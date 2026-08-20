// src/i18n/locales/en.ts
// English - source of truth. type Strings = typeof STRINGS_EN (see ../index).
// Do NOT add `as const`: leaves must infer as `string` so translations are assignable.
export const STRINGS_EN = {
  // Generic atoms reused across surfaces (DRY).
  common: {
    run: 'Run',
    back: 'Back',
    cancel: 'Cancel',
    close: 'Close',
    file: 'File',
    created: 'Created',
    updated: 'Updated',
    viewed: 'Viewed',
    createdKeyed: 'Created ({key})',
    updatedKeyed: 'Updated ({key})',
    viewedKeyed: 'Viewed ({key})',
    scanAndPreview: 'Scan & preview',
    scanningFiles: 'Scanning files…',
    doneWithErrors: 'Done with {errors} error(s).',
  },

  commands: {
    updateCurrentFile: 'Update timestamps for current file',
    toggleAutoUpdate: 'Toggle auto-update on/off',
    pauseAutoUpdate: 'Pause auto-update for 5 minutes',
  },

  statusBar: {
    paused: 'Paused',
    pausedWithMinutes: 'Paused ({remaining}m)',
  },

  notices: {
    inversionDetectedAndFixed:
      'Frontmatter Date Manager: out-of-order dates were detected and fixed. Use "Find out-of-order dates" in settings to review.',
    timestampsUpdated: 'Timestamps updated.',
    timestampsAlreadyCurrent: 'Timestamps are already up to date.',
    timestampsUpdateScheduled: 'Timestamps will update shortly.',
    ignoredExcalidraw:
      "Excalidraw drawings are excluded. Turn on 'Include Excalidraw drawings' in the plugin settings to add dates to them.",
    ignoredByFilterRule:
      "This file is excluded by a rule in 'Files and folders to skip'.",
    ignoredCanvas: 'Canvas files are not supported.',
    ignoredEmpty: 'This file is empty, so there is nothing to date.',
    ignoredUnchanged: 'No content change detected since the last update.',
    ignoredNoDateKeys:
      'No date property names are configured in the plugin settings.',
    ignoredInvalidFileTimes:
      "The file's creation or modification time could not be read.",
    ignoredNotMarkdown: 'Only Markdown notes get date properties.',
    excalidrawHasUnsavedChanges:
      'The drawing has unsaved changes - dates will update after Excalidraw saves it.',
    failedToUpdateWithReason: 'Failed to update timestamps: {reason}',
    failedToUpdate: 'Failed to update timestamps.',
    autoUpdateEnabled: 'Auto-update enabled',
    autoUpdateDisabled: 'Auto-update disabled',
    autoUpdatePausedForMinutes:
      'Auto-update paused for {minutes} minutes. Will resume automatically.',
    autoUpdateResumed: 'Auto-update resumed.',
    malformedFrontmatter:
      'Frontmatter Date Manager failed\nMalformed frontmatter on this file: {filePath}\n\n{message}',
  },

  bulkChrome: {
    summaryWillChange: '{changed} file(s) will change',
    summarySkipped: '{skipped} skipped',
    summaryErrors: '{errors} error(s)',
    pagerPrev: 'Prev',
    pagerNext: 'Next',
    pageInfo: 'Page {current} of {total}',
    downloadFullPreview: 'Download full preview',
    downloadSuccess:
      'Downloaded {count} row(s) as {filename} to your downloads folder.',
    downloadFailed: 'Could not download the preview file.',
    failureColumnError: 'Error',
    skippedColumnReason: 'Reason',
    skippedTableIntro: '{count} note(s) were skipped and left unchanged:',
    skippedUnsavedChanges:
      'The note has unsaved changes in an open editor. Save or close it, then run a new preview.',
    skippedExcalidrawUnsaved:
      'The Excalidraw drawing has unsaved changes or is busy saving. Save or close it, then run a new preview.',
    progressCounter: '{count}/{max}',
  },

  settings: {
    validation: {
      propertyNameRequired: 'Enter a property name.',
      counterNameCollision:
        'This name is already used by another property above.',
    },
    description: {
      syncIntro:
        "Sync services, backup tools, and other plugins often rewrite files without changing their content - which resets the file's dates on disk. That makes it impossible to tell when you actually last edited a note.",
      pluginIntro:
        "This plugin writes created and last-edited dates straight into each note's properties, and detects real changes by comparing content, so your dates reflect actual edits - not sync artifacts.",
    },
    dates: {
      enableNoneHint: 'Turn on at least one date above to set up the plugin.',
      created: {
        enableName: 'Track creation date',
        enableDesc: "Add a creation date to notes that don't have one yet.",
        propertyName: 'Created property',
        propertyDesc: 'Property name where the creation date is saved.',
        propertyPlaceholder: 'Created',
      },
      updated: {
        enableName: 'Track last-edited date',
        enableDesc: 'Update this date whenever you edit the note.',
        propertyName: 'Updated property',
        propertyDesc: 'Property name where the last-edited date is saved.',
        propertyPlaceholder: 'Updated',
      },
      updateCount: {
        enableName: 'Count edits',
        enableDesc:
          'Add a number property that goes up by one each time you edit a note. An approximate activity count, not an exact history.',
        propertyName: 'Edit count property',
        propertyDesc: 'Property name where the edit count is saved.',
      },
      viewed: {
        enableName: 'Track last-opened date',
        enableDesc: 'Save the date each time you open the note.',
        propertyName: 'Viewed property',
        propertyDesc: 'Property name where the last-opened date is saved.',
        propertyPlaceholder: 'Viewed',
      },
    },
    formatting: {
      heading: 'Date formatting',
      dateFormat: {
        name: 'Date format',
        desc: 'How dates and times are written into your notes.',
        formatCodesLink: 'See available format codes',
        currentlyPreview: 'Currently: {preview}',
        invalidWithHint: 'Invalid format. {hint}',
        invalidFormat: 'Invalid date format string.',
        obsidianDefault:
          "Obsidian default: yyyy-MM-dd'T'HH:mm:ss (date and time, local timezone)",
      },
      timezone: {
        name: 'Timezone',
        desc: "Timezone used when writing dates. Leave blank to use your device's timezone ({localTz}).",
        placeholder: 'Local ({localTz})',
        resetTooltip: 'Reset to local timezone',
        invalidTimezone: 'Unknown timezone name.',
      },
      numberProperties: {
        name: 'Save number-only dates without quotes',
        desc: 'If your date format is only digits (like a unix timestamp), write it as a plain number (updated: 1712930400) instead of text in quotes (updated: "1712930400"). No effect when your format includes dashes or colons.',
      },
    },
    behavior: {
      heading: 'Behavior',
      autoUpdate: {
        name: 'Auto-update',
        desc: 'Automatically update dates when you edit a note. Also available from the command palette.',
      },
      minSeconds: {
        name: 'Minimum seconds between updates',
        desc: 'Avoids updating the date too often while you type or switch between notes.',
      },
      trackExcalidraw: {
        name: 'Include Excalidraw drawings',
        desc: 'Add dates to Excalidraw drawings like to any note. A drawing is never written to while it has unsaved changes, and the last-opened date is never written to drawings. Rename key and Reformat dates always cover every note.',
      },
      changeDetection: {
        name: 'Change detection (content hashing)',
        desc: "When enabled, the last-edited date is written only when the note's content actually changes - this prevents false updates from sync plugins.",
      },
      hashTrackingMode: {
        name: 'What counts as a change',
        desc: 'Which part of a note counts as a change. "Body only" - editing properties (tags, aliases, etc.) will not update the date. "Properties only" - editing the note text will not update the date. "Both" - any edit updates the date.',
        optionBody: 'Note body only (default)',
        optionFrontmatter: 'Properties only',
        optionBoth: 'Body and properties',
        changedNotice:
          'Tracking mode changed. Rebuild the hash cache (in bulk operations) so dates stay accurate.',
      },
      excludeKeys: {
        name: 'Ignore these properties',
        desc: 'Editing these properties will not update the date. You can add several at once, separated by commas. The created, updated, and viewed properties are always ignored automatically.',
        placeholder: 'Property name like tags',
        addTooltip: 'Add property',
        // Heading above the native list. The list cannot nest inside the
        // behavior group, so without it the entries render as an unlabeled
        // card with no visible tie to the input row above.
        listHeading: 'Ignored properties',
        emptyState: 'No ignored properties.',
      },
    },
    filterRules: {
      name: 'Files and folders to skip',
      pageDesc:
        'Choose files or folders that never get automatic date updates.',
      ruleCount: 'Rules: {count}',
      descIntro:
        'Choose files or folders to leave alone (no automatic date updates). ',
      descOnePerLine: 'One pattern per line. Lines starting with ',
      descCommentsAre: ' are comments. Start a line with ',
      descAddBack: ' to add a path back. ',
      descLastWins: 'If several lines match, the last one wins.',
      advancedSyntaxLink: 'Advanced syntax (gitignore-style)',
      noRulesWarning: 'No rules set - all notes get automatic date updates.',
      placeholderExcludeFolder: '# Exclude a folder',
      placeholderExcludeByPattern: '# Exclude by pattern',
      placeholderReinclude: '# Re-include a specific file',
      parseError: 'Line {lineNumber}: {message} - "{text}"',
      previewButton: 'Preview matching files',
      previewSummary: '{tracked} notes tracked, {excluded} notes skipped',
      skippedFilesSummary: 'Skipped files ({excluded})',
      skippedMore: '...and {count} more',
      reference: {
        summary: 'Pattern syntax reference',
        sectionBasics: 'Syntax basics',
        basicsCommentDesc: 'Lines starting with # are ignored',
        basicsBlankDesc: 'Blank lines are ignored',
        basicsExcludeDesc: 'Exclude - files inside templates/ are skipped',
        basicsReincludeDesc: 'Re-include - prefix with ! to undo exclusion',
        basicsLastWinsDesc: 'When multiple rules match, the last one wins',
        sectionExcludeFolder: 'Exclude a folder',
        excludeFolderAllFilesDesc: 'All files inside templates/',
        excludeFolderSameEffectDesc: 'Same effect (trailing slash is optional)',
        excludeFolderNestedDesc: 'Nested folder',
        sectionReinclude: 'Re-include (undo an exclusion)',
        reincludeExcludeWholeDesc: 'Exclude the whole folder',
        reincludeKeepDesc: 'But keep tracking this specific file',
        sectionWildcards: 'Wildcards',
        wildcardStarDesc: 'Any characters except /',
        wildcardDoubleStarDesc: 'Any characters including / (crosses folders)',
        wildcardQuestionDesc: 'Exactly one character',
        sectionWildcardExamples: 'Wildcard examples',
        wildcardExCanvasRootDesc: 'Files ending in .canvas.md at vault root',
        wildcardExCanvasAnyDesc: 'Files ending in .canvas.md in any folder',
        wildcardExDailyDesc: 'Files like daily/2024-01-01.md',
        wildcardExTwoCharDesc: 'Two-character filenames in notes/',
        sectionSpecificFiles: 'Specific files',
        specificFilesOneExactDesc: 'One exact file',
        specificFilesRootDesc: 'A file at vault root',
        sectionPathsWithSpaces: 'Paths with spaces',
        pathsWithSpacesAsIsDesc: 'Just write the path as-is',
        pathsWithSpacesNoQuotesDesc: 'No quotes needed around spaces',
        sectionNonLatin: 'Non-Latin characters',
        nonLatinCyrillicDesc: 'Cyrillic folder name',
        nonLatinChineseDesc: 'Chinese characters',
        nonLatinFullPathDesc: 'Full non-Latin path',
        sectionObsidianExamples: 'Obsidian-specific examples',
        obsidianTemplateFolderDesc: 'Template folder',
        obsidianDailyFolderDesc: 'Daily notes folder',
        obsidianAttachmentsDesc: 'Attachments / media folder',
        obsidianCanvasDesc: 'All canvas files',
        obsidianExcalidrawDesc:
          "Excalidraw drawings by file name (matches only the default suffix; the 'Include Excalidraw drawings' toggle is the reliable switch)",
        obsidianInboxDesc: 'Inbox / scratchpad folder',
        obsidianArchiveDesc: 'Archived notes',
        sectionAllowlist: 'Allowlist mode (track only specific folders)',
        allowlistExcludeEverythingDesc: 'First, exclude everything',
        allowlistReincludeWantedDesc: 'Then re-include only what you want',
        allowlistReincludeAnotherDesc: 'Re-include another folder',
        emptyNote:
          'When this field is empty, all notes get automatic date updates.',
      },
    },
    inversions: {
      heading: 'Modified-before-created dates',
      strategy: {
        name: 'How to fix out-of-order dates',
        desc: 'What to do when the last-edited date is earlier than the creation date. Applies to automatic edits, and sets the default for the bulk tool.',
        optionDisabled: "Don't fix (detect only)",
        optionCreatedToUpdated: 'Set creation date to the last-edited date',
        optionUpdatedToCreated: 'Set last-edited date to the creation date',
        optionMaxAll: 'Set both to the most recent date',
      },
      tolerance: {
        name: 'Ignore tiny differences (seconds)',
        desc: 'Ignore out-of-order dates when the gap is smaller than this. A small value hides tiny clock differences.',
      },
    },
    advanced: {
      pageName: 'Advanced',
      pageDesc: 'Timing, cache, and automation options.',
      newFileDelay: {
        name: 'New file delay',
        desc: 'Wait this many milliseconds before stamping a date on a newly created note. Helps avoid conflicts with template plugins. Set to 0 to turn off.',
      },
      autoPopulateCache: {
        name: 'Auto-populate cache on startup',
        desc: 'When the plugin loads, build change-detection data for notes that do not have it yet. Runs in the background.',
      },
      maxCacheEntries: {
        name: 'Maximum cache entries',
        desc: 'When the cache grows past this limit, the oldest unused entries are removed. 0 = no limit.',
      },
      postUpdateCommand: {
        name: 'Command after update',
        desc: 'Run an Obsidian command after a date is updated. Leave empty to turn off.',
        optionNone: 'None',
      },
    },
    bulk: {
      heading: 'Bulk operations',
      populate: {
        name: "Set dates from the file's own dates",
        desc: "Fill in the created and last-edited dates from each file's own creation and modification dates on disk. Great for first-time setup.",
        button: 'Fill in dates',
      },
      rename: {
        name: 'Rename a property',
        desc: 'Move values from an old property name to a new one across all notes. Useful after changing a property name above.',
        button: 'Rename property',
      },
      reformat: {
        name: 'Reformat existing dates',
        desc: 'Find dates written in an old format and rewrite them in your current format. Useful after changing the date format above.',
        button: 'Reformat dates',
      },
      findInversions: {
        name: 'Find out-of-order dates',
        desc: 'Scan your notes and list ones where the last-edited date is earlier than the creation date. You can then apply the fix you chose above.',
        button: 'Find out-of-order dates',
      },
      rebuildCache: {
        name: 'Rebuild hash cache',
        desc: 'Recompute change-detection data (content hashes) for all your notes. Useful after changing what counts as a change above.',
        button: 'Rebuild cache',
      },
    },
  },

  modals: {
    populate: {
      configureTitle: "Set dates from the file's own dates",
      configureSubtitleLine1: 'Fill in the created and last-edited dates',
      configureSubtitleLine2:
        "from each file's own creation and modification dates on disk.",
      modeName: 'Which dates to set',
      modeDesc: 'Choose which dates to fill in.',
      modeOptionBoth: 'Both created and updated',
      modeOptionCreated: 'Created dates only',
      modeOptionUpdated: 'Updated dates only',
      overrideName: 'Files that already have dates',
      overrideDesc:
        'Fill in only the missing dates, or overwrite the existing ones.',
      overrideOptionFillMissing: 'Fill missing only (safe)',
      overrideOptionOverwriteAll: 'Overwrite all (replaces existing)',
      autoUpdateNoteTitle: 'Note about auto-update:',
      autoUpdateNoteBody:
        "If auto-update has been active, the file's own dates on disk may already reflect the plugin's own edits, not the original dates. For best results, use this feature before enabling auto-update or right after installing the plugin.",
      warningTitleCreatedUnreliable:
        "The file's creation date is unreliable on some platforms",
      warningTitlePlatformNote: 'Platform note',
      platformMacWin: 'macOS / Windows',
      platformMacWinNote: 'real file creation date',
      platformLinux: 'Linux',
      platformLinuxNote:
        'system reports a later date, not the real creation date',
      platformAndroid: 'Android',
      platformAndroidNote: 'depends on the device, often unreliable',
      platformIos: 'iOS',
      platformIosNote: 'generally reliable',
      platformReliable: 'Reliable',
      platformUnreliable: 'UNRELIABLE',
      platformLineName: '{name}: {prefix}',
      platformYourPlatformSuffix: ' (your platform)',
      syncNoteLine1: 'Synced vaults: file dates may be reset by sync services',
      syncNoteLine2: '(Obsidian Sync, iCloud, Dropbox, Git).',
      syncNoteLine3:
        'The last-edited date is usually more reliable than the creation date.',
      recommendation:
        'Recommendation: review results after running. Make a backup first.',
      overwriteWarning:
        'This will replace existing dates in your notes. This cannot be undone. Make a backup first.',
      noPropertyConfigured:
        'No property name configured for: {missing}. Check plugin settings.',
      previewTitle: 'Preview: set dates',
      noFilesNeedUpdating:
        'No files need updating. All eligible files already have the requested dates.',
      previewOverwriteWarning:
        'Overwrite mode: existing dates will be replaced. This cannot be undone. Make a backup first.',
      settingDates: 'Setting dates…',
      stopped: 'Stopped.',
      doneWithErrorsSubtitle: '{processed} file(s) updated.',
      doneTitle: 'Done! {processed} file(s) updated.',
    },
    rename: {
      configureTitle: 'Rename a property',
      configureSubtitle:
        'Move values from one property name to another across all notes.',
      validationEnterOld: 'Enter the old property name to proceed.',
      validationEnterNew: 'Enter the new property name to proceed.',
      validationMustDiffer: 'Old and new property names must be different.',
      oldKeyName: 'Old property name',
      oldKeyDesc: 'The property name currently used in your notes.',
      oldKeyPlaceholder: 'Date_created',
      newKeyName: 'New property name',
      newKeyDesc: 'The new property name to use.',
      newKeyPlaceholder: 'Created',
      deleteOldName: 'Delete the old property after renaming',
      deleteOldDesc:
        'Remove the old property after copying its value to the new one.',
      namesCannotBeEmpty: 'Property names cannot be empty.',
      previewTitle: 'Preview: rename property',
      noNotesUseProperty: 'No notes use the property "{oldKey}".',
      conflictWarning:
        '{conflicts} note(s) already have the property "{newKey}". The existing value will be overwritten.',
      columnArrowNew: '→ {newKey}',
      deleteWarning:
        'The old property will be deleted after copying. This cannot be undone. Make a backup first.',
      renamingProperty: 'Renaming property…',
      renameStopped: 'Rename stopped.',
      doneWithErrorsSubtitle: '{processed} file(s) updated.',
      doneTitle: 'Done! {processed} file(s) updated.',
    },
    reformat: {
      configureTitle: 'Standardize date format',
      configureSubtitle:
        'Parse existing date values and rewrite them using the current format from settings.',
      invalidFormat: 'Invalid format',
      targetFormatName: 'Target format',
      targetFormatDesc: '{currentFormat}',
      scopeName: 'Which fields to reformat',
      scopeDesc: 'Choose which dates to standardize.',
      scopeOptionAll: 'All dates',
      scopeOptionCreated: 'Created only',
      scopeOptionUpdated: 'Updated only',
      scopeOptionViewed: 'Viewed only',
      autoDetectNote:
        'Dates are auto-detected from common formats (ISO 8601, European, US, numeric dates) and rewritten in your current format.',
      noPropertyConfigured:
        'No property name configured for: {missing}. Check plugin settings.',
      previewTitle: 'Preview: standardize dates',
      noChangeAmbiguous:
        'Nothing to convert yet. {ambiguousCount} date(s) could be read two ways and are left unchanged - choose a day/month order above to convert them.',
      noChangeDefault:
        'No files need reformatting. All dates are already in the target format or could not be parsed.',
      errorWarningNoChange:
        '{errorCount} file(s) have dates that could not be parsed.',
      errorWarningWillSkip:
        '{errorCount} file(s) have dates that could not be parsed. These will be skipped.',
      checkNote:
        'Rows marked [check] could be read two ways - confirm the new date looks right.',
      rewriteWarning:
        'This rewrites existing date values in place. It cannot be undone. Make a backup first.',
      ambiguityName: 'Dates that could be read two ways',
      ambiguityDesc:
        '{ambiguousCount} date(s) could mean day-first or month-first (e.g. 01/05/2024).{detectedHint}',
      detectedHintMonthFirst: ' Your system suggests month first.',
      detectedHintDayFirst: ' Your system suggests day first.',
      ambiguityOptionSkip: 'Leave unclear dates unchanged',
      ambiguityOptionDmy: 'Day first (01/05 = day 1, month 5)',
      ambiguityOptionMdy: 'Month first (01/05 = month 1, day 5)',
      cellCouldNotRead: '{oldValue} (could not read date)',
      cellConversion: '{oldValue} → {newValue}{check}',
      cellNewValue: '{newValue}{check}',
      cellCheckSuffix: ' [check]',
      reformattingDates: 'Reformatting dates…',
      reformatStopped: 'Reformat stopped.',
      doneWithErrorsSubtitle: '{processed} file(s) updated.',
      doneTitle: 'Done! {processed} file(s) updated.',
    },
    inversions: {
      scanningTitle: 'Finding out-of-order dates…',
      foundTitle: 'Found {count} notes with out-of-order dates',
      foundSubtitle:
        'These notes have a last-edited date earlier than the creation date. Choose how to fix them below, or close to review manually.',
      noneFound: 'No out-of-order dates found.',
      strategyName: 'How to fix',
      strategyDesc: 'Choose how to correct the dates.',
      strategyOptionDisabled: "Don't fix (review only)",
      strategyOptionCreatedToUpdated:
        'Set creation date to the last-edited date',
      strategyOptionUpdatedToCreated:
        'Set last-edited date to the creation date',
      strategyOptionMaxAll: 'Set both to the most recent date',
      toleranceNote:
        'Ignoring differences under {tolerance} seconds (set in settings).',
      columnDelta: 'Δ',
      fixWarning:
        'This will modify {count} notes. This cannot be undone. Make a backup first.',
      fixingDates: 'Fixing dates…',
      stopped: 'Bulk operation stopped.',
      fixedNotice: 'Fixed {processed} note(s).',
      doneWithErrorsSubtitle: '{processed} note(s) fixed.',
      doneTitle: 'Done! You can safely close this modal.',
    },
    rebuildCache: {
      loadingFiles: 'Loading files…',
      confirmTitle: 'Rebuild change-detection data for {count} files',
      confirmSubtitle:
        'This recomputes the content fingerprints (content hashes) used to detect real edits. It does not change your notes.',
      rebuilding: 'Rebuilding…',
      stopped: 'Bulk operation stopped.',
      doneWithErrorsSubtitle: '{processed} file(s) processed.',
      doneTitle: 'Done! You can safely close this modal.',
    },
  },
};
