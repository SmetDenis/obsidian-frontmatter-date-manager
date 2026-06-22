// Indonesian. Machine-generated baseline. Improvements welcome - see CONTRIBUTING.md.
import type { Strings } from '../index';

export const STRINGS_ID: Strings = {
  common: {
    run: 'Jalankan',
    back: 'Kembali',
    cancel: 'Batal',
    close: 'Tutup',
    file: 'Berkas',
    created: 'Dibuat',
    updated: 'Diperbarui',
    viewed: 'Dilihat',
    createdKeyed: 'Dibuat ({key})',
    updatedKeyed: 'Diperbarui ({key})',
    viewedKeyed: 'Dilihat ({key})',
    scanAndPreview: 'Pindai dan pratinjau',
    scanningFiles: 'Memindai berkas…',
    doneWithErrors: 'Selesai dengan {errors} kesalahan.',
  },
  commands: {
    updateCurrentFile: 'Perbarui tanggal untuk berkas saat ini',
    toggleAutoUpdate: 'Aktifkan/nonaktifkan pembaruan otomatis',
    pauseAutoUpdate: 'Jeda pembaruan otomatis selama 5 menit',
  },
  statusBar: {
    paused: 'Dijeda',
    pausedWithMinutes: 'Dijeda ({remaining}m)',
  },
  notices: {
    inversionDetectedAndFixed:
      'Frontmatter Date Manager: tanggal yang tidak urut terdeteksi dan diperbaiki. Gunakan "Cari tanggal yang tidak urut" di pengaturan untuk meninjau.',
    timestampsUpdated: 'Tanggal diperbarui.',
    fileIgnored: 'Berkas diabaikan oleh pengaturan plugin.',
    failedToUpdateWithReason: 'Gagal memperbarui tanggal: {reason}',
    failedToUpdate: 'Gagal memperbarui tanggal.',
    autoUpdateEnabled: 'Pembaruan otomatis aktif',
    autoUpdateDisabled: 'Pembaruan otomatis nonaktif',
    autoUpdatePausedForMinutes:
      'Pembaruan otomatis dijeda selama {minutes} menit. Akan dilanjutkan otomatis.',
    autoUpdateResumed: 'Pembaruan otomatis dilanjutkan.',
    malformedFrontmatter:
      'Frontmatter Date Manager gagal\nProperti rusak pada berkas ini: {filePath}\n\n{message}',
  },
  bulkChrome: {
    summaryWillChange: '{changed} berkas akan berubah',
    summarySkipped: '{skipped} dilewati',
    summaryErrors: '{errors} kesalahan',
    pagerPrev: 'Sebelumnya',
    pagerNext: 'Berikutnya',
    pageInfo: 'Halaman {current} dari {total}',
    downloadFullPreview: 'Unduh pratinjau lengkap',
    downloadSuccess:
      'Mengunduh {count} baris sebagai {filename} ke folder unduhan Anda.',
    downloadFailed: 'Tidak dapat mengunduh berkas pratinjau.',
    failureColumnError: 'Kesalahan',
    progressCounter: '{count}/{max}',
  },
  settings: {
    description: {
      syncIntro:
        'Layanan sinkronisasi, alat cadangan, dan plugin lain sering menulis ulang berkas tanpa mengubah isinya - yang mengatur ulang tanggal berkas di disk. Ini membuat tidak mungkin mengetahui kapan Anda benar-benar terakhir mengedit sebuah catatan.',
      pluginIntro:
        'Plugin ini menulis tanggal dibuat dan terakhir diedit langsung ke dalam properti setiap catatan, dan mendeteksi perubahan nyata dengan membandingkan isi, sehingga tanggal Anda mencerminkan suntingan yang sebenarnya - bukan artefak sinkronisasi.',
    },
    dates: {
      heading: 'Tanggal yang dilacak',
      enableNoneHint:
        'Aktifkan setidaknya satu tanggal di atas untuk menyiapkan plugin.',
      created: {
        enableName: 'Lacak tanggal pembuatan',
        enableDesc:
          'Tambahkan tanggal pembuatan ke catatan yang belum memilikinya.',
        propertyName: 'Properti dibuat',
        propertyDesc: 'Nama properti tempat tanggal pembuatan disimpan.',
        propertyPlaceholder: 'Created',
      },
      updated: {
        enableName: 'Lacak tanggal terakhir diedit',
        enableDesc: 'Perbarui tanggal ini setiap kali Anda mengedit catatan.',
        propertyName: 'Properti diperbarui',
        propertyDesc: 'Nama properti tempat tanggal terakhir diedit disimpan.',
        propertyPlaceholder: 'Updated',
      },
      updateCount: {
        enableName: 'Hitung suntingan',
        enableDesc:
          'Tambahkan properti angka yang naik satu setiap kali Anda mengedit catatan. Hitungan aktivitas perkiraan, bukan riwayat yang tepat.',
        propertyName: 'Properti hitungan suntingan',
        propertyDesc: 'Nama properti tempat hitungan suntingan disimpan.',
      },
      viewed: {
        enableName: 'Lacak tanggal terakhir dibuka',
        enableDesc: 'Simpan tanggal setiap kali Anda membuka catatan.',
        propertyName: 'Properti dilihat',
        propertyDesc: 'Nama properti tempat tanggal terakhir dibuka disimpan.',
        propertyPlaceholder: 'Viewed',
      },
    },
    formatting: {
      heading: 'Format tanggal',
      dateFormat: {
        name: 'Format tanggal',
        desc: 'Bagaimana tanggal dan waktu ditulis ke dalam catatan Anda.',
        formatCodesLink: 'Lihat kode format yang tersedia',
        currentlyPreview: 'Saat ini: {preview}',
        invalidWithHint: 'Format tidak valid. {hint}',
        invalidFormat: 'String format tanggal tidak valid.',
        obsidianDefault:
          "Bawaan Obsidian: yyyy-MM-dd'T'HH:mm:ss (tanggal dan waktu, zona waktu lokal)",
      },
      timezone: {
        name: 'Zona waktu',
        desc: 'Zona waktu yang digunakan saat menulis tanggal. Biarkan kosong untuk memakai zona waktu perangkat Anda ({localTz}).',
        placeholder: 'Lokal ({localTz})',
        resetTooltip: 'Atur ulang ke zona waktu lokal',
      },
      numberProperties: {
        name: 'Simpan tanggal angka saja tanpa tanda kutip',
        desc: 'Jika format tanggal Anda hanya berupa angka (seperti stempel waktu unix), tulis sebagai angka biasa (updated: 1712930400) alih-alih teks dalam tanda kutip (updated: "1712930400"). Tidak berpengaruh jika format Anda berisi tanda hubung atau titik dua.',
      },
    },
    behavior: {
      heading: 'Perilaku',
      autoUpdate: {
        name: 'Pembaruan otomatis',
        desc: 'Perbarui tanggal secara otomatis saat Anda mengedit catatan. Juga tersedia dari palet perintah.',
      },
      minSeconds: {
        name: 'Detik minimum antar pembaruan',
        desc: 'Menghindari pembaruan tanggal terlalu sering saat Anda mengetik atau berpindah antar catatan.',
      },
      changeDetection: {
        name: 'Deteksi perubahan (hashing isi)',
        descEnabled:
          'Tanggal terakhir diedit hanya ditulis ketika isi catatan benar-benar berubah - ini mencegah pembaruan palsu dari plugin sinkronisasi.',
        descDisabled:
          'Nonaktif - tanggal terakhir diedit ditulis pada setiap penyimpanan, meski tidak ada yang berubah.',
      },
      hashTrackingMode: {
        name: 'Apa yang dianggap perubahan',
        desc: 'Bagian catatan mana yang dianggap perubahan. "Hanya isi" - mengedit properti (tag, alias, dll.) tidak akan memperbarui tanggal. "Hanya properti" - mengedit teks catatan tidak akan memperbarui tanggal. "Keduanya" - setiap suntingan memperbarui tanggal.',
        optionBody: 'Hanya isi catatan (bawaan)',
        optionFrontmatter: 'Hanya properti',
        optionBoth: 'Isi dan properti',
        changedNotice:
          'Mode pelacakan diubah. Bangun ulang cache hash (di operasi massal) agar tanggal tetap akurat.',
      },
      excludeKeys: {
        name: 'Abaikan properti ini',
        desc: 'Mengedit properti ini tidak akan memperbarui tanggal. Anda dapat menambahkan beberapa sekaligus, dipisahkan dengan koma. Properti created, updated, dan viewed selalu diabaikan otomatis.',
        placeholder: 'Nama properti seperti tags',
        addTooltip: 'Tambah properti',
        chipRemoveAriaLabel: 'Hapus {entry}',
      },
    },
    filterRules: {
      name: 'Berkas dan folder yang dilewati',
      descIntro:
        'Pilih berkas atau folder yang dibiarkan saja (tanpa pembaruan tanggal otomatis). ',
      descOnePerLine: 'Satu pola per baris. Baris yang diawali dengan ',
      descCommentsAre: ' adalah komentar. Awali baris dengan ',
      descAddBack: ' untuk menambahkan kembali sebuah jalur. ',
      descLastWins: 'Jika beberapa baris cocok, yang terakhir menang.',
      advancedSyntaxLink: 'Sintaks lanjutan (gaya gitignore)',
      noRulesWarning:
        'Tidak ada aturan - semua catatan mendapat pembaruan tanggal otomatis.',
      placeholderExcludeFolder: '# Kecualikan sebuah folder',
      placeholderExcludeByPattern: '# Kecualikan berdasarkan pola',
      placeholderReinclude: '# Sertakan kembali berkas tertentu',
      parseError: 'Baris {lineNumber}: {message} - "{text}"',
      previewButton: 'Pratinjau berkas yang cocok',
      previewSummary: '{tracked} catatan dilacak, {excluded} catatan dilewati',
      skippedFilesSummary: 'Berkas yang dilewati ({excluded})',
      skippedMore: '...dan {count} lagi',
      reference: {
        summary: 'Referensi sintaks pola',
        sectionBasics: 'Dasar sintaks',
        basicsCommentDesc: 'Baris yang diawali dengan # diabaikan',
        basicsBlankDesc: 'Baris kosong diabaikan',
        basicsExcludeDesc: 'Kecualikan - berkas di dalam templates/ dilewati',
        basicsReincludeDesc:
          'Sertakan kembali - awali dengan ! untuk membatalkan pengecualian',
        basicsLastWinsDesc: 'Saat beberapa aturan cocok, yang terakhir menang',
        sectionExcludeFolder: 'Kecualikan sebuah folder',
        excludeFolderAllFilesDesc: 'Semua berkas di dalam templates/',
        excludeFolderSameEffectDesc:
          'Efek yang sama (garis miring di akhir opsional)',
        excludeFolderNestedDesc: 'Folder bersarang',
        sectionReinclude: 'Sertakan kembali (batalkan pengecualian)',
        reincludeExcludeWholeDesc: 'Kecualikan seluruh folder',
        reincludeKeepDesc: 'Tetapi tetap lacak berkas tertentu ini',
        sectionWildcards: 'Karakter pengganti',
        wildcardStarDesc: 'Karakter apa pun kecuali /',
        wildcardDoubleStarDesc:
          'Karakter apa pun termasuk / (melintasi folder)',
        wildcardQuestionDesc: 'Tepat satu karakter',
        sectionWildcardExamples: 'Contoh karakter pengganti',
        wildcardExCanvasRootDesc:
          'Berkas yang berakhiran .canvas.md di akar brankas',
        wildcardExCanvasAnyDesc:
          'Berkas yang berakhiran .canvas.md di folder mana pun',
        wildcardExDailyDesc: 'Berkas seperti daily/2024-01-01.md',
        wildcardExTwoCharDesc: 'Nama berkas dua karakter di notes/',
        sectionSpecificFiles: 'Berkas tertentu',
        specificFilesOneExactDesc: 'Satu berkas yang tepat',
        specificFilesRootDesc: 'Sebuah berkas di akar brankas',
        sectionPathsWithSpaces: 'Jalur dengan spasi',
        pathsWithSpacesAsIsDesc: 'Cukup tulis jalur apa adanya',
        pathsWithSpacesNoQuotesDesc: 'Tidak perlu tanda kutip di sekitar spasi',
        sectionNonLatin: 'Karakter non-Latin',
        nonLatinCyrillicDesc: 'Nama folder Sirilik',
        nonLatinChineseDesc: 'Karakter Tionghoa',
        nonLatinFullPathDesc: 'Jalur non-Latin lengkap',
        sectionObsidianExamples: 'Contoh khusus Obsidian',
        obsidianTemplateFolderDesc: 'Folder templat',
        obsidianDailyFolderDesc: 'Folder catatan harian',
        obsidianAttachmentsDesc: 'Folder lampiran / media',
        obsidianCanvasDesc: 'Semua berkas kanvas',
        obsidianExcalidrawDesc: 'Semua gambar Excalidraw',
        obsidianInboxDesc: 'Folder kotak masuk / coretan',
        obsidianArchiveDesc: 'Catatan yang diarsipkan',
        sectionAllowlist: 'Mode daftar izin (lacak hanya folder tertentu)',
        allowlistExcludeEverythingDesc: 'Pertama, kecualikan semuanya',
        allowlistReincludeWantedDesc:
          'Lalu sertakan kembali hanya yang Anda inginkan',
        allowlistReincludeAnotherDesc: 'Sertakan kembali folder lain',
        emptyNote:
          'Saat bidang ini kosong, semua catatan mendapat pembaruan tanggal otomatis.',
      },
    },
    inversions: {
      heading: 'Tanggal diubah sebelum dibuat',
      strategy: {
        name: 'Cara memperbaiki tanggal yang tidak urut',
        desc: 'Apa yang harus dilakukan ketika tanggal terakhir diedit lebih awal daripada tanggal pembuatan. Berlaku untuk suntingan otomatis, dan menjadi bawaan untuk alat massal.',
        optionDisabled: 'Jangan perbaiki (hanya deteksi)',
        optionCreatedToUpdated:
          'Atur tanggal pembuatan ke tanggal terakhir diedit',
        optionUpdatedToCreated:
          'Atur tanggal terakhir diedit ke tanggal pembuatan',
        optionMaxAll: 'Atur keduanya ke tanggal paling baru',
      },
      tolerance: {
        name: 'Abaikan selisih kecil (detik)',
        desc: 'Abaikan tanggal yang tidak urut ketika selisihnya lebih kecil dari ini. Nilai kecil menyembunyikan selisih jam yang sangat kecil.',
      },
    },
    advanced: {
      summary: 'Lanjutan',
      newFileDelay: {
        name: 'Penundaan berkas baru',
        desc: 'Tunggu sekian milidetik sebelum menstempel tanggal pada catatan yang baru dibuat. Membantu menghindari konflik dengan plugin templat. Atur ke 0 untuk mematikan.',
      },
      autoPopulateCache: {
        name: 'Isi cache otomatis saat mulai',
        desc: 'Saat plugin dimuat, bangun data deteksi perubahan untuk catatan yang belum memilikinya. Berjalan di latar belakang.',
      },
      maxCacheEntries: {
        name: 'Entri cache maksimum',
        desc: 'Ketika cache melebihi batas ini, entri terlama yang tidak terpakai dihapus. 0 = tanpa batas.',
      },
      postUpdateCommand: {
        name: 'Perintah setelah pembaruan',
        desc: 'Jalankan perintah Obsidian setelah tanggal diperbarui. Biarkan kosong untuk mematikan.',
        optionNone: 'Tidak ada',
      },
    },
    bulk: {
      heading: 'Operasi massal',
      populate: {
        name: 'Atur tanggal dari tanggal milik berkas itu sendiri',
        desc: 'Isi tanggal dibuat dan terakhir diedit dari tanggal pembuatan dan modifikasi setiap berkas di disk. Bagus untuk penyiapan pertama kali.',
        button: 'Isi tanggal',
      },
      rename: {
        name: 'Ganti nama properti',
        desc: 'Pindahkan nilai dari nama properti lama ke nama baru di semua catatan. Berguna setelah mengubah nama properti di atas.',
        button: 'Ganti nama properti',
      },
      reformat: {
        name: 'Format ulang tanggal yang ada',
        desc: 'Temukan tanggal yang ditulis dalam format lama dan tulis ulang dalam format Anda saat ini. Berguna setelah mengubah format tanggal di atas.',
        button: 'Format ulang tanggal',
      },
      findInversions: {
        name: 'Cari tanggal yang tidak urut',
        desc: 'Pindai catatan Anda dan daftar catatan yang tanggal terakhir dieditnya lebih awal daripada tanggal pembuatan. Anda lalu dapat menerapkan perbaikan yang Anda pilih di atas.',
        button: 'Cari tanggal yang tidak urut',
      },
      rebuildCache: {
        name: 'Bangun ulang cache hash',
        desc: 'Hitung ulang data deteksi perubahan (hash isi) untuk semua catatan Anda. Berguna setelah mengubah apa yang dianggap perubahan di atas.',
        button: 'Bangun ulang cache',
      },
    },
  },
  modals: {
    populate: {
      configureTitle: 'Atur tanggal dari tanggal milik berkas itu sendiri',
      configureSubtitleLine1: 'Isi tanggal dibuat dan terakhir diedit',
      configureSubtitleLine2:
        'dari tanggal pembuatan dan modifikasi setiap berkas di disk.',
      modeName: 'Tanggal mana yang diatur',
      modeDesc: 'Pilih tanggal mana yang akan diisi.',
      modeOptionBoth: 'Dibuat dan diperbarui',
      modeOptionCreated: 'Hanya tanggal dibuat',
      modeOptionUpdated: 'Hanya tanggal diperbarui',
      overrideName: 'Berkas yang sudah memiliki tanggal',
      overrideDesc: 'Isi hanya tanggal yang hilang, atau timpa yang sudah ada.',
      overrideOptionFillMissing: 'Hanya isi yang hilang (aman)',
      overrideOptionOverwriteAll: 'Timpa semua (mengganti yang ada)',
      autoUpdateNoteTitle: 'Catatan tentang pembaruan otomatis:',
      autoUpdateNoteBody:
        'Jika pembaruan otomatis telah aktif, tanggal milik berkas di disk mungkin sudah mencerminkan suntingan plugin sendiri, bukan tanggal asli. Untuk hasil terbaik, gunakan fitur ini sebelum mengaktifkan pembaruan otomatis atau segera setelah memasang plugin.',
      warningTitleCreatedUnreliable:
        'Tanggal pembuatan berkas tidak andal pada beberapa platform',
      warningTitlePlatformNote: 'Catatan platform',
      platformMacWin: 'macOS / Windows',
      platformMacWinNote: 'tanggal pembuatan berkas yang sebenarnya',
      platformLinux: 'Linux',
      platformLinuxNote:
        'sistem melaporkan tanggal yang lebih baru, bukan tanggal pembuatan yang sebenarnya',
      platformAndroid: 'Android',
      platformAndroidNote: 'bergantung pada perangkat, sering tidak andal',
      platformIos: 'iOS',
      platformIosNote: 'umumnya andal',
      platformReliable: 'Andal',
      platformUnreliable: 'TIDAK ANDAL',
      platformLineName: '{name}: {prefix}',
      platformYourPlatformSuffix: ' (platform Anda)',
      syncNoteLine1:
        'Lemari tersinkron: tanggal berkas mungkin diatur ulang oleh layanan sinkronisasi',
      syncNoteLine2: '(Obsidian Sync, iCloud, Dropbox, Git).',
      syncNoteLine3:
        'Tanggal terakhir diedit biasanya lebih andal daripada tanggal pembuatan.',
      recommendation:
        'Rekomendasi: tinjau hasil setelah menjalankan. Buat cadangan terlebih dahulu.',
      overwriteWarning:
        'Ini akan mengganti tanggal yang ada di catatan Anda. Ini tidak dapat dibatalkan. Buat cadangan terlebih dahulu.',
      noPropertyConfigured:
        'Tidak ada nama properti yang diatur untuk: {missing}. Periksa pengaturan plugin.',
      previewTitle: 'Pratinjau: atur tanggal',
      noFilesNeedUpdating:
        'Tidak ada berkas yang perlu diperbarui. Semua berkas yang memenuhi syarat sudah memiliki tanggal yang diminta.',
      previewOverwriteWarning:
        'Mode timpa: tanggal yang ada akan diganti. Ini tidak dapat dibatalkan. Buat cadangan terlebih dahulu.',
      settingDates: 'Mengatur tanggal…',
      stopped: 'Dihentikan.',
      doneWithErrorsSubtitle: '{processed} berkas diperbarui.',
      doneTitle: 'Selesai! {processed} berkas diperbarui.',
    },
    rename: {
      configureTitle: 'Ganti nama properti',
      configureSubtitle:
        'Pindahkan nilai dari satu nama properti ke nama lain di semua catatan.',
      validationEnterOld: 'Masukkan nama properti lama untuk melanjutkan.',
      validationEnterNew: 'Masukkan nama properti baru untuk melanjutkan.',
      validationMustDiffer: 'Nama properti lama dan baru harus berbeda.',
      oldKeyName: 'Nama properti lama',
      oldKeyDesc: 'Nama properti yang saat ini dipakai di catatan Anda.',
      oldKeyPlaceholder: 'Date_created',
      newKeyName: 'Nama properti baru',
      newKeyDesc: 'Nama properti baru yang akan dipakai.',
      newKeyPlaceholder: 'Created',
      deleteOldName: 'Hapus properti lama setelah penggantian nama',
      deleteOldDesc:
        'Hapus properti lama setelah menyalin nilainya ke yang baru.',
      namesCannotBeEmpty: 'Nama properti tidak boleh kosong.',
      previewTitle: 'Pratinjau: ganti nama properti',
      noNotesUseProperty: 'Tidak ada catatan yang memakai properti "{oldKey}".',
      conflictWarning:
        '{conflicts} catatan sudah memiliki properti "{newKey}". Nilai yang ada akan ditimpa.',
      columnArrowNew: '→ {newKey}',
      deleteWarning:
        'Properti lama akan dihapus setelah disalin. Ini tidak dapat dibatalkan. Buat cadangan terlebih dahulu.',
      renamingProperty: 'Mengganti nama properti…',
      renameStopped: 'Penggantian nama dihentikan.',
      doneWithErrorsSubtitle: '{processed} berkas diperbarui.',
      doneTitle: 'Selesai! {processed} berkas diperbarui.',
    },
    reformat: {
      configureTitle: 'Standarkan format tanggal',
      configureSubtitle:
        'Uraikan nilai tanggal yang ada dan tulis ulang menggunakan format saat ini dari pengaturan.',
      invalidFormat: 'Format tidak valid',
      targetFormatName: 'Format target',
      targetFormatDesc: '{currentFormat}',
      scopeName: 'Bidang mana yang diformat ulang',
      scopeDesc: 'Pilih tanggal mana yang akan distandarkan.',
      scopeOptionAll: 'Semua tanggal',
      scopeOptionCreated: 'Hanya dibuat',
      scopeOptionUpdated: 'Hanya diperbarui',
      scopeOptionViewed: 'Hanya dilihat',
      autoDetectNote:
        'Tanggal dideteksi otomatis dari format umum (ISO 8601, Eropa, AS, tanggal angka) dan ditulis ulang dalam format Anda saat ini.',
      noPropertyConfigured:
        'Tidak ada nama properti yang diatur untuk: {missing}. Periksa pengaturan plugin.',
      previewTitle: 'Pratinjau: standarkan tanggal',
      noChangeAmbiguous:
        'Belum ada yang dikonversi. {ambiguousCount} tanggal dapat dibaca dua cara dan dibiarkan tanpa perubahan - pilih urutan hari/bulan di atas untuk mengonversinya.',
      noChangeDefault:
        'Tidak ada berkas yang perlu diformat ulang. Semua tanggal sudah dalam format target atau tidak dapat diuraikan.',
      errorWarningNoChange:
        '{errorCount} berkas memiliki tanggal yang tidak dapat diuraikan.',
      errorWarningWillSkip:
        '{errorCount} berkas memiliki tanggal yang tidak dapat diuraikan. Berkas ini akan dilewati.',
      checkNote:
        'Baris yang ditandai [check] dapat dibaca dua cara - pastikan tanggal baru terlihat benar.',
      rewriteWarning:
        'Ini menulis ulang nilai tanggal yang ada di tempatnya. Ini tidak dapat dibatalkan. Buat cadangan terlebih dahulu.',
      ambiguityName: 'Tanggal yang dapat dibaca dua cara',
      ambiguityDesc:
        '{ambiguousCount} tanggal dapat berarti hari dahulu atau bulan dahulu (mis. 01/05/2024).{detectedHint}',
      detectedHintMonthFirst: ' Sistem Anda menyarankan bulan dahulu.',
      detectedHintDayFirst: ' Sistem Anda menyarankan hari dahulu.',
      ambiguityOptionSkip: 'Biarkan tanggal yang tidak jelas tanpa perubahan',
      ambiguityOptionDmy: 'Hari dahulu (01/05 = hari 1, bulan 5)',
      ambiguityOptionMdy: 'Bulan dahulu (01/05 = bulan 1, hari 5)',
      cellCouldNotRead: '{oldValue} (tidak dapat membaca tanggal)',
      cellConversion: '{oldValue} → {newValue}{check}',
      cellNewValue: '{newValue}{check}',
      cellCheckSuffix: ' [check]',
      reformattingDates: 'Memformat ulang tanggal…',
      reformatStopped: 'Format ulang dihentikan.',
      doneWithErrorsSubtitle: '{processed} berkas diperbarui.',
      doneTitle: 'Selesai! {processed} berkas diperbarui.',
    },
    inversions: {
      scanningTitle: 'Mencari tanggal yang tidak urut…',
      foundTitle: 'Ditemukan {count} catatan dengan tanggal yang tidak urut',
      foundSubtitle:
        'Catatan ini memiliki tanggal terakhir diedit lebih awal daripada tanggal pembuatan. Pilih cara memperbaikinya di bawah, atau tutup untuk meninjau secara manual.',
      noneFound: 'Tidak ada tanggal yang tidak urut ditemukan.',
      strategyName: 'Cara memperbaiki',
      strategyDesc: 'Pilih cara mengoreksi tanggal.',
      strategyOptionDisabled: 'Jangan perbaiki (hanya tinjau)',
      strategyOptionCreatedToUpdated:
        'Atur tanggal pembuatan ke tanggal terakhir diedit',
      strategyOptionUpdatedToCreated:
        'Atur tanggal terakhir diedit ke tanggal pembuatan',
      strategyOptionMaxAll: 'Atur keduanya ke tanggal paling baru',
      toleranceNote:
        'Mengabaikan selisih di bawah {tolerance} detik (diatur di pengaturan).',
      columnDelta: 'Δ',
      fixWarning:
        'Ini akan mengubah {count} catatan. Ini tidak dapat dibatalkan. Buat cadangan terlebih dahulu.',
      fixingDates: 'Memperbaiki tanggal…',
      stopped: 'Operasi massal dihentikan.',
      fixedNotice: 'Memperbaiki {processed} catatan.',
      doneWithErrorsSubtitle: '{processed} catatan diperbaiki.',
      doneTitle: 'Selesai! Anda dapat menutup jendela ini dengan aman.',
    },
    rebuildCache: {
      loadingFiles: 'Memuat berkas…',
      confirmTitle: 'Bangun ulang data deteksi perubahan untuk {count} berkas',
      confirmSubtitle:
        'Ini menghitung ulang sidik jari isi (hash isi) yang dipakai untuk mendeteksi suntingan nyata. Ini tidak mengubah catatan Anda.',
      rebuilding: 'Membangun ulang…',
      stopped: 'Operasi massal dihentikan.',
      doneWithErrorsSubtitle: '{processed} berkas diproses.',
      doneTitle: 'Selesai! Anda dapat menutup jendela ini dengan aman.',
    },
  },
};
