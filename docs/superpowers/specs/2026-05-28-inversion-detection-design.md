# Inversion detection — design

Status: draft (pending user review)
Date: 2026-05-28

## Problem

Плагин не отслеживает случаи, когда `updated < created` в frontmatter. Такая инверсия возникает в нескольких сценариях:

1. **Первичное заполнение из файловой системы.** В `computeFrontmatterUpdates` (`main.ts:448`) при отсутствии и `created`, и `updated` плагин пишет `formatDate(ctime)` в `created` и `formatDate(mtime)` в `updated`. Если файл скопирован/импортирован, `ctime` (момент копирования) может быть позже `mtime` (исходный момент правки) — сразу получаем `created > updated`.
2. **`BulkPopulateTimestampsModal`.** Заполняет `created` из `ctime`, `updated` из `mtime` независимо. Те же риски.
3. **Ручная правка frontmatter.** Пользователь ставит `created: 2030-01-01` (для журнала событий). При следующем `modify` плагин обновляет `updated` от текущего mtime → инверсия.
4. **Sync-конфликты.** Dropbox/iCloud могут вернуть `mtime` в прошлое после rebase конфликтующих копий.
5. **Hash check скрывает правки frontmatter.** В режиме `hashTrackingMode='body'` правки в `created`/`updated` не триггерят обработку файла, и инверсия живёт незамеченной.

Инверсия нарушает семантику ("файл изменён до его создания") и ломает сортировку/фильтры по дате.

## Goals

- **Prevent**: при автоматической записи (`computeFrontmatterUpdates`) не давать самому плагину создать инверсию.
- **Detect**: дать пользователю команду найти все существующие инверсии в vault.
- **Fix**: предоставить bulk-операцию исправления с выбором стратегии.
- Не использовать `console.*` в новой логике (политика Obsidian community plugins).
- Поведение по умолчанию — пассивное (`disabled`), без неожиданных автоматических правок.

## Non-goals

- Не предоставлять real-time индикатор в status bar.
- Не показывать Notice/predupreждение при каждом `file-open`.
- Не вести постоянный персистентный лог инверсий — сканирование выполняется по запросу.
- Не менять поведение `viewed` (`handleFileOpen`) — там нет created/updated пары.
- Не пытаться авто-восстановить "истинную" дату из истории git/sync (вне scope).

## Concepts

### Inversion

Файл считается имеющим инверсию, когда:

- `frontmatter[createdKey]` существует и парсится в валидную `Date` (`created`)
- `frontmatter[updatedKey]` существует и парсится в валидную `Date` (`updated`)
- `created.getTime() - updated.getTime() > toleranceSec * 1000`

Если хотя бы одна из дат отсутствует или не парсится — инверсии нет (файл пропускается из сканирования).

### Fix strategies

| ID                    | Что делает                                             | Когда применять                                                                                                                |
| --------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `disabled`            | Не делать ничего                                       | Default. Только детект через bulk-modal, prevention noop.                                                                      |
| `created-to-updated`  | `created := updated`                                   | Если `updated` достовернее (свежий mtime). Сохраняет "свежесть" updated, опускает created в момент или раньше.                 |
| `updated-to-created`  | `updated := created`                                   | Если `created` — ground truth (пользователь сознательно его поставил). Откатывает updated.                                     |
| `max-all`             | Оба := `max(created, updated, mtime, ctime)`           | Максимально консервативно: гарантирует монотонность поверх всех известных источников. Может смещать обе даты в будущее.        |

Стратегия выбирается:

1. Глобально — в settings (default = `disabled`).
2. Отдельно в bulk-modal — dropdown инициализируется значением из settings, но пользователь может переопределить per-операция.

### Tolerance

Настраиваемое количество секунд. Default = `0`. Используется при:

- Bulk-сканировании (определяет, считать ли файл инверсионным).
- Prevention (определяет, нужно ли применять fix-стратегию во время `computeFrontmatterUpdates`).

Пользователь может выставить, например, `5` чтобы игнорировать сабсекундные/коротколаговые расхождения.

## Components

### New: `src/inversionDetection.ts`

Pure functions, без Obsidian-зависимостей. Тестируется отдельно.

```ts
export type InversionFixStrategy =
  | 'disabled'
  | 'created-to-updated'
  | 'updated-to-created'
  | 'max-all';

export interface DateSources {
  created: Date;
  updated: Date;
  mtime: Date;
  ctime: Date;
}

export interface FixResult {
  created: Date;
  updated: Date;
}

export function isInversion(
  created: Date,
  updated: Date,
  toleranceSec: number,
): boolean;

export function applyInversionFix(
  strategy: Exclude<InversionFixStrategy, 'disabled'>,
  sources: DateSources,
): FixResult;
```

### New: `src/FindInversionsModal.ts`

Extends `BaseBulkModal`. Использует расширенные hook'и (см. ниже).

- `skipHashCheck(): true` — нам всё равно на hash при сканировании.
- `narrowFiles(files)` — фильтрует список до файлов с инверсией. Использует `metadataCache.getFileCache(file)?.frontmatter` чтобы не читать содержимое файлов с диска (быстрее). Если кэш для какого-то файла отсутствует (например, не прогрелся после старта) — файл пропускается; пользователь может повторить сканирование после прогрева кэша.
- `renderExtraSection(parent, narrowedFiles)`:
  - Dropdown "Fix strategy" с 4 опциями (`disabled` показывается как "Don't fix (review only)").
  - Tolerance input — read-only отражение текущего settings-значения (информативно).
  - Таблица: `Path | Created | Updated | Δ` (первые 50 строк, потом `…and N more`).
- `processFile(file)`:
  - Если strategy = `disabled` — noop (но Run в таком случае дизейблится в UI).
  - Иначе: `processFrontMatter` с применением `applyInversionFix`. После записи — сохранить `file.stat.mtime` в `plugin.lastPluginWriteMtime` (чтобы self-modify event был skip-нут) и пересчитать `populateCacheForFile` (как делает `handleFileChange`).
- `getTitle(count)`: `Found ${count} inverted files`.
- `getDescription()`: пояснение что делает.
- `getWarning(count)`: если выбрана стратегия и count > 0 — `This will modify ${count} files. Irreversible without a backup.`.
- `getRunningMessage()`: `Fixing inversions...`.

### Modified: `src/BaseBulkModal.ts`

Минимальное расширение для поддержки модалов с pre-filter и кастомным UI блоком:

```ts
// New optional hooks (default = no-op):
protected async narrowFiles(files: TFile[]): Promise<TFile[]> {
  return files;
}

protected renderExtraSection(parent: HTMLElement, files: TFile[]): void {
  // default: empty
}

protected canRun(files: TFile[]): boolean {
  return files.length > 0;
}
```

Поток `onOpen` обновлён:

1. Сканируем `getAllFilesPossiblyAffected` (как сейчас).
2. Вызываем `narrowFiles` — обновляем `cachedFiles`.
3. Используем `narrowedFiles.length` для `getTitle` / `getWarning`.
4. Между description/warning и Run/Cancel секцией зовём `renderExtraSection`.
5. Кнопка Run дизейблится, если `!canRun(narrowedFiles)`.

Это не ломает `UpdateAllModal`/`UpdateAllCacheData` — у них дефолтные хуки.

### Modified: `src/main.ts`

В `computeFrontmatterUpdates` (после строки 511) добавить **prevention block**:

```ts
// After computing result.createdValue / result.updatedValue
if (this.settings.inversionFixStrategy && this.settings.inversionFixStrategy !== 'disabled') {
  const finalCreatedRaw = result.createdValue ?? cached?.[createdKey];
  const finalUpdatedRaw = result.updatedValue ?? cached?.[updatedKey];

  if (finalCreatedRaw != null && finalUpdatedRaw != null) {
    const finalCreated = this.parseDate(finalCreatedRaw as string | number);
    const finalUpdated = this.parseDate(finalUpdatedRaw as string | number);
    if (finalCreated && finalUpdated &&
        isInversion(finalCreated, finalUpdated, this.settings.inversionToleranceSec ?? 0)) {
      const fixed = applyInversionFix(this.settings.inversionFixStrategy, {
        created: finalCreated, updated: finalUpdated, mtime: mTime, ctime: cTime,
      });
      result.createdValue = this.formatDate(fixed.created);
      result.updatedValue = this.formatDate(fixed.updated);
      this.showInversionNoticeOnce();
    }
  }
}
```

Новое приватное поле:
```ts
private _sessionInversionNoticeShown = false;

private showInversionNoticeOnce(): void {
  if (this._sessionInversionNoticeShown) return;
  this._sessionInversionNoticeShown = true;
  new Notice('Frontmatter Date Manager: inversion detected and auto-fixed. Use "Find inverted timestamps" in settings to review.', 8000);
}
```

Никаких `console.*`.

### CSS

Добавить в `styles.css` (с обязательным префиксом `frontmatter-date-manager-`):

```css
.frontmatter-date-manager-inversion-table { /* layout */ }
.frontmatter-date-manager-inversion-row    { /* row */ }
.frontmatter-date-manager-inversion-delta  { color: var(--text-error); }
.frontmatter-date-manager-inversion-strategy-section { /* spacing */ }
```

Никаких `element.style.*` в JS, никаких хардкод-цветов.

### Modified: `src/Settings.ts`

Расширить `FrontmatterDateManagerSettings`:

```ts
inversionFixStrategy?: InversionFixStrategy; // default 'disabled'
inversionToleranceSec?: number;              // default 0
```

В UI добавить новую секцию (между "Behavior" и "Advanced"):

```
new Setting(containerEl).setHeading().setName('Timestamp inversion');

new Setting(...)
  .setName('Auto-fix strategy')
  .setDesc('How to resolve files where updated is earlier than created. Applies both during normal edits and in the bulk "Find inverted timestamps" tool.')
  .addDropdown(dd => dd
    .addOption('disabled', 'Disabled (detect only)')
    .addOption('created-to-updated', 'Set created = updated')
    .addOption('updated-to-created', 'Set updated = created')
    .addOption('max-all', 'Set both = max of all known dates')
    ...);

new Setting(...)
  .setName('Tolerance (seconds)')
  .setDesc('Ignore inversions smaller than this. Useful to suppress sub-second clock skew.')
  .addText(...); // number input, default 0
```

В секции "Bulk operations" добавить кнопку:

```
new Setting(...)
  .setName('Find inverted timestamps')
  .setDesc('Scan eligible files and list ones where updated is earlier than created. Optionally apply the configured fix strategy.')
  .addButton(btn => btn
    .setButtonText('Find inversions')
    .onClick(() => new FindInversionsModal(this.app, this.plugin).open()));
```

## Data flow

### Prevention (modify event)

```
vault.modify → debounce → handleFileChange
  → shouldFileBeIgnored (filter rules + hash check)
  → computeFrontmatterUpdates
      → compute created/updated candidates
      → [NEW] check inversion on final values
      → [NEW] if inversion && strategy != disabled → applyInversionFix → adjust result
  → processFrontMatter writes
  → showInversionNoticeOnce (rate-limited per session)
```

### Bulk detect & fix

```
Button "Find inversions" → new FindInversionsModal().open()
  → BaseBulkModal.onOpen
      → getAllFilesPossiblyAffected(skipHashCheck: true) — respects filterRules
      → narrowFiles: для каждого файла читаем metadataCache.getFileCache(file).frontmatter,
        парсим created/updated через plugin.parseDate, проверяем isInversion
      → render таблицу
      → render strategy dropdown
  → User selects strategy + Run
  → BaseBulkModal.onRun
      → bulkRunning = true
      → for each narrowed file: processFile (применяет applyInversionFix через processFrontMatter)
      → progress bar
  → onComplete: Notice "Fixed N inversions"
```

## Edge cases

| Случай                                                            | Поведение                                                                      |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `created` отсутствует, `updated` есть                             | Не инверсия, пропустить.                                                       |
| Оба отсутствуют                                                   | Не инверсия, пропустить.                                                       |
| `created` невалидной даты (parseDate undefined)                   | Не инверсия, пропустить. В таблице modal не показывать (молчаливый skip).      |
| `created` числовой, `updated` строковый                           | Парсим оба через `plugin.parseDate` (он умеет оба типа), сравниваем `Date`-ы.  |
| `created === updated` ровно                                       | Не инверсия (разница 0).                                                       |
| `created - updated < tolerance`                                   | Не инверсия.                                                                  |
| Файл попадает под filterRules                                     | Не сканируется (cogerent с поведением плагина).                                |
| Стратегия = `disabled` в settings, но в bulk-modal выбрана другая | Bulk-modal использует свой override.                                           |
| Бесконечный цикл (fix создаёт новую инверсию через self-modify)   | Невозможен: fix применяется ДО `processFrontMatter`; `lastPluginWriteMtime` дальше блокирует self-modify event. |
| Pause / autoUpdate = off                                          | Bulk-операция игнорирует эти флаги (выполняется по явной кнопке).              |
| `enableModifiedTime` = false                                      | Prevention noop (updated не вычисляется). Bulk всё равно работает.             |
| `metadataCache` не содержит frontmatter (кэш не прогрелся)        | В narrowFiles файл пропускается; пользователь может перезапустить сканирование. |
| `created` и `updated` в формате, который не парсится текущим `dateFormat` | parseDate вернёт undefined → файл не считается инверсионным; пользователю стоит сначала запустить "Reformat existing dates". |
| Bulk fix меняет файлы, далее vault.modify event приходит           | `lastPluginWriteMtime` блокирует self-modify (как и в обычном handleFileChange). |

## Testing

### Unit tests

`src/__tests__/inversionDetection.test.ts`:

- `isInversion(created, updated, tolerance)`:
  - created < updated → false
  - created == updated → false
  - created > updated, разница < tolerance → false
  - created > updated, разница >= tolerance → true
  - граничный случай: разница == tolerance → false
- `applyInversionFix(strategy, sources)`:
  - `created-to-updated` → returns `{ created: updated, updated }`
  - `updated-to-created` → returns `{ created, updated: created }`
  - `max-all` → returns `{ max, max }` где max — самая поздняя из 4 источников
  - входной `strategy === 'disabled'` не валидный для функции (тип уже исключает) — но всё равно тестируем тип-гард

### Integration tests

`src/__tests__/inversionPrevention.test.ts`:

- Сценарий 1: `created` есть (поздняя дата), `updated` нет, `mtime` ранняя → должен вычислиться updated < created → fix применяется → итог соответствует стратегии.
- Сценарий 2: `inversionFixStrategy = 'disabled'` → ничего не правится, файл сохраняется как есть.
- Сценарий 3: разница меньше tolerance → fix не применяется.
- Сценарий 4: notice показывается один раз за сессию (флаг `_sessionInversionNoticeShown`).

`src/__tests__/findInversionsModal.test.ts`:

- mock плагин с файлами разных видов (нет дат / есть нормальные / инверсия / непарсимая дата)
- `narrowFiles` оставляет только инверсии
- `processFile` применяет стратегию через `processFrontMatter`

## Migration

- Новые поля `inversionFixStrategy`, `inversionToleranceSec` отсутствуют у существующих пользователей — `loadSettings` использует `Object.assign({}, DEFAULT_SETTINGS, data ?? {})` (`main.ts:856`), так что defaults применятся автоматически.
- Default `disabled` означает что для существующих пользователей **поведение не меняется** до явного включения.
- Никакой миграции данных не требуется.

## Acceptance

- [ ] `make pre-commit` проходит.
- [ ] `eslint-plugin-obsidianmd` rules не нарушены (no `console.*`, sentence case, CSS prefix).
- [ ] Unit-тесты `inversionDetection.test.ts` зелёные.
- [ ] Integration-тесты для prevention зелёные.
- [ ] `README.md` дополнен секцией про inversion handling.
- [ ] `CLAUDE.md` дополнен описанием новых компонентов и settings keys.
