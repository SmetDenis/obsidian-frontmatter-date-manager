// src/i18n/locales/ru.ts
// Russian. Hand-verified by the maintainer (native speaker).
// Keep {token} placeholders byte-identical to English. No em/en dashes - use '-'.
// Pure-identifier / proper-noun / symbol leaves (property-key placeholders, OS
// names, the Delta glyph, '{currentFormat}', '{name}: {prefix}') are intentionally
// omitted so they fall back to the English source unchanged.
import type { Strings, DeepPartial } from '../index';

export const STRINGS_RU: DeepPartial<Strings> = {
  common: {
    run: 'Запустить',
    back: 'Назад',
    cancel: 'Отмена',
    close: 'Закрыть',
    file: 'Файл',
    created: 'Создано',
    updated: 'Обновлено',
    viewed: 'Просмотрено',
    createdKeyed: 'Создано ({key})',
    updatedKeyed: 'Обновлено ({key})',
    viewedKeyed: 'Просмотрено ({key})',
    scanAndPreview: 'Сканировать и показать',
    scanningFiles: 'Сканирование файлов…',
    doneWithErrors: 'Готово. Ошибок: {errors}.',
  },

  commands: {
    updateCurrentFile: 'Обновить даты в текущем файле',
    toggleAutoUpdate: 'Включить/выключить автообновление',
    pauseAutoUpdate: 'Приостановить автообновление на 5 минут',
  },

  statusBar: {
    paused: 'Приостановлено',
    pausedWithMinutes: 'Приостановлено ({remaining}м)',
  },

  notices: {
    inversionDetectedAndFixed:
      'Frontmatter Date Manager: обнаружены и исправлены даты в неправильном порядке. Откройте "Найти даты в неправильном порядке" в настройках для проверки.',
    timestampsUpdated: 'Даты обновлены.',
    fileIgnored: 'Файл исключён настройками плагина.',
    failedToUpdateWithReason: 'Не удалось обновить даты: {reason}',
    failedToUpdate: 'Не удалось обновить даты.',
    autoUpdateEnabled: 'Автообновление включено',
    autoUpdateDisabled: 'Автообновление выключено',
    autoUpdatePausedForMinutes:
      'Автообновление приостановлено на {minutes} минут. Возобновится автоматически.',
    autoUpdateResumed: 'Автообновление возобновлено.',
    malformedFrontmatter:
      'Frontmatter Date Manager: сбой\nНекорректные свойства в файле: {filePath}\n\n{message}',
  },

  bulkChrome: {
    summaryWillChange: 'Будет изменено файлов: {changed}',
    summarySkipped: 'Пропущено: {skipped}',
    summaryErrors: 'Ошибок: {errors}',
    pagerPrev: 'Предыдущая',
    pagerNext: 'Следующая',
    pageInfo: 'Страница {current} из {total}',
    downloadFullPreview: 'Скачать полный предпросмотр',
    downloadSuccess:
      'Скачано строк: {count}. Файл {filename} в папке загрузок.',
    downloadFailed: 'Не удалось скачать файл предпросмотра.',
    failureColumnError: 'Ошибка',
    progressCounter: '{count}/{max}',
  },

  settings: {
    description: {
      syncIntro:
        'Сервисы синхронизации, инструменты резервного копирования и другие плагины часто перезаписывают файлы, не меняя их содержимое - и это сбрасывает даты файла на диске. Из-за этого невозможно понять, когда вы на самом деле в последний раз редактировали заметку.',
      pluginIntro:
        'Плагин записывает даты создания и последнего изменения прямо в свойства каждой заметки и распознаёт реальные изменения, сравнивая содержимое, поэтому ваши даты отражают настоящие правки, а не артефакты синхронизации.',
    },
    dates: {
      heading: 'Какие даты отслеживать',
      enableNoneHint:
        'Включите хотя бы одну дату выше, чтобы настроить плагин.',
      created: {
        enableName: 'Отслеживать дату создания',
        enableDesc: 'Добавлять дату создания заметкам, у которых её ещё нет.',
        propertyName: 'Свойство для даты создания',
        propertyDesc: 'Имя свойства, в которое сохраняется дата создания.',
      },
      updated: {
        enableName: 'Отслеживать дату изменения',
        enableDesc: 'Обновлять эту дату при каждом редактировании заметки.',
        propertyName: 'Свойство для даты изменения',
        propertyDesc:
          'Имя свойства, в которое сохраняется дата последнего изменения.',
      },
      updateCount: {
        enableName: 'Считать правки',
        enableDesc:
          'Добавлять числовое свойство, которое увеличивается на единицу при каждом редактировании заметки. Приблизительный счётчик активности, а не точная история.',
        propertyName: 'Свойство для счётчика правок',
        propertyDesc: 'Имя свойства, в которое сохраняется счётчик правок.',
      },
      viewed: {
        enableName: 'Отслеживать дату последнего открытия',
        enableDesc: 'Сохранять дату при каждом открытии заметки.',
        propertyName: 'Свойство для даты открытия',
        propertyDesc:
          'Имя свойства, в которое сохраняется дата последнего открытия.',
      },
    },
    formatting: {
      heading: 'Формат даты',
      dateFormat: {
        name: 'Формат даты',
        desc: 'Как даты и время записываются в ваши заметки.',
        formatCodesLink: 'Список кодов формата',
        currentlyPreview: 'Сейчас: {preview}',
        invalidWithHint: 'Неверный формат. {hint}',
        invalidFormat: 'Неверная строка формата даты.',
        obsidianDefault:
          "Формат Obsidian по умолчанию: yyyy-MM-dd'T'HH:mm:ss (дата и время, местный часовой пояс)",
      },
      timezone: {
        name: 'Часовой пояс',
        desc: 'Часовой пояс для записи дат. Оставьте пустым, чтобы использовать часовой пояс вашего устройства ({localTz}).',
        placeholder: 'Местный ({localTz})',
        resetTooltip: 'Сбросить на местный часовой пояс',
      },
      numberProperties: {
        name: 'Сохранять числовые даты без кавычек',
        desc: 'Если ваш формат даты состоит только из цифр (например, unix-время), записывать её как обычное число (updated: 1712930400), а не как текст в кавычках (updated: "1712930400"). Не влияет, если формат содержит дефисы или двоеточия.',
      },
    },
    behavior: {
      heading: 'Поведение',
      autoUpdate: {
        name: 'Автообновление',
        desc: 'Автоматически обновлять даты при редактировании заметки. Также доступно из палитры команд.',
      },
      minSeconds: {
        name: 'Минимум секунд между обновлениями',
        desc: 'Не даёт обновлять дату слишком часто, пока вы печатаете или переключаетесь между заметками.',
      },
      changeDetection: {
        name: 'Распознавание изменений (хеширование содержимого)',
        descEnabled:
          'Дата последнего изменения записывается только когда содержимое заметки действительно меняется - это предотвращает ложные обновления от плагинов синхронизации.',
        descDisabled:
          'Выключено - дата последнего изменения записывается при каждом сохранении, даже если ничего не изменилось.',
      },
      hashTrackingMode: {
        name: 'Что считать изменением',
        desc: 'Какая часть заметки считается изменением. "Только тело" - редактирование свойств (теги, псевдонимы и т.д.) не обновляет дату. "Только свойства" - редактирование текста заметки не обновляет дату. "Оба" - любая правка обновляет дату.',
        optionBody: 'Только тело заметки (по умолчанию)',
        optionFrontmatter: 'Только свойства',
        optionBoth: 'Тело и свойства',
        changedNotice:
          'Режим отслеживания изменён. Перестройте кеш хешей (в массовых операциях), чтобы даты оставались точными.',
      },
      excludeKeys: {
        name: 'Игнорировать эти свойства',
        desc: 'Редактирование этих свойств не будет обновлять дату. Можно добавить несколько сразу через запятую. Свойства created, updated и viewed всегда игнорируются автоматически.',
        placeholder: 'Имя свойства, например tags',
        addTooltip: 'Добавить свойство',
        chipRemoveAriaLabel: 'Удалить {entry}',
      },
    },
    filterRules: {
      name: 'Файлы и папки, которые пропускать',
      descIntro:
        'Выберите файлы или папки, которые не нужно трогать (без автоматического обновления дат). ',
      descOnePerLine: 'По одному шаблону в строке. Строки, начинающиеся с ',
      descCommentsAre: ' - это комментарии. Начните строку с ',
      descAddBack: ' - чтобы вернуть путь обратно. ',
      descLastWins: 'Если совпадает несколько строк, побеждает последняя.',
      advancedSyntaxLink: 'Расширенный синтаксис (в стиле gitignore)',
      noRulesWarning:
        'Правил нет - все заметки получают автоматическое обновление дат.',
      placeholderExcludeFolder: '# Исключить папку',
      placeholderExcludeByPattern: '# Исключить по шаблону',
      placeholderReinclude: '# Вернуть конкретный файл',
      parseError: 'Строка {lineNumber}: {message} - "{text}"',
      previewButton: 'Показать подходящие файлы',
      previewSummary: 'Отслеживается заметок: {tracked}, пропущено: {excluded}',
      skippedFilesSummary: 'Пропущенные файлы ({excluded})',
      skippedMore: '...и ещё {count}',
      reference: {
        summary: 'Справка по синтаксису шаблонов',
        sectionBasics: 'Основы синтаксиса',
        basicsCommentDesc: 'Строки, начинающиеся с #, игнорируются',
        basicsBlankDesc: 'Пустые строки игнорируются',
        basicsExcludeDesc: 'Исключение - файлы внутри templates/ пропускаются',
        basicsReincludeDesc: 'Возврат - префикс ! отменяет исключение',
        basicsLastWinsDesc:
          'Когда совпадает несколько правил, побеждает последнее',
        sectionExcludeFolder: 'Исключить папку',
        excludeFolderAllFilesDesc: 'Все файлы внутри templates/',
        excludeFolderSameEffectDesc:
          'Тот же эффект (завершающий слеш необязателен)',
        excludeFolderNestedDesc: 'Вложенная папка',
        sectionReinclude: 'Возврат (отмена исключения)',
        reincludeExcludeWholeDesc: 'Исключить всю папку',
        reincludeKeepDesc: 'Но продолжать отслеживать этот конкретный файл',
        sectionWildcards: 'Подстановочные знаки',
        wildcardStarDesc: 'Любые символы, кроме /',
        wildcardDoubleStarDesc: 'Любые символы, включая / (пересекает папки)',
        wildcardQuestionDesc: 'Ровно один символ',
        sectionWildcardExamples: 'Примеры с подстановочными знаками',
        wildcardExCanvasRootDesc:
          'Файлы, оканчивающиеся на .canvas.md в корне хранилища',
        wildcardExCanvasAnyDesc:
          'Файлы, оканчивающиеся на .canvas.md в любой папке',
        wildcardExDailyDesc: 'Файлы вида daily/2024-01-01.md',
        wildcardExTwoCharDesc: 'Двухсимвольные имена файлов в notes/',
        sectionSpecificFiles: 'Конкретные файлы',
        specificFilesOneExactDesc: 'Один точный файл',
        specificFilesRootDesc: 'Файл в корне хранилища',
        sectionPathsWithSpaces: 'Пути с пробелами',
        pathsWithSpacesAsIsDesc: 'Просто напишите путь как есть',
        pathsWithSpacesNoQuotesDesc: 'Кавычки вокруг пробелов не нужны',
        sectionNonLatin: 'Нелатинские символы',
        nonLatinCyrillicDesc: 'Имя папки на кириллице',
        nonLatinChineseDesc: 'Китайские символы',
        nonLatinFullPathDesc: 'Полный нелатинский путь',
        sectionObsidianExamples: 'Примеры для Obsidian',
        obsidianTemplateFolderDesc: 'Папка шаблонов',
        obsidianDailyFolderDesc: 'Папка ежедневных заметок',
        obsidianAttachmentsDesc: 'Папка вложений / медиа',
        obsidianCanvasDesc: 'Все файлы холстов',
        obsidianExcalidrawDesc: 'Все рисунки Excalidraw',
        obsidianInboxDesc: 'Папка входящих / черновиков',
        obsidianArchiveDesc: 'Архивные заметки',
        sectionAllowlist:
          'Режим белого списка (отслеживать только определённые папки)',
        allowlistExcludeEverythingDesc: 'Сначала исключите всё',
        allowlistReincludeWantedDesc: 'Затем верните только то, что нужно',
        allowlistReincludeAnotherDesc: 'Вернуть ещё одну папку',
        emptyNote:
          'Когда это поле пустое, все заметки получают автоматическое обновление дат.',
      },
    },
    inversions: {
      heading: 'Дата изменения раньше даты создания',
      strategy: {
        name: 'Как исправлять даты в неправильном порядке',
        desc: 'Что делать, когда дата последнего изменения раньше даты создания. Применяется к автоматическим правкам и задаёт значение по умолчанию для массового инструмента.',
        optionDisabled: 'Не исправлять (только обнаруживать)',
        optionCreatedToUpdated:
          'Установить дату создания равной дате изменения',
        optionUpdatedToCreated:
          'Установить дату изменения равной дате создания',
        optionMaxAll: 'Установить обе на самую позднюю дату',
      },
      tolerance: {
        name: 'Игнорировать крошечные различия (секунды)',
        desc: 'Игнорировать неправильный порядок дат, когда разница меньше этого значения. Маленькое значение скрывает крошечные расхождения часов.',
      },
    },
    advanced: {
      summary: 'Дополнительно',
      newFileDelay: {
        name: 'Задержка для новых файлов',
        desc: 'Сколько миллисекунд подождать перед записью даты в только что созданную заметку. Помогает избежать конфликтов с плагинами шаблонов. Установите 0, чтобы выключить.',
      },
      autoPopulateCache: {
        name: 'Заполнять кеш при запуске',
        desc: 'При загрузке плагина создавать данные распознавания изменений для заметок, у которых их ещё нет. Работает в фоне.',
      },
      maxCacheEntries: {
        name: 'Максимум записей в кеше',
        desc: 'Когда кеш превышает этот предел, самые старые неиспользуемые записи удаляются. 0 = без ограничения.',
      },
      postUpdateCommand: {
        name: 'Команда после обновления',
        desc: 'Запускать команду Obsidian после обновления даты. Оставьте пустым, чтобы выключить.',
        optionNone: 'Нет',
      },
    },
    bulk: {
      heading: 'Массовые операции',
      populate: {
        name: 'Задать даты из собственных дат файла',
        desc: 'Заполнить даты создания и последнего изменения из собственных дат создания и изменения каждого файла на диске. Отлично для первоначальной настройки.',
        button: 'Заполнить даты',
      },
      rename: {
        name: 'Переименовать свойство',
        desc: 'Перенести значения из старого имени свойства в новое во всех заметках. Полезно после изменения имени свойства выше.',
        button: 'Переименовать свойство',
      },
      reformat: {
        name: 'Переформатировать существующие даты',
        desc: 'Найти даты в старом формате и переписать их в вашем текущем формате. Полезно после изменения формата даты выше.',
        button: 'Переформатировать даты',
      },
      findInversions: {
        name: 'Найти даты в неправильном порядке',
        desc: 'Просканировать заметки и перечислить те, где дата последнего изменения раньше даты создания. Затем можно применить выбранное выше исправление.',
        button: 'Найти даты в неправильном порядке',
      },
      rebuildCache: {
        name: 'Перестроить кеш хешей',
        desc: 'Пересчитать данные распознавания изменений (хеши содержимого) для всех ваших заметок. Полезно после изменения того, что считается изменением выше.',
        button: 'Перестроить кеш',
      },
    },
  },

  modals: {
    populate: {
      configureTitle: 'Задать даты из собственных дат файла',
      configureSubtitleLine1: 'Заполнить даты создания и последнего изменения',
      configureSubtitleLine2:
        'из собственных дат создания и изменения каждого файла на диске.',
      modeName: 'Какие даты задать',
      modeDesc: 'Выберите, какие даты заполнить.',
      modeOptionBoth: 'И создание, и изменение',
      modeOptionCreated: 'Только даты создания',
      modeOptionUpdated: 'Только даты изменения',
      overrideName: 'Файлы, у которых уже есть даты',
      overrideDesc:
        'Заполнить только отсутствующие даты или перезаписать существующие.',
      overrideOptionFillMissing: 'Только отсутствующие (безопасно)',
      overrideOptionOverwriteAll: 'Перезаписать все (заменяет существующие)',
      autoUpdateNoteTitle: 'Примечание об автообновлении:',
      autoUpdateNoteBody:
        'Если автообновление было активно, собственные даты файла на диске могут уже отражать правки самого плагина, а не исходные даты. Для лучшего результата используйте эту функцию до включения автообновления или сразу после установки плагина.',
      warningTitleCreatedUnreliable:
        'Дата создания файла ненадёжна на некоторых платформах',
      warningTitlePlatformNote: 'Примечание о платформе',
      platformMacWinNote: 'настоящая дата создания файла',
      platformLinuxNote:
        'система сообщает более позднюю дату, а не настоящую дату создания',
      platformAndroidNote: 'зависит от устройства, часто ненадёжна',
      platformIosNote: 'обычно надёжна',
      platformReliable: 'Надёжно',
      platformUnreliable: 'НЕНАДЁЖНО',
      platformYourPlatformSuffix: ' (ваша платформа)',
      syncNoteLine1:
        'Синхронизируемые хранилища: даты файлов могут сбрасываться службами синхронизации',
      syncNoteLine3: 'Дата последнего изменения обычно надёжнее даты создания.',
      recommendation:
        'Рекомендация: проверьте результаты после запуска. Сначала сделайте резервную копию.',
      overwriteWarning:
        'Это заменит существующие даты в ваших заметках. Это нельзя отменить. Сначала сделайте резервную копию.',
      noPropertyConfigured:
        'Не настроено имя свойства для: {missing}. Проверьте настройки плагина.',
      previewTitle: 'Предпросмотр: задать даты',
      noFilesNeedUpdating:
        'Нет файлов для обновления. У всех подходящих файлов уже есть запрошенные даты.',
      previewOverwriteWarning:
        'Режим перезаписи: существующие даты будут заменены. Это нельзя отменить. Сначала сделайте резервную копию.',
      settingDates: 'Установка дат…',
      stopped: 'Остановлено.',
      doneWithErrorsSubtitle: 'Обновлено файлов: {processed}.',
      doneTitle: 'Готово! Обновлено файлов: {processed}.',
    },
    rename: {
      configureTitle: 'Переименовать свойство',
      configureSubtitle:
        'Перенести значения из одного имени свойства в другое во всех заметках.',
      validationEnterOld: 'Введите старое имя свойства, чтобы продолжить.',
      validationEnterNew: 'Введите новое имя свойства, чтобы продолжить.',
      validationMustDiffer: 'Старое и новое имена свойства должны отличаться.',
      oldKeyName: 'Старое имя свойства',
      oldKeyDesc: 'Имя свойства, которое сейчас используется в ваших заметках.',
      newKeyName: 'Новое имя свойства',
      newKeyDesc: 'Новое имя свойства для использования.',
      deleteOldName: 'Удалить старое свойство после переименования',
      deleteOldDesc:
        'Удалить старое свойство после копирования его значения в новое.',
      namesCannotBeEmpty: 'Имена свойств не могут быть пустыми.',
      previewTitle: 'Предпросмотр: переименование свойства',
      noNotesUseProperty: 'Ни одна заметка не использует свойство "{oldKey}".',
      conflictWarning:
        'У {conflicts} заметок уже есть свойство "{newKey}". Существующее значение будет перезаписано.',
      columnArrowNew: '→ {newKey}',
      deleteWarning:
        'Старое свойство будет удалено после копирования. Это нельзя отменить. Сначала сделайте резервную копию.',
      renamingProperty: 'Переименование свойства…',
      renameStopped: 'Переименование остановлено.',
      doneWithErrorsSubtitle: 'Обновлено файлов: {processed}.',
      doneTitle: 'Готово! Обновлено файлов: {processed}.',
    },
    reformat: {
      configureTitle: 'Стандартизировать формат даты',
      configureSubtitle:
        'Разобрать существующие значения дат и переписать их в текущем формате из настроек.',
      invalidFormat: 'Неверный формат',
      targetFormatName: 'Целевой формат',
      scopeName: 'Какие поля переформатировать',
      scopeDesc: 'Выберите, какие даты стандартизировать.',
      scopeOptionAll: 'Все даты',
      scopeOptionCreated: 'Только создание',
      scopeOptionUpdated: 'Только изменение',
      scopeOptionViewed: 'Только просмотр',
      autoDetectNote:
        'Даты автоматически распознаются из распространённых форматов (ISO 8601, европейский, американский, числовые даты) и переписываются в вашем текущем формате.',
      noPropertyConfigured:
        'Не настроено имя свойства для: {missing}. Проверьте настройки плагина.',
      previewTitle: 'Предпросмотр: стандартизация дат',
      noChangeAmbiguous:
        'Пока нечего конвертировать. {ambiguousCount} дат можно прочитать двумя способами и они оставлены без изменений - выберите порядок день/месяц выше, чтобы конвертировать их.',
      noChangeDefault:
        'Нет файлов для переформатирования. Все даты уже в целевом формате или их не удалось разобрать.',
      errorWarningNoChange:
        'У {errorCount} файлов есть даты, которые не удалось разобрать.',
      errorWarningWillSkip:
        'У {errorCount} файлов есть даты, которые не удалось разобрать. Они будут пропущены.',
      checkNote:
        'Строки, отмеченные [проверить], можно прочитать двумя способами - проверьте, что новая дата выглядит правильно.',
      rewriteWarning:
        'Это переписывает существующие значения дат на месте. Это нельзя отменить. Сначала сделайте резервную копию.',
      ambiguityName: 'Даты, которые можно прочитать двумя способами',
      ambiguityDesc:
        '{ambiguousCount} дат могут означать день-первым или месяц-первым (например, 01/05/2024).{detectedHint}',
      detectedHintMonthFirst: ' Ваша система предлагает месяц первым.',
      detectedHintDayFirst: ' Ваша система предлагает день первым.',
      ambiguityOptionSkip: 'Оставить непонятные даты без изменений',
      ambiguityOptionDmy: 'День первым (01/05 = день 1, месяц 5)',
      ambiguityOptionMdy: 'Месяц первым (01/05 = месяц 1, день 5)',
      cellCouldNotRead: '{oldValue} (не удалось прочитать дату)',
      cellConversion: '{oldValue} → {newValue}{check}',
      cellNewValue: '{newValue}{check}',
      cellCheckSuffix: ' [проверить]',
      reformattingDates: 'Переформатирование дат…',
      reformatStopped: 'Переформатирование остановлено.',
      doneWithErrorsSubtitle: 'Обновлено файлов: {processed}.',
      doneTitle: 'Готово! Обновлено файлов: {processed}.',
    },
    inversions: {
      scanningTitle: 'Поиск дат в неправильном порядке…',
      foundTitle: 'Найдено заметок с датами в неправильном порядке: {count}',
      foundSubtitle:
        'У этих заметок дата последнего изменения раньше даты создания. Выберите ниже, как их исправить, или закройте для ручной проверки.',
      noneFound: 'Дат в неправильном порядке не найдено.',
      strategyName: 'Как исправить',
      strategyDesc: 'Выберите, как исправить даты.',
      strategyOptionDisabled: 'Не исправлять (только просмотр)',
      strategyOptionCreatedToUpdated:
        'Установить дату создания равной дате изменения',
      strategyOptionUpdatedToCreated:
        'Установить дату изменения равной дате создания',
      strategyOptionMaxAll: 'Установить обе на самую позднюю дату',
      toleranceNote:
        'Игнорируются различия меньше {tolerance} секунд (задано в настройках).',
      fixWarning:
        'Это изменит {count} заметок. Это нельзя отменить. Сначала сделайте резервную копию.',
      fixingDates: 'Исправление дат…',
      stopped: 'Массовая операция остановлена.',
      fixedNotice: 'Исправлено заметок: {processed}.',
      doneWithErrorsSubtitle: 'Исправлено заметок: {processed}.',
      doneTitle: 'Готово! Это окно можно безопасно закрыть.',
    },
    rebuildCache: {
      loadingFiles: 'Загрузка файлов…',
      confirmTitle:
        'Перестроить данные распознавания изменений для {count} файлов',
      confirmSubtitle:
        'Это пересчитывает отпечатки содержимого (хеши), которые используются для распознавания реальных правок. Ваши заметки не меняются.',
      rebuilding: 'Перестройка…',
      stopped: 'Массовая операция остановлена.',
      doneWithErrorsSubtitle: 'Обработано файлов: {processed}.',
      doneTitle: 'Готово! Это окно можно безопасно закрыть.',
    },
  },
};
