// Turkish. Machine-generated baseline. Improvements welcome - see CONTRIBUTING.md.
import type { Strings, DeepPartial } from '../index';

export const STRINGS_TR: DeepPartial<Strings> = {
  common: {
    run: 'Çalıştır',
    back: 'Geri',
    cancel: 'İptal',
    close: 'Kapat',
    file: 'Dosya',
    created: 'Oluşturuldu',
    updated: 'Güncellendi',
    viewed: 'Görüntülendi',
    createdKeyed: 'Oluşturuldu ({key})',
    updatedKeyed: 'Güncellendi ({key})',
    viewedKeyed: 'Görüntülendi ({key})',
    scanAndPreview: 'Tara ve önizle',
    scanningFiles: 'Dosyalar taranıyor…',
    doneWithErrors: 'Tamamlandı. Hata sayısı: {errors}.',
  },

  commands: {
    updateCurrentFile: 'Geçerli dosyadaki tarihleri güncelle',
    toggleAutoUpdate: 'Otomatik güncellemeyi aç/kapat',
    pauseAutoUpdate: 'Otomatik güncellemeyi 5 dakika duraklat',
  },

  statusBar: {
    paused: 'Duraklatıldı',
    pausedWithMinutes: 'Duraklatıldı ({remaining}d)',
  },

  notices: {
    inversionDetectedAndFixed:
      'Frontmatter Date Manager: sıralaması yanlış tarihler bulundu ve düzeltildi. İncelemek için ayarlardaki "Sıralaması yanlış tarihleri bul" seçeneğini kullanın.',
    timestampsUpdated: 'Tarihler güncellendi.',
    fileIgnored: 'Dosya, eklenti ayarlarınca yok sayılıyor.',
    failedToUpdateWithReason: 'Tarihler güncellenemedi: {reason}',
    failedToUpdate: 'Tarihler güncellenemedi.',
    autoUpdateEnabled: 'Otomatik güncelleme açık',
    autoUpdateDisabled: 'Otomatik güncelleme kapalı',
    autoUpdatePausedForMinutes:
      'Otomatik güncelleme {minutes} dakika duraklatıldı. Otomatik olarak devam edecek.',
    autoUpdateResumed: 'Otomatik güncelleme devam ettirildi.',
    malformedFrontmatter:
      'Frontmatter Date Manager başarısız oldu\nBu dosyada bozuk özellikler var: {filePath}\n\n{message}',
  },

  bulkChrome: {
    summaryWillChange: 'Değişecek dosya sayısı: {changed}',
    summarySkipped: 'Atlandı: {skipped}',
    summaryErrors: 'Hata sayısı: {errors}',
    pagerPrev: 'Önceki',
    pagerNext: 'Sonraki',
    pageInfo: 'Sayfa {current} / {total}',
    downloadFullPreview: 'Tam önizlemeyi indir',
    downloadSuccess:
      'İndirilen satır sayısı: {count}. {filename} dosyası indirilenler klasörünüze kaydedildi.',
    downloadFailed: 'Önizleme dosyası indirilemedi.',
    failureColumnError: 'Hata',
    progressCounter: '{count}/{max}',
  },

  settings: {
    description: {
      syncIntro:
        'Eşitleme hizmetleri, yedekleme araçları ve diğer eklentiler dosyaları içeriklerini değiştirmeden sık sık yeniden yazar - bu da diskteki dosya tarihlerini sıfırlar. Bu yüzden bir notu gerçekte en son ne zaman düzenlediğinizi anlamak imkansız hale gelir.',
      pluginIntro:
        'Bu eklenti, oluşturma ve son düzenleme tarihlerini doğrudan her notun özelliklerine yazar ve içeriği karşılaştırarak gerçek değişiklikleri algılar; böylece tarihleriniz eşitleme kalıntılarını değil, gerçek düzenlemeleri yansıtır.',
    },
    dates: {
      heading: 'İzlenecek tarihler',
      enableNoneHint:
        'Eklentiyi kurmak için yukarıdaki tarihlerden en az birini açın.',
      created: {
        enableName: 'Oluşturma tarihini izle',
        enableDesc: 'Henüz oluşturma tarihi olmayan notlara bir tarih ekle.',
        propertyName: 'Oluşturma özelliği',
        propertyDesc: 'Oluşturma tarihinin kaydedildiği özellik adı.',
      },
      updated: {
        enableName: 'Son düzenleme tarihini izle',
        enableDesc: 'Notu her düzenlediğinizde bu tarihi güncelle.',
        propertyName: 'Güncelleme özelliği',
        propertyDesc: 'Son düzenleme tarihinin kaydedildiği özellik adı.',
      },
      updateCount: {
        enableName: 'Düzenlemeleri say',
        enableDesc:
          'Bir notu her düzenlediğinizde bir artan sayısal bir özellik ekle. Kesin bir geçmiş değil, yaklaşık bir etkinlik sayacıdır.',
        propertyName: 'Düzenleme sayacı özelliği',
        propertyDesc: 'Düzenleme sayacının kaydedildiği özellik adı.',
      },
      viewed: {
        enableName: 'Son açılma tarihini izle',
        enableDesc: 'Notu her açtığınızda tarihi kaydet.',
        propertyName: 'Görüntüleme özelliği',
        propertyDesc: 'Son açılma tarihinin kaydedildiği özellik adı.',
      },
    },
    formatting: {
      heading: 'Tarih biçimi',
      dateFormat: {
        name: 'Tarih biçimi',
        desc: 'Tarihlerin ve saatlerin notlarınıza nasıl yazılacağı.',
        formatCodesLink: 'Kullanılabilir biçim kodlarına bak',
        currentlyPreview: 'Şu anda: {preview}',
        invalidWithHint: 'Geçersiz biçim. {hint}',
        invalidFormat: 'Geçersiz tarih biçimi dizesi.',
        obsidianDefault:
          "Obsidian varsayılanı: yyyy-MM-dd'T'HH:mm:ss (tarih ve saat, yerel saat dilimi)",
      },
      timezone: {
        name: 'Saat dilimi',
        desc: 'Tarihler yazılırken kullanılan saat dilimi. Cihazınızın saat dilimini ({localTz}) kullanmak için boş bırakın.',
        placeholder: 'Yerel ({localTz})',
        resetTooltip: 'Yerel saat dilimine sıfırla',
      },
      numberProperties: {
        name: 'Yalnızca sayı olan tarihleri tırnaksız kaydet',
        desc: 'Tarih biçiminiz yalnızca rakamlardan oluşuyorsa (örneğin bir unix zaman damgası), onu tırnak içinde metin (updated: "1712930400") yerine düz bir sayı (updated: 1712930400) olarak yaz. Biçiminiz tire veya iki nokta içeriyorsa etkisi olmaz.',
      },
    },
    behavior: {
      heading: 'Davranış',
      autoUpdate: {
        name: 'Otomatik güncelleme',
        desc: 'Bir notu düzenlediğinizde tarihleri otomatik olarak güncelle. Komut paletinden de kullanılabilir.',
      },
      minSeconds: {
        name: 'Güncellemeler arasındaki en az saniye',
        desc: 'Yazarken veya notlar arasında geçiş yaparken tarihin çok sık güncellenmesini önler.',
      },
      changeDetection: {
        name: 'Değişiklik algılama (içerik özetleme)',
        descEnabled:
          'Son düzenleme tarihi yalnızca notun içeriği gerçekten değiştiğinde yazılır - bu, eşitleme eklentilerinden gelen yanlış güncellemeleri önler.',
        descDisabled:
          'Kapalı - son düzenleme tarihi, hiçbir şey değişmese bile her kaydetmede yazılır.',
      },
      hashTrackingMode: {
        name: 'Neyin değişiklik sayılacağı',
        desc: 'Notun hangi bölümünün değişiklik sayıldığı. "Yalnızca gövde" - özellikleri (etiketler, takma adlar vb.) düzenlemek tarihi güncellemez. "Yalnızca özellikler" - not metnini düzenlemek tarihi güncellemez. "İkisi de" - herhangi bir düzenleme tarihi günceller.',
        optionBody: 'Yalnızca not gövdesi (varsayılan)',
        optionFrontmatter: 'Yalnızca özellikler',
        optionBoth: 'Gövde ve özellikler',
        changedNotice:
          'İzleme modu değişti. Tarihlerin doğru kalması için özet önbelleğini (toplu işlemlerde) yeniden oluşturun.',
      },
      excludeKeys: {
        name: 'Bu özellikleri yok say',
        desc: 'Bu özellikleri düzenlemek tarihi güncellemez. Birden fazlasını virgülle ayırarak aynı anda ekleyebilirsiniz. created, updated ve viewed özellikleri her zaman otomatik olarak yok sayılır.',
        placeholder: 'tags gibi bir özellik adı',
        addTooltip: 'Özellik ekle',
        chipRemoveAriaLabel: '{entry} öğesini kaldır',
      },
    },
    filterRules: {
      name: 'Atlanacak dosya ve klasörler',
      descIntro:
        'Dokunulmayacak dosyaları veya klasörleri seçin (otomatik tarih güncellemesi yok). ',
      descOnePerLine: 'Her satıra bir desen. Şununla başlayan satırlar: ',
      descCommentsAre: ' yorumdur. Bir satıra şununla başlayın: ',
      descAddBack: ' bir yolu geri eklemek için. ',
      descLastWins: 'Birden fazla satır eşleşirse, sonuncusu kazanır.',
      advancedSyntaxLink: 'Gelişmiş sözdizimi (gitignore stili)',
      noRulesWarning:
        'Kural yok - tüm notlar otomatik tarih güncellemesi alır.',
      placeholderExcludeFolder: '# Bir klasörü hariç tut',
      placeholderExcludeByPattern: '# Desene göre hariç tut',
      placeholderReinclude: '# Belirli bir dosyayı geri ekle',
      parseError: 'Satır {lineNumber}: {message} - "{text}"',
      previewButton: 'Eşleşen dosyaları önizle',
      previewSummary: '{tracked} not izleniyor, {excluded} not atlandı',
      skippedFilesSummary: 'Atlanan dosyalar ({excluded})',
      skippedMore: '...ve {count} tane daha',
      reference: {
        summary: 'Desen sözdizimi başvurusu',
        sectionBasics: 'Sözdizimi temelleri',
        basicsCommentDesc: '# ile başlayan satırlar yok sayılır',
        basicsBlankDesc: 'Boş satırlar yok sayılır',
        basicsExcludeDesc: 'Hariç tut - templates/ içindeki dosyalar atlanır',
        basicsReincludeDesc:
          'Geri ekle - hariç tutmayı geri almak için ! ön eki',
        basicsLastWinsDesc: 'Birden fazla kural eşleştiğinde sonuncusu kazanır',
        sectionExcludeFolder: 'Bir klasörü hariç tut',
        excludeFolderAllFilesDesc: 'templates/ içindeki tüm dosyalar',
        excludeFolderSameEffectDesc:
          'Aynı etki (sondaki eğik çizgi isteğe bağlı)',
        excludeFolderNestedDesc: 'İç içe klasör',
        sectionReinclude: 'Geri ekle (bir hariç tutmayı geri al)',
        reincludeExcludeWholeDesc: 'Tüm klasörü hariç tut',
        reincludeKeepDesc: 'Ama bu belirli dosyayı izlemeye devam et',
        sectionWildcards: 'Joker karakterler',
        wildcardStarDesc: '/ dışında herhangi bir karakter',
        wildcardDoubleStarDesc:
          '/ dahil herhangi bir karakter (klasörleri aşar)',
        wildcardQuestionDesc: 'Tam olarak bir karakter',
        sectionWildcardExamples: 'Joker karakter örnekleri',
        wildcardExCanvasRootDesc: 'Kasa kökünde .canvas.md ile biten dosyalar',
        wildcardExCanvasAnyDesc:
          'Herhangi bir klasörde .canvas.md ile biten dosyalar',
        wildcardExDailyDesc: 'daily/2024-01-01.md gibi dosyalar',
        wildcardExTwoCharDesc: 'notes/ içindeki iki karakterli dosya adları',
        sectionSpecificFiles: 'Belirli dosyalar',
        specificFilesOneExactDesc: 'Bir tam dosya',
        specificFilesRootDesc: 'Kasa kökündeki bir dosya',
        sectionPathsWithSpaces: 'Boşluklu yollar',
        pathsWithSpacesAsIsDesc: 'Yolu olduğu gibi yazmanız yeterli',
        pathsWithSpacesNoQuotesDesc: 'Boşlukların etrafına tırnak gerekmez',
        sectionNonLatin: 'Latin olmayan karakterler',
        nonLatinCyrillicDesc: 'Kiril klasör adı',
        nonLatinChineseDesc: 'Çince karakterler',
        nonLatinFullPathDesc: 'Tam Latin olmayan yol',
        sectionObsidianExamples: 'Obsidian örnekleri',
        obsidianTemplateFolderDesc: 'Şablon klasörü',
        obsidianDailyFolderDesc: 'Günlük notlar klasörü',
        obsidianAttachmentsDesc: 'Ekler / medya klasörü',
        obsidianCanvasDesc: 'Tüm tuval dosyaları',
        obsidianExcalidrawDesc: 'Tüm Excalidraw çizimleri',
        obsidianInboxDesc: 'Gelen kutusu / karalama klasörü',
        obsidianArchiveDesc: 'Arşivlenmiş notlar',
        sectionAllowlist:
          'İzin listesi modu (yalnızca belirli klasörleri izle)',
        allowlistExcludeEverythingDesc: 'Önce her şeyi hariç tut',
        allowlistReincludeWantedDesc: 'Sonra yalnızca istediğinizi geri ekle',
        allowlistReincludeAnotherDesc: 'Başka bir klasörü geri ekle',
        emptyNote:
          'Bu alan boş olduğunda, tüm notlar otomatik tarih güncellemesi alır.',
      },
    },
    inversions: {
      heading: 'Oluşturma tarihinden önceki değişiklik tarihleri',
      strategy: {
        name: 'Sıralaması yanlış tarihler nasıl düzeltilsin',
        desc: 'Son düzenleme tarihi oluşturma tarihinden önce olduğunda ne yapılacağı. Otomatik düzenlemelere uygulanır ve toplu araç için varsayılanı belirler.',
        optionDisabled: 'Düzeltme (yalnızca algıla)',
        optionCreatedToUpdated:
          'Oluşturma tarihini son düzenleme tarihine ayarla',
        optionUpdatedToCreated:
          'Son düzenleme tarihini oluşturma tarihine ayarla',
        optionMaxAll: 'İkisini de en son tarihe ayarla',
      },
      tolerance: {
        name: 'Küçük farkları yok say (saniye)',
        desc: 'Aradaki fark bundan küçük olduğunda sıralaması yanlış tarihleri yok say. Küçük bir değer minik saat farklarını gizler.',
      },
    },
    advanced: {
      summary: 'Gelişmiş',
      newFileDelay: {
        name: 'Yeni dosya gecikmesi',
        desc: 'Yeni oluşturulan bir nota tarih damgalamadan önce bu kadar milisaniye bekle. Şablon eklentileriyle çakışmaları önlemeye yardımcı olur. Kapatmak için 0 yapın.',
      },
      autoPopulateCache: {
        name: 'Başlangıçta önbelleği otomatik doldur',
        desc: 'Eklenti yüklendiğinde, henüz değişiklik algılama verisi olmayan notlar için bu veriyi oluştur. Arka planda çalışır.',
      },
      maxCacheEntries: {
        name: 'En fazla önbellek girişi',
        desc: 'Önbellek bu sınırı aştığında, en eski kullanılmayan girişler kaldırılır. 0 = sınır yok.',
      },
      postUpdateCommand: {
        name: 'Güncellemeden sonraki komut',
        desc: 'Bir tarih güncellendikten sonra bir Obsidian komutu çalıştır. Kapatmak için boş bırakın.',
        optionNone: 'Yok',
      },
    },
    bulk: {
      heading: 'Toplu işlemler',
      populate: {
        name: 'Tarihleri dosyanın kendi tarihlerinden ayarla',
        desc: 'Oluşturma ve son düzenleme tarihlerini her dosyanın diskteki kendi oluşturma ve değiştirme tarihlerinden doldur. İlk kurulum için harikadır.',
        button: 'Tarihleri doldur',
      },
      rename: {
        name: 'Bir özelliği yeniden adlandır',
        desc: 'Değerleri eski bir özellik adından yenisine tüm notlarda taşı. Yukarıdaki bir özellik adını değiştirdikten sonra kullanışlıdır.',
        button: 'Özelliği yeniden adlandır',
      },
      reformat: {
        name: 'Mevcut tarihleri yeniden biçimlendir',
        desc: 'Eski bir biçimde yazılmış tarihleri bul ve onları geçerli biçiminizde yeniden yaz. Yukarıdaki tarih biçimini değiştirdikten sonra kullanışlıdır.',
        button: 'Tarihleri yeniden biçimlendir',
      },
      findInversions: {
        name: 'Sıralaması yanlış tarihleri bul',
        desc: 'Notlarınızı tarayın ve son düzenleme tarihinin oluşturma tarihinden önce olduğu notları listeleyin. Ardından yukarıda seçtiğiniz düzeltmeyi uygulayabilirsiniz.',
        button: 'Sıralaması yanlış tarihleri bul',
      },
      rebuildCache: {
        name: 'Özet önbelleğini yeniden oluştur',
        desc: 'Tüm notlarınız için değişiklik algılama verisini (içerik özetleri) yeniden hesapla. Yukarıda neyin değişiklik sayıldığını değiştirdikten sonra kullanışlıdır.',
        button: 'Önbelleği yeniden oluştur',
      },
    },
  },

  modals: {
    populate: {
      configureTitle: 'Tarihleri dosyanın kendi tarihlerinden ayarla',
      configureSubtitleLine1: 'Oluşturma ve son düzenleme tarihlerini doldur',
      configureSubtitleLine2:
        'her dosyanın diskteki kendi oluşturma ve değiştirme tarihlerinden.',
      modeName: 'Hangi tarihler ayarlansın',
      modeDesc: 'Hangi tarihlerin doldurulacağını seçin.',
      modeOptionBoth: 'Hem oluşturma hem güncelleme',
      modeOptionCreated: 'Yalnızca oluşturma tarihleri',
      modeOptionUpdated: 'Yalnızca güncelleme tarihleri',
      overrideName: 'Zaten tarihi olan dosyalar',
      overrideDesc:
        'Yalnızca eksik tarihleri doldur veya mevcut olanların üzerine yaz.',
      overrideOptionFillMissing: 'Yalnızca eksik olanları doldur (güvenli)',
      overrideOptionOverwriteAll:
        'Tümünün üzerine yaz (mevcut olanları değiştirir)',
      autoUpdateNoteTitle: 'Otomatik güncelleme hakkında not:',
      autoUpdateNoteBody:
        'Otomatik güncelleme etkinse, dosyanın diskteki kendi tarihleri özgün tarihleri değil, eklentinin kendi düzenlemelerini yansıtıyor olabilir. En iyi sonuç için bu özelliği otomatik güncellemeyi açmadan önce veya eklentiyi kurduktan hemen sonra kullanın.',
      warningTitleCreatedUnreliable:
        'Dosyanın oluşturma tarihi bazı platformlarda güvenilir değil',
      warningTitlePlatformNote: 'Platform notu',
      platformMacWinNote: 'gerçek dosya oluşturma tarihi',
      platformLinuxNote:
        'sistem gerçek oluşturma tarihini değil, daha geç bir tarih bildirir',
      platformAndroidNote: 'cihaza bağlıdır, çoğu zaman güvenilir değildir',
      platformIosNote: 'genellikle güvenilirdir',
      platformReliable: 'Güvenilir',
      platformUnreliable: 'GÜVENİLİR DEĞİL',
      platformYourPlatformSuffix: ' (sizin platformunuz)',
      syncNoteLine1:
        'Eşitlenen kasalar: dosya tarihleri eşitleme hizmetlerince sıfırlanabilir',
      syncNoteLine3:
        'Son düzenleme tarihi genellikle oluşturma tarihinden daha güvenilirdir.',
      recommendation:
        'Öneri: çalıştırdıktan sonra sonuçları gözden geçirin. Önce bir yedek alın.',
      overwriteWarning:
        'Bu, notlarınızdaki mevcut tarihleri değiştirir. Bu geri alınamaz. Önce bir yedek alın.',
      noPropertyConfigured:
        'Şunun için özellik adı ayarlanmamış: {missing}. Eklenti ayarlarını kontrol edin.',
      previewTitle: 'Önizleme: tarihleri ayarla',
      noFilesNeedUpdating:
        'Güncellenecek dosya yok. Tüm uygun dosyalarda istenen tarihler zaten var.',
      previewOverwriteWarning:
        'Üzerine yazma modu: mevcut tarihler değiştirilecek. Bu geri alınamaz. Önce bir yedek alın.',
      settingDates: 'Tarihler ayarlanıyor…',
      stopped: 'Durduruldu.',
      doneWithErrorsSubtitle: 'Güncellenen dosya sayısı: {processed}.',
      doneTitle: 'Tamamlandı! Güncellenen dosya sayısı: {processed}.',
    },
    rename: {
      configureTitle: 'Bir özelliği yeniden adlandır',
      configureSubtitle:
        'Değerleri bir özellik adından diğerine tüm notlarda taşı.',
      validationEnterOld: 'Devam etmek için eski özellik adını girin.',
      validationEnterNew: 'Devam etmek için yeni özellik adını girin.',
      validationMustDiffer: 'Eski ve yeni özellik adları farklı olmalıdır.',
      oldKeyName: 'Eski özellik adı',
      oldKeyDesc: 'Notlarınızda şu anda kullanılan özellik adı.',
      newKeyName: 'Yeni özellik adı',
      newKeyDesc: 'Kullanılacak yeni özellik adı.',
      deleteOldName: 'Yeniden adlandırdıktan sonra eski özelliği sil',
      deleteOldDesc:
        'Değerini yenisine kopyaladıktan sonra eski özelliği kaldır.',
      namesCannotBeEmpty: 'Özellik adları boş olamaz.',
      previewTitle: 'Önizleme: özelliği yeniden adlandır',
      noNotesUseProperty: 'Hiçbir not "{oldKey}" özelliğini kullanmıyor.',
      conflictWarning:
        '{conflicts} notta zaten "{newKey}" özelliği var. Mevcut değerin üzerine yazılacak.',
      columnArrowNew: '→ {newKey}',
      deleteWarning:
        'Kopyalandıktan sonra eski özellik silinecek. Bu geri alınamaz. Önce bir yedek alın.',
      renamingProperty: 'Özellik yeniden adlandırılıyor…',
      renameStopped: 'Yeniden adlandırma durduruldu.',
      doneWithErrorsSubtitle: 'Güncellenen dosya sayısı: {processed}.',
      doneTitle: 'Tamamlandı! Güncellenen dosya sayısı: {processed}.',
    },
    reformat: {
      configureTitle: 'Tarih biçimini standartlaştır',
      configureSubtitle:
        'Mevcut tarih değerlerini ayrıştır ve onları ayarlardaki geçerli biçimi kullanarak yeniden yaz.',
      invalidFormat: 'Geçersiz biçim',
      targetFormatName: 'Hedef biçim',
      scopeName: 'Hangi alanlar yeniden biçimlendirilsin',
      scopeDesc: 'Hangi tarihlerin standartlaştırılacağını seçin.',
      scopeOptionAll: 'Tüm tarihler',
      scopeOptionCreated: 'Yalnızca oluşturma',
      scopeOptionUpdated: 'Yalnızca güncelleme',
      scopeOptionViewed: 'Yalnızca görüntüleme',
      autoDetectNote:
        'Tarihler yaygın biçimlerden (ISO 8601, Avrupa, ABD, sayısal tarihler) otomatik olarak algılanır ve geçerli biçiminizde yeniden yazılır.',
      noPropertyConfigured:
        'Şunun için özellik adı ayarlanmamış: {missing}. Eklenti ayarlarını kontrol edin.',
      previewTitle: 'Önizleme: tarihleri standartlaştır',
      noChangeAmbiguous:
        'Henüz dönüştürülecek bir şey yok. {ambiguousCount} tarih iki şekilde okunabiliyor ve değiştirilmeden bırakıldı - onları dönüştürmek için yukarıdan bir gün/ay sırası seçin.',
      noChangeDefault:
        'Yeniden biçimlendirilecek dosya yok. Tüm tarihler zaten hedef biçimde ya da ayrıştırılamadı.',
      errorWarningNoChange:
        '{errorCount} dosyada ayrıştırılamayan tarihler var.',
      errorWarningWillSkip:
        '{errorCount} dosyada ayrıştırılamayan tarihler var. Bunlar atlanacak.',
      checkNote:
        '[check] ile işaretli satırlar iki şekilde okunabiliyor - yeni tarihin doğru göründüğünü onaylayın.',
      rewriteWarning:
        'Bu, mevcut tarih değerlerini yerinde yeniden yazar. Bu geri alınamaz. Önce bir yedek alın.',
      ambiguityName: 'İki şekilde okunabilen tarihler',
      ambiguityDesc:
        '{ambiguousCount} tarih gün-önce veya ay-önce anlamına gelebilir (örneğin 01/05/2024).{detectedHint}',
      detectedHintMonthFirst: ' Sisteminiz ayın önce gelmesini öneriyor.',
      detectedHintDayFirst: ' Sisteminiz günün önce gelmesini öneriyor.',
      ambiguityOptionSkip: 'Belirsiz tarihleri değiştirmeden bırak',
      ambiguityOptionDmy: 'Gün önce (01/05 = gün 1, ay 5)',
      ambiguityOptionMdy: 'Ay önce (01/05 = ay 1, gün 5)',
      cellCouldNotRead: '{oldValue} (tarih okunamadı)',
      cellConversion: '{oldValue} → {newValue}{check}',
      cellNewValue: '{newValue}{check}',
      cellCheckSuffix: ' [check]',
      reformattingDates: 'Tarihler yeniden biçimlendiriliyor…',
      reformatStopped: 'Yeniden biçimlendirme durduruldu.',
      doneWithErrorsSubtitle: 'Güncellenen dosya sayısı: {processed}.',
      doneTitle: 'Tamamlandı! Güncellenen dosya sayısı: {processed}.',
    },
    inversions: {
      scanningTitle: 'Sıralaması yanlış tarihler bulunuyor…',
      foundTitle: 'Sıralaması yanlış tarihli not sayısı: {count}',
      foundSubtitle:
        'Bu notların son düzenleme tarihi oluşturma tarihinden önce. Onları nasıl düzelteceğinizi aşağıdan seçin ya da elle incelemek için kapatın.',
      noneFound: 'Sıralaması yanlış tarih bulunamadı.',
      strategyName: 'Nasıl düzeltilsin',
      strategyDesc: 'Tarihleri nasıl düzelteceğinizi seçin.',
      strategyOptionDisabled: 'Düzeltme (yalnızca incele)',
      strategyOptionCreatedToUpdated:
        'Oluşturma tarihini son düzenleme tarihine ayarla',
      strategyOptionUpdatedToCreated:
        'Son düzenleme tarihini oluşturma tarihine ayarla',
      strategyOptionMaxAll: 'İkisini de en son tarihe ayarla',
      toleranceNote:
        '{tolerance} saniyeden küçük farklar yok sayılıyor (ayarlarda belirlenir).',
      fixWarning:
        'Bu, {count} notu değiştirecek. Bu geri alınamaz. Önce bir yedek alın.',
      fixingDates: 'Tarihler düzeltiliyor…',
      stopped: 'Toplu işlem durduruldu.',
      fixedNotice: 'Düzeltilen not sayısı: {processed}.',
      doneWithErrorsSubtitle: 'Düzeltilen not sayısı: {processed}.',
      doneTitle: 'Tamamlandı! Bu pencereyi güvenle kapatabilirsiniz.',
    },
    rebuildCache: {
      loadingFiles: 'Dosyalar yükleniyor…',
      confirmTitle:
        '{count} dosya için değişiklik algılama verisini yeniden oluştur',
      confirmSubtitle:
        'Bu, gerçek düzenlemeleri algılamak için kullanılan içerik parmak izlerini (içerik özetleri) yeniden hesaplar. Notlarınızı değiştirmez.',
      rebuilding: 'Yeniden oluşturuluyor…',
      stopped: 'Toplu işlem durduruldu.',
      doneWithErrorsSubtitle: 'İşlenen dosya sayısı: {processed}.',
      doneTitle: 'Tamamlandı! Bu pencereyi güvenle kapatabilirsiniz.',
    },
  },
};
