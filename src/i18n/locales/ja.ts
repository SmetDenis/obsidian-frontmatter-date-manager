// src/i18n/locales/ja.ts
// Japanese. Machine-generated baseline. Improvements welcome - see CONTRIBUTING.md.
// Keep {token} placeholders byte-identical to English. No em/en dashes.
// Pure-identifier / proper-noun / symbol leaves (property-key placeholders, OS
// names, the Delta glyph, '{currentFormat}', '{name}: {prefix}') are intentionally
// omitted so they fall back to the English source unchanged.
import type { Strings, DeepPartial } from '../index';

export const STRINGS_JA: DeepPartial<Strings> = {
  common: {
    run: '実行',
    back: '戻る',
    cancel: 'キャンセル',
    close: '閉じる',
    file: 'ファイル',
    created: '作成日',
    updated: '更新日',
    viewed: '閲覧日',
    createdKeyed: '作成日 ({key})',
    updatedKeyed: '更新日 ({key})',
    viewedKeyed: '閲覧日 ({key})',
    scanAndPreview: 'スキャンしてプレビュー',
    scanningFiles: 'ファイルをスキャン中…',
    doneWithErrors: '完了しました。エラー: {errors} 件。',
  },

  commands: {
    updateCurrentFile: '現在のファイルの日付を更新',
    toggleAutoUpdate: '自動更新のオン/オフを切り替え',
    pauseAutoUpdate: '自動更新を5分間停止',
  },

  statusBar: {
    paused: '停止中',
    pausedWithMinutes: '停止中 ({remaining}分)',
  },

  notices: {
    inversionDetectedAndFixed:
      'Frontmatter Date Manager: 順序が逆の日付を検出して修正しました。設定の「順序が逆の日付を検索」で確認してください。',
    timestampsUpdated: '日付を更新しました。',
    fileIgnored: 'このファイルはプラグインの設定により除外されています。',
    failedToUpdateWithReason: '日付の更新に失敗しました: {reason}',
    failedToUpdate: '日付の更新に失敗しました。',
    autoUpdateEnabled: '自動更新を有効にしました',
    autoUpdateDisabled: '自動更新を無効にしました',
    autoUpdatePausedForMinutes:
      '自動更新を{minutes}分間停止しました。自動的に再開します。',
    autoUpdateResumed: '自動更新を再開しました。',
    malformedFrontmatter:
      'Frontmatter Date Manager: 失敗しました\nこのファイルのプロパティが不正です: {filePath}\n\n{message}',
  },

  bulkChrome: {
    summaryWillChange: '変更されるファイル: {changed} 件',
    summarySkipped: 'スキップ: {skipped} 件',
    summaryErrors: 'エラー: {errors} 件',
    pagerPrev: '前へ',
    pagerNext: '次へ',
    pageInfo: '{total} ページ中 {current} ページ',
    downloadFullPreview: '完全なプレビューをダウンロード',
    downloadSuccess:
      '{count} 行をダウンロードしました。ファイル {filename} がダウンロードフォルダにあります。',
    downloadFailed: 'プレビューファイルをダウンロードできませんでした。',
    failureColumnError: 'エラー',
    progressCounter: '{count}/{max}',
  },

  settings: {
    description: {
      syncIntro:
        '同期サービスやバックアップツール、その他のプラグインは、内容を変えずにファイルを書き換えることがよくあります。これによりディスク上のファイルの日付がリセットされ、実際にいつ最後にノートを編集したのか分からなくなってしまいます。',
      pluginIntro:
        'このプラグインは作成日と最終編集日を各ノートのプロパティに直接書き込み、内容を比較して実際の変更を検出します。そのため日付は同期によるものではなく、実際の編集を反映します。',
    },
    dates: {
      heading: '追跡する日付',
      enableNoneHint:
        'プラグインを設定するには、上の日付を少なくとも1つ有効にしてください。',
      created: {
        enableName: '作成日を追跡',
        enableDesc: 'まだ作成日のないノートに作成日を追加します。',
        propertyName: '作成日のプロパティ',
        propertyDesc: '作成日を保存するプロパティ名。',
      },
      updated: {
        enableName: '最終編集日を追跡',
        enableDesc: 'ノートを編集するたびにこの日付を更新します。',
        propertyName: '更新日のプロパティ',
        propertyDesc: '最終編集日を保存するプロパティ名。',
      },
      updateCount: {
        enableName: '編集回数をカウント',
        enableDesc:
          'ノートを編集するたびに1ずつ増える数値プロパティを追加します。正確な履歴ではなく、おおよその活動量の目安です。',
        propertyName: '編集回数のプロパティ',
        propertyDesc: '編集回数を保存するプロパティ名。',
      },
      viewed: {
        enableName: '最終閲覧日を追跡',
        enableDesc: 'ノートを開くたびに日付を保存します。',
        propertyName: '閲覧日のプロパティ',
        propertyDesc: '最終閲覧日を保存するプロパティ名。',
      },
    },
    formatting: {
      heading: '日付の書式',
      dateFormat: {
        name: '日付の書式',
        desc: '日付と時刻をノートにどのように書き込むか。',
        formatCodesLink: '使用できる書式コードを見る',
        currentlyPreview: '現在: {preview}',
        invalidWithHint: '無効な書式です。{hint}',
        invalidFormat: '無効な日付書式の文字列です。',
        obsidianDefault:
          "Obsidian の既定: yyyy-MM-dd'T'HH:mm:ss (日付と時刻、ローカルのタイムゾーン)",
      },
      timezone: {
        name: 'タイムゾーン',
        desc: '日付を書き込むときに使用するタイムゾーン。空欄にするとデバイスのタイムゾーン ({localTz}) を使用します。',
        placeholder: 'ローカル ({localTz})',
        resetTooltip: 'ローカルのタイムゾーンにリセット',
      },
      numberProperties: {
        name: '数字のみの日付を引用符なしで保存',
        desc: '日付の書式が数字のみの場合 (unix タイムスタンプなど)、引用符で囲んだテキスト (updated: "1712930400") ではなく、そのままの数値 (updated: 1712930400) として書き込みます。書式にハイフンやコロンが含まれる場合は影響しません。',
      },
    },
    behavior: {
      heading: '動作',
      autoUpdate: {
        name: '自動更新',
        desc: 'ノートを編集したときに自動的に日付を更新します。コマンドパレットからも利用できます。',
      },
      minSeconds: {
        name: '更新間隔の最小秒数',
        desc: '入力中やノートを切り替えている間に、日付が頻繁に更新されすぎるのを防ぎます。',
      },
      changeDetection: {
        name: '変更検出 (内容のハッシュ化)',
        descEnabled:
          'ノートの内容が実際に変わったときだけ最終編集日が書き込まれます。これにより同期プラグインによる誤った更新を防ぎます。',
        descDisabled:
          '無効です。何も変わっていなくても、保存のたびに最終編集日が書き込まれます。',
      },
      hashTrackingMode: {
        name: '何を変更とみなすか',
        desc: 'ノートのどの部分を変更とみなすか。「本文のみ」: プロパティ (タグ、エイリアスなど) の編集では日付は更新されません。「プロパティのみ」: ノート本文の編集では日付は更新されません。「両方」: あらゆる編集で日付が更新されます。',
        optionBody: 'ノート本文のみ (既定)',
        optionFrontmatter: 'プロパティのみ',
        optionBoth: '本文とプロパティ',
        changedNotice:
          '追跡モードを変更しました。日付を正確に保つため、ハッシュキャッシュを (一括操作で) 再構築してください。',
      },
      excludeKeys: {
        name: 'これらのプロパティを無視',
        desc: 'これらのプロパティを編集しても日付は更新されません。カンマで区切って一度に複数追加できます。created、updated、viewed のプロパティは常に自動的に無視されます。',
        placeholder: 'プロパティ名 (例: tags)',
        addTooltip: 'プロパティを追加',
        chipRemoveAriaLabel: '{entry} を削除',
      },
    },
    filterRules: {
      name: 'スキップするファイルとフォルダ',
      descIntro:
        'そのままにしておく (日付を自動更新しない) ファイルやフォルダを選びます。',
      descOnePerLine: '1行につき1つのパターン。先頭が ',
      descCommentsAre: ' の行はコメントです。行の先頭に ',
      descAddBack: ' を付けるとパスを戻せます。',
      descLastWins: '複数の行が一致した場合は、最後の行が優先されます。',
      advancedSyntaxLink: '高度な構文 (gitignore 形式)',
      noRulesWarning:
        'ルールが設定されていません。すべてのノートが日付の自動更新の対象になります。',
      placeholderExcludeFolder: '# フォルダを除外',
      placeholderExcludeByPattern: '# パターンで除外',
      placeholderReinclude: '# 特定のファイルを戻す',
      parseError: '{lineNumber} 行目: {message} - "{text}"',
      previewButton: '一致するファイルをプレビュー',
      previewSummary: '追跡対象 {tracked} 件、スキップ {excluded} 件',
      skippedFilesSummary: 'スキップされたファイル ({excluded})',
      skippedMore: '...他 {count} 件',
      reference: {
        summary: 'パターン構文リファレンス',
        sectionBasics: '構文の基本',
        basicsCommentDesc: '# で始まる行は無視されます',
        basicsBlankDesc: '空行は無視されます',
        basicsExcludeDesc: '除外 - templates/ 内のファイルはスキップされます',
        basicsReincludeDesc: '再追加 - ! を前に付けると除外を取り消します',
        basicsLastWinsDesc:
          '複数のルールが一致した場合は最後のものが優先されます',
        sectionExcludeFolder: 'フォルダを除外',
        excludeFolderAllFilesDesc: 'templates/ 内のすべてのファイル',
        excludeFolderSameEffectDesc: '同じ効果 (末尾のスラッシュは任意)',
        excludeFolderNestedDesc: 'ネストされたフォルダ',
        sectionReinclude: '再追加 (除外の取り消し)',
        reincludeExcludeWholeDesc: 'フォルダ全体を除外',
        reincludeKeepDesc: 'ただしこの特定のファイルは追跡し続ける',
        sectionWildcards: 'ワイルドカード',
        wildcardStarDesc: '/ 以外の任意の文字',
        wildcardDoubleStarDesc: '/ を含む任意の文字 (フォルダをまたぐ)',
        wildcardQuestionDesc: 'ちょうど1文字',
        sectionWildcardExamples: 'ワイルドカードの例',
        wildcardExCanvasRootDesc:
          '保管庫のルートにある .canvas.md で終わるファイル',
        wildcardExCanvasAnyDesc:
          '任意のフォルダにある .canvas.md で終わるファイル',
        wildcardExDailyDesc: 'daily/2024-01-01.md のようなファイル',
        wildcardExTwoCharDesc: 'notes/ 内の2文字のファイル名',
        sectionSpecificFiles: '特定のファイル',
        specificFilesOneExactDesc: '完全一致する1つのファイル',
        specificFilesRootDesc: '保管庫のルートにあるファイル',
        sectionPathsWithSpaces: 'スペースを含むパス',
        pathsWithSpacesAsIsDesc: 'パスをそのまま書くだけ',
        pathsWithSpacesNoQuotesDesc: 'スペースを引用符で囲む必要はありません',
        sectionNonLatin: '非ラテン文字',
        nonLatinCyrillicDesc: 'キリル文字のフォルダ名',
        nonLatinChineseDesc: '中国語の文字',
        nonLatinFullPathDesc: '非ラテン文字の完全なパス',
        sectionObsidianExamples: 'Obsidian 固有の例',
        obsidianTemplateFolderDesc: 'テンプレートフォルダ',
        obsidianDailyFolderDesc: 'デイリーノートのフォルダ',
        obsidianAttachmentsDesc: '添付ファイル / メディアのフォルダ',
        obsidianCanvasDesc: 'すべてのキャンバスファイル',
        obsidianExcalidrawDesc: 'すべての Excalidraw の図',
        obsidianInboxDesc: '受信トレイ / 下書きのフォルダ',
        obsidianArchiveDesc: 'アーカイブされたノート',
        sectionAllowlist: '許可リストモード (特定のフォルダのみ追跡)',
        allowlistExcludeEverythingDesc: 'まずすべてを除外',
        allowlistReincludeWantedDesc: '次に必要なものだけを戻す',
        allowlistReincludeAnotherDesc: 'もう1つのフォルダを戻す',
        emptyNote:
          'このフィールドが空のときは、すべてのノートが日付の自動更新の対象になります。',
      },
    },
    inversions: {
      heading: '更新日が作成日より前の日付',
      strategy: {
        name: '順序が逆の日付の修正方法',
        desc: '最終編集日が作成日より前の場合にどうするか。自動編集に適用され、一括ツールの既定値にもなります。',
        optionDisabled: '修正しない (検出のみ)',
        optionCreatedToUpdated: '作成日を最終編集日に合わせる',
        optionUpdatedToCreated: '最終編集日を作成日に合わせる',
        optionMaxAll: '両方を最も新しい日付に設定',
      },
      tolerance: {
        name: 'わずかな差を無視 (秒)',
        desc: '差がこの値より小さいときは、順序が逆の日付を無視します。小さな値にすると、わずかな時計のずれが隠れます。',
      },
    },
    advanced: {
      summary: '詳細設定',
      newFileDelay: {
        name: '新規ファイルの遅延',
        desc: '新しく作成したノートに日付を書き込むまで、この値 (ミリ秒) だけ待ちます。テンプレートプラグインとの競合を避けるのに役立ちます。0 にすると無効になります。',
      },
      autoPopulateCache: {
        name: '起動時にキャッシュを自動生成',
        desc: 'プラグインの読み込み時に、まだ変更検出データのないノートのデータを作成します。バックグラウンドで実行されます。',
      },
      maxCacheEntries: {
        name: 'キャッシュの最大エントリ数',
        desc: 'キャッシュがこの上限を超えると、最も古い未使用のエントリが削除されます。0 = 無制限。',
      },
      postUpdateCommand: {
        name: '更新後のコマンド',
        desc: '日付の更新後に Obsidian のコマンドを実行します。空欄にすると無効になります。',
        optionNone: 'なし',
      },
    },
    bulk: {
      heading: '一括操作',
      populate: {
        name: 'ファイル自身の日付から設定',
        desc: 'ディスク上の各ファイル自身の作成日時と変更日時から、作成日と最終編集日を埋めます。初回設定に最適です。',
        button: '日付を埋める',
      },
      rename: {
        name: 'プロパティの名前を変更',
        desc: 'すべてのノートで、古いプロパティ名の値を新しい名前へ移します。上でプロパティ名を変更したあとに便利です。',
        button: 'プロパティの名前を変更',
      },
      reformat: {
        name: '既存の日付を再フォーマット',
        desc: '古い書式で書かれた日付を見つけて、現在の書式で書き直します。上で日付の書式を変更したあとに便利です。',
        button: '日付を再フォーマット',
      },
      findInversions: {
        name: '順序が逆の日付を検索',
        desc: 'ノートをスキャンし、最終編集日が作成日より前のものを一覧表示します。その後、上で選んだ修正を適用できます。',
        button: '順序が逆の日付を検索',
      },
      rebuildCache: {
        name: 'ハッシュキャッシュを再構築',
        desc: 'すべてのノートの変更検出データ (内容のハッシュ) を再計算します。上で何を変更とみなすかを変更したあとに便利です。',
        button: 'キャッシュを再構築',
      },
    },
  },

  modals: {
    populate: {
      configureTitle: 'ファイル自身の日付から設定',
      configureSubtitleLine1: '作成日と最終編集日を埋めます',
      configureSubtitleLine2:
        'ディスク上の各ファイル自身の作成日時と変更日時から。',
      modeName: 'どの日付を設定するか',
      modeDesc: '埋める日付を選んでください。',
      modeOptionBoth: '作成日と更新日の両方',
      modeOptionCreated: '作成日のみ',
      modeOptionUpdated: '更新日のみ',
      overrideName: '既に日付があるファイル',
      overrideDesc:
        '不足している日付だけを埋めるか、既存の日付を上書きします。',
      overrideOptionFillMissing: '不足分のみ埋める (安全)',
      overrideOptionOverwriteAll: 'すべて上書き (既存を置き換え)',
      autoUpdateNoteTitle: '自動更新についての注意:',
      autoUpdateNoteBody:
        '自動更新が有効だった場合、ディスク上のファイル自身の日付は、元の日付ではなくプラグイン自身の編集を既に反映していることがあります。最良の結果を得るには、自動更新を有効にする前か、プラグインのインストール直後にこの機能を使ってください。',
      warningTitleCreatedUnreliable:
        '一部のプラットフォームではファイルの作成日は信頼できません',
      warningTitlePlatformNote: 'プラットフォームに関する注意',
      platformMacWinNote: '本当のファイル作成日',
      platformLinuxNote:
        'システムは本当の作成日ではなく、より後の日付を報告します',
      platformAndroidNote: 'デバイスに依存し、信頼できないことが多い',
      platformIosNote: '通常は信頼できる',
      platformReliable: '信頼できる',
      platformUnreliable: '信頼できない',
      platformYourPlatformSuffix: ' (お使いのプラットフォーム)',
      syncNoteLine1:
        '同期される保管庫: ファイルの日付は同期サービスによってリセットされることがあります',
      syncNoteLine3: '最終編集日は通常、作成日より信頼できます。',
      recommendation:
        '推奨: 実行後に結果を確認してください。先にバックアップを取ってください。',
      overwriteWarning:
        'これはノート内の既存の日付を置き換えます。元に戻せません。先にバックアップを取ってください。',
      noPropertyConfigured:
        '{missing} のプロパティ名が設定されていません。プラグインの設定を確認してください。',
      previewTitle: 'プレビュー: 日付を設定',
      noFilesNeedUpdating:
        '更新が必要なファイルはありません。対象のファイルはすべて既に指定の日付を持っています。',
      previewOverwriteWarning:
        '上書きモード: 既存の日付が置き換えられます。元に戻せません。先にバックアップを取ってください。',
      settingDates: '日付を設定中…',
      stopped: '停止しました。',
      doneWithErrorsSubtitle: '更新したファイル: {processed} 件。',
      doneTitle: '完了しました。更新したファイル: {processed} 件。',
    },
    rename: {
      configureTitle: 'プロパティの名前を変更',
      configureSubtitle:
        'すべてのノートで、あるプロパティ名の値を別の名前へ移します。',
      validationEnterOld: '続行するには古いプロパティ名を入力してください。',
      validationEnterNew: '続行するには新しいプロパティ名を入力してください。',
      validationMustDiffer:
        '古いプロパティ名と新しいプロパティ名は異なる必要があります。',
      oldKeyName: '古いプロパティ名',
      oldKeyDesc: '現在ノートで使われているプロパティ名。',
      newKeyName: '新しいプロパティ名',
      newKeyDesc: '使用する新しいプロパティ名。',
      deleteOldName: '名前変更後に古いプロパティを削除',
      deleteOldDesc:
        '値を新しいプロパティにコピーしたあと、古いプロパティを削除します。',
      namesCannotBeEmpty: 'プロパティ名は空にできません。',
      previewTitle: 'プレビュー: プロパティの名前変更',
      noNotesUseProperty:
        'プロパティ "{oldKey}" を使っているノートはありません。',
      conflictWarning:
        '{conflicts} 件のノートには既にプロパティ "{newKey}" があります。既存の値は上書きされます。',
      columnArrowNew: '→ {newKey}',
      deleteWarning:
        'コピー後に古いプロパティは削除されます。元に戻せません。先にバックアップを取ってください。',
      renamingProperty: 'プロパティの名前を変更中…',
      renameStopped: '名前変更を停止しました。',
      doneWithErrorsSubtitle: '更新したファイル: {processed} 件。',
      doneTitle: '完了しました。更新したファイル: {processed} 件。',
    },
    reformat: {
      configureTitle: '日付の書式を統一',
      configureSubtitle:
        '既存の日付の値を解釈し、設定の現在の書式で書き直します。',
      invalidFormat: '無効な書式',
      targetFormatName: '対象の書式',
      scopeName: 'どのフィールドを再フォーマットするか',
      scopeDesc: '統一する日付を選んでください。',
      scopeOptionAll: 'すべての日付',
      scopeOptionCreated: '作成日のみ',
      scopeOptionUpdated: '更新日のみ',
      scopeOptionViewed: '閲覧日のみ',
      autoDetectNote:
        '日付は一般的な書式 (ISO 8601、ヨーロッパ式、アメリカ式、数値の日付) から自動的に判別され、現在の書式で書き直されます。',
      noPropertyConfigured:
        '{missing} のプロパティ名が設定されていません。プラグインの設定を確認してください。',
      previewTitle: 'プレビュー: 日付を統一',
      noChangeAmbiguous:
        'まだ変換するものはありません。{ambiguousCount} 件の日付は2通りに読み取れるため、変更されていません。上で日/月の順序を選ぶと変換できます。',
      noChangeDefault:
        '再フォーマットが必要なファイルはありません。すべての日付は既に対象の書式になっているか、解釈できませんでした。',
      errorWarningNoChange:
        '{errorCount} 件のファイルに、解釈できない日付があります。',
      errorWarningWillSkip:
        '{errorCount} 件のファイルに、解釈できない日付があります。これらはスキップされます。',
      checkNote:
        '[check] と付いた行は2通りに読み取れます。新しい日付が正しいか確認してください。',
      rewriteWarning:
        'これは既存の日付の値をその場で書き直します。元に戻せません。先にバックアップを取ってください。',
      ambiguityName: '2通りに読み取れる日付',
      ambiguityDesc:
        '{ambiguousCount} 件の日付は、日が先か月が先かのどちらにも取れます (例: 01/05/2024)。{detectedHint}',
      detectedHintMonthFirst: ' お使いのシステムは月が先を提案しています。',
      detectedHintDayFirst: ' お使いのシステムは日が先を提案しています。',
      ambiguityOptionSkip: 'あいまいな日付はそのままにする',
      ambiguityOptionDmy: '日が先 (01/05 = 1日、5月)',
      ambiguityOptionMdy: '月が先 (01/05 = 1月、5日)',
      cellCouldNotRead: '{oldValue} (日付を読み取れませんでした)',
      cellConversion: '{oldValue} → {newValue}{check}',
      cellNewValue: '{newValue}{check}',
      cellCheckSuffix: ' [check]',
      reformattingDates: '日付を再フォーマット中…',
      reformatStopped: '再フォーマットを停止しました。',
      doneWithErrorsSubtitle: '更新したファイル: {processed} 件。',
      doneTitle: '完了しました。更新したファイル: {processed} 件。',
    },
    inversions: {
      scanningTitle: '順序が逆の日付を検索中…',
      foundTitle: '順序が逆の日付を持つノートが {count} 件見つかりました',
      foundSubtitle:
        'これらのノートは最終編集日が作成日より前です。下で修正方法を選ぶか、閉じて手動で確認してください。',
      noneFound: '順序が逆の日付は見つかりませんでした。',
      strategyName: '修正方法',
      strategyDesc: '日付の修正方法を選んでください。',
      strategyOptionDisabled: '修正しない (確認のみ)',
      strategyOptionCreatedToUpdated: '作成日を最終編集日に合わせる',
      strategyOptionUpdatedToCreated: '最終編集日を作成日に合わせる',
      strategyOptionMaxAll: '両方を最も新しい日付に設定',
      toleranceNote: '{tolerance} 秒未満の差は無視します (設定で指定)。',
      fixWarning:
        'これは {count} 件のノートを変更します。元に戻せません。先にバックアップを取ってください。',
      fixingDates: '日付を修正中…',
      stopped: '一括操作を停止しました。',
      fixedNotice: '修正したノート: {processed} 件。',
      doneWithErrorsSubtitle: '修正したノート: {processed} 件。',
      doneTitle: '完了しました。このウィンドウは閉じても問題ありません。',
    },
    rebuildCache: {
      loadingFiles: 'ファイルを読み込み中…',
      confirmTitle: '{count} 件のファイルの変更検出データを再構築',
      confirmSubtitle:
        'これは、実際の編集を検出するために使う内容の指紋 (内容のハッシュ) を再計算します。ノートは変更されません。',
      rebuilding: '再構築中…',
      stopped: '一括操作を停止しました。',
      doneWithErrorsSubtitle: '処理したファイル: {processed} 件。',
      doneTitle: '完了しました。このウィンドウは閉じても問題ありません。',
    },
  },
};
