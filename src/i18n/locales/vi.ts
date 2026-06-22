// Vietnamese. Machine-generated baseline. Improvements welcome - see CONTRIBUTING.md.
import type { Strings } from '../index';

export const STRINGS_VI: Strings = {
  common: {
    run: 'Chạy',
    back: 'Quay lại',
    cancel: 'Hủy',
    close: 'Đóng',
    file: 'Tệp',
    created: 'Đã tạo',
    updated: 'Đã cập nhật',
    viewed: 'Đã xem',
    createdKeyed: 'Đã tạo ({key})',
    updatedKeyed: 'Đã cập nhật ({key})',
    viewedKeyed: 'Đã xem ({key})',
    scanAndPreview: 'Quét và xem trước',
    scanningFiles: 'Đang quét tệp…',
    doneWithErrors: 'Xong với {errors} lỗi.',
  },
  commands: {
    updateCurrentFile: 'Cập nhật ngày cho tệp hiện tại',
    toggleAutoUpdate: 'Bật/tắt tự động cập nhật',
    pauseAutoUpdate: 'Tạm dừng tự động cập nhật trong 5 phút',
  },
  statusBar: {
    paused: 'Đã tạm dừng',
    pausedWithMinutes: 'Đã tạm dừng ({remaining} phút)',
  },
  notices: {
    inversionDetectedAndFixed:
      'Frontmatter Date Manager: đã phát hiện và sửa các ngày sai thứ tự. Dùng "Tìm các ngày sai thứ tự" trong cài đặt để xem lại.',
    timestampsUpdated: 'Đã cập nhật ngày.',
    fileIgnored: 'Tệp bị bỏ qua bởi cài đặt của plugin.',
    failedToUpdateWithReason: 'Không thể cập nhật ngày: {reason}',
    failedToUpdate: 'Không thể cập nhật ngày.',
    autoUpdateEnabled: 'Đã bật tự động cập nhật',
    autoUpdateDisabled: 'Đã tắt tự động cập nhật',
    autoUpdatePausedForMinutes:
      'Đã tạm dừng tự động cập nhật trong {minutes} phút. Sẽ tự động tiếp tục.',
    autoUpdateResumed: 'Đã tiếp tục tự động cập nhật.',
    malformedFrontmatter:
      'Frontmatter Date Manager thất bại\nThuộc tính bị lỗi định dạng trong tệp này: {filePath}\n\n{message}',
  },
  bulkChrome: {
    summaryWillChange: '{changed} tệp sẽ thay đổi',
    summarySkipped: 'Bỏ qua {skipped}',
    summaryErrors: '{errors} lỗi',
    pagerPrev: 'Trước',
    pagerNext: 'Sau',
    pageInfo: 'Trang {current} trên {total}',
    downloadFullPreview: 'Tải về bản xem trước đầy đủ',
    downloadSuccess:
      'Đã tải về {count} dòng dưới dạng {filename} vào thư mục tải về của bạn.',
    downloadFailed: 'Không thể tải về tệp xem trước.',
    failureColumnError: 'Lỗi',
    progressCounter: '{count}/{max}',
  },
  settings: {
    description: {
      syncIntro:
        'Các dịch vụ đồng bộ, công cụ sao lưu và các plugin khác thường ghi lại tệp mà không thay đổi nội dung - điều này đặt lại ngày của tệp trên đĩa. Việc đó khiến không thể biết được lần cuối bạn thực sự chỉnh sửa một ghi chú là khi nào.',
      pluginIntro:
        'Plugin này ghi ngày tạo và ngày chỉnh sửa cuối thẳng vào thuộc tính của mỗi ghi chú, và phát hiện thay đổi thật bằng cách so sánh nội dung, nên ngày của bạn phản ánh các chỉnh sửa thực tế - không phải tạo tác của đồng bộ.',
    },
    dates: {
      heading: 'Các ngày cần theo dõi',
      enableNoneHint: 'Bật ít nhất một ngày ở trên để thiết lập plugin.',
      created: {
        enableName: 'Theo dõi ngày tạo',
        enableDesc: 'Thêm ngày tạo cho các ghi chú chưa có.',
        propertyName: 'Thuộc tính ngày tạo',
        propertyDesc: 'Tên thuộc tính nơi lưu ngày tạo.',
        propertyPlaceholder: 'Created',
      },
      updated: {
        enableName: 'Theo dõi ngày chỉnh sửa cuối',
        enableDesc: 'Cập nhật ngày này mỗi khi bạn chỉnh sửa ghi chú.',
        propertyName: 'Thuộc tính ngày cập nhật',
        propertyDesc: 'Tên thuộc tính nơi lưu ngày chỉnh sửa cuối.',
        propertyPlaceholder: 'Updated',
      },
      updateCount: {
        enableName: 'Đếm số lần chỉnh sửa',
        enableDesc:
          'Thêm một thuộc tính số tăng lên một mỗi khi bạn chỉnh sửa ghi chú. Đây là số đếm hoạt động gần đúng, không phải lịch sử chính xác.',
        propertyName: 'Thuộc tính số lần chỉnh sửa',
        propertyDesc: 'Tên thuộc tính nơi lưu số lần chỉnh sửa.',
      },
      viewed: {
        enableName: 'Theo dõi ngày mở cuối',
        enableDesc: 'Lưu ngày mỗi khi bạn mở ghi chú.',
        propertyName: 'Thuộc tính ngày xem',
        propertyDesc: 'Tên thuộc tính nơi lưu ngày mở cuối.',
        propertyPlaceholder: 'Viewed',
      },
    },
    formatting: {
      heading: 'Định dạng ngày',
      dateFormat: {
        name: 'Định dạng ngày',
        desc: 'Cách ngày và giờ được ghi vào ghi chú của bạn.',
        formatCodesLink: 'Xem các mã định dạng có sẵn',
        currentlyPreview: 'Hiện tại: {preview}',
        invalidWithHint: 'Định dạng không hợp lệ. {hint}',
        invalidFormat: 'Chuỗi định dạng ngày không hợp lệ.',
        obsidianDefault:
          "Mặc định của Obsidian: yyyy-MM-dd'T'HH:mm:ss (ngày và giờ, múi giờ địa phương)",
      },
      timezone: {
        name: 'Múi giờ',
        desc: 'Múi giờ dùng khi ghi ngày. Để trống để dùng múi giờ của thiết bị ({localTz}).',
        placeholder: 'Địa phương ({localTz})',
        resetTooltip: 'Đặt lại về múi giờ địa phương',
      },
      numberProperties: {
        name: 'Lưu ngày chỉ gồm số không có dấu ngoặc kép',
        desc: 'Nếu định dạng ngày của bạn chỉ gồm chữ số (như mốc thời gian unix), hãy ghi nó dưới dạng số thuần (updated: 1712930400) thay vì văn bản trong dấu ngoặc kép (updated: "1712930400"). Không có tác dụng khi định dạng của bạn chứa dấu gạch ngang hoặc dấu hai chấm.',
      },
    },
    behavior: {
      heading: 'Hành vi',
      autoUpdate: {
        name: 'Tự động cập nhật',
        desc: 'Tự động cập nhật ngày khi bạn chỉnh sửa ghi chú. Cũng có sẵn từ bảng lệnh.',
      },
      minSeconds: {
        name: 'Số giây tối thiểu giữa các lần cập nhật',
        desc: 'Tránh cập nhật ngày quá thường xuyên khi bạn đang gõ hoặc chuyển giữa các ghi chú.',
      },
      changeDetection: {
        name: 'Phát hiện thay đổi (băm nội dung)',
        descEnabled:
          'Ngày chỉnh sửa cuối chỉ được ghi khi nội dung ghi chú thực sự thay đổi - điều này ngăn các cập nhật sai từ plugin đồng bộ.',
        descDisabled:
          'Đã tắt - ngày chỉnh sửa cuối được ghi mỗi lần lưu, ngay cả khi không có gì thay đổi.',
      },
      hashTrackingMode: {
        name: 'Điều gì được tính là thay đổi',
        desc: 'Phần nào của ghi chú được tính là thay đổi. "Chỉ nội dung" - chỉnh sửa thuộc tính (thẻ, bí danh, v.v.) sẽ không cập nhật ngày. "Chỉ thuộc tính" - chỉnh sửa văn bản ghi chú sẽ không cập nhật ngày. "Cả hai" - bất kỳ chỉnh sửa nào cũng cập nhật ngày.',
        optionBody: 'Chỉ nội dung ghi chú (mặc định)',
        optionFrontmatter: 'Chỉ thuộc tính',
        optionBoth: 'Nội dung và thuộc tính',
        changedNotice:
          'Chế độ theo dõi đã thay đổi. Hãy xây dựng lại bộ đệm băm (trong các thao tác hàng loạt) để ngày luôn chính xác.',
      },
      excludeKeys: {
        name: 'Bỏ qua các thuộc tính này',
        desc: 'Chỉnh sửa các thuộc tính này sẽ không cập nhật ngày. Bạn có thể thêm nhiều thuộc tính cùng lúc, cách nhau bằng dấu phẩy. Các thuộc tính created, updated và viewed luôn được bỏ qua tự động.',
        placeholder: 'Tên thuộc tính như tags',
        addTooltip: 'Thêm thuộc tính',
        chipRemoveAriaLabel: 'Xóa {entry}',
      },
    },
    filterRules: {
      name: 'Tệp và thư mục cần bỏ qua',
      descIntro:
        'Chọn các tệp hoặc thư mục để không động đến (không tự động cập nhật ngày). ',
      descOnePerLine: 'Mỗi mẫu một dòng. Các dòng bắt đầu bằng ',
      descCommentsAre: ' là chú thích. Bắt đầu một dòng bằng ',
      descAddBack: ' để thêm lại một đường dẫn. ',
      descLastWins: 'Nếu có nhiều dòng khớp, dòng cuối cùng thắng.',
      advancedSyntaxLink: 'Cú pháp nâng cao (kiểu gitignore)',
      noRulesWarning:
        'Chưa đặt quy tắc nào - tất cả ghi chú đều được tự động cập nhật ngày.',
      placeholderExcludeFolder: '# Loại trừ một thư mục',
      placeholderExcludeByPattern: '# Loại trừ theo mẫu',
      placeholderReinclude: '# Thêm lại một tệp cụ thể',
      parseError: 'Dòng {lineNumber}: {message} - "{text}"',
      previewButton: 'Xem trước các tệp khớp',
      previewSummary: 'Theo dõi {tracked} ghi chú, bỏ qua {excluded} ghi chú',
      skippedFilesSummary: 'Tệp đã bỏ qua ({excluded})',
      skippedMore: '...và {count} tệp nữa',
      reference: {
        summary: 'Tham khảo cú pháp mẫu',
        sectionBasics: 'Cú pháp cơ bản',
        basicsCommentDesc: 'Các dòng bắt đầu bằng # bị bỏ qua',
        basicsBlankDesc: 'Các dòng trống bị bỏ qua',
        basicsExcludeDesc: 'Loại trừ - các tệp bên trong templates/ bị bỏ qua',
        basicsReincludeDesc: 'Thêm lại - thêm tiền tố ! để hủy loại trừ',
        basicsLastWinsDesc: 'Khi nhiều quy tắc khớp, quy tắc cuối cùng thắng',
        sectionExcludeFolder: 'Loại trừ một thư mục',
        excludeFolderAllFilesDesc: 'Tất cả tệp bên trong templates/',
        excludeFolderSameEffectDesc:
          'Cùng tác dụng (dấu gạch chéo cuối là tùy chọn)',
        excludeFolderNestedDesc: 'Thư mục lồng nhau',
        sectionReinclude: 'Thêm lại (hủy một loại trừ)',
        reincludeExcludeWholeDesc: 'Loại trừ toàn bộ thư mục',
        reincludeKeepDesc: 'Nhưng vẫn theo dõi tệp cụ thể này',
        sectionWildcards: 'Ký tự đại diện',
        wildcardStarDesc: 'Bất kỳ ký tự nào trừ /',
        wildcardDoubleStarDesc: 'Bất kỳ ký tự nào kể cả / (vượt qua thư mục)',
        wildcardQuestionDesc: 'Đúng một ký tự',
        sectionWildcardExamples: 'Ví dụ ký tự đại diện',
        wildcardExCanvasRootDesc:
          'Các tệp kết thúc bằng .canvas.md ở gốc kho lưu trữ',
        wildcardExCanvasAnyDesc:
          'Các tệp kết thúc bằng .canvas.md trong bất kỳ thư mục nào',
        wildcardExDailyDesc: 'Các tệp như daily/2024-01-01.md',
        wildcardExTwoCharDesc: 'Các tên tệp hai ký tự trong notes/',
        sectionSpecificFiles: 'Tệp cụ thể',
        specificFilesOneExactDesc: 'Một tệp chính xác',
        specificFilesRootDesc: 'Một tệp ở gốc kho lưu trữ',
        sectionPathsWithSpaces: 'Đường dẫn có khoảng trắng',
        pathsWithSpacesAsIsDesc: 'Chỉ cần viết đường dẫn như nó vốn có',
        pathsWithSpacesNoQuotesDesc: 'Không cần dấu ngoặc quanh khoảng trắng',
        sectionNonLatin: 'Ký tự không phải Latin',
        nonLatinCyrillicDesc: 'Tên thư mục bằng Kirin',
        nonLatinChineseDesc: 'Ký tự Trung Quốc',
        nonLatinFullPathDesc: 'Đường dẫn không phải Latin đầy đủ',
        sectionObsidianExamples: 'Ví dụ riêng cho Obsidian',
        obsidianTemplateFolderDesc: 'Thư mục mẫu',
        obsidianDailyFolderDesc: 'Thư mục ghi chú hàng ngày',
        obsidianAttachmentsDesc: 'Thư mục tệp đính kèm / phương tiện',
        obsidianCanvasDesc: 'Tất cả tệp canvas',
        obsidianExcalidrawDesc: 'Tất cả bản vẽ Excalidraw',
        obsidianInboxDesc: 'Thư mục hộp thư đến / ghi nháp',
        obsidianArchiveDesc: 'Ghi chú lưu trữ',
        sectionAllowlist:
          'Chế độ danh sách cho phép (chỉ theo dõi các thư mục nhất định)',
        allowlistExcludeEverythingDesc: 'Trước tiên, loại trừ tất cả',
        allowlistReincludeWantedDesc: 'Sau đó chỉ thêm lại thứ bạn muốn',
        allowlistReincludeAnotherDesc: 'Thêm lại một thư mục khác',
        emptyNote:
          'Khi trường này trống, tất cả ghi chú đều được tự động cập nhật ngày.',
      },
    },
    inversions: {
      heading: 'Ngày chỉnh sửa sớm hơn ngày tạo',
      strategy: {
        name: 'Cách sửa các ngày sai thứ tự',
        desc: 'Làm gì khi ngày chỉnh sửa cuối sớm hơn ngày tạo. Áp dụng cho các chỉnh sửa tự động, và đặt mặc định cho công cụ hàng loạt.',
        optionDisabled: 'Không sửa (chỉ phát hiện)',
        optionCreatedToUpdated: 'Đặt ngày tạo bằng ngày chỉnh sửa cuối',
        optionUpdatedToCreated: 'Đặt ngày chỉnh sửa cuối bằng ngày tạo',
        optionMaxAll: 'Đặt cả hai về ngày gần đây nhất',
      },
      tolerance: {
        name: 'Bỏ qua các khác biệt nhỏ (giây)',
        desc: 'Bỏ qua các ngày sai thứ tự khi khoảng cách nhỏ hơn giá trị này. Một giá trị nhỏ sẽ ẩn các khác biệt đồng hồ nhỏ.',
      },
    },
    advanced: {
      summary: 'Nâng cao',
      newFileDelay: {
        name: 'Độ trễ cho tệp mới',
        desc: 'Chờ bao nhiêu mili giây trước khi đóng dấu ngày lên một ghi chú vừa được tạo. Giúp tránh xung đột với các plugin mẫu. Đặt 0 để tắt.',
      },
      autoPopulateCache: {
        name: 'Tự động điền bộ đệm khi khởi động',
        desc: 'Khi plugin tải, xây dựng dữ liệu phát hiện thay đổi cho các ghi chú chưa có. Chạy ngầm.',
      },
      maxCacheEntries: {
        name: 'Số mục bộ đệm tối đa',
        desc: 'Khi bộ đệm vượt quá giới hạn này, các mục cũ không dùng nhất sẽ bị xóa. 0 = không giới hạn.',
      },
      postUpdateCommand: {
        name: 'Lệnh sau khi cập nhật',
        desc: 'Chạy một lệnh Obsidian sau khi cập nhật ngày. Để trống để tắt.',
        optionNone: 'Không có',
      },
    },
    bulk: {
      heading: 'Thao tác hàng loạt',
      populate: {
        name: 'Đặt ngày từ ngày của chính tệp',
        desc: 'Điền ngày tạo và ngày chỉnh sửa cuối từ ngày tạo và sửa đổi của chính mỗi tệp trên đĩa. Tuyệt vời cho lần thiết lập đầu tiên.',
        button: 'Điền ngày',
      },
      rename: {
        name: 'Đổi tên một thuộc tính',
        desc: 'Chuyển giá trị từ tên thuộc tính cũ sang tên mới trên tất cả ghi chú. Hữu ích sau khi đổi tên một thuộc tính ở trên.',
        button: 'Đổi tên thuộc tính',
      },
      reformat: {
        name: 'Định dạng lại các ngày hiện có',
        desc: 'Tìm các ngày được ghi ở định dạng cũ và ghi lại chúng theo định dạng hiện tại của bạn. Hữu ích sau khi đổi định dạng ngày ở trên.',
        button: 'Định dạng lại ngày',
      },
      findInversions: {
        name: 'Tìm các ngày sai thứ tự',
        desc: 'Quét các ghi chú của bạn và liệt kê những ghi chú có ngày chỉnh sửa cuối sớm hơn ngày tạo. Sau đó bạn có thể áp dụng cách sửa đã chọn ở trên.',
        button: 'Tìm các ngày sai thứ tự',
      },
      rebuildCache: {
        name: 'Xây dựng lại bộ đệm băm',
        desc: 'Tính lại dữ liệu phát hiện thay đổi (băm nội dung) cho tất cả ghi chú của bạn. Hữu ích sau khi đổi điều được tính là thay đổi ở trên.',
        button: 'Xây dựng lại bộ đệm',
      },
    },
  },
  modals: {
    populate: {
      configureTitle: 'Đặt ngày từ ngày của chính tệp',
      configureSubtitleLine1: 'Điền ngày tạo và ngày chỉnh sửa cuối',
      configureSubtitleLine2:
        'từ ngày tạo và sửa đổi của chính mỗi tệp trên đĩa.',
      modeName: 'Đặt những ngày nào',
      modeDesc: 'Chọn những ngày cần điền.',
      modeOptionBoth: 'Cả ngày tạo và ngày cập nhật',
      modeOptionCreated: 'Chỉ ngày tạo',
      modeOptionUpdated: 'Chỉ ngày cập nhật',
      overrideName: 'Các tệp đã có ngày',
      overrideDesc:
        'Chỉ điền các ngày còn thiếu, hoặc ghi đè các ngày hiện có.',
      overrideOptionFillMissing: 'Chỉ điền ngày thiếu (an toàn)',
      overrideOptionOverwriteAll: 'Ghi đè tất cả (thay thế ngày hiện có)',
      autoUpdateNoteTitle: 'Lưu ý về tự động cập nhật:',
      autoUpdateNoteBody:
        'Nếu tự động cập nhật đã hoạt động, ngày của chính tệp trên đĩa có thể đã phản ánh các chỉnh sửa của plugin, không phải ngày gốc. Để có kết quả tốt nhất, hãy dùng tính năng này trước khi bật tự động cập nhật hoặc ngay sau khi cài plugin.',
      warningTitleCreatedUnreliable:
        'Ngày tạo của tệp không đáng tin cậy trên một số nền tảng',
      warningTitlePlatformNote: 'Lưu ý về nền tảng',
      platformMacWin: 'macOS / Windows',
      platformMacWinNote: 'ngày tạo tệp thật',
      platformLinux: 'Linux',
      platformLinuxNote:
        'hệ thống báo cáo ngày muộn hơn, không phải ngày tạo thật',
      platformAndroid: 'Android',
      platformAndroidNote: 'tùy theo thiết bị, thường không đáng tin cậy',
      platformIos: 'iOS',
      platformIosNote: 'thường đáng tin cậy',
      platformReliable: 'Đáng tin cậy',
      platformUnreliable: 'KHÔNG ĐÁNG TIN CẬY',
      platformLineName: '{name}: {prefix}',
      platformYourPlatformSuffix: ' (nền tảng của bạn)',
      syncNoteLine1:
        'Kho lưu trữ được đồng bộ: ngày tệp có thể bị đặt lại bởi các dịch vụ đồng bộ',
      syncNoteLine2: '(Obsidian Sync, iCloud, Dropbox, Git).',
      syncNoteLine3: 'Ngày chỉnh sửa cuối thường đáng tin cậy hơn ngày tạo.',
      recommendation:
        'Khuyến nghị: xem lại kết quả sau khi chạy. Hãy sao lưu trước.',
      overwriteWarning:
        'Việc này sẽ thay thế các ngày hiện có trong ghi chú của bạn. Không thể hoàn tác. Hãy sao lưu trước.',
      noPropertyConfigured:
        'Chưa cấu hình tên thuộc tính cho: {missing}. Hãy kiểm tra cài đặt plugin.',
      previewTitle: 'Xem trước: đặt ngày',
      noFilesNeedUpdating:
        'Không có tệp nào cần cập nhật. Tất cả tệp đủ điều kiện đã có các ngày được yêu cầu.',
      previewOverwriteWarning:
        'Chế độ ghi đè: các ngày hiện có sẽ bị thay thế. Không thể hoàn tác. Hãy sao lưu trước.',
      settingDates: 'Đang đặt ngày…',
      stopped: 'Đã dừng.',
      doneWithErrorsSubtitle: 'Đã cập nhật {processed} tệp.',
      doneTitle: 'Xong! Đã cập nhật {processed} tệp.',
    },
    rename: {
      configureTitle: 'Đổi tên một thuộc tính',
      configureSubtitle:
        'Chuyển giá trị từ một tên thuộc tính sang tên khác trên tất cả ghi chú.',
      validationEnterOld: 'Nhập tên thuộc tính cũ để tiếp tục.',
      validationEnterNew: 'Nhập tên thuộc tính mới để tiếp tục.',
      validationMustDiffer: 'Tên thuộc tính cũ và mới phải khác nhau.',
      oldKeyName: 'Tên thuộc tính cũ',
      oldKeyDesc: 'Tên thuộc tính hiện đang dùng trong ghi chú của bạn.',
      oldKeyPlaceholder: 'Date_created',
      newKeyName: 'Tên thuộc tính mới',
      newKeyDesc: 'Tên thuộc tính mới để dùng.',
      newKeyPlaceholder: 'Created',
      deleteOldName: 'Xóa thuộc tính cũ sau khi đổi tên',
      deleteOldDesc:
        'Xóa thuộc tính cũ sau khi sao chép giá trị của nó sang thuộc tính mới.',
      namesCannotBeEmpty: 'Tên thuộc tính không thể để trống.',
      previewTitle: 'Xem trước: đổi tên thuộc tính',
      noNotesUseProperty: 'Không có ghi chú nào dùng thuộc tính "{oldKey}".',
      conflictWarning:
        '{conflicts} ghi chú đã có thuộc tính "{newKey}". Giá trị hiện có sẽ bị ghi đè.',
      columnArrowNew: '→ {newKey}',
      deleteWarning:
        'Thuộc tính cũ sẽ bị xóa sau khi sao chép. Không thể hoàn tác. Hãy sao lưu trước.',
      renamingProperty: 'Đang đổi tên thuộc tính…',
      renameStopped: 'Đã dừng đổi tên.',
      doneWithErrorsSubtitle: 'Đã cập nhật {processed} tệp.',
      doneTitle: 'Xong! Đã cập nhật {processed} tệp.',
    },
    reformat: {
      configureTitle: 'Chuẩn hóa định dạng ngày',
      configureSubtitle:
        'Phân tích các giá trị ngày hiện có và ghi lại chúng bằng định dạng hiện tại từ cài đặt.',
      invalidFormat: 'Định dạng không hợp lệ',
      targetFormatName: 'Định dạng đích',
      targetFormatDesc: '{currentFormat}',
      scopeName: 'Định dạng lại những trường nào',
      scopeDesc: 'Chọn những ngày cần chuẩn hóa.',
      scopeOptionAll: 'Tất cả ngày',
      scopeOptionCreated: 'Chỉ ngày tạo',
      scopeOptionUpdated: 'Chỉ ngày cập nhật',
      scopeOptionViewed: 'Chỉ ngày xem',
      autoDetectNote:
        'Các ngày được tự động nhận diện từ các định dạng phổ biến (ISO 8601, châu Âu, Mỹ, ngày dạng số) và ghi lại theo định dạng hiện tại của bạn.',
      noPropertyConfigured:
        'Chưa cấu hình tên thuộc tính cho: {missing}. Hãy kiểm tra cài đặt plugin.',
      previewTitle: 'Xem trước: chuẩn hóa ngày',
      noChangeAmbiguous:
        'Chưa có gì để chuyển đổi. {ambiguousCount} ngày có thể đọc theo hai cách và được giữ nguyên - hãy chọn thứ tự ngày/tháng ở trên để chuyển đổi chúng.',
      noChangeDefault:
        'Không có tệp nào cần định dạng lại. Tất cả ngày đã ở định dạng đích hoặc không thể phân tích.',
      errorWarningNoChange: '{errorCount} tệp có các ngày không thể phân tích.',
      errorWarningWillSkip:
        '{errorCount} tệp có các ngày không thể phân tích. Những tệp này sẽ bị bỏ qua.',
      checkNote:
        'Các dòng được đánh dấu [check] có thể đọc theo hai cách - hãy xác nhận ngày mới trông đúng.',
      rewriteWarning:
        'Việc này ghi lại các giá trị ngày hiện có tại chỗ. Không thể hoàn tác. Hãy sao lưu trước.',
      ambiguityName: 'Các ngày có thể đọc theo hai cách',
      ambiguityDesc:
        '{ambiguousCount} ngày có thể mang nghĩa ngày trước hoặc tháng trước (ví dụ 01/05/2024).{detectedHint}',
      detectedHintMonthFirst: ' Hệ thống của bạn đề xuất tháng trước.',
      detectedHintDayFirst: ' Hệ thống của bạn đề xuất ngày trước.',
      ambiguityOptionSkip: 'Giữ nguyên các ngày không rõ ràng',
      ambiguityOptionDmy: 'Ngày trước (01/05 = ngày 1, tháng 5)',
      ambiguityOptionMdy: 'Tháng trước (01/05 = tháng 1, ngày 5)',
      cellCouldNotRead: '{oldValue} (không thể đọc ngày)',
      cellConversion: '{oldValue} → {newValue}{check}',
      cellNewValue: '{newValue}{check}',
      cellCheckSuffix: ' [check]',
      reformattingDates: 'Đang định dạng lại ngày…',
      reformatStopped: 'Đã dừng định dạng lại.',
      doneWithErrorsSubtitle: 'Đã cập nhật {processed} tệp.',
      doneTitle: 'Xong! Đã cập nhật {processed} tệp.',
    },
    inversions: {
      scanningTitle: 'Đang tìm các ngày sai thứ tự…',
      foundTitle: 'Tìm thấy {count} ghi chú có ngày sai thứ tự',
      foundSubtitle:
        'Các ghi chú này có ngày chỉnh sửa cuối sớm hơn ngày tạo. Chọn cách sửa chúng bên dưới, hoặc đóng lại để xem lại thủ công.',
      noneFound: 'Không tìm thấy ngày sai thứ tự.',
      strategyName: 'Cách sửa',
      strategyDesc: 'Chọn cách sửa các ngày.',
      strategyOptionDisabled: 'Không sửa (chỉ xem lại)',
      strategyOptionCreatedToUpdated: 'Đặt ngày tạo bằng ngày chỉnh sửa cuối',
      strategyOptionUpdatedToCreated: 'Đặt ngày chỉnh sửa cuối bằng ngày tạo',
      strategyOptionMaxAll: 'Đặt cả hai về ngày gần đây nhất',
      toleranceNote:
        'Bỏ qua các khác biệt dưới {tolerance} giây (đặt trong cài đặt).',
      columnDelta: 'Δ',
      fixWarning:
        'Việc này sẽ sửa đổi {count} ghi chú. Không thể hoàn tác. Hãy sao lưu trước.',
      fixingDates: 'Đang sửa ngày…',
      stopped: 'Đã dừng thao tác hàng loạt.',
      fixedNotice: 'Đã sửa {processed} ghi chú.',
      doneWithErrorsSubtitle: 'Đã sửa {processed} ghi chú.',
      doneTitle: 'Xong! Bạn có thể đóng cửa sổ này an toàn.',
    },
    rebuildCache: {
      loadingFiles: 'Đang tải tệp…',
      confirmTitle: 'Xây dựng lại dữ liệu phát hiện thay đổi cho {count} tệp',
      confirmSubtitle:
        'Việc này tính lại dấu vân tay nội dung (băm nội dung) dùng để phát hiện các chỉnh sửa thật. Nó không thay đổi ghi chú của bạn.',
      rebuilding: 'Đang xây dựng lại…',
      stopped: 'Đã dừng thao tác hàng loạt.',
      doneWithErrorsSubtitle: 'Đã xử lý {processed} tệp.',
      doneTitle: 'Xong! Bạn có thể đóng cửa sổ này an toàn.',
    },
  },
};
