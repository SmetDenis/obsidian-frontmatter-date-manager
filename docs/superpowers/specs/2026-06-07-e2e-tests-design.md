# Дизайн e2e-тестов (реальный Obsidian через WebdriverIO)

Дата: 2026-06-07
Статус: согласован, готов к написанию плана реализации

## 1. Контекст и мотивация

В репозитории есть каркас e2e (`e2e/`) на `wdio-obsidian-service`: он скачивает реальный
Obsidian, копирует vault-фикстуру, ставит и включает собранный плагин (`dist/`) и даёт
хелперы (`browser.executeObsidian`, `browser.executeObsidianCommand`, `obsidianPage.*`).
Сейчас в нём один демо-сценарий.

e2e ценен ровно там, где **мок `obsidian` физически не воспроизводит поведение**, а баг
означает порчу данных пользователя (главная инварианта проекта — «never corrupt body, key
order, comments, unrelated keys»). В unit-тестах `processFrontMatter` — это `vi.fn()`, он
не сериализует YAML и не трогает тело заметки. Поэтому e2e должен покрывать стыки:

- реальная сериализация `processFrontMatter` (сохранность body / порядка ключей / комментариев / чужих ключей);
- сериализация `number` vs `string` на диск (документированное допущение `formatDate`:
  «returning a number causes processFrontMatter to write unquoted YAML» — нигде не проверено);
- подавление самоиндуцированного `modify` (`lastPluginWriteMtime`) на **реальном** `mtime`;
- UI-проводка bulk-модалок: рендеринг диффов, пагинация, переключение фаз, привязка
  дропдаунов/кнопок к compute/execute. По CLAUDE.md «DOM rendering in chrome.ts/PhaseModal is
  not unit-tested (the obsidian mock no-ops DOM)» — этот слой не покрыт ничем.

Где логика чистая (`formatDate`-комбинаторика форматов, `inversionDetection`,
`filterRules`/`matchesPathPattern`, `pagination`, `epochNumberToDate`, `toTSV`) — она уже
строго покрыта unit; гонять её копии через реальный Obsidian — антипаттерн.

## 2. Зафиксированные решения (развилки брейншторма)

| Развилка | Решение |
| --- | --- |
| Объём основного пути | Tier 1 (целостность данных) + Tier 2 (рантайм-петли) на авто/командном пути |
| Запуск | Только локально вручную (перед релизом). CI не добавляем. |
| Bulk-операции | **Full UI-driven** — все 5 модалок драйвятся через реальные клики |
| Матрица версий | Только `latest` |
| Стабильность селекторов | **Семантические CSS-классы** с префиксом `frontmatter-date-manager-` на интерактивных контролах + Page Objects |
| Tier 3 (ctime по ОС, персистентность кэша через рестарт, file-open→viewed) | Вне scope этого набора (возможное расширение позже) |

Почему full UI-driven приемлем при ручном запуске: тесты не являются merge-гейтом; дрейф
селекторов виден сразу при осознанном прогоне и чинится тут же, а не «тихо гниёт в CI».
Цена — стоимость написания и async-флак — снижается Page Objects и стабильными классами.

## 3. Цели и не-цели

**Цели**
- Подтвердить интеграцию с реальным Obsidian: загрузка плагина, реальный `processFrontMatter`,
  реальные vault-события, реальная команда, реальная UI-проводка bulk-модалок.
- Покрыть инварианту безопасности данных там, где её может проверить только реальная сериализация.

**Не-цели**
- Дублировать чистую логику (она в unit).
- CI / автоматический прогон на PR.
- Tier 3 (платформенная точность ctime, персистентность hash-cache через рестарт, viewed).
- Матрица версий Obsidian.

## 4. Архитектура и структура файлов

```
e2e/
  wdio.conf.mts            # существует; доработать (см. §8)
  tsconfig.json            # существует
  README.md                # обновить под новый набор
  fixtures/
    rich-vault/            # богатый vault-фикстур: заметки с body, # heading,
                           # YAML-комментарием, чужими ключами (aliases, tags:[a,b]),
                           # вложенным объектом
  pageobjects/
    settingsTab.ts         # открыть настройки программно, дойти до bulk-кнопок
    bulkModal.ts           # общий PO для PhaseModal: configure / preview / run / pager
    populateModal.ts
    renameModal.ts
    reformatModal.ts
    inversionsModal.ts
    rebuildCacheModal.ts
  helpers/
    vault.ts               # создание/чтение файлов per-test (obsidianPage.write/read),
                           # уникальные имена
    frontmatter.ts         # точный парсинг frontmatter для ассертов (не regex)
    settings.ts            # программно выставить plugin.settings в известное состояние
  specs/
    auto-stamp.e2e.ts          # Группа A
    command-update.e2e.ts      # Группа A (усиленный текущий демо-тест)
    bulk-populate.e2e.ts       # Группа B
    bulk-rename.e2e.ts
    bulk-reformat.e2e.ts
    bulk-inversions.e2e.ts
    bulk-rebuild-cache.e2e.ts
```

Текущий `specs/update-current-file.e2e.ts` заменяется усиленным `command-update.e2e.ts`.

Доступ к рантайму: `browser.executeObsidian(({app, obsidian, plugins}) => …)` даёт инстанс
плагина (`plugins.frontmatterDateManager`) с его публичными методами и сам `app`/`obsidian`.
Внутренние модули бандла (`src/bulk/*`, классы модалок) в рантайме недоступны — поэтому bulk
драйвится только через UI (см. §6), а не вызовом ядра.

## 5. Изоляция и фикстуры

- Один инстанс Obsidian на прогон (`maxInstances: 1`), один богатый vault копируется
  сервисом per-run (оригинал не трогается).
- **Изоляция между тестами:** каждый тест создаёт свои файлы через `obsidianPage.write()`
  (или `app.vault.create`) с уникальными именами (по имени теста/счётчику) и ассертит только
  их. Никакого общего мутируемого состояния между `it`.
- **`beforeEach`:** программно выставляет `plugin.settings` в известное состояние
  (`enableAutoUpdate`, `headerCreated`/`headerUpdated`, `dateFormat`, `timezone`,
  `enableNumberProperties`, `enableContentHashCheck`) через `executeObsidian` + при
  необходимости `recompileFilterRules()`. Это обязательно для детерминизма.
- Где нужно детектить изменение (hash-gating): правим body заметки или очищаем hash-cache
  для файла, чтобы изменение реально детектировалось.

## 6. Стабильные селекторы (правки в продакшн-коде)

Интерактивные контролы сейчас рендерятся через Obsidian `setButtonText`/`addDropdown` без
стабильных id/классов — зацепиться можно только за текст и `.mod-cta`/`.mod-warning`, что
хрупко. Добавляем префикс-классы (через `cls:` / `addClass` / `setClass` — не `element.style`,
чтобы пройти линтер; все с префиксом `frontmatter-date-manager-`):

- `src/bulk/chrome.ts`:
  - `renderButtonBar`: класс на primary-кнопку (роль Run) и footer-кнопку; pager Prev/Next
    (`-pager-prev`, `-pager-next`); preview-таблица (`-preview-table`); failure-таблица.
- модалки: дропдауны режимов/стратегий/scope получают классы
  (`-mode-select`, `-override-select`, `-strategy-select`, `-scope-select`).
- `src/Settings.ts`: bulk-кнопки получают классы (`-open-populate`, `-open-rename`,
  `-open-reformat`, `-open-inversions`, `-open-rebuild-cache`) — PO открывает модалку по классу,
  а не по тексту.

Эти классы UX-нейтральны и ничего не ломают. Все селекторы инкапсулируются в Page Objects:
при дрейфе UI правка в одном месте.

## 7. Группа A — авто/командный путь (Tier 1+2, без UI)

**A1. auto-stamp сохраняет данные (Tier 1).**
Богатая заметка (body, `# heading`, YAML-комментарий, чужие ключи `aliases` и `tags: [a, b]`,
вложенный объект), `enableAutoUpdate=on`, без `updated`. Реально изменить файл (append через
`app.vault`). Дождаться авто-стампа `updated`.
Ассерты: `updated` добавлен и соответствует формату настроек; `created` строго не изменён;
body, чужие ключи, порядок ключей и комментарий целы (точный парсинг, не regex).

**A2. number-vs-string сериализация (Tier 1).**
- `enableNumberProperties=true` + числовой (epoch) формат → `updated` записан на диск как
  **unquoted число**.
- `enableNumberProperties=false` → `updated` записан как строка ожидаемого формата.
Проверяем реальную сериализацию Obsidian (допущение `formatDate`).

**A3. нет повторного стампа / self-trigger (Tier 2).**
После авто-стампа зафиксировать значение `updated`, подождать > debounce (~3 с), убедиться,
что `updated` не изменился второй раз (`lastPluginWriteMtime` работает на реальном `modify`).

**A4. auto off + команда (усиленный текущий тест, Tier 1/2).**
`enableAutoUpdate=off`. Правка body → `updated` НЕ появляется (подождать и проверить
отсутствие). Затем `executeObsidianCommand('frontmatter-date-manager:update-timestamps-current-file')`
→ `updated` появляется; `created` строго цел; body цел.

(Опционально A5 — debounce coalescing: серия правок → один стамп. Можно отложить.)

## 8. Группа B — bulk, full UI-driven (5 модалок)

Каждый тест: программно настроить состояние и файлы → открыть Settings программно
(`app.setting.open()` + `openTabById('frontmatter-date-manager')`) → клик по кнопке модалки →
пройти фазы кликами (общий `bulkModal` PO: configure → preview → run, pager) → ассертить
содержимое файлов + data-safety (body / чужие ключи целы).

**B1. Populate timestamps.**
- fill-missing: заметки без дат → синяя Run → даты заполнены из ctime/mtime; существующие
  значения не тронуты.
- overwrite-all: заметки с датами → выбрать overwrite в дропдауне → preview показывает дифф →
  **красная** Run → значения перезаписаны; body/чужие ключи целы.
- Проверить, что preview-таблица отрисована и пагинация (Prev/Next) работает (создать
  достаточно файлов для >1 страницы).

**B2. Rename key (+ delete toggle, конфликты).**
Переименовать `created`→`createdAt` по всем файлам; проверить delete toggle; preview с
conflict-detection (есть файл, где целевой ключ уже существует). Run → ключ переименован,
значение сохранено, конфликт обработан согласно логике.

**B3. Reformat dates.**
Заметки с разными форматами дат → scope dropdown → preview конверсий → **красная** Run
(операция всегда destructive) → даты в целевом формате; body цел.

**B4. Find inversions.**
Заметки с `updated < created` → модалка авто-сканирует на открытии → таблица инверсий + Δ →
выбрать стратегию в дропдауне → красная Run, **задизейблена пока стратегия `disabled`** →
инверсии исправлены согласно стратегии. Проверить дизейбл Run при `disabled`.

**B5. Rebuild hash cache (non-destructive).**
Confirm-экран (счётчик файлов, **синяя** Run, задизейблена при 0 файлов) → Run → завершается
без ошибок. Ассерт: заметки не изменены (rebuild трогает только sidecar-кэш, не данные).

## 9. Ассерты и helpers

- **Точный парсинг frontmatter** вместо regex: helper читает файл, отделяет YAML-блок и парсит
  (через `app.metadataCache` в `executeObsidian` или мини-парсер в helper). Body сравнивается
  как строка (всё после закрывающего `---`).
- Async-фазы (preview-скан, execute) — через `browser.waitUntil` с разумными таймаутами и
  внятным `timeoutMsg`.

## 10. Запуск и гигиена

- `npm run test:e2e` (есть) = `build && wdio`. Сборка production — добавленные CSS-классы
  попадают в прод, это норма.
- Новый `npm run typecheck:e2e` = `tsc -p e2e/tsconfig.json`; включить в `make pre-commit`
  (дёшево, Obsidian не нужен — ловит сломанные спеки/PO на типах до прогона). Это закрывает
  пробел из ревью: сейчас e2e исключён из корневого `tsc` и `eslint`, и `e2e/tsconfig.json`
  нигде не запускается.
- README e2e: список сценариев, требование display/xvfb для ручного запуска, как гонять один
  спек.
- В CI **не** добавляем. Пункт «прогнать e2e» — в release-чеклист (дисциплина запуска).

## 11. Риски и митигации

- **Хрупкость UI:** снижена стабильными классами + Page Objects, но не устранена. Правки UI
  требуют синхронной правки PO. Митигация: вся завязка на DOM — только в PO.
- **Async-флак** в preview/execute: митигируется `waitUntil` + `timeoutMsg`.
- **Ручной запуск → риск забыть прогнать:** митигируется пунктом в release-чеклисте.
- **typecheck:e2e в pre-commit** ловит сломанные спеки/PO без полного прогона Obsidian.

## 12. Объём и порядок реализации

1. Инфраструктура: правки селекторов в `chrome.ts`/`Settings.ts`/модалках; `helpers/*`;
   `pageobjects/*`; `fixtures/rich-vault/`; `typecheck:e2e` + pre-commit; доработка `wdio.conf.mts`.
2. Группа A: `auto-stamp.e2e.ts` (A1–A3), `command-update.e2e.ts` (A4).
3. Группа B: `bulk-populate`, `bulk-rename`, `bulk-reformat`, `bulk-inversions`,
   `bulk-rebuild-cache`.
4. Обновить README e2e и release-чеклист.

Итого: ~4 спека Группы A + 5 спеков Группы B, PO/helpers, точечные классы в продакшн-UI.
```
