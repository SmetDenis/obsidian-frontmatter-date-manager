// Arabic. Machine-generated baseline. Improvements welcome - see CONTRIBUTING.md.
import type { Strings, DeepPartial } from '../index';

export const STRINGS_AR: DeepPartial<Strings> = {
  common: {
    run: 'تشغيل',
    back: 'رجوع',
    cancel: 'إلغاء',
    close: 'إغلاق',
    file: 'ملف',
    created: 'تاريخ الإنشاء',
    updated: 'تاريخ التعديل',
    viewed: 'تاريخ العرض',
    createdKeyed: 'تاريخ الإنشاء ({key})',
    updatedKeyed: 'تاريخ التعديل ({key})',
    viewedKeyed: 'تاريخ العرض ({key})',
    scanAndPreview: 'فحص ومعاينة',
    scanningFiles: 'جارٍ فحص الملفات…',
    doneWithErrors: 'تم. عدد الأخطاء: {errors}.',
  },

  commands: {
    updateCurrentFile: 'تحديث التواريخ في الملف الحالي',
    toggleAutoUpdate: 'تشغيل/إيقاف التحديث التلقائي',
    pauseAutoUpdate: 'إيقاف التحديث التلقائي مؤقتًا لمدة 5 دقائق',
  },

  statusBar: {
    paused: 'متوقف مؤقتًا',
    pausedWithMinutes: 'متوقف مؤقتًا ({remaining}د)',
  },

  notices: {
    inversionDetectedAndFixed:
      'Frontmatter Date Manager: تم اكتشاف تواريخ بترتيب غير صحيح وإصلاحها. استخدم "البحث عن التواريخ ذات الترتيب غير الصحيح" في الإعدادات للمراجعة.',
    timestampsUpdated: 'تم تحديث التواريخ.',
    fileIgnored: 'تم تجاهل الملف بناءً على إعدادات الإضافة.',
    failedToUpdateWithReason: 'تعذّر تحديث التواريخ: {reason}',
    failedToUpdate: 'تعذّر تحديث التواريخ.',
    autoUpdateEnabled: 'تم تفعيل التحديث التلقائي',
    autoUpdateDisabled: 'تم تعطيل التحديث التلقائي',
    autoUpdatePausedForMinutes:
      'تم إيقاف التحديث التلقائي مؤقتًا لمدة {minutes} دقيقة. سيُستأنف تلقائيًا.',
    autoUpdateResumed: 'تم استئناف التحديث التلقائي.',
    malformedFrontmatter:
      'فشل Frontmatter Date Manager\nخصائص غير صالحة في هذا الملف: {filePath}\n\n{message}',
  },

  bulkChrome: {
    summaryWillChange: 'عدد الملفات التي ستتغيّر: {changed}',
    summarySkipped: 'تم التخطّي: {skipped}',
    summaryErrors: 'عدد الأخطاء: {errors}',
    pagerPrev: 'السابق',
    pagerNext: 'التالي',
    pageInfo: 'الصفحة {current} من {total}',
    downloadFullPreview: 'تنزيل المعاينة الكاملة',
    downloadSuccess:
      'تم تنزيل عدد الصفوف: {count}. الملف {filename} في مجلد التنزيلات.',
    downloadFailed: 'تعذّر تنزيل ملف المعاينة.',
    failureColumnError: 'خطأ',
    progressCounter: '{count}/{max}',
  },

  settings: {
    description: {
      syncIntro:
        'كثيرًا ما تعيد خدمات المزامنة وأدوات النسخ الاحتياطي والإضافات الأخرى كتابة الملفات دون تغيير محتواها، وهذا يعيد ضبط تواريخ الملف على القرص. ونتيجة لذلك يصبح من المستحيل معرفة متى عدّلت الملاحظة فعليًا آخر مرة.',
      pluginIntro:
        'تكتب هذه الإضافة تاريخ الإنشاء وتاريخ آخر تعديل مباشرة في خصائص كل ملاحظة، وتكتشف التغييرات الحقيقية بمقارنة المحتوى، لتعكس تواريخك التعديلات الفعلية لا آثار المزامنة.',
    },
    dates: {
      heading: 'التواريخ المراد تتبّعها',
      enableNoneHint: 'فعّل تاريخًا واحدًا على الأقل أعلاه لإعداد الإضافة.',
      created: {
        enableName: 'تتبّع تاريخ الإنشاء',
        enableDesc: 'إضافة تاريخ إنشاء للملاحظات التي ليس لها واحد بعد.',
        propertyName: 'خاصية تاريخ الإنشاء',
        propertyDesc: 'اسم الخاصية التي يُحفظ فيها تاريخ الإنشاء.',
      },
      updated: {
        enableName: 'تتبّع تاريخ آخر تعديل',
        enableDesc: 'تحديث هذا التاريخ في كل مرة تعدّل فيها الملاحظة.',
        propertyName: 'خاصية تاريخ التعديل',
        propertyDesc: 'اسم الخاصية التي يُحفظ فيها تاريخ آخر تعديل.',
      },
      updateCount: {
        enableName: 'عدّ التعديلات',
        enableDesc:
          'إضافة خاصية رقمية تزيد بمقدار واحد في كل مرة تعدّل فيها الملاحظة. عدّاد نشاط تقريبي وليس سجلًا دقيقًا.',
        propertyName: 'خاصية عدّاد التعديلات',
        propertyDesc: 'اسم الخاصية التي يُحفظ فيها عدّاد التعديلات.',
      },
      viewed: {
        enableName: 'تتبّع تاريخ آخر فتح',
        enableDesc: 'حفظ التاريخ في كل مرة تفتح فيها الملاحظة.',
        propertyName: 'خاصية تاريخ الفتح',
        propertyDesc: 'اسم الخاصية التي يُحفظ فيها تاريخ آخر فتح.',
      },
    },
    formatting: {
      heading: 'تنسيق التاريخ',
      dateFormat: {
        name: 'تنسيق التاريخ',
        desc: 'كيفية كتابة التواريخ والأوقات في ملاحظاتك.',
        formatCodesLink: 'عرض رموز التنسيق المتاحة',
        currentlyPreview: 'حاليًا: {preview}',
        invalidWithHint: 'تنسيق غير صالح. {hint}',
        invalidFormat: 'سلسلة تنسيق تاريخ غير صالحة.',
        obsidianDefault:
          "تنسيق Obsidian الافتراضي: yyyy-MM-dd'T'HH:mm:ss (التاريخ والوقت، المنطقة الزمنية المحلية)",
      },
      timezone: {
        name: 'المنطقة الزمنية',
        desc: 'المنطقة الزمنية المستخدمة عند كتابة التواريخ. اتركها فارغة لاستخدام المنطقة الزمنية لجهازك ({localTz}).',
        placeholder: 'المحلية ({localTz})',
        resetTooltip: 'إعادة الضبط إلى المنطقة الزمنية المحلية',
      },
      numberProperties: {
        name: 'حفظ التواريخ الرقمية فقط بدون علامات اقتباس',
        desc: 'إذا كان تنسيق التاريخ أرقامًا فقط (مثل طابع unix الزمني)، فاكتبه كرقم عادي (updated: 1712930400) بدلًا من نص بين علامات اقتباس (updated: "1712930400"). لا تأثير لذلك عندما يحتوي التنسيق على شرطات أو نقطتين.',
      },
    },
    behavior: {
      heading: 'السلوك',
      autoUpdate: {
        name: 'التحديث التلقائي',
        desc: 'تحديث التواريخ تلقائيًا عند تعديل ملاحظة. متاح أيضًا من لوحة الأوامر.',
      },
      minSeconds: {
        name: 'الحد الأدنى للثواني بين التحديثات',
        desc: 'يمنع تحديث التاريخ بكثرة أثناء الكتابة أو التنقّل بين الملاحظات.',
      },
      changeDetection: {
        name: 'اكتشاف التغييرات (تجزئة المحتوى)',
        descEnabled:
          'يُكتب تاريخ آخر تعديل فقط عندما يتغيّر محتوى الملاحظة فعليًا، وهذا يمنع التحديثات الزائفة الناتجة عن إضافات المزامنة.',
        descDisabled:
          'معطّل، يُكتب تاريخ آخر تعديل عند كل حفظ حتى لو لم يتغيّر شيء.',
      },
      hashTrackingMode: {
        name: 'ما الذي يُعدّ تغييرًا',
        desc: 'أي جزء من الملاحظة يُعدّ تغييرًا. "النص فقط": تعديل الخصائص (الوسوم والأسماء البديلة وغيرها) لن يحدّث التاريخ. "الخصائص فقط": تعديل نص الملاحظة لن يحدّث التاريخ. "كلاهما": أي تعديل يحدّث التاريخ.',
        optionBody: 'نص الملاحظة فقط (افتراضي)',
        optionFrontmatter: 'الخصائص فقط',
        optionBoth: 'النص والخصائص',
        changedNotice:
          'تم تغيير وضع التتبّع. أعد بناء ذاكرة التجزئة المؤقتة (من العمليات الجماعية) لتبقى التواريخ دقيقة.',
      },
      excludeKeys: {
        name: 'تجاهل هذه الخصائص',
        desc: 'تعديل هذه الخصائص لن يحدّث التاريخ. يمكنك إضافة عدة خصائص دفعة واحدة مفصولة بفواصل. تُتجاهَل الخصائص created وupdated وviewed دائمًا تلقائيًا.',
        placeholder: 'اسم خاصية مثل tags',
        addTooltip: 'إضافة خاصية',
        chipRemoveAriaLabel: 'إزالة {entry}',
      },
    },
    filterRules: {
      name: 'الملفات والمجلدات المراد تخطّيها',
      descIntro:
        'اختر الملفات أو المجلدات التي تريد تركها دون تغيير (بدون تحديث تلقائي للتواريخ). ',
      descOnePerLine: 'نمط واحد في كل سطر. الأسطر التي تبدأ بـ ',
      descCommentsAre: ' هي تعليقات. ابدأ سطرًا بـ ',
      descAddBack: ' لإعادة إضافة مسار. ',
      descLastWins: 'إذا تطابق عدة أسطر، فإن الأخير هو الذي يسود.',
      advancedSyntaxLink: 'صياغة متقدمة (بأسلوب gitignore)',
      noRulesWarning:
        'لا توجد قواعد، تحصل جميع الملاحظات على تحديث تلقائي للتواريخ.',
      placeholderExcludeFolder: '# استبعاد مجلد',
      placeholderExcludeByPattern: '# استبعاد بنمط',
      placeholderReinclude: '# إعادة تضمين ملف محدد',
      parseError: 'السطر {lineNumber}: {message} - "{text}"',
      previewButton: 'معاينة الملفات المطابقة',
      previewSummary: 'الملاحظات المتتبَّعة: {tracked}، المتخطّاة: {excluded}',
      skippedFilesSummary: 'الملفات المتخطّاة ({excluded})',
      skippedMore: '...و{count} أخرى',
      reference: {
        summary: 'مرجع صياغة الأنماط',
        sectionBasics: 'أساسيات الصياغة',
        basicsCommentDesc: 'تُتجاهَل الأسطر التي تبدأ بـ #',
        basicsBlankDesc: 'تُتجاهَل الأسطر الفارغة',
        basicsExcludeDesc: 'استبعاد، يتم تخطّي الملفات داخل templates/',
        basicsReincludeDesc:
          'إعادة التضمين، استخدم البادئة ! للتراجع عن الاستبعاد',
        basicsLastWinsDesc: 'عند تطابق عدة قواعد، تسود القاعدة الأخيرة',
        sectionExcludeFolder: 'استبعاد مجلد',
        excludeFolderAllFilesDesc: 'جميع الملفات داخل templates/',
        excludeFolderSameEffectDesc:
          'نفس التأثير (الشرطة المائلة الختامية اختيارية)',
        excludeFolderNestedDesc: 'مجلد متداخل',
        sectionReinclude: 'إعادة التضمين (التراجع عن الاستبعاد)',
        reincludeExcludeWholeDesc: 'استبعاد المجلد بأكمله',
        reincludeKeepDesc: 'لكن استمر في تتبّع هذا الملف المحدد',
        sectionWildcards: 'أحرف البدل',
        wildcardStarDesc: 'أي أحرف باستثناء /',
        wildcardDoubleStarDesc: 'أي أحرف بما في ذلك / (يعبر المجلدات)',
        wildcardQuestionDesc: 'حرف واحد بالضبط',
        sectionWildcardExamples: 'أمثلة على أحرف البدل',
        wildcardExCanvasRootDesc:
          'الملفات المنتهية بـ .canvas.md في جذر الخزنة',
        wildcardExCanvasAnyDesc: 'الملفات المنتهية بـ .canvas.md في أي مجلد',
        wildcardExDailyDesc: 'ملفات مثل daily/2024-01-01.md',
        wildcardExTwoCharDesc: 'أسماء ملفات من حرفين في notes/',
        sectionSpecificFiles: 'ملفات محددة',
        specificFilesOneExactDesc: 'ملف واحد بالضبط',
        specificFilesRootDesc: 'ملف في جذر الخزنة',
        sectionPathsWithSpaces: 'المسارات التي تحتوي على مسافات',
        pathsWithSpacesAsIsDesc: 'اكتب المسار كما هو فحسب',
        pathsWithSpacesNoQuotesDesc: 'لا حاجة لعلامات اقتباس حول المسافات',
        sectionNonLatin: 'الأحرف غير اللاتينية',
        nonLatinCyrillicDesc: 'اسم مجلد بالحروف السيريلية',
        nonLatinChineseDesc: 'أحرف صينية',
        nonLatinFullPathDesc: 'مسار كامل غير لاتيني',
        sectionObsidianExamples: 'أمثلة خاصة بـ Obsidian',
        obsidianTemplateFolderDesc: 'مجلد القوالب',
        obsidianDailyFolderDesc: 'مجلد الملاحظات اليومية',
        obsidianAttachmentsDesc: 'مجلد المرفقات / الوسائط',
        obsidianCanvasDesc: 'جميع ملفات الكانفاس',
        obsidianExcalidrawDesc: 'جميع رسومات Excalidraw',
        obsidianInboxDesc: 'مجلد الوارد / المسودات',
        obsidianArchiveDesc: 'الملاحظات المؤرشفة',
        sectionAllowlist: 'وضع القائمة المسموح بها (تتبّع مجلدات محددة فقط)',
        allowlistExcludeEverythingDesc: 'أولًا، استبعد كل شيء',
        allowlistReincludeWantedDesc: 'ثم أعد تضمين ما تريده فقط',
        allowlistReincludeAnotherDesc: 'إعادة تضمين مجلد آخر',
        emptyNote:
          'عندما يكون هذا الحقل فارغًا، تحصل جميع الملاحظات على تحديث تلقائي للتواريخ.',
      },
    },
    inversions: {
      heading: 'تاريخ التعديل أقدم من تاريخ الإنشاء',
      strategy: {
        name: 'كيفية إصلاح التواريخ ذات الترتيب غير الصحيح',
        desc: 'ما الذي يجب فعله عندما يكون تاريخ آخر تعديل أقدم من تاريخ الإنشاء. ينطبق على التعديلات التلقائية، ويحدّد القيمة الافتراضية للأداة الجماعية.',
        optionDisabled: 'عدم الإصلاح (الكشف فقط)',
        optionCreatedToUpdated: 'تعيين تاريخ الإنشاء ليساوي تاريخ آخر تعديل',
        optionUpdatedToCreated: 'تعيين تاريخ آخر تعديل ليساوي تاريخ الإنشاء',
        optionMaxAll: 'تعيين كليهما إلى أحدث تاريخ',
      },
      tolerance: {
        name: 'تجاهل الفروق الطفيفة (بالثواني)',
        desc: 'تجاهل التواريخ ذات الترتيب غير الصحيح عندما يكون الفارق أصغر من هذه القيمة. القيمة الصغيرة تُخفي فروق الساعة الطفيفة.',
      },
    },
    advanced: {
      summary: 'متقدّم',
      newFileDelay: {
        name: 'تأخير الملفات الجديدة',
        desc: 'انتظر هذا العدد من المللي ثانية قبل وضع تاريخ على ملاحظة منشأة حديثًا. يساعد على تجنّب التعارض مع إضافات القوالب. اضبطها على 0 للإيقاف.',
      },
      autoPopulateCache: {
        name: 'تعبئة الذاكرة المؤقتة عند بدء التشغيل',
        desc: 'عند تحميل الإضافة، يتم بناء بيانات اكتشاف التغييرات للملاحظات التي لا تملكها بعد. يعمل في الخلفية.',
      },
      maxCacheEntries: {
        name: 'الحد الأقصى لمدخلات الذاكرة المؤقتة',
        desc: 'عندما تتجاوز الذاكرة المؤقتة هذا الحد، تُزال أقدم المدخلات غير المستخدمة. 0 = بلا حد.',
      },
      postUpdateCommand: {
        name: 'أمر بعد التحديث',
        desc: 'تشغيل أمر Obsidian بعد تحديث التاريخ. اتركه فارغًا للإيقاف.',
        optionNone: 'بلا',
      },
    },
    bulk: {
      heading: 'العمليات الجماعية',
      populate: {
        name: 'تعيين التواريخ من تواريخ الملف نفسه',
        desc: 'تعبئة تاريخي الإنشاء وآخر تعديل من تاريخي إنشاء وتعديل كل ملف على القرص. ممتاز للإعداد لأول مرة.',
        button: 'تعبئة التواريخ',
      },
      rename: {
        name: 'إعادة تسمية خاصية',
        desc: 'نقل القيم من اسم خاصية قديم إلى اسم جديد في كل الملاحظات. مفيد بعد تغيير اسم خاصية أعلاه.',
        button: 'إعادة تسمية الخاصية',
      },
      reformat: {
        name: 'إعادة تنسيق التواريخ الموجودة',
        desc: 'البحث عن التواريخ المكتوبة بتنسيق قديم وإعادة كتابتها بتنسيقك الحالي. مفيد بعد تغيير تنسيق التاريخ أعلاه.',
        button: 'إعادة تنسيق التواريخ',
      },
      findInversions: {
        name: 'البحث عن التواريخ ذات الترتيب غير الصحيح',
        desc: 'افحص ملاحظاتك واعرض تلك التي يكون فيها تاريخ آخر تعديل أقدم من تاريخ الإنشاء. ثم يمكنك تطبيق الإصلاح الذي اخترته أعلاه.',
        button: 'البحث عن التواريخ ذات الترتيب غير الصحيح',
      },
      rebuildCache: {
        name: 'إعادة بناء ذاكرة التجزئة المؤقتة',
        desc: 'إعادة حساب بيانات اكتشاف التغييرات (تجزئات المحتوى) لجميع ملاحظاتك. مفيد بعد تغيير ما يُعدّ تغييرًا أعلاه.',
        button: 'إعادة بناء الذاكرة المؤقتة',
      },
    },
  },

  modals: {
    populate: {
      configureTitle: 'تعيين التواريخ من تواريخ الملف نفسه',
      configureSubtitleLine1: 'تعبئة تاريخي الإنشاء وآخر تعديل',
      configureSubtitleLine2: 'من تاريخي إنشاء وتعديل كل ملف على القرص.',
      modeName: 'أي التواريخ يتم تعيينها',
      modeDesc: 'اختر التواريخ المراد تعبئتها.',
      modeOptionBoth: 'كلا تاريخي الإنشاء والتعديل',
      modeOptionCreated: 'تواريخ الإنشاء فقط',
      modeOptionUpdated: 'تواريخ التعديل فقط',
      overrideName: 'الملفات التي لها تواريخ بالفعل',
      overrideDesc: 'تعبئة التواريخ المفقودة فقط، أو الكتابة فوق الموجودة.',
      overrideOptionFillMissing: 'تعبئة المفقود فقط (آمن)',
      overrideOptionOverwriteAll: 'الكتابة فوق الكل (يستبدل الموجود)',
      autoUpdateNoteTitle: 'ملاحظة حول التحديث التلقائي:',
      autoUpdateNoteBody:
        'إذا كان التحديث التلقائي مفعّلًا، فقد تعكس تواريخ الملف على القرص بالفعل تعديلات الإضافة نفسها لا التواريخ الأصلية. للحصول على أفضل النتائج، استخدم هذه الميزة قبل تفعيل التحديث التلقائي أو مباشرة بعد تثبيت الإضافة.',
      warningTitleCreatedUnreliable:
        'تاريخ إنشاء الملف غير موثوق على بعض المنصّات',
      warningTitlePlatformNote: 'ملاحظة حول المنصّة',
      platformMacWinNote: 'تاريخ إنشاء الملف الحقيقي',
      platformLinuxNote: 'يبلّغ النظام عن تاريخ لاحق لا تاريخ الإنشاء الحقيقي',
      platformAndroidNote: 'يعتمد على الجهاز، وغالبًا غير موثوق',
      platformIosNote: 'موثوق عمومًا',
      platformReliable: 'موثوق',
      platformUnreliable: 'غير موثوق',
      platformYourPlatformSuffix: ' (منصّتك)',
      syncNoteLine1:
        'القباب المتزامنة: قد تُعاد ضبط تواريخ الملفات بواسطة خدمات المزامنة',
      syncNoteLine3: 'تاريخ آخر تعديل عادةً أكثر موثوقية من تاريخ الإنشاء.',
      recommendation:
        'توصية: راجع النتائج بعد التشغيل. اعمل نسخة احتياطية أولًا.',
      overwriteWarning:
        'سيؤدي هذا إلى استبدال التواريخ الموجودة في ملاحظاتك. لا يمكن التراجع عن هذا. اعمل نسخة احتياطية أولًا.',
      noPropertyConfigured:
        'لم يُضبط اسم خاصية لـ: {missing}. تحقّق من إعدادات الإضافة.',
      previewTitle: 'معاينة: تعيين التواريخ',
      noFilesNeedUpdating:
        'لا توجد ملفات تحتاج إلى تحديث. جميع الملفات المؤهَّلة لديها التواريخ المطلوبة بالفعل.',
      previewOverwriteWarning:
        'وضع الكتابة فوق: ستُستبدل التواريخ الموجودة. لا يمكن التراجع عن هذا. اعمل نسخة احتياطية أولًا.',
      settingDates: 'جارٍ تعيين التواريخ…',
      stopped: 'تم الإيقاف.',
      doneWithErrorsSubtitle: 'عدد الملفات المحدَّثة: {processed}.',
      doneTitle: 'تم! عدد الملفات المحدَّثة: {processed}.',
    },
    rename: {
      configureTitle: 'إعادة تسمية خاصية',
      configureSubtitle: 'نقل القيم من اسم خاصية إلى آخر في كل الملاحظات.',
      validationEnterOld: 'أدخل اسم الخاصية القديم للمتابعة.',
      validationEnterNew: 'أدخل اسم الخاصية الجديد للمتابعة.',
      validationMustDiffer: 'يجب أن يختلف اسما الخاصية القديم والجديد.',
      oldKeyName: 'اسم الخاصية القديم',
      oldKeyDesc: 'اسم الخاصية المستخدم حاليًا في ملاحظاتك.',
      newKeyName: 'اسم الخاصية الجديد',
      newKeyDesc: 'اسم الخاصية الجديد المراد استخدامه.',
      deleteOldName: 'حذف الخاصية القديمة بعد إعادة التسمية',
      deleteOldDesc: 'إزالة الخاصية القديمة بعد نسخ قيمتها إلى الجديدة.',
      namesCannotBeEmpty: 'لا يمكن أن تكون أسماء الخصائص فارغة.',
      previewTitle: 'معاينة: إعادة تسمية الخاصية',
      noNotesUseProperty: 'لا توجد ملاحظات تستخدم الخاصية "{oldKey}".',
      conflictWarning:
        '{conflicts} ملاحظة لديها الخاصية "{newKey}" بالفعل. ستُستبدل القيمة الموجودة.',
      columnArrowNew: '→ {newKey}',
      deleteWarning:
        'ستُحذف الخاصية القديمة بعد النسخ. لا يمكن التراجع عن هذا. اعمل نسخة احتياطية أولًا.',
      renamingProperty: 'جارٍ إعادة تسمية الخاصية…',
      renameStopped: 'تم إيقاف إعادة التسمية.',
      doneWithErrorsSubtitle: 'عدد الملفات المحدَّثة: {processed}.',
      doneTitle: 'تم! عدد الملفات المحدَّثة: {processed}.',
    },
    reformat: {
      configureTitle: 'توحيد تنسيق التاريخ',
      configureSubtitle:
        'تحليل قيم التواريخ الموجودة وإعادة كتابتها بالتنسيق الحالي من الإعدادات.',
      invalidFormat: 'تنسيق غير صالح',
      targetFormatName: 'التنسيق المستهدف',
      scopeName: 'أي الحقول يُعاد تنسيقها',
      scopeDesc: 'اختر التواريخ المراد توحيدها.',
      scopeOptionAll: 'جميع التواريخ',
      scopeOptionCreated: 'الإنشاء فقط',
      scopeOptionUpdated: 'التعديل فقط',
      scopeOptionViewed: 'العرض فقط',
      autoDetectNote:
        'تُكتشف التواريخ تلقائيًا من التنسيقات الشائعة (ISO 8601، الأوروبي، الأمريكي، التواريخ الرقمية) ويُعاد كتابتها بتنسيقك الحالي.',
      noPropertyConfigured:
        'لم يُضبط اسم خاصية لـ: {missing}. تحقّق من إعدادات الإضافة.',
      previewTitle: 'معاينة: توحيد التواريخ',
      noChangeAmbiguous:
        'لا شيء للتحويل بعد. يمكن قراءة {ambiguousCount} تاريخ بطريقتين وتُركت دون تغيير، اختر ترتيب اليوم/الشهر أعلاه لتحويلها.',
      noChangeDefault:
        'لا توجد ملفات تحتاج إلى إعادة تنسيق. جميع التواريخ بالتنسيق المستهدف بالفعل أو تعذّر تحليلها.',
      errorWarningNoChange: '{errorCount} ملف لديه تواريخ تعذّر تحليلها.',
      errorWarningWillSkip:
        '{errorCount} ملف لديه تواريخ تعذّر تحليلها. سيتم تخطّيها.',
      checkNote:
        'الصفوف المعلَّمة بـ [check] يمكن قراءتها بطريقتين، تأكّد من أن التاريخ الجديد يبدو صحيحًا.',
      rewriteWarning:
        'هذا يعيد كتابة قيم التواريخ الموجودة في مكانها. لا يمكن التراجع عن هذا. اعمل نسخة احتياطية أولًا.',
      ambiguityName: 'تواريخ يمكن قراءتها بطريقتين',
      ambiguityDesc:
        'يمكن أن يعني {ambiguousCount} تاريخ اليوم أولًا أو الشهر أولًا (مثل 01/05/2024).{detectedHint}',
      detectedHintMonthFirst: ' يقترح نظامك الشهر أولًا.',
      detectedHintDayFirst: ' يقترح نظامك اليوم أولًا.',
      ambiguityOptionSkip: 'ترك التواريخ غير الواضحة دون تغيير',
      ambiguityOptionDmy: 'اليوم أولًا (01/05 = اليوم 1، الشهر 5)',
      ambiguityOptionMdy: 'الشهر أولًا (01/05 = الشهر 1، اليوم 5)',
      cellCouldNotRead: '{oldValue} (تعذّرت قراءة التاريخ)',
      cellConversion: '{oldValue} → {newValue}{check}',
      cellNewValue: '{newValue}{check}',
      cellCheckSuffix: ' [check]',
      reformattingDates: 'جارٍ إعادة تنسيق التواريخ…',
      reformatStopped: 'تم إيقاف إعادة التنسيق.',
      doneWithErrorsSubtitle: 'عدد الملفات المحدَّثة: {processed}.',
      doneTitle: 'تم! عدد الملفات المحدَّثة: {processed}.',
    },
    inversions: {
      scanningTitle: 'جارٍ البحث عن التواريخ ذات الترتيب غير الصحيح…',
      foundTitle: 'عدد الملاحظات ذات التواريخ غير المرتبة: {count}',
      foundSubtitle:
        'هذه الملاحظات لديها تاريخ آخر تعديل أقدم من تاريخ الإنشاء. اختر كيفية إصلاحها أدناه، أو أغلق للمراجعة يدويًا.',
      noneFound: 'لم يُعثر على تواريخ ذات ترتيب غير صحيح.',
      strategyName: 'كيفية الإصلاح',
      strategyDesc: 'اختر كيفية تصحيح التواريخ.',
      strategyOptionDisabled: 'عدم الإصلاح (المراجعة فقط)',
      strategyOptionCreatedToUpdated:
        'تعيين تاريخ الإنشاء ليساوي تاريخ آخر تعديل',
      strategyOptionUpdatedToCreated:
        'تعيين تاريخ آخر تعديل ليساوي تاريخ الإنشاء',
      strategyOptionMaxAll: 'تعيين كليهما إلى أحدث تاريخ',
      toleranceNote:
        'يتم تجاهل الفروق الأقل من {tolerance} ثانية (مضبوطة في الإعدادات).',
      fixWarning:
        'سيؤدي هذا إلى تعديل {count} ملاحظة. لا يمكن التراجع عن هذا. اعمل نسخة احتياطية أولًا.',
      fixingDates: 'جارٍ إصلاح التواريخ…',
      stopped: 'تم إيقاف العملية الجماعية.',
      fixedNotice: 'عدد الملاحظات المُصلَحة: {processed}.',
      doneWithErrorsSubtitle: 'عدد الملاحظات المُصلَحة: {processed}.',
      doneTitle: 'تم! يمكنك إغلاق هذه النافذة بأمان.',
    },
    rebuildCache: {
      loadingFiles: 'جارٍ تحميل الملفات…',
      confirmTitle: 'إعادة بناء بيانات اكتشاف التغييرات لـ {count} ملف',
      confirmSubtitle:
        'هذا يعيد حساب بصمات المحتوى (تجزئات المحتوى) المستخدمة لاكتشاف التعديلات الحقيقية. لا يغيّر ملاحظاتك.',
      rebuilding: 'جارٍ إعادة البناء…',
      stopped: 'تم إيقاف العملية الجماعية.',
      doneWithErrorsSubtitle: 'عدد الملفات المعالَجة: {processed}.',
      doneTitle: 'تم! يمكنك إغلاق هذه النافذة بأمان.',
    },
  },
};
