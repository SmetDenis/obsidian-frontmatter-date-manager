// Ukrainian. Machine-generated baseline. Improvements welcome - see CONTRIBUTING.md.
import type { Strings } from '../index';

export const STRINGS_UK: Strings = {
  common: {
    run: 'Запустити',
    back: 'Назад',
    cancel: 'Скасувати',
    close: 'Закрити',
    file: 'Файл',
    created: 'Створено',
    updated: 'Оновлено',
    viewed: 'Переглянуто',
    createdKeyed: 'Створено ({key})',
    updatedKeyed: 'Оновлено ({key})',
    viewedKeyed: 'Переглянуто ({key})',
    scanAndPreview: 'Сканувати та показати',
    scanningFiles: 'Сканування файлів…',
    doneWithErrors: 'Готово. Помилок: {errors}.',
  },
  commands: {
    updateCurrentFile: 'Оновити дати в поточному файлі',
    toggleAutoUpdate: 'Увімкнути/вимкнути автооновлення',
    pauseAutoUpdate: 'Призупинити автооновлення на 5 хвилин',
  },
  statusBar: {
    paused: 'Призупинено',
    pausedWithMinutes: 'Призупинено ({remaining}хв)',
  },
  notices: {
    inversionDetectedAndFixed:
      'Frontmatter Date Manager: виявлено та виправлено дати в неправильному порядку. Відкрийте "Знайти дати в неправильному порядку" в налаштуваннях для перевірки.',
    timestampsUpdated: 'Дати оновлено.',
    fileIgnored: 'Файл виключено налаштуваннями плагіна.',
    failedToUpdateWithReason: 'Не вдалося оновити дати: {reason}',
    failedToUpdate: 'Не вдалося оновити дати.',
    autoUpdateEnabled: 'Автооновлення увімкнено',
    autoUpdateDisabled: 'Автооновлення вимкнено',
    autoUpdatePausedForMinutes:
      'Автооновлення призупинено на {minutes} хвилин. Відновиться автоматично.',
    autoUpdateResumed: 'Автооновлення відновлено.',
    malformedFrontmatter:
      'Frontmatter Date Manager: збій\nНекоректні властивості у файлі: {filePath}\n\n{message}',
  },
  bulkChrome: {
    summaryWillChange: 'Буде змінено файлів: {changed}',
    summarySkipped: 'Пропущено: {skipped}',
    summaryErrors: 'Помилок: {errors}',
    pagerPrev: 'Попередня',
    pagerNext: 'Наступна',
    pageInfo: 'Сторінка {current} з {total}',
    downloadFullPreview: 'Завантажити повний попередній перегляд',
    downloadSuccess:
      'Завантажено рядків: {count}. Файл {filename} у теці завантажень.',
    downloadFailed: 'Не вдалося завантажити файл попереднього перегляду.',
    failureColumnError: 'Помилка',
    progressCounter: '{count}/{max}',
  },
  settings: {
    description: {
      syncIntro:
        'Служби синхронізації, інструменти резервного копіювання та інші плагіни часто перезаписують файли, не змінюючи їхній вміст - і це скидає дати файлу на диску. Через це неможливо зрозуміти, коли ви насправді востаннє редагували нотатку.',
      pluginIntro:
        'Плагін записує дати створення та останнього редагування прямо у властивості кожної нотатки й розпізнає справжні зміни, порівнюючи вміст, тому ваші дати відображають реальні правки, а не артефакти синхронізації.',
    },
    dates: {
      heading: 'Які дати відстежувати',
      enableNoneHint:
        'Увімкніть хоча б одну дату вище, щоб налаштувати плагін.',
      created: {
        enableName: 'Відстежувати дату створення',
        enableDesc: 'Додавати дату створення нотаткам, у яких її ще немає.',
        propertyName: 'Властивість для дати створення',
        propertyDesc: "Ім'я властивості, у яку зберігається дата створення.",
        propertyPlaceholder: 'Created',
      },
      updated: {
        enableName: 'Відстежувати дату редагування',
        enableDesc: 'Оновлювати цю дату під час кожного редагування нотатки.',
        propertyName: 'Властивість для дати редагування',
        propertyDesc:
          "Ім'я властивості, у яку зберігається дата останнього редагування.",
        propertyPlaceholder: 'Updated',
      },
      updateCount: {
        enableName: 'Рахувати правки',
        enableDesc:
          'Додавати числову властивість, яка збільшується на одиницю під час кожного редагування нотатки. Приблизний лічильник активності, а не точна історія.',
        propertyName: 'Властивість для лічильника правок',
        propertyDesc: "Ім'я властивості, у яку зберігається лічильник правок.",
      },
      viewed: {
        enableName: 'Відстежувати дату останнього відкриття',
        enableDesc: 'Зберігати дату під час кожного відкриття нотатки.',
        propertyName: 'Властивість для дати відкриття',
        propertyDesc:
          "Ім'я властивості, у яку зберігається дата останнього відкриття.",
        propertyPlaceholder: 'Viewed',
      },
    },
    formatting: {
      heading: 'Формат дати',
      dateFormat: {
        name: 'Формат дати',
        desc: 'Як дати й час записуються у ваші нотатки.',
        formatCodesLink: 'Список кодів формату',
        currentlyPreview: 'Зараз: {preview}',
        invalidWithHint: 'Неправильний формат. {hint}',
        invalidFormat: 'Неправильний рядок формату дати.',
        obsidianDefault:
          "Формат Obsidian за замовчуванням: yyyy-MM-dd'T'HH:mm:ss (дата й час, місцевий часовий пояс)",
      },
      timezone: {
        name: 'Часовий пояс',
        desc: 'Часовий пояс для запису дат. Залиште порожнім, щоб використовувати часовий пояс вашого пристрою ({localTz}).',
        placeholder: 'Місцевий ({localTz})',
        resetTooltip: 'Скинути на місцевий часовий пояс',
      },
      numberProperties: {
        name: 'Зберігати числові дати без лапок',
        desc: 'Якщо ваш формат дати складається лише з цифр (наприклад, unix-час), записувати її як звичайне число (updated: 1712930400), а не як текст у лапках (updated: "1712930400"). Не впливає, якщо формат містить дефіси або двокрапки.',
      },
    },
    behavior: {
      heading: 'Поведінка',
      autoUpdate: {
        name: 'Автооновлення',
        desc: 'Автоматично оновлювати дати під час редагування нотатки. Також доступно з палітри команд.',
      },
      minSeconds: {
        name: 'Мінімум секунд між оновленнями',
        desc: 'Не дає оновлювати дату надто часто, поки ви друкуєте або перемикаєтеся між нотатками.',
      },
      changeDetection: {
        name: 'Розпізнавання змін (хешування вмісту)',
        descEnabled:
          'Дата останнього редагування записується лише тоді, коли вміст нотатки справді змінюється - це запобігає хибним оновленням від плагінів синхронізації.',
        descDisabled:
          'Вимкнено - дата останнього редагування записується під час кожного збереження, навіть якщо нічого не змінилося.',
      },
      hashTrackingMode: {
        name: 'Що вважати зміною',
        desc: 'Яка частина нотатки вважається зміною. "Лише тіло" - редагування властивостей (теги, псевдоніми тощо) не оновлює дату. "Лише властивості" - редагування тексту нотатки не оновлює дату. "Обидва" - будь-яка правка оновлює дату.',
        optionBody: 'Лише тіло нотатки (за замовчуванням)',
        optionFrontmatter: 'Лише властивості',
        optionBoth: 'Тіло та властивості',
        changedNotice:
          'Режим відстеження змінено. Перебудуйте кеш хешів (у масових операціях), щоб дати залишалися точними.',
      },
      excludeKeys: {
        name: 'Ігнорувати ці властивості',
        desc: 'Редагування цих властивостей не оновлюватиме дату. Можна додати кілька одразу через кому. Властивості created, updated і viewed завжди ігноруються автоматично.',
        placeholder: "Ім'я властивості, наприклад tags",
        addTooltip: 'Додати властивість',
        chipRemoveAriaLabel: 'Видалити {entry}',
      },
    },
    filterRules: {
      name: 'Файли та теки, які пропускати',
      descIntro:
        'Виберіть файли або теки, які не потрібно чіпати (без автоматичного оновлення дат). ',
      descOnePerLine: 'По одному шаблону в рядку. Рядки, що починаються з ',
      descCommentsAre: ' - це коментарі. Почніть рядок з ',
      descAddBack: ' - щоб повернути шлях назад. ',
      descLastWins: 'Якщо збігається кілька рядків, перемагає останній.',
      advancedSyntaxLink: 'Розширений синтаксис (у стилі gitignore)',
      noRulesWarning:
        'Правил немає - усі нотатки отримують автоматичне оновлення дат.',
      placeholderExcludeFolder: '# Виключити теку',
      placeholderExcludeByPattern: '# Виключити за шаблоном',
      placeholderReinclude: '# Повернути конкретний файл',
      parseError: 'Рядок {lineNumber}: {message} - "{text}"',
      previewButton: 'Показати відповідні файли',
      previewSummary: 'Відстежується нотаток: {tracked}, пропущено: {excluded}',
      skippedFilesSummary: 'Пропущені файли ({excluded})',
      skippedMore: '...і ще {count}',
      reference: {
        summary: 'Довідка із синтаксису шаблонів',
        sectionBasics: 'Основи синтаксису',
        basicsCommentDesc: 'Рядки, що починаються з #, ігноруються',
        basicsBlankDesc: 'Порожні рядки ігноруються',
        basicsExcludeDesc:
          'Виключення - файли всередині templates/ пропускаються',
        basicsReincludeDesc: 'Повернення - префікс ! скасовує виключення',
        basicsLastWinsDesc: 'Коли збігається кілька правил, перемагає останнє',
        sectionExcludeFolder: 'Виключити теку',
        excludeFolderAllFilesDesc: 'Усі файли всередині templates/',
        excludeFolderSameEffectDesc:
          'Той самий ефект (завершальний слеш необовʼязковий)',
        excludeFolderNestedDesc: 'Вкладена тека',
        sectionReinclude: 'Повернення (скасування виключення)',
        reincludeExcludeWholeDesc: 'Виключити всю теку',
        reincludeKeepDesc: 'Але продовжувати відстежувати цей конкретний файл',
        sectionWildcards: 'Підстановочні знаки',
        wildcardStarDesc: 'Будь-які символи, крім /',
        wildcardDoubleStarDesc:
          'Будь-які символи, включно з / (перетинає теки)',
        wildcardQuestionDesc: 'Рівно один символ',
        sectionWildcardExamples: 'Приклади з підстановочними знаками',
        wildcardExCanvasRootDesc:
          'Файли, що закінчуються на .canvas.md у корені сховища',
        wildcardExCanvasAnyDesc:
          'Файли, що закінчуються на .canvas.md у будь-якій теці',
        wildcardExDailyDesc: 'Файли на кшталт daily/2024-01-01.md',
        wildcardExTwoCharDesc: 'Двосимвольні імена файлів у notes/',
        sectionSpecificFiles: 'Конкретні файли',
        specificFilesOneExactDesc: 'Один точний файл',
        specificFilesRootDesc: 'Файл у корені сховища',
        sectionPathsWithSpaces: 'Шляхи з пробілами',
        pathsWithSpacesAsIsDesc: 'Просто напишіть шлях як є',
        pathsWithSpacesNoQuotesDesc: 'Лапки навколо пробілів не потрібні',
        sectionNonLatin: 'Нелатинські символи',
        nonLatinCyrillicDesc: 'Імʼя теки кирилицею',
        nonLatinChineseDesc: 'Китайські символи',
        nonLatinFullPathDesc: 'Повний нелатинський шлях',
        sectionObsidianExamples: 'Приклади для Obsidian',
        obsidianTemplateFolderDesc: 'Тека шаблонів',
        obsidianDailyFolderDesc: 'Тека щоденних нотаток',
        obsidianAttachmentsDesc: 'Тека вкладень / медіа',
        obsidianCanvasDesc: 'Усі файли полотен',
        obsidianExcalidrawDesc: 'Усі малюнки Excalidraw',
        obsidianInboxDesc: 'Тека вхідних / чернеток',
        obsidianArchiveDesc: 'Архівні нотатки',
        sectionAllowlist: 'Режим білого списку (відстежувати лише певні теки)',
        allowlistExcludeEverythingDesc: 'Спочатку виключіть усе',
        allowlistReincludeWantedDesc: 'Потім поверніть лише те, що потрібно',
        allowlistReincludeAnotherDesc: 'Повернути ще одну теку',
        emptyNote:
          'Коли це поле порожнє, усі нотатки отримують автоматичне оновлення дат.',
      },
    },
    inversions: {
      heading: 'Дата редагування раніше за дату створення',
      strategy: {
        name: 'Як виправляти дати в неправильному порядку',
        desc: 'Що робити, коли дата останнього редагування раніша за дату створення. Застосовується до автоматичних правок і задає значення за замовчуванням для масового інструмента.',
        optionDisabled: 'Не виправляти (лише виявляти)',
        optionCreatedToUpdated:
          'Установити дату створення рівною даті редагування',
        optionUpdatedToCreated:
          'Установити дату редагування рівною даті створення',
        optionMaxAll: 'Установити обидві на найпізнішу дату',
      },
      tolerance: {
        name: 'Ігнорувати крихітні різниці (секунди)',
        desc: 'Ігнорувати неправильний порядок дат, коли різниця менша за це значення. Маленьке значення приховує крихітні розбіжності годинників.',
      },
    },
    advanced: {
      summary: 'Додатково',
      newFileDelay: {
        name: 'Затримка для нових файлів',
        desc: 'Скільки мілісекунд зачекати перед записом дати в щойно створену нотатку. Допомагає уникнути конфліктів з плагінами шаблонів. Установіть 0, щоб вимкнути.',
      },
      autoPopulateCache: {
        name: 'Заповнювати кеш під час запуску',
        desc: 'Під час завантаження плагіна створювати дані розпізнавання змін для нотаток, у яких їх ще немає. Працює у фоні.',
      },
      maxCacheEntries: {
        name: 'Максимум записів у кеші',
        desc: 'Коли кеш перевищує цю межу, найстаріші невикористовувані записи видаляються. 0 = без обмеження.',
      },
      postUpdateCommand: {
        name: 'Команда після оновлення',
        desc: 'Запускати команду Obsidian після оновлення дати. Залиште порожнім, щоб вимкнути.',
        optionNone: 'Немає',
      },
    },
    bulk: {
      heading: 'Масові операції',
      populate: {
        name: 'Задати дати з власних дат файлу',
        desc: 'Заповнити дати створення та останнього редагування з власних дат створення й зміни кожного файлу на диску. Чудово для першого налаштування.',
        button: 'Заповнити дати',
      },
      rename: {
        name: 'Перейменувати властивість',
        desc: 'Перенести значення зі старого імені властивості в нове в усіх нотатках. Корисно після зміни імені властивості вище.',
        button: 'Перейменувати властивість',
      },
      reformat: {
        name: 'Переформатувати наявні дати',
        desc: 'Знайти дати у старому форматі й переписати їх у вашому поточному форматі. Корисно після зміни формату дати вище.',
        button: 'Переформатувати дати',
      },
      findInversions: {
        name: 'Знайти дати в неправильному порядку',
        desc: 'Просканувати нотатки та перелічити ті, де дата останнього редагування раніша за дату створення. Потім можна застосувати вибране вище виправлення.',
        button: 'Знайти дати в неправильному порядку',
      },
      rebuildCache: {
        name: 'Перебудувати кеш хешів',
        desc: 'Перерахувати дані розпізнавання змін (хеші вмісту) для всіх ваших нотаток. Корисно після зміни того, що вважається зміною вище.',
        button: 'Перебудувати кеш',
      },
    },
  },
  modals: {
    populate: {
      configureTitle: 'Задати дати з власних дат файлу',
      configureSubtitleLine1:
        'Заповнити дати створення та останнього редагування',
      configureSubtitleLine2:
        'з власних дат створення й зміни кожного файлу на диску.',
      modeName: 'Які дати задати',
      modeDesc: 'Виберіть, які дати заповнити.',
      modeOptionBoth: 'І створення, і редагування',
      modeOptionCreated: 'Лише дати створення',
      modeOptionUpdated: 'Лише дати редагування',
      overrideName: 'Файли, у яких уже є дати',
      overrideDesc: 'Заповнити лише відсутні дати або перезаписати наявні.',
      overrideOptionFillMissing: 'Лише відсутні (безпечно)',
      overrideOptionOverwriteAll: 'Перезаписати всі (замінює наявні)',
      autoUpdateNoteTitle: 'Примітка про автооновлення:',
      autoUpdateNoteBody:
        'Якщо автооновлення було активним, власні дати файлу на диску можуть уже відображати правки самого плагіна, а не початкові дати. Для найкращого результату використовуйте цю функцію до ввімкнення автооновлення або одразу після встановлення плагіна.',
      warningTitleCreatedUnreliable:
        'Дата створення файлу ненадійна на деяких платформах',
      warningTitlePlatformNote: 'Примітка про платформу',
      platformMacWin: 'macOS / Windows',
      platformMacWinNote: 'справжня дата створення файлу',
      platformLinux: 'Linux',
      platformLinuxNote:
        'система повідомляє пізнішу дату, а не справжню дату створення',
      platformAndroid: 'Android',
      platformAndroidNote: 'залежить від пристрою, часто ненадійна',
      platformIos: 'iOS',
      platformIosNote: 'зазвичай надійна',
      platformReliable: 'Надійно',
      platformUnreliable: 'НЕНАДІЙНО',
      platformLineName: '{name}: {prefix}',
      platformYourPlatformSuffix: ' (ваша платформа)',
      syncNoteLine1:
        'Синхронізовані сховища: дати файлів можуть скидатися службами синхронізації',
      syncNoteLine2: '(Obsidian Sync, iCloud, Dropbox, Git).',
      syncNoteLine3:
        'Дата останнього редагування зазвичай надійніша за дату створення.',
      recommendation:
        'Рекомендація: перевірте результати після запуску. Спочатку зробіть резервну копію.',
      overwriteWarning:
        'Це замінить наявні дати у ваших нотатках. Це не можна скасувати. Спочатку зробіть резервну копію.',
      noPropertyConfigured:
        "Не налаштовано ім'я властивості для: {missing}. Перевірте налаштування плагіна.",
      previewTitle: 'Попередній перегляд: задати дати',
      noFilesNeedUpdating:
        'Немає файлів для оновлення. У всіх відповідних файлів уже є запитувані дати.',
      previewOverwriteWarning:
        'Режим перезапису: наявні дати будуть замінені. Це не можна скасувати. Спочатку зробіть резервну копію.',
      settingDates: 'Встановлення дат…',
      stopped: 'Зупинено.',
      doneWithErrorsSubtitle: 'Оновлено файлів: {processed}.',
      doneTitle: 'Готово! Оновлено файлів: {processed}.',
    },
    rename: {
      configureTitle: 'Перейменувати властивість',
      configureSubtitle:
        'Перенести значення з одного імені властивості в інше в усіх нотатках.',
      validationEnterOld: "Введіть старе ім'я властивості, щоб продовжити.",
      validationEnterNew: "Введіть нове ім'я властивості, щоб продовжити.",
      validationMustDiffer:
        'Старе й нове імена властивості повинні відрізнятися.',
      oldKeyName: "Старе ім'я властивості",
      oldKeyDesc:
        "Ім'я властивості, яке зараз використовується у ваших нотатках.",
      oldKeyPlaceholder: 'Date_created',
      newKeyName: "Нове ім'я властивості",
      newKeyDesc: "Нове ім'я властивості для використання.",
      newKeyPlaceholder: 'Created',
      deleteOldName: 'Видалити стару властивість після перейменування',
      deleteOldDesc:
        'Видалити стару властивість після копіювання її значення в нову.',
      namesCannotBeEmpty: 'Імена властивостей не можуть бути порожніми.',
      previewTitle: 'Попередній перегляд: перейменування властивості',
      noNotesUseProperty:
        'Жодна нотатка не використовує властивість "{oldKey}".',
      conflictWarning:
        'У {conflicts} нотаток уже є властивість "{newKey}". Наявне значення буде перезаписано.',
      columnArrowNew: '→ {newKey}',
      deleteWarning:
        'Стара властивість буде видалена після копіювання. Це не можна скасувати. Спочатку зробіть резервну копію.',
      renamingProperty: 'Перейменування властивості…',
      renameStopped: 'Перейменування зупинено.',
      doneWithErrorsSubtitle: 'Оновлено файлів: {processed}.',
      doneTitle: 'Готово! Оновлено файлів: {processed}.',
    },
    reformat: {
      configureTitle: 'Стандартизувати формат дати',
      configureSubtitle:
        'Розібрати наявні значення дат і переписати їх у поточному форматі з налаштувань.',
      invalidFormat: 'Неправильний формат',
      targetFormatName: 'Цільовий формат',
      targetFormatDesc: '{currentFormat}',
      scopeName: 'Які поля переформатувати',
      scopeDesc: 'Виберіть, які дати стандартизувати.',
      scopeOptionAll: 'Усі дати',
      scopeOptionCreated: 'Лише створення',
      scopeOptionUpdated: 'Лише редагування',
      scopeOptionViewed: 'Лише перегляд',
      autoDetectNote:
        'Дати автоматично розпізнаються з поширених форматів (ISO 8601, європейський, американський, числові дати) і переписуються у вашому поточному форматі.',
      noPropertyConfigured:
        "Не налаштовано ім'я властивості для: {missing}. Перевірте налаштування плагіна.",
      previewTitle: 'Попередній перегляд: стандартизація дат',
      noChangeAmbiguous:
        'Поки нічого конвертувати. {ambiguousCount} дат можна прочитати двома способами і вони залишені без змін - виберіть порядок день/місяць вище, щоб конвертувати їх.',
      noChangeDefault:
        'Немає файлів для переформатування. Усі дати вже в цільовому форматі або їх не вдалося розібрати.',
      errorWarningNoChange:
        'У {errorCount} файлів є дати, які не вдалося розібрати.',
      errorWarningWillSkip:
        'У {errorCount} файлів є дати, які не вдалося розібрати. Вони будуть пропущені.',
      checkNote:
        'Рядки, позначені [перевірити], можна прочитати двома способами - перевірте, що нова дата виглядає правильно.',
      rewriteWarning:
        'Це переписує наявні значення дат на місці. Це не можна скасувати. Спочатку зробіть резервну копію.',
      ambiguityName: 'Дати, які можна прочитати двома способами',
      ambiguityDesc:
        '{ambiguousCount} дат можуть означати день-першим або місяць-першим (наприклад, 01/05/2024).{detectedHint}',
      detectedHintMonthFirst: ' Ваша система пропонує місяць першим.',
      detectedHintDayFirst: ' Ваша система пропонує день першим.',
      ambiguityOptionSkip: 'Залишити незрозумілі дати без змін',
      ambiguityOptionDmy: 'День першим (01/05 = день 1, місяць 5)',
      ambiguityOptionMdy: 'Місяць першим (01/05 = місяць 1, день 5)',
      cellCouldNotRead: '{oldValue} (не вдалося прочитати дату)',
      cellConversion: '{oldValue} → {newValue}{check}',
      cellNewValue: '{newValue}{check}',
      cellCheckSuffix: ' [перевірити]',
      reformattingDates: 'Переформатування дат…',
      reformatStopped: 'Переформатування зупинено.',
      doneWithErrorsSubtitle: 'Оновлено файлів: {processed}.',
      doneTitle: 'Готово! Оновлено файлів: {processed}.',
    },
    inversions: {
      scanningTitle: 'Пошук дат у неправильному порядку…',
      foundTitle: 'Знайдено нотаток з датами в неправильному порядку: {count}',
      foundSubtitle:
        'У цих нотаток дата останнього редагування раніша за дату створення. Виберіть нижче, як їх виправити, або закрийте для ручної перевірки.',
      noneFound: 'Дат у неправильному порядку не знайдено.',
      strategyName: 'Як виправити',
      strategyDesc: 'Виберіть, як виправити дати.',
      strategyOptionDisabled: 'Не виправляти (лише перегляд)',
      strategyOptionCreatedToUpdated:
        'Установити дату створення рівною даті редагування',
      strategyOptionUpdatedToCreated:
        'Установити дату редагування рівною даті створення',
      strategyOptionMaxAll: 'Установити обидві на найпізнішу дату',
      toleranceNote:
        'Ігноруються різниці менші за {tolerance} секунд (задано в налаштуваннях).',
      columnDelta: 'Δ',
      fixWarning:
        'Це змінить {count} нотаток. Це не можна скасувати. Спочатку зробіть резервну копію.',
      fixingDates: 'Виправлення дат…',
      stopped: 'Масову операцію зупинено.',
      fixedNotice: 'Виправлено нотаток: {processed}.',
      doneWithErrorsSubtitle: 'Виправлено нотаток: {processed}.',
      doneTitle: 'Готово! Це вікно можна безпечно закрити.',
    },
    rebuildCache: {
      loadingFiles: 'Завантаження файлів…',
      confirmTitle: 'Перебудувати дані розпізнавання змін для {count} файлів',
      confirmSubtitle:
        'Це перераховує відбитки вмісту (хеші), які використовуються для розпізнавання реальних правок. Ваші нотатки не змінюються.',
      rebuilding: 'Перебудова…',
      stopped: 'Масову операцію зупинено.',
      doneWithErrorsSubtitle: 'Оброблено файлів: {processed}.',
      doneTitle: 'Готово! Це вікно можна безпечно закрити.',
    },
  },
};
