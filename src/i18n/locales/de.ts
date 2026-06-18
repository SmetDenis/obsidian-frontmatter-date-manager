// German. Machine-generated baseline. Improvements welcome - see CONTRIBUTING.md.
import type { Strings, DeepPartial } from '../index';

export const STRINGS_DE: DeepPartial<Strings> = {
  common: {
    run: 'Ausführen',
    back: 'Zurück',
    cancel: 'Abbrechen',
    close: 'Schließen',
    file: 'Datei',
    created: 'Erstellt',
    updated: 'Aktualisiert',
    viewed: 'Angesehen',
    createdKeyed: 'Erstellt ({key})',
    updatedKeyed: 'Aktualisiert ({key})',
    viewedKeyed: 'Angesehen ({key})',
    scanAndPreview: 'Scannen & Vorschau',
    scanningFiles: 'Dateien werden gescannt…',
    doneWithErrors: 'Fertig mit {errors} Fehler(n).',
  },

  commands: {
    updateCurrentFile: 'Daten der aktuellen Datei aktualisieren',
    toggleAutoUpdate: 'Automatische Aktualisierung ein-/ausschalten',
    pauseAutoUpdate: 'Automatische Aktualisierung für 5 Minuten pausieren',
  },

  statusBar: {
    paused: 'Pausiert',
    pausedWithMinutes: 'Pausiert ({remaining}m)',
  },

  notices: {
    inversionDetectedAndFixed:
      'Frontmatter Date Manager: Daten in falscher Reihenfolge wurden erkannt und korrigiert. Verwenden Sie "Daten in falscher Reihenfolge finden" in den Einstellungen, um sie zu prüfen.',
    timestampsUpdated: 'Daten aktualisiert.',
    fileIgnored: 'Datei wird durch die Plugin-Einstellungen ignoriert.',
    failedToUpdateWithReason:
      'Daten konnten nicht aktualisiert werden: {reason}',
    failedToUpdate: 'Daten konnten nicht aktualisiert werden.',
    autoUpdateEnabled: 'Automatische Aktualisierung aktiviert',
    autoUpdateDisabled: 'Automatische Aktualisierung deaktiviert',
    autoUpdatePausedForMinutes:
      'Automatische Aktualisierung für {minutes} Minuten pausiert. Wird automatisch fortgesetzt.',
    autoUpdateResumed: 'Automatische Aktualisierung fortgesetzt.',
    malformedFrontmatter:
      'Frontmatter Date Manager fehlgeschlagen\nFehlerhafte Eigenschaften in dieser Datei: {filePath}\n\n{message}',
  },

  bulkChrome: {
    summaryWillChange: 'Geänderte Dateien: {changed}',
    summarySkipped: 'Übersprungen: {skipped}',
    summaryErrors: 'Fehler: {errors}',
    pagerPrev: 'Zurück',
    pagerNext: 'Weiter',
    pageInfo: 'Seite {current} von {total}',
    downloadFullPreview: 'Vollständige Vorschau herunterladen',
    downloadSuccess:
      '{count} Zeile(n) als {filename} in Ihren Downloads-Ordner heruntergeladen.',
    downloadFailed: 'Die Vorschaudatei konnte nicht heruntergeladen werden.',
    failureColumnError: 'Fehler',
    progressCounter: '{count}/{max}',
  },

  settings: {
    description: {
      syncIntro:
        'Synchronisierungsdienste, Backup-Tools und andere Plugins schreiben Dateien oft neu, ohne ihren Inhalt zu ändern - dadurch werden die Daten der Datei auf der Festplatte zurückgesetzt. Das macht es unmöglich zu erkennen, wann Sie eine Notiz tatsächlich zuletzt bearbeitet haben.',
      pluginIntro:
        'Dieses Plugin schreibt das Erstellungs- und das letzte Bearbeitungsdatum direkt in die Eigenschaften jeder Notiz und erkennt echte Änderungen durch Inhaltsvergleich, sodass Ihre Daten echte Bearbeitungen widerspiegeln - nicht Synchronisierungsartefakte.',
    },
    dates: {
      heading: 'Zu verfolgende Daten',
      enableNoneHint:
        'Aktivieren Sie oben mindestens ein Datum, um das Plugin einzurichten.',
      created: {
        enableName: 'Erstellungsdatum verfolgen',
        enableDesc:
          'Notizen, die noch keines haben, ein Erstellungsdatum hinzufügen.',
        propertyName: 'Eigenschaft für Erstellungsdatum',
        propertyDesc:
          'Name der Eigenschaft, in der das Erstellungsdatum gespeichert wird.',
      },
      updated: {
        enableName: 'Letztes Bearbeitungsdatum verfolgen',
        enableDesc:
          'Dieses Datum aktualisieren, wann immer Sie die Notiz bearbeiten.',
        propertyName: 'Eigenschaft für Bearbeitungsdatum',
        propertyDesc:
          'Name der Eigenschaft, in der das letzte Bearbeitungsdatum gespeichert wird.',
      },
      updateCount: {
        enableName: 'Bearbeitungen zählen',
        enableDesc:
          'Eine Zahleneigenschaft hinzufügen, die bei jeder Bearbeitung einer Notiz um eins steigt. Ein ungefährer Aktivitätszähler, kein exakter Verlauf.',
        propertyName: 'Eigenschaft für Bearbeitungszähler',
        propertyDesc:
          'Name der Eigenschaft, in der der Bearbeitungszähler gespeichert wird.',
      },
      viewed: {
        enableName: 'Datum des letzten Öffnens verfolgen',
        enableDesc: 'Das Datum bei jedem Öffnen der Notiz speichern.',
        propertyName: 'Eigenschaft für Öffnungsdatum',
        propertyDesc:
          'Name der Eigenschaft, in der das Datum des letzten Öffnens gespeichert wird.',
      },
    },
    formatting: {
      heading: 'Datumsformat',
      dateFormat: {
        name: 'Datumsformat',
        desc: 'Wie Daten und Uhrzeiten in Ihre Notizen geschrieben werden.',
        formatCodesLink: 'Verfügbare Formatcodes ansehen',
        currentlyPreview: 'Aktuell: {preview}',
        invalidWithHint: 'Ungültiges Format. {hint}',
        invalidFormat: 'Ungültige Datumsformat-Zeichenfolge.',
        obsidianDefault:
          "Obsidian-Standard: yyyy-MM-dd'T'HH:mm:ss (Datum und Uhrzeit, lokale Zeitzone)",
      },
      timezone: {
        name: 'Zeitzone',
        desc: 'Zeitzone, die beim Schreiben von Daten verwendet wird. Leer lassen, um die Zeitzone Ihres Geräts zu verwenden ({localTz}).',
        placeholder: 'Lokal ({localTz})',
        resetTooltip: 'Auf lokale Zeitzone zurücksetzen',
      },
      numberProperties: {
        name: 'Reine Zahlendaten ohne Anführungszeichen speichern',
        desc: 'Wenn Ihr Datumsformat nur aus Ziffern besteht (wie ein Unix-Zeitstempel), wird es als einfache Zahl geschrieben (updated: 1712930400) statt als Text in Anführungszeichen (updated: "1712930400"). Keine Wirkung, wenn Ihr Format Bindestriche oder Doppelpunkte enthält.',
      },
    },
    behavior: {
      heading: 'Verhalten',
      autoUpdate: {
        name: 'Automatische Aktualisierung',
        desc: 'Daten automatisch aktualisieren, wenn Sie eine Notiz bearbeiten. Auch über die Befehlspalette verfügbar.',
      },
      minSeconds: {
        name: 'Mindestsekunden zwischen Aktualisierungen',
        desc: 'Verhindert ein zu häufiges Aktualisieren des Datums, während Sie tippen oder zwischen Notizen wechseln.',
      },
      changeDetection: {
        name: 'Änderungserkennung (Inhalts-Hashing)',
        descEnabled:
          'Das letzte Bearbeitungsdatum wird nur geschrieben, wenn sich der Inhalt der Notiz tatsächlich ändert - das verhindert falsche Aktualisierungen durch Synchronisierungs-Plugins.',
        descDisabled:
          'Deaktiviert - das letzte Bearbeitungsdatum wird bei jedem Speichern geschrieben, auch wenn sich nichts geändert hat.',
      },
      hashTrackingMode: {
        name: 'Was als Änderung zählt',
        desc: 'Welcher Teil einer Notiz als Änderung zählt. "Nur Textkörper" - das Bearbeiten von Eigenschaften (Tags, Aliase usw.) aktualisiert das Datum nicht. "Nur Eigenschaften" - das Bearbeiten des Notiztexts aktualisiert das Datum nicht. "Beide" - jede Bearbeitung aktualisiert das Datum.',
        optionBody: 'Nur Notiztext (Standard)',
        optionFrontmatter: 'Nur Eigenschaften',
        optionBoth: 'Textkörper und Eigenschaften',
        changedNotice:
          'Verfolgungsmodus geändert. Erstellen Sie den Hash-Cache neu (in den Massenoperationen), damit die Daten korrekt bleiben.',
      },
      excludeKeys: {
        name: 'Diese Eigenschaften ignorieren',
        desc: 'Das Bearbeiten dieser Eigenschaften aktualisiert das Datum nicht. Sie können mehrere auf einmal hinzufügen, durch Kommas getrennt. Die Eigenschaften created, updated und viewed werden immer automatisch ignoriert.',
        placeholder: 'Eigenschaftsname wie tags',
        addTooltip: 'Eigenschaft hinzufügen',
        chipRemoveAriaLabel: '{entry} entfernen',
      },
    },
    filterRules: {
      name: 'Zu überspringende Dateien und Ordner',
      descIntro:
        'Wählen Sie Dateien oder Ordner, die unangetastet bleiben sollen (keine automatischen Datumsaktualisierungen). ',
      descOnePerLine: 'Ein Muster pro Zeile. Zeilen, die mit ',
      descCommentsAre:
        ' beginnen, sind Kommentare. Beginnen Sie eine Zeile mit ',
      descAddBack: ', um einen Pfad wieder hinzuzufügen. ',
      descLastWins: 'Wenn mehrere Zeilen zutreffen, gewinnt die letzte.',
      advancedSyntaxLink: 'Erweiterte Syntax (im gitignore-Stil)',
      noRulesWarning:
        'Keine Regeln festgelegt - alle Notizen erhalten automatische Datumsaktualisierungen.',
      placeholderExcludeFolder: '# Einen Ordner ausschließen',
      placeholderExcludeByPattern: '# Nach Muster ausschließen',
      placeholderReinclude: '# Eine bestimmte Datei wieder aufnehmen',
      parseError: 'Zeile {lineNumber}: {message} - "{text}"',
      previewButton: 'Passende Dateien anzeigen',
      previewSummary:
        '{tracked} Notizen verfolgt, {excluded} Notizen übersprungen',
      skippedFilesSummary: 'Übersprungene Dateien ({excluded})',
      skippedMore: '...und {count} weitere',
      reference: {
        summary: 'Referenz zur Mustersyntax',
        sectionBasics: 'Syntax-Grundlagen',
        basicsCommentDesc: 'Zeilen, die mit # beginnen, werden ignoriert',
        basicsBlankDesc: 'Leere Zeilen werden ignoriert',
        basicsExcludeDesc:
          'Ausschließen - Dateien innerhalb von templates/ werden übersprungen',
        basicsReincludeDesc:
          'Wieder aufnehmen - Präfix ! macht den Ausschluss rückgängig',
        basicsLastWinsDesc: 'Wenn mehrere Regeln zutreffen, gewinnt die letzte',
        sectionExcludeFolder: 'Einen Ordner ausschließen',
        excludeFolderAllFilesDesc: 'Alle Dateien innerhalb von templates/',
        excludeFolderSameEffectDesc:
          'Gleicher Effekt (der abschließende Schrägstrich ist optional)',
        excludeFolderNestedDesc: 'Verschachtelter Ordner',
        sectionReinclude:
          'Wieder aufnehmen (einen Ausschluss rückgängig machen)',
        reincludeExcludeWholeDesc: 'Den gesamten Ordner ausschließen',
        reincludeKeepDesc: 'Aber diese bestimmte Datei weiter verfolgen',
        sectionWildcards: 'Platzhalter',
        wildcardStarDesc: 'Beliebige Zeichen außer /',
        wildcardDoubleStarDesc:
          'Beliebige Zeichen einschließlich / (übergreift Ordner)',
        wildcardQuestionDesc: 'Genau ein Zeichen',
        sectionWildcardExamples: 'Platzhalter-Beispiele',
        wildcardExCanvasRootDesc:
          'Dateien, die auf .canvas.md enden, im Stammverzeichnis des Vaults',
        wildcardExCanvasAnyDesc:
          'Dateien, die auf .canvas.md enden, in jedem Ordner',
        wildcardExDailyDesc: 'Dateien wie daily/2024-01-01.md',
        wildcardExTwoCharDesc: 'Dateinamen mit zwei Zeichen in notes/',
        sectionSpecificFiles: 'Bestimmte Dateien',
        specificFilesOneExactDesc: 'Eine exakte Datei',
        specificFilesRootDesc: 'Eine Datei im Stammverzeichnis des Vaults',
        sectionPathsWithSpaces: 'Pfade mit Leerzeichen',
        pathsWithSpacesAsIsDesc:
          'Schreiben Sie den Pfad einfach so, wie er ist',
        pathsWithSpacesNoQuotesDesc:
          'Keine Anführungszeichen um Leerzeichen nötig',
        sectionNonLatin: 'Nicht-lateinische Zeichen',
        nonLatinCyrillicDesc: 'Kyrillischer Ordnername',
        nonLatinChineseDesc: 'Chinesische Zeichen',
        nonLatinFullPathDesc: 'Vollständiger nicht-lateinischer Pfad',
        sectionObsidianExamples: 'Obsidian-spezifische Beispiele',
        obsidianTemplateFolderDesc: 'Vorlagenordner',
        obsidianDailyFolderDesc: 'Ordner für tägliche Notizen',
        obsidianAttachmentsDesc: 'Ordner für Anhänge / Medien',
        obsidianCanvasDesc: 'Alle Canvas-Dateien',
        obsidianExcalidrawDesc: 'Alle Excalidraw-Zeichnungen',
        obsidianInboxDesc: 'Ordner für Eingang / Notizzettel',
        obsidianArchiveDesc: 'Archivierte Notizen',
        sectionAllowlist:
          'Erlaubnislisten-Modus (nur bestimmte Ordner verfolgen)',
        allowlistExcludeEverythingDesc: 'Zuerst alles ausschließen',
        allowlistReincludeWantedDesc:
          'Dann nur das wieder aufnehmen, was Sie möchten',
        allowlistReincludeAnotherDesc: 'Einen weiteren Ordner wieder aufnehmen',
        emptyNote:
          'Wenn dieses Feld leer ist, erhalten alle Notizen automatische Datumsaktualisierungen.',
      },
    },
    inversions: {
      heading: 'Bearbeitungsdatum vor Erstellungsdatum',
      strategy: {
        name: 'Wie Daten in falscher Reihenfolge korrigiert werden',
        desc: 'Was zu tun ist, wenn das letzte Bearbeitungsdatum vor dem Erstellungsdatum liegt. Gilt für automatische Bearbeitungen und legt den Standard für das Massenwerkzeug fest.',
        optionDisabled: 'Nicht korrigieren (nur erkennen)',
        optionCreatedToUpdated:
          'Erstellungsdatum auf das letzte Bearbeitungsdatum setzen',
        optionUpdatedToCreated:
          'Letztes Bearbeitungsdatum auf das Erstellungsdatum setzen',
        optionMaxAll: 'Beide auf das neueste Datum setzen',
      },
      tolerance: {
        name: 'Winzige Unterschiede ignorieren (Sekunden)',
        desc: 'Daten in falscher Reihenfolge ignorieren, wenn der Abstand kleiner als dieser Wert ist. Ein kleiner Wert verbirgt winzige Uhrabweichungen.',
      },
    },
    advanced: {
      summary: 'Erweitert',
      newFileDelay: {
        name: 'Verzögerung für neue Dateien',
        desc: 'So viele Millisekunden warten, bevor ein Datum in eine neu erstellte Notiz geschrieben wird. Hilft, Konflikte mit Vorlagen-Plugins zu vermeiden. Auf 0 setzen, um zu deaktivieren.',
      },
      autoPopulateCache: {
        name: 'Cache beim Start automatisch füllen',
        desc: 'Beim Laden des Plugins Änderungserkennungsdaten für Notizen erstellen, die noch keine haben. Läuft im Hintergrund.',
      },
      maxCacheEntries: {
        name: 'Maximale Cache-Einträge',
        desc: 'Wenn der Cache dieses Limit überschreitet, werden die ältesten ungenutzten Einträge entfernt. 0 = keine Begrenzung.',
      },
      postUpdateCommand: {
        name: 'Befehl nach Aktualisierung',
        desc: 'Einen Obsidian-Befehl ausführen, nachdem ein Datum aktualisiert wurde. Leer lassen, um zu deaktivieren.',
        optionNone: 'Keiner',
      },
    },
    bulk: {
      heading: 'Massenoperationen',
      populate: {
        name: 'Daten aus den eigenen Daten der Datei setzen',
        desc: 'Das Erstellungs- und das letzte Bearbeitungsdatum aus dem eigenen Erstellungs- und Änderungsdatum jeder Datei auf der Festplatte ausfüllen. Ideal für die Ersteinrichtung.',
        button: 'Daten ausfüllen',
      },
      rename: {
        name: 'Eine Eigenschaft umbenennen',
        desc: 'Werte von einem alten Eigenschaftsnamen in einen neuen über alle Notizen hinweg verschieben. Nützlich nach dem Ändern eines Eigenschaftsnamens oben.',
        button: 'Eigenschaft umbenennen',
      },
      reformat: {
        name: 'Vorhandene Daten neu formatieren',
        desc: 'Daten in einem alten Format finden und sie in Ihrem aktuellen Format neu schreiben. Nützlich nach dem Ändern des Datumsformats oben.',
        button: 'Daten neu formatieren',
      },
      findInversions: {
        name: 'Daten in falscher Reihenfolge finden',
        desc: 'Ihre Notizen scannen und die auflisten, bei denen das letzte Bearbeitungsdatum vor dem Erstellungsdatum liegt. Sie können dann die oben gewählte Korrektur anwenden.',
        button: 'Daten in falscher Reihenfolge finden',
      },
      rebuildCache: {
        name: 'Hash-Cache neu erstellen',
        desc: 'Änderungserkennungsdaten (Inhalts-Hashes) für alle Ihre Notizen neu berechnen. Nützlich nach dem Ändern dessen, was oben als Änderung zählt.',
        button: 'Cache neu erstellen',
      },
    },
  },

  modals: {
    populate: {
      configureTitle: 'Daten aus den eigenen Daten der Datei setzen',
      configureSubtitleLine1:
        'Das Erstellungs- und das letzte Bearbeitungsdatum ausfüllen',
      configureSubtitleLine2:
        'aus dem eigenen Erstellungs- und Änderungsdatum jeder Datei auf der Festplatte.',
      modeName: 'Welche Daten setzen',
      modeDesc: 'Wählen Sie, welche Daten ausgefüllt werden sollen.',
      modeOptionBoth: 'Sowohl Erstellung als auch Aktualisierung',
      modeOptionCreated: 'Nur Erstellungsdaten',
      modeOptionUpdated: 'Nur Aktualisierungsdaten',
      overrideName: 'Dateien, die bereits Daten haben',
      overrideDesc:
        'Nur die fehlenden Daten ausfüllen oder die vorhandenen überschreiben.',
      overrideOptionFillMissing: 'Nur fehlende ausfüllen (sicher)',
      overrideOptionOverwriteAll: 'Alle überschreiben (ersetzt vorhandene)',
      autoUpdateNoteTitle: 'Hinweis zur automatischen Aktualisierung:',
      autoUpdateNoteBody:
        'Wenn die automatische Aktualisierung aktiv war, spiegeln die eigenen Daten der Datei auf der Festplatte möglicherweise bereits die Bearbeitungen des Plugins wider, nicht die ursprünglichen Daten. Für beste Ergebnisse verwenden Sie diese Funktion vor dem Aktivieren der automatischen Aktualisierung oder direkt nach der Installation des Plugins.',
      warningTitleCreatedUnreliable:
        'Das Erstellungsdatum der Datei ist auf einigen Plattformen unzuverlässig',
      warningTitlePlatformNote: 'Plattformhinweis',
      platformMacWinNote: 'echtes Datei-Erstellungsdatum',
      platformLinuxNote:
        'das System meldet ein späteres Datum, nicht das echte Erstellungsdatum',
      platformAndroidNote: 'hängt vom Gerät ab, oft unzuverlässig',
      platformIosNote: 'in der Regel zuverlässig',
      platformReliable: 'Zuverlässig',
      platformUnreliable: 'UNZUVERLÄSSIG',
      platformYourPlatformSuffix: ' (Ihre Plattform)',
      syncNoteLine1:
        'Synchronisierte Vaults: Dateidaten können durch Synchronisierungsdienste zurückgesetzt werden',
      syncNoteLine3:
        'Das letzte Bearbeitungsdatum ist in der Regel zuverlässiger als das Erstellungsdatum.',
      recommendation:
        'Empfehlung: Prüfen Sie die Ergebnisse nach dem Ausführen. Erstellen Sie zuerst ein Backup.',
      overwriteWarning:
        'Dies ersetzt vorhandene Daten in Ihren Notizen. Das kann nicht rückgängig gemacht werden. Erstellen Sie zuerst ein Backup.',
      noPropertyConfigured:
        'Kein Eigenschaftsname konfiguriert für: {missing}. Überprüfen Sie die Plugin-Einstellungen.',
      previewTitle: 'Vorschau: Daten setzen',
      noFilesNeedUpdating:
        'Keine Dateien müssen aktualisiert werden. Alle infrage kommenden Dateien haben bereits die angeforderten Daten.',
      previewOverwriteWarning:
        'Überschreibmodus: vorhandene Daten werden ersetzt. Das kann nicht rückgängig gemacht werden. Erstellen Sie zuerst ein Backup.',
      settingDates: 'Daten werden gesetzt…',
      stopped: 'Gestoppt.',
      doneWithErrorsSubtitle: '{processed} Datei(en) aktualisiert.',
      doneTitle: 'Fertig! {processed} Datei(en) aktualisiert.',
    },
    rename: {
      configureTitle: 'Eine Eigenschaft umbenennen',
      configureSubtitle:
        'Werte von einem Eigenschaftsnamen zu einem anderen über alle Notizen hinweg verschieben.',
      validationEnterOld:
        'Geben Sie den alten Eigenschaftsnamen ein, um fortzufahren.',
      validationEnterNew:
        'Geben Sie den neuen Eigenschaftsnamen ein, um fortzufahren.',
      validationMustDiffer:
        'Alter und neuer Eigenschaftsname müssen sich unterscheiden.',
      oldKeyName: 'Alter Eigenschaftsname',
      oldKeyDesc:
        'Der Eigenschaftsname, der derzeit in Ihren Notizen verwendet wird.',
      newKeyName: 'Neuer Eigenschaftsname',
      newKeyDesc: 'Der neue zu verwendende Eigenschaftsname.',
      deleteOldName: 'Die alte Eigenschaft nach dem Umbenennen löschen',
      deleteOldDesc:
        'Die alte Eigenschaft entfernen, nachdem ihr Wert in die neue kopiert wurde.',
      namesCannotBeEmpty: 'Eigenschaftsnamen dürfen nicht leer sein.',
      previewTitle: 'Vorschau: Eigenschaft umbenennen',
      noNotesUseProperty: 'Keine Notiz verwendet die Eigenschaft "{oldKey}".',
      conflictWarning:
        '{conflicts} Notiz(en) haben bereits die Eigenschaft "{newKey}". Der vorhandene Wert wird überschrieben.',
      columnArrowNew: '→ {newKey}',
      deleteWarning:
        'Die alte Eigenschaft wird nach dem Kopieren gelöscht. Das kann nicht rückgängig gemacht werden. Erstellen Sie zuerst ein Backup.',
      renamingProperty: 'Eigenschaft wird umbenannt…',
      renameStopped: 'Umbenennen gestoppt.',
      doneWithErrorsSubtitle: '{processed} Datei(en) aktualisiert.',
      doneTitle: 'Fertig! {processed} Datei(en) aktualisiert.',
    },
    reformat: {
      configureTitle: 'Datumsformat vereinheitlichen',
      configureSubtitle:
        'Vorhandene Datumswerte einlesen und mit dem aktuellen Format aus den Einstellungen neu schreiben.',
      invalidFormat: 'Ungültiges Format',
      targetFormatName: 'Zielformat',
      scopeName: 'Welche Felder neu formatieren',
      scopeDesc: 'Wählen Sie, welche Daten vereinheitlicht werden sollen.',
      scopeOptionAll: 'Alle Daten',
      scopeOptionCreated: 'Nur Erstellung',
      scopeOptionUpdated: 'Nur Aktualisierung',
      scopeOptionViewed: 'Nur Ansicht',
      autoDetectNote:
        'Daten werden automatisch aus gängigen Formaten erkannt (ISO 8601, europäisch, US-amerikanisch, numerische Daten) und in Ihrem aktuellen Format neu geschrieben.',
      noPropertyConfigured:
        'Kein Eigenschaftsname konfiguriert für: {missing}. Überprüfen Sie die Plugin-Einstellungen.',
      previewTitle: 'Vorschau: Daten vereinheitlichen',
      noChangeAmbiguous:
        'Noch nichts zu konvertieren. {ambiguousCount} Datum/Daten könnten auf zwei Arten gelesen werden und bleiben unverändert - wählen Sie oben eine Tag/Monat-Reihenfolge, um sie zu konvertieren.',
      noChangeDefault:
        'Keine Dateien müssen neu formatiert werden. Alle Daten sind bereits im Zielformat oder konnten nicht eingelesen werden.',
      errorWarningNoChange:
        '{errorCount} Datei(en) haben Daten, die nicht eingelesen werden konnten.',
      errorWarningWillSkip:
        '{errorCount} Datei(en) haben Daten, die nicht eingelesen werden konnten. Diese werden übersprungen.',
      checkNote:
        'Mit [check] markierte Zeilen könnten auf zwei Arten gelesen werden - prüfen Sie, ob das neue Datum richtig aussieht.',
      rewriteWarning:
        'Dies schreibt vorhandene Datumswerte an Ort und Stelle neu. Das kann nicht rückgängig gemacht werden. Erstellen Sie zuerst ein Backup.',
      ambiguityName: 'Daten, die auf zwei Arten gelesen werden können',
      ambiguityDesc:
        '{ambiguousCount} Datum/Daten könnten Tag-zuerst oder Monat-zuerst bedeuten (z. B. 01/05/2024).{detectedHint}',
      detectedHintMonthFirst: ' Ihr System schlägt Monat zuerst vor.',
      detectedHintDayFirst: ' Ihr System schlägt Tag zuerst vor.',
      ambiguityOptionSkip: 'Unklare Daten unverändert lassen',
      ambiguityOptionDmy: 'Tag zuerst (01/05 = Tag 1, Monat 5)',
      ambiguityOptionMdy: 'Monat zuerst (01/05 = Monat 1, Tag 5)',
      cellCouldNotRead: '{oldValue} (Datum konnte nicht gelesen werden)',
      cellConversion: '{oldValue} → {newValue}{check}',
      cellNewValue: '{newValue}{check}',
      cellCheckSuffix: ' [check]',
      reformattingDates: 'Daten werden neu formatiert…',
      reformatStopped: 'Neuformatierung gestoppt.',
      doneWithErrorsSubtitle: '{processed} Datei(en) aktualisiert.',
      doneTitle: 'Fertig! {processed} Datei(en) aktualisiert.',
    },
    inversions: {
      scanningTitle: 'Daten in falscher Reihenfolge werden gesucht…',
      foundTitle: '{count} Notizen mit Daten in falscher Reihenfolge gefunden',
      foundSubtitle:
        'Diese Notizen haben ein letztes Bearbeitungsdatum vor dem Erstellungsdatum. Wählen Sie unten, wie sie korrigiert werden sollen, oder schließen Sie, um manuell zu prüfen.',
      noneFound: 'Keine Daten in falscher Reihenfolge gefunden.',
      strategyName: 'Wie korrigieren',
      strategyDesc: 'Wählen Sie, wie die Daten korrigiert werden sollen.',
      strategyOptionDisabled: 'Nicht korrigieren (nur prüfen)',
      strategyOptionCreatedToUpdated:
        'Erstellungsdatum auf das letzte Bearbeitungsdatum setzen',
      strategyOptionUpdatedToCreated:
        'Letztes Bearbeitungsdatum auf das Erstellungsdatum setzen',
      strategyOptionMaxAll: 'Beide auf das neueste Datum setzen',
      toleranceNote:
        'Unterschiede unter {tolerance} Sekunden werden ignoriert (in den Einstellungen festgelegt).',
      fixWarning:
        'Dies ändert {count} Notizen. Das kann nicht rückgängig gemacht werden. Erstellen Sie zuerst ein Backup.',
      fixingDates: 'Daten werden korrigiert…',
      stopped: 'Massenoperation gestoppt.',
      fixedNotice: '{processed} Notiz(en) korrigiert.',
      doneWithErrorsSubtitle: '{processed} Notiz(en) korrigiert.',
      doneTitle: 'Fertig! Sie können dieses Fenster sicher schließen.',
    },
    rebuildCache: {
      loadingFiles: 'Dateien werden geladen…',
      confirmTitle:
        'Änderungserkennungsdaten für {count} Dateien neu erstellen',
      confirmSubtitle:
        'Dies berechnet die Inhalts-Fingerabdrücke (Inhalts-Hashes) neu, die zum Erkennen echter Bearbeitungen verwendet werden. Ihre Notizen werden nicht verändert.',
      rebuilding: 'Wird neu erstellt…',
      stopped: 'Massenoperation gestoppt.',
      doneWithErrorsSubtitle: '{processed} Datei(en) verarbeitet.',
      doneTitle: 'Fertig! Sie können dieses Fenster sicher schließen.',
    },
  },
};
