// Persian. Machine-generated baseline. Improvements welcome - see CONTRIBUTING.md.
import type { Strings } from '../index';

export const STRINGS_FA: Strings = {
  common: {
    run: 'اجرا',
    back: 'بازگشت',
    cancel: 'لغو',
    close: 'بستن',
    file: 'پرونده',
    created: 'ایجادشده',
    updated: 'به‌روزشده',
    viewed: 'مشاهده‌شده',
    createdKeyed: 'ایجادشده ({key})',
    updatedKeyed: 'به‌روزشده ({key})',
    viewedKeyed: 'مشاهده‌شده ({key})',
    scanAndPreview: 'پویش و پیش‌نمایش',
    scanningFiles: 'در حال پویش پرونده‌ها…',
    doneWithErrors: 'انجام شد. تعداد خطاها: {errors}.',
  },
  commands: {
    updateCurrentFile: 'به‌روزرسانی تاریخ‌ها در پرونده فعلی',
    toggleAutoUpdate: 'روشن/خاموش کردن به‌روزرسانی خودکار',
    pauseAutoUpdate: 'مکث به‌روزرسانی خودکار به مدت 5 دقیقه',
  },
  statusBar: {
    paused: 'متوقف‌شده',
    pausedWithMinutes: 'متوقف‌شده ({remaining} دقیقه)',
  },
  notices: {
    inversionDetectedAndFixed:
      'Frontmatter Date Manager: تاریخ‌های نامرتب شناسایی و اصلاح شدند. برای بررسی از «یافتن تاریخ‌های نامرتب» در تنظیمات استفاده کنید.',
    timestampsUpdated: 'تاریخ‌ها به‌روزرسانی شدند.',
    fileIgnored: 'این پرونده بر اساس تنظیمات افزونه نادیده گرفته شده است.',
    failedToUpdateWithReason: 'به‌روزرسانی تاریخ‌ها ناموفق بود: {reason}',
    failedToUpdate: 'به‌روزرسانی تاریخ‌ها ناموفق بود.',
    autoUpdateEnabled: 'به‌روزرسانی خودکار فعال شد',
    autoUpdateDisabled: 'به‌روزرسانی خودکار غیرفعال شد',
    autoUpdatePausedForMinutes:
      'به‌روزرسانی خودکار به مدت {minutes} دقیقه متوقف شد. به‌طور خودکار از سر گرفته می‌شود.',
    autoUpdateResumed: 'به‌روزرسانی خودکار از سر گرفته شد.',
    malformedFrontmatter:
      'Frontmatter Date Manager ناموفق بود\nویژگی‌های نادرست در این پرونده: {filePath}\n\n{message}',
  },
  bulkChrome: {
    summaryWillChange: 'تعداد پرونده‌هایی که تغییر می‌کنند: {changed}',
    summarySkipped: 'رد شده: {skipped}',
    summaryErrors: 'تعداد خطاها: {errors}',
    pagerPrev: 'قبلی',
    pagerNext: 'بعدی',
    pageInfo: 'صفحه {current} از {total}',
    downloadFullPreview: 'دانلود پیش‌نمایش کامل',
    downloadSuccess:
      'تعداد {count} ردیف به‌صورت {filename} در پوشه دانلودهای شما دانلود شد.',
    downloadFailed: 'دانلود پرونده پیش‌نمایش ممکن نشد.',
    failureColumnError: 'خطا',
    progressCounter: '{count}/{max}',
  },
  settings: {
    description: {
      syncIntro:
        'سرویس‌های همگام‌سازی، ابزارهای پشتیبان‌گیری و افزونه‌های دیگر اغلب پرونده‌ها را بدون تغییر محتوا بازنویسی می‌کنند و این کار تاریخ‌های پرونده روی دیسک را بازنشانی می‌کند. در نتیجه تشخیص اینکه واقعاً آخرین بار چه زمانی یادداشتی را ویرایش کرده‌اید ناممکن می‌شود.',
      pluginIntro:
        'این افزونه تاریخ‌های ایجاد و آخرین ویرایش را مستقیماً در ویژگی‌های هر یادداشت می‌نویسد و با مقایسه محتوا تغییرات واقعی را تشخیص می‌دهد، پس تاریخ‌های شما ویرایش‌های واقعی را بازتاب می‌دهند، نه نتیجه همگام‌سازی را.',
    },
    dates: {
      heading: 'تاریخ‌هایی که باید ردیابی شوند',
      enableNoneHint:
        'برای راه‌اندازی افزونه، دست‌کم یکی از تاریخ‌های بالا را روشن کنید.',
      created: {
        enableName: 'ردیابی تاریخ ایجاد',
        enableDesc: 'افزودن تاریخ ایجاد به یادداشت‌هایی که هنوز آن را ندارند.',
        propertyName: 'ویژگی تاریخ ایجاد',
        propertyDesc: 'نام ویژگی‌ای که تاریخ ایجاد در آن ذخیره می‌شود.',
        propertyPlaceholder: 'Created',
      },
      updated: {
        enableName: 'ردیابی تاریخ آخرین ویرایش',
        enableDesc:
          'هر بار که یادداشت را ویرایش می‌کنید این تاریخ را به‌روز کن.',
        propertyName: 'ویژگی به‌روزرسانی',
        propertyDesc: 'نام ویژگی‌ای که تاریخ آخرین ویرایش در آن ذخیره می‌شود.',
        propertyPlaceholder: 'Updated',
      },
      updateCount: {
        enableName: 'شمارش ویرایش‌ها',
        enableDesc:
          'افزودن یک ویژگی عددی که هر بار یادداشتی را ویرایش می‌کنید یک واحد بالا می‌رود. یک شمارنده تقریبی فعالیت، نه یک تاریخچه دقیق.',
        propertyName: 'ویژگی شمار ویرایش‌ها',
        propertyDesc: 'نام ویژگی‌ای که شمار ویرایش‌ها در آن ذخیره می‌شود.',
      },
      viewed: {
        enableName: 'ردیابی تاریخ آخرین بازکردن',
        enableDesc: 'ذخیره تاریخ هر بار که یادداشت را باز می‌کنید.',
        propertyName: 'ویژگی مشاهده',
        propertyDesc: 'نام ویژگی‌ای که تاریخ آخرین بازکردن در آن ذخیره می‌شود.',
        propertyPlaceholder: 'Viewed',
      },
    },
    formatting: {
      heading: 'قالب‌بندی تاریخ',
      dateFormat: {
        name: 'قالب تاریخ',
        desc: 'چگونگی نوشته‌شدن تاریخ‌ها و زمان‌ها در یادداشت‌های شما.',
        formatCodesLink: 'مشاهده کدهای قالب موجود',
        currentlyPreview: 'اکنون: {preview}',
        invalidWithHint: 'قالب نامعتبر است. {hint}',
        invalidFormat: 'رشته قالب تاریخ نامعتبر است.',
        obsidianDefault:
          "قالب پیش‌فرض Obsidian: yyyy-MM-dd'T'HH:mm:ss (تاریخ و زمان، منطقه زمانی محلی)",
      },
      timezone: {
        name: 'منطقه زمانی',
        desc: 'منطقه زمانی‌ای که هنگام نوشتن تاریخ‌ها به کار می‌رود. برای استفاده از منطقه زمانی دستگاه خود ({localTz}) آن را خالی بگذارید.',
        placeholder: 'محلی ({localTz})',
        resetTooltip: 'بازنشانی به منطقه زمانی محلی',
      },
      numberProperties: {
        name: 'ذخیره تاریخ‌های فقط عددی بدون نقل‌قول',
        desc: 'اگر قالب تاریخ شما فقط رقم است (مانند unix timestamp)، آن را به‌صورت یک عدد ساده (updated: 1712930400) بنویس به‌جای متن درون نقل‌قول (updated: "1712930400"). وقتی قالب شما خط تیره یا دونقطه دارد، اثری ندارد.',
      },
    },
    behavior: {
      heading: 'رفتار',
      autoUpdate: {
        name: 'به‌روزرسانی خودکار',
        desc: 'هنگام ویرایش یادداشت، تاریخ‌ها را به‌طور خودکار به‌روز کن. از پالت فرمان نیز در دسترس است.',
      },
      minSeconds: {
        name: 'حداقل ثانیه بین به‌روزرسانی‌ها',
        desc: 'از به‌روزرسانی بیش از حد تاریخ هنگام تایپ یا جابه‌جایی میان یادداشت‌ها جلوگیری می‌کند.',
      },
      changeDetection: {
        name: 'تشخیص تغییر (هش‌کردن محتوا)',
        descEnabled:
          'تاریخ آخرین ویرایش فقط زمانی نوشته می‌شود که محتوای یادداشت واقعاً تغییر کند. این از به‌روزرسانی‌های نادرست افزونه‌های همگام‌سازی جلوگیری می‌کند.',
        descDisabled:
          'غیرفعال است. تاریخ آخرین ویرایش در هر ذخیره نوشته می‌شود، حتی اگر چیزی تغییر نکرده باشد.',
      },
      hashTrackingMode: {
        name: 'چه چیزی تغییر به شمار می‌رود',
        desc: 'کدام بخش از یک یادداشت تغییر به شمار می‌رود. «فقط بدنه» - ویرایش ویژگی‌ها (برچسب‌ها، نام‌های مستعار و غیره) تاریخ را به‌روز نمی‌کند. «فقط ویژگی‌ها» - ویرایش متن یادداشت تاریخ را به‌روز نمی‌کند. «هر دو» - هر ویرایشی تاریخ را به‌روز می‌کند.',
        optionBody: 'فقط بدنه یادداشت (پیش‌فرض)',
        optionFrontmatter: 'فقط ویژگی‌ها',
        optionBoth: 'بدنه و ویژگی‌ها',
        changedNotice:
          'حالت ردیابی تغییر کرد. حافظه پنهان هش‌ها را (در عملیات گروهی) بازسازی کنید تا تاریخ‌ها دقیق بمانند.',
      },
      excludeKeys: {
        name: 'این ویژگی‌ها را نادیده بگیر',
        desc: 'ویرایش این ویژگی‌ها تاریخ را به‌روز نمی‌کند. می‌توانید چند مورد را یک‌جا با جداکردن آن‌ها با ویرگول اضافه کنید. ویژگی‌های created، updated و viewed همیشه به‌طور خودکار نادیده گرفته می‌شوند.',
        placeholder: 'نام ویژگی مانند tags',
        addTooltip: 'افزودن ویژگی',
        chipRemoveAriaLabel: 'حذف {entry}',
      },
    },
    filterRules: {
      name: 'پرونده‌ها و پوشه‌هایی که باید رد شوند',
      descIntro:
        'پرونده‌ها یا پوشه‌هایی را انتخاب کنید که بدون تغییر بمانند (بدون به‌روزرسانی خودکار تاریخ). ',
      descOnePerLine: 'هر الگو در یک خط. خط‌هایی که با ',
      descCommentsAre: ' آغاز می‌شوند توضیح هستند. خطی را با ',
      descAddBack: ' آغاز کنید تا یک مسیر را بازگردانید. ',
      descLastWins: 'اگر چند خط مطابقت داشته باشند، آخرین خط برنده است.',
      advancedSyntaxLink: 'نحو پیشرفته (به سبک gitignore)',
      noRulesWarning:
        'هیچ قاعده‌ای تنظیم نشده است - همه یادداشت‌ها به‌روزرسانی خودکار تاریخ می‌گیرند.',
      placeholderExcludeFolder: '# Exclude a folder',
      placeholderExcludeByPattern: '# Exclude by pattern',
      placeholderReinclude: '# Re-include a specific file',
      parseError: 'خط {lineNumber}: {message} - "{text}"',
      previewButton: 'پیش‌نمایش پرونده‌های منطبق',
      previewSummary: '{tracked} یادداشت ردیابی‌شده، {excluded} یادداشت رد شده',
      skippedFilesSummary: 'پرونده‌های رد شده ({excluded})',
      skippedMore: '...و {count} مورد دیگر',
      reference: {
        summary: 'مرجع نحو الگو',
        sectionBasics: 'اصول نحو',
        basicsCommentDesc: 'خط‌هایی که با # آغاز می‌شوند نادیده گرفته می‌شوند',
        basicsBlankDesc: 'خط‌های خالی نادیده گرفته می‌شوند',
        basicsExcludeDesc: 'استثنا - پرونده‌های درون templates/ رد می‌شوند',
        basicsReincludeDesc: 'بازگرداندن - با پیشوند ! استثنا را خنثی کنید',
        basicsLastWinsDesc:
          'وقتی چند قاعده مطابقت دارند، آخرین قاعده برنده است',
        sectionExcludeFolder: 'استثنا کردن یک پوشه',
        excludeFolderAllFilesDesc: 'همه پرونده‌های درون templates/',
        excludeFolderSameEffectDesc: 'همان اثر (اسلش پایانی اختیاری است)',
        excludeFolderNestedDesc: 'پوشه تودرتو',
        sectionReinclude: 'بازگرداندن (خنثی‌کردن یک استثنا)',
        reincludeExcludeWholeDesc: 'استثنا کردن کل پوشه',
        reincludeKeepDesc: 'اما همچنان ردیابی این پرونده مشخص را ادامه بده',
        sectionWildcards: 'نشانگرهای جایگزین',
        wildcardStarDesc: 'هر نویسه‌ای به‌جز /',
        wildcardDoubleStarDesc:
          'هر نویسه‌ای از جمله / (از پوشه‌ها عبور می‌کند)',
        wildcardQuestionDesc: 'دقیقاً یک نویسه',
        sectionWildcardExamples: 'نمونه‌های نشانگر جایگزین',
        wildcardExCanvasRootDesc:
          'پرونده‌هایی که به .canvas.md ختم می‌شوند در ریشه خزانه',
        wildcardExCanvasAnyDesc:
          'پرونده‌هایی که به .canvas.md ختم می‌شوند در هر پوشه‌ای',
        wildcardExDailyDesc: 'پرونده‌هایی مانند daily/2024-01-01.md',
        wildcardExTwoCharDesc: 'نام پرونده‌های دونویسه‌ای در notes/',
        sectionSpecificFiles: 'پرونده‌های مشخص',
        specificFilesOneExactDesc: 'یک پرونده دقیق',
        specificFilesRootDesc: 'یک پرونده در ریشه خزانه',
        sectionPathsWithSpaces: 'مسیرهای دارای فاصله',
        pathsWithSpacesAsIsDesc: 'فقط مسیر را همان‌طور که هست بنویسید',
        pathsWithSpacesNoQuotesDesc: 'نیازی به نقل‌قول دور فاصله‌ها نیست',
        sectionNonLatin: 'نویسه‌های غیرلاتین',
        nonLatinCyrillicDesc: 'نام پوشه سیریلیک',
        nonLatinChineseDesc: 'نویسه‌های چینی',
        nonLatinFullPathDesc: 'مسیر کامل غیرلاتین',
        sectionObsidianExamples: 'نمونه‌های ویژه Obsidian',
        obsidianTemplateFolderDesc: 'پوشه قالب',
        obsidianDailyFolderDesc: 'پوشه یادداشت‌های روزانه',
        obsidianAttachmentsDesc: 'پوشه پیوست‌ها / رسانه',
        obsidianCanvasDesc: 'همه پرونده‌های بوم',
        obsidianExcalidrawDesc: 'همه نقاشی‌های Excalidraw',
        obsidianInboxDesc: 'پوشه صندوق ورودی / چرک‌نویس',
        obsidianArchiveDesc: 'یادداشت‌های بایگانی‌شده',
        sectionAllowlist: 'حالت فهرست مجاز (ردیابی فقط پوشه‌های مشخص)',
        allowlistExcludeEverythingDesc: 'نخست، همه چیز را استثنا کنید',
        allowlistReincludeWantedDesc: 'سپس فقط آنچه می‌خواهید را بازگردانید',
        allowlistReincludeAnotherDesc: 'بازگرداندن یک پوشه دیگر',
        emptyNote:
          'وقتی این فیلد خالی باشد، همه یادداشت‌ها به‌روزرسانی خودکار تاریخ می‌گیرند.',
      },
    },
    inversions: {
      heading: 'تاریخ ویرایش پیش از تاریخ ایجاد',
      strategy: {
        name: 'نحوه اصلاح تاریخ‌های نامرتب',
        desc: 'وقتی تاریخ آخرین ویرایش پیش از تاریخ ایجاد است چه کاری انجام شود. برای ویرایش‌های خودکار اعمال می‌شود و مقدار پیش‌فرض ابزار گروهی را تعیین می‌کند.',
        optionDisabled: 'اصلاح نکن (فقط شناسایی)',
        optionCreatedToUpdated:
          'تاریخ ایجاد را برابر تاریخ آخرین ویرایش قرار بده',
        optionUpdatedToCreated:
          'تاریخ آخرین ویرایش را برابر تاریخ ایجاد قرار بده',
        optionMaxAll: 'هر دو را روی تازه‌ترین تاریخ قرار بده',
      },
      tolerance: {
        name: 'نادیده‌گرفتن تفاوت‌های جزئی (ثانیه)',
        desc: 'وقتی فاصله کمتر از این مقدار است، تاریخ‌های نامرتب را نادیده بگیر. مقدار کوچک، تفاوت‌های جزئی ساعت را پنهان می‌کند.',
      },
    },
    advanced: {
      summary: 'پیشرفته',
      newFileDelay: {
        name: 'تأخیر برای پرونده جدید',
        desc: 'پیش از ثبت تاریخ روی یادداشتی که تازه ساخته شده، این تعداد میلی‌ثانیه صبر کن. به جلوگیری از تداخل با افزونه‌های قالب کمک می‌کند. برای خاموش‌کردن روی 0 بگذارید.',
      },
      autoPopulateCache: {
        name: 'پر کردن خودکار حافظه پنهان هنگام راه‌اندازی',
        desc: 'هنگام بارگذاری افزونه، داده‌های تشخیص تغییر را برای یادداشت‌هایی که هنوز آن را ندارند بساز. در پس‌زمینه اجرا می‌شود.',
      },
      maxCacheEntries: {
        name: 'حداکثر مدخل‌های حافظه پنهان',
        desc: 'وقتی حافظه پنهان از این حد فراتر رود، قدیمی‌ترین مدخل‌های بلااستفاده حذف می‌شوند. 0 = بدون محدودیت.',
      },
      postUpdateCommand: {
        name: 'فرمان پس از به‌روزرسانی',
        desc: 'پس از به‌روزرسانی یک تاریخ، یک فرمان Obsidian را اجرا کن. برای خاموش‌کردن خالی بگذارید.',
        optionNone: 'هیچ‌کدام',
      },
    },
    bulk: {
      heading: 'عملیات گروهی',
      populate: {
        name: 'تنظیم تاریخ‌ها از تاریخ‌های خود پرونده',
        desc: 'تاریخ‌های ایجاد و آخرین ویرایش را از تاریخ‌های ایجاد و تغییر خود هر پرونده روی دیسک پر کن. عالی برای راه‌اندازی نخستین‌بار.',
        button: 'پر کردن تاریخ‌ها',
      },
      rename: {
        name: 'تغییر نام یک ویژگی',
        desc: 'مقادیر را از یک نام ویژگی قدیمی به نامی جدید در همه یادداشت‌ها منتقل کن. پس از تغییر نام ویژگی در بالا کاربردی است.',
        button: 'تغییر نام ویژگی',
      },
      reformat: {
        name: 'قالب‌بندی دوباره تاریخ‌های موجود',
        desc: 'تاریخ‌های نوشته‌شده در قالب قدیمی را بیاب و آن‌ها را در قالب فعلی شما بازنویسی کن. پس از تغییر قالب تاریخ در بالا کاربردی است.',
        button: 'قالب‌بندی دوباره تاریخ‌ها',
      },
      findInversions: {
        name: 'یافتن تاریخ‌های نامرتب',
        desc: 'یادداشت‌های خود را پویش کن و آن‌هایی را که تاریخ آخرین ویرایش پیش از تاریخ ایجاد دارند فهرست کن. سپس می‌توانید اصلاحی را که در بالا انتخاب کردید اعمال کنید.',
        button: 'یافتن تاریخ‌های نامرتب',
      },
      rebuildCache: {
        name: 'بازسازی حافظه پنهان هش‌ها',
        desc: 'داده‌های تشخیص تغییر (هش‌های محتوا) را برای همه یادداشت‌های شما دوباره محاسبه کن. پس از تغییر آنچه در بالا تغییر به شمار می‌رود کاربردی است.',
        button: 'بازسازی حافظه پنهان',
      },
    },
  },
  modals: {
    populate: {
      configureTitle: 'تنظیم تاریخ‌ها از تاریخ‌های خود پرونده',
      configureSubtitleLine1: 'پر کردن تاریخ‌های ایجاد و آخرین ویرایش',
      configureSubtitleLine2:
        'از تاریخ‌های ایجاد و تغییر خود هر پرونده روی دیسک.',
      modeName: 'کدام تاریخ‌ها تنظیم شوند',
      modeDesc: 'انتخاب کنید کدام تاریخ‌ها پر شوند.',
      modeOptionBoth: 'هم ایجاد و هم به‌روزرسانی',
      modeOptionCreated: 'فقط تاریخ‌های ایجاد',
      modeOptionUpdated: 'فقط تاریخ‌های به‌روزرسانی',
      overrideName: 'پرونده‌هایی که از پیش تاریخ دارند',
      overrideDesc:
        'فقط تاریخ‌های موجودنبوده را پر کن، یا تاریخ‌های موجود را بازنویسی کن.',
      overrideOptionFillMissing: 'فقط موارد موجودنبوده (ایمن)',
      overrideOptionOverwriteAll: 'بازنویسی همه (موجودها را جایگزین می‌کند)',
      autoUpdateNoteTitle: 'یادداشتی درباره به‌روزرسانی خودکار:',
      autoUpdateNoteBody:
        'اگر به‌روزرسانی خودکار فعال بوده باشد، تاریخ‌های خود پرونده روی دیسک ممکن است از پیش ویرایش‌های خود افزونه را بازتاب دهند، نه تاریخ‌های اصلی را. برای بهترین نتیجه، از این ویژگی پیش از فعال‌کردن به‌روزرسانی خودکار یا درست پس از نصب افزونه استفاده کنید.',
      warningTitleCreatedUnreliable:
        'تاریخ ایجاد پرونده در برخی سکوها قابل اعتماد نیست',
      warningTitlePlatformNote: 'یادداشت درباره سکو',
      platformMacWin: 'macOS / Windows',
      platformMacWinNote: 'تاریخ ایجاد واقعی پرونده',
      platformLinux: 'Linux',
      platformLinuxNote:
        'سیستم تاریخی دیرتر را گزارش می‌کند، نه تاریخ ایجاد واقعی را',
      platformAndroid: 'Android',
      platformAndroidNote: 'به دستگاه بستگی دارد، اغلب قابل اعتماد نیست',
      platformIos: 'iOS',
      platformIosNote: 'به‌طور کلی قابل اعتماد است',
      platformReliable: 'قابل اعتماد',
      platformUnreliable: 'غیرقابل اعتماد',
      platformLineName: '{name}: {prefix}',
      platformYourPlatformSuffix: ' (سکوی شما)',
      syncNoteLine1:
        'خزانه‌های همگام‌شده: تاریخ‌های پرونده ممکن است توسط سرویس‌های همگام‌سازی بازنشانی شوند',
      syncNoteLine2: '(Obsidian Sync, iCloud, Dropbox, Git).',
      syncNoteLine3:
        'تاریخ آخرین ویرایش معمولاً از تاریخ ایجاد قابل اعتمادتر است.',
      recommendation:
        'توصیه: نتایج را پس از اجرا بررسی کنید. ابتدا یک پشتیبان بگیرید.',
      overwriteWarning:
        'این کار تاریخ‌های موجود در یادداشت‌های شما را جایگزین می‌کند. قابل بازگشت نیست. ابتدا یک پشتیبان بگیرید.',
      noPropertyConfigured:
        'هیچ نام ویژگی‌ای برای {missing} پیکربندی نشده است. تنظیمات افزونه را بررسی کنید.',
      previewTitle: 'پیش‌نمایش: تنظیم تاریخ‌ها',
      noFilesNeedUpdating:
        'هیچ پرونده‌ای نیاز به به‌روزرسانی ندارد. همه پرونده‌های واجد شرایط از پیش تاریخ‌های درخواست‌شده را دارند.',
      previewOverwriteWarning:
        'حالت بازنویسی: تاریخ‌های موجود جایگزین خواهند شد. قابل بازگشت نیست. ابتدا یک پشتیبان بگیرید.',
      settingDates: 'در حال تنظیم تاریخ‌ها…',
      stopped: 'متوقف شد.',
      doneWithErrorsSubtitle: 'تعداد پرونده‌های به‌روزشده: {processed}.',
      doneTitle: 'انجام شد! تعداد پرونده‌های به‌روزشده: {processed}.',
    },
    rename: {
      configureTitle: 'تغییر نام یک ویژگی',
      configureSubtitle:
        'انتقال مقادیر از یک نام ویژگی به نامی دیگر در همه یادداشت‌ها.',
      validationEnterOld: 'برای ادامه، نام ویژگی قدیمی را وارد کنید.',
      validationEnterNew: 'برای ادامه، نام ویژگی جدید را وارد کنید.',
      validationMustDiffer: 'نام ویژگی قدیمی و جدید باید متفاوت باشند.',
      oldKeyName: 'نام ویژگی قدیمی',
      oldKeyDesc: 'نام ویژگی‌ای که اکنون در یادداشت‌های شما استفاده می‌شود.',
      oldKeyPlaceholder: 'Date_created',
      newKeyName: 'نام ویژگی جدید',
      newKeyDesc: 'نام ویژگی جدیدی که باید استفاده شود.',
      newKeyPlaceholder: 'Created',
      deleteOldName: 'حذف ویژگی قدیمی پس از تغییر نام',
      deleteOldDesc: 'حذف ویژگی قدیمی پس از کپی مقدار آن به ویژگی جدید.',
      namesCannotBeEmpty: 'نام ویژگی‌ها نمی‌توانند خالی باشند.',
      previewTitle: 'پیش‌نمایش: تغییر نام ویژگی',
      noNotesUseProperty: 'هیچ یادداشتی از ویژگی "{oldKey}" استفاده نمی‌کند.',
      conflictWarning:
        'تعداد {conflicts} یادداشت از پیش ویژگی "{newKey}" را دارند. مقدار موجود بازنویسی خواهد شد.',
      columnArrowNew: '→ {newKey}',
      deleteWarning:
        'ویژگی قدیمی پس از کپی حذف خواهد شد. قابل بازگشت نیست. ابتدا یک پشتیبان بگیرید.',
      renamingProperty: 'در حال تغییر نام ویژگی…',
      renameStopped: 'تغییر نام متوقف شد.',
      doneWithErrorsSubtitle: 'تعداد پرونده‌های به‌روزشده: {processed}.',
      doneTitle: 'انجام شد! تعداد پرونده‌های به‌روزشده: {processed}.',
    },
    reformat: {
      configureTitle: 'یکسان‌سازی قالب تاریخ',
      configureSubtitle:
        'تجزیه مقادیر تاریخ موجود و بازنویسی آن‌ها با استفاده از قالب فعلی در تنظیمات.',
      invalidFormat: 'قالب نامعتبر',
      targetFormatName: 'قالب هدف',
      targetFormatDesc: '{currentFormat}',
      scopeName: 'کدام فیلدها قالب‌بندی دوباره شوند',
      scopeDesc: 'انتخاب کنید کدام تاریخ‌ها یکسان‌سازی شوند.',
      scopeOptionAll: 'همه تاریخ‌ها',
      scopeOptionCreated: 'فقط ایجاد',
      scopeOptionUpdated: 'فقط به‌روزرسانی',
      scopeOptionViewed: 'فقط مشاهده',
      autoDetectNote:
        'تاریخ‌ها به‌طور خودکار از قالب‌های رایج (ISO 8601، اروپایی، آمریکایی، تاریخ‌های عددی) شناسایی و در قالب فعلی شما بازنویسی می‌شوند.',
      noPropertyConfigured:
        'هیچ نام ویژگی‌ای برای {missing} پیکربندی نشده است. تنظیمات افزونه را بررسی کنید.',
      previewTitle: 'پیش‌نمایش: یکسان‌سازی تاریخ‌ها',
      noChangeAmbiguous:
        'هنوز چیزی برای تبدیل وجود ندارد. تعداد {ambiguousCount} تاریخ را می‌توان به دو شکل خواند و بدون تغییر مانده‌اند. برای تبدیل آن‌ها در بالا ترتیب روز/ماه را انتخاب کنید.',
      noChangeDefault:
        'هیچ پرونده‌ای نیاز به قالب‌بندی دوباره ندارد. همه تاریخ‌ها از پیش در قالب هدف هستند یا تجزیه نشدند.',
      errorWarningNoChange:
        'تعداد {errorCount} پرونده تاریخ‌هایی دارند که تجزیه نشدند.',
      errorWarningWillSkip:
        'تعداد {errorCount} پرونده تاریخ‌هایی دارند که تجزیه نشدند. این‌ها رد خواهند شد.',
      checkNote:
        'ردیف‌های نشان‌دار [check] را می‌توان به دو شکل خواند. تأیید کنید که تاریخ جدید درست به نظر می‌رسد.',
      rewriteWarning:
        'این کار مقادیر تاریخ موجود را در همان جا بازنویسی می‌کند. قابل بازگشت نیست. ابتدا یک پشتیبان بگیرید.',
      ambiguityName: 'تاریخ‌هایی که می‌توان به دو شکل خواند',
      ambiguityDesc:
        'تعداد {ambiguousCount} تاریخ می‌تواند به‌صورت روز-اول یا ماه-اول باشد (مثلاً 01/05/2024).{detectedHint}',
      detectedHintMonthFirst: ' سیستم شما ماه را اول پیشنهاد می‌دهد.',
      detectedHintDayFirst: ' سیستم شما روز را اول پیشنهاد می‌دهد.',
      ambiguityOptionSkip: 'تاریخ‌های نامشخص را بدون تغییر بگذار',
      ambiguityOptionDmy: 'روز اول (01/05 = روز 1، ماه 5)',
      ambiguityOptionMdy: 'ماه اول (01/05 = ماه 1، روز 5)',
      cellCouldNotRead: '{oldValue} (نتوانست تاریخ را بخواند)',
      cellConversion: '{oldValue} → {newValue}{check}',
      cellNewValue: '{newValue}{check}',
      cellCheckSuffix: ' [check]',
      reformattingDates: 'در حال قالب‌بندی دوباره تاریخ‌ها…',
      reformatStopped: 'قالب‌بندی دوباره متوقف شد.',
      doneWithErrorsSubtitle: 'تعداد پرونده‌های به‌روزشده: {processed}.',
      doneTitle: 'انجام شد! تعداد پرونده‌های به‌روزشده: {processed}.',
    },
    inversions: {
      scanningTitle: 'در حال یافتن تاریخ‌های نامرتب…',
      foundTitle: 'تعداد یادداشت‌های دارای تاریخ‌های نامرتب یافت‌شده: {count}',
      foundSubtitle:
        'این یادداشت‌ها تاریخ آخرین ویرایش زودتر از تاریخ ایجاد دارند. در پایین انتخاب کنید چگونه اصلاح شوند، یا برای بررسی دستی ببندید.',
      noneFound: 'هیچ تاریخ نامرتبی یافت نشد.',
      strategyName: 'نحوه اصلاح',
      strategyDesc: 'انتخاب کنید تاریخ‌ها چگونه اصلاح شوند.',
      strategyOptionDisabled: 'اصلاح نکن (فقط بررسی)',
      strategyOptionCreatedToUpdated:
        'تاریخ ایجاد را برابر تاریخ آخرین ویرایش قرار بده',
      strategyOptionUpdatedToCreated:
        'تاریخ آخرین ویرایش را برابر تاریخ ایجاد قرار بده',
      strategyOptionMaxAll: 'هر دو را روی تازه‌ترین تاریخ قرار بده',
      toleranceNote:
        'تفاوت‌های کمتر از {tolerance} ثانیه نادیده گرفته می‌شوند (در تنظیمات تعیین شده است).',
      columnDelta: 'Δ',
      fixWarning:
        'این کار {count} یادداشت را تغییر می‌دهد. قابل بازگشت نیست. ابتدا یک پشتیبان بگیرید.',
      fixingDates: 'در حال اصلاح تاریخ‌ها…',
      stopped: 'عملیات گروهی متوقف شد.',
      fixedNotice: 'تعداد یادداشت‌های اصلاح‌شده: {processed}.',
      doneWithErrorsSubtitle: 'تعداد یادداشت‌های اصلاح‌شده: {processed}.',
      doneTitle: 'انجام شد! این پنجره را با خیال راحت می‌توانید ببندید.',
    },
    rebuildCache: {
      loadingFiles: 'در حال بارگذاری پرونده‌ها…',
      confirmTitle: 'بازسازی داده‌های تشخیص تغییر برای {count} پرونده',
      confirmSubtitle:
        'این کار اثرانگشت‌های محتوا (هش‌های محتوا) را که برای تشخیص ویرایش‌های واقعی به کار می‌روند دوباره محاسبه می‌کند. یادداشت‌های شما را تغییر نمی‌دهد.',
      rebuilding: 'در حال بازسازی…',
      stopped: 'عملیات گروهی متوقف شد.',
      doneWithErrorsSubtitle: 'تعداد پرونده‌های پردازش‌شده: {processed}.',
      doneTitle: 'انجام شد! این پنجره را با خیال راحت می‌توانید ببندید.',
    },
  },
};
