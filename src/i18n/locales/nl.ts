// Dutch. Machine-generated baseline. Improvements welcome - see CONTRIBUTING.md.
import type { Strings } from '../index';

export const STRINGS_NL: Strings = {
  common: {
    run: 'Uitvoeren',
    back: 'Terug',
    cancel: 'Annuleren',
    close: 'Sluiten',
    file: 'Bestand',
    created: 'Aangemaakt',
    updated: 'Bijgewerkt',
    viewed: 'Bekeken',
    createdKeyed: 'Aangemaakt ({key})',
    updatedKeyed: 'Bijgewerkt ({key})',
    viewedKeyed: 'Bekeken ({key})',
    scanAndPreview: 'Scannen en voorbeeld',
    scanningFiles: 'Bestanden scannen…',
    doneWithErrors: 'Klaar met {errors} fout(en).',
  },
  commands: {
    updateCurrentFile: 'Datums in huidig bestand bijwerken',
    toggleAutoUpdate: 'Automatisch bijwerken aan/uit',
    pauseAutoUpdate: 'Automatisch bijwerken 5 minuten pauzeren',
  },
  statusBar: {
    paused: 'Gepauzeerd',
    pausedWithMinutes: 'Gepauzeerd ({remaining}m)',
  },
  notices: {
    inversionDetectedAndFixed:
      'Frontmatter Date Manager: datums in verkeerde volgorde zijn gevonden en hersteld. Gebruik "Datums in verkeerde volgorde zoeken" in de instellingen om te controleren.',
    timestampsUpdated: 'Datums bijgewerkt.',
    fileIgnored: 'Bestand wordt genegeerd door de plug-in-instellingen.',
    failedToUpdateWithReason: 'Datums bijwerken mislukt: {reason}',
    failedToUpdate: 'Datums bijwerken mislukt.',
    autoUpdateEnabled: 'Automatisch bijwerken ingeschakeld',
    autoUpdateDisabled: 'Automatisch bijwerken uitgeschakeld',
    autoUpdatePausedForMinutes:
      'Automatisch bijwerken gepauzeerd voor {minutes} minuten. Wordt automatisch hervat.',
    autoUpdateResumed: 'Automatisch bijwerken hervat.',
    malformedFrontmatter:
      'Frontmatter Date Manager: mislukt\nOnjuiste eigenschappen in dit bestand: {filePath}\n\n{message}',
  },
  bulkChrome: {
    summaryWillChange: '{changed} bestand(en) worden gewijzigd',
    summarySkipped: '{skipped} overgeslagen',
    summaryErrors: '{errors} fout(en)',
    pagerPrev: 'Vorige',
    pagerNext: 'Volgende',
    pageInfo: 'Pagina {current} van {total}',
    downloadFullPreview: 'Volledig voorbeeld downloaden',
    downloadSuccess:
      '{count} rij(en) gedownload als {filename} naar uw downloadmap.',
    downloadFailed: 'Het voorbeeldbestand kon niet worden gedownload.',
    failureColumnError: 'Fout',
    progressCounter: '{count}/{max}',
  },
  settings: {
    description: {
      syncIntro:
        'Synchronisatiediensten, back-uptools en andere plug-ins herschrijven bestanden vaak zonder de inhoud te wijzigen - waardoor de datums van het bestand op schijf worden gereset. Daardoor is het onmogelijk om te zien wanneer u een notitie echt voor het laatst hebt bewerkt.',
      pluginIntro:
        'Deze plug-in schrijft de aanmaak- en laatst-bewerkt-datums rechtstreeks in de eigenschappen van elke notitie en herkent echte wijzigingen door de inhoud te vergelijken, zodat uw datums echte bewerkingen weerspiegelen - geen synchronisatie-artefacten.',
    },
    dates: {
      heading: 'Welke datums bijhouden',
      enableNoneHint:
        'Schakel hierboven minstens één datum in om de plug-in in te stellen.',
      created: {
        enableName: 'Aanmaakdatum bijhouden',
        enableDesc:
          'Voeg een aanmaakdatum toe aan notities die er nog geen hebben.',
        propertyName: 'Eigenschap voor aanmaakdatum',
        propertyDesc:
          'Naam van de eigenschap waarin de aanmaakdatum wordt opgeslagen.',
        propertyPlaceholder: 'Created',
      },
      updated: {
        enableName: 'Laatst-bewerkt-datum bijhouden',
        enableDesc: 'Werk deze datum bij telkens wanneer u de notitie bewerkt.',
        propertyName: 'Eigenschap voor laatst-bewerkt-datum',
        propertyDesc:
          'Naam van de eigenschap waarin de laatst-bewerkt-datum wordt opgeslagen.',
        propertyPlaceholder: 'Updated',
      },
      updateCount: {
        enableName: 'Bewerkingen tellen',
        enableDesc:
          'Voeg een numerieke eigenschap toe die telkens met één omhooggaat wanneer u een notitie bewerkt. Een geschatte activiteitsteller, geen exacte geschiedenis.',
        propertyName: 'Eigenschap voor bewerkingsteller',
        propertyDesc:
          'Naam van de eigenschap waarin de bewerkingsteller wordt opgeslagen.',
      },
      viewed: {
        enableName: 'Laatst-geopend-datum bijhouden',
        enableDesc: 'Sla de datum op telkens wanneer u de notitie opent.',
        propertyName: 'Eigenschap voor laatst-geopend-datum',
        propertyDesc:
          'Naam van de eigenschap waarin de laatst-geopend-datum wordt opgeslagen.',
        propertyPlaceholder: 'Viewed',
      },
    },
    formatting: {
      heading: 'Datumopmaak',
      dateFormat: {
        name: 'Datumformaat',
        desc: 'Hoe datums en tijden in uw notities worden geschreven.',
        formatCodesLink: 'Beschikbare formaatcodes bekijken',
        currentlyPreview: 'Nu: {preview}',
        invalidWithHint: 'Ongeldig formaat. {hint}',
        invalidFormat: 'Ongeldige datumformaattekst.',
        obsidianDefault:
          "Obsidian-standaard: yyyy-MM-dd'T'HH:mm:ss (datum en tijd, lokale tijdzone)",
      },
      timezone: {
        name: 'Tijdzone',
        desc: 'Tijdzone die wordt gebruikt bij het schrijven van datums. Laat leeg om de tijdzone van uw apparaat te gebruiken ({localTz}).',
        placeholder: 'Lokaal ({localTz})',
        resetTooltip: 'Terugzetten naar lokale tijdzone',
      },
      numberProperties: {
        name: 'Datums met alleen cijfers zonder aanhalingstekens opslaan',
        desc: 'Als uw datumformaat alleen cijfers bevat (zoals een unix-tijd), schrijf het dan als een gewoon getal (updated: 1712930400) in plaats van als tekst tussen aanhalingstekens (updated: "1712930400"). Geen effect als uw formaat streepjes of dubbele punten bevat.',
      },
    },
    behavior: {
      heading: 'Gedrag',
      autoUpdate: {
        name: 'Automatisch bijwerken',
        desc: 'Datums automatisch bijwerken wanneer u een notitie bewerkt. Ook beschikbaar vanuit het opdrachtenpalet.',
      },
      minSeconds: {
        name: 'Minimaal aantal seconden tussen updates',
        desc: 'Voorkomt dat de datum te vaak wordt bijgewerkt terwijl u typt of tussen notities wisselt.',
      },
      changeDetection: {
        name: 'Wijzigingsdetectie (inhoud-hashing)',
        descEnabled:
          'De laatst-bewerkt-datum wordt alleen geschreven wanneer de inhoud van de notitie daadwerkelijk verandert - dit voorkomt valse updates van synchronisatie-plug-ins.',
        descDisabled:
          'Uitgeschakeld - de laatst-bewerkt-datum wordt bij elke opslag geschreven, ook als er niets is veranderd.',
      },
      hashTrackingMode: {
        name: 'Wat telt als een wijziging',
        desc: 'Welk deel van een notitie telt als een wijziging. "Alleen tekst" - het bewerken van eigenschappen (tags, aliassen, enz.) werkt de datum niet bij. "Alleen eigenschappen" - het bewerken van de notitietekst werkt de datum niet bij. "Beide" - elke bewerking werkt de datum bij.',
        optionBody: 'Alleen notitietekst (standaard)',
        optionFrontmatter: 'Alleen eigenschappen',
        optionBoth: 'Tekst en eigenschappen',
        changedNotice:
          'Bijhoudmodus gewijzigd. Bouw de hashcache opnieuw op (bij bulkbewerkingen) zodat datums nauwkeurig blijven.',
      },
      excludeKeys: {
        name: 'Deze eigenschappen negeren',
        desc: "Het bewerken van deze eigenschappen werkt de datum niet bij. U kunt er meerdere tegelijk toevoegen, gescheiden door komma's. De eigenschappen created, updated en viewed worden altijd automatisch genegeerd.",
        placeholder: 'Eigenschapsnaam zoals tags',
        addTooltip: 'Eigenschap toevoegen',
        chipRemoveAriaLabel: '{entry} verwijderen',
      },
    },
    filterRules: {
      name: 'Bestanden en mappen om over te slaan',
      descIntro:
        'Kies bestanden of mappen die met rust moeten worden gelaten (geen automatische datumupdates). ',
      descOnePerLine: 'Eén patroon per regel. Regels die beginnen met ',
      descCommentsAre: ' zijn opmerkingen. Begin een regel met ',
      descAddBack: ' om een pad terug toe te voegen. ',
      descLastWins: 'Als meerdere regels overeenkomen, wint de laatste.',
      advancedSyntaxLink: 'Geavanceerde syntaxis (gitignore-stijl)',
      noRulesWarning:
        'Geen regels ingesteld - alle notities krijgen automatische datumupdates.',
      placeholderExcludeFolder: '# Een map uitsluiten',
      placeholderExcludeByPattern: '# Uitsluiten op patroon',
      placeholderReinclude: '# Een specifiek bestand terug opnemen',
      parseError: 'Regel {lineNumber}: {message} - "{text}"',
      previewButton: 'Overeenkomende bestanden tonen',
      previewSummary:
        '{tracked} notities bijgehouden, {excluded} notities overgeslagen',
      skippedFilesSummary: 'Overgeslagen bestanden ({excluded})',
      skippedMore: '...en nog {count}',
      reference: {
        summary: 'Naslag voor patroonsyntaxis',
        sectionBasics: 'Syntaxisbasis',
        basicsCommentDesc: 'Regels die beginnen met # worden genegeerd',
        basicsBlankDesc: 'Lege regels worden genegeerd',
        basicsExcludeDesc:
          'Uitsluiten - bestanden in templates/ worden overgeslagen',
        basicsReincludeDesc:
          'Terug opnemen - prefix met ! om uitsluiting ongedaan te maken',
        basicsLastWinsDesc: 'Als meerdere regels overeenkomen, wint de laatste',
        sectionExcludeFolder: 'Een map uitsluiten',
        excludeFolderAllFilesDesc: 'Alle bestanden in templates/',
        excludeFolderSameEffectDesc:
          'Hetzelfde effect (afsluitende schuine streep is optioneel)',
        excludeFolderNestedDesc: 'Geneste map',
        sectionReinclude: 'Terug opnemen (een uitsluiting ongedaan maken)',
        reincludeExcludeWholeDesc: 'Sluit de hele map uit',
        reincludeKeepDesc: 'Maar blijf dit specifieke bestand bijhouden',
        sectionWildcards: 'Jokertekens',
        wildcardStarDesc: 'Alle tekens behalve /',
        wildcardDoubleStarDesc: 'Alle tekens inclusief / (over mappen heen)',
        wildcardQuestionDesc: 'Precies één teken',
        sectionWildcardExamples: 'Voorbeelden met jokertekens',
        wildcardExCanvasRootDesc:
          'Bestanden die eindigen op .canvas.md in de hoofdmap van de kluis',
        wildcardExCanvasAnyDesc:
          'Bestanden die eindigen op .canvas.md in een willekeurige map',
        wildcardExDailyDesc: 'Bestanden zoals daily/2024-01-01.md',
        wildcardExTwoCharDesc: 'Bestandsnamen van twee tekens in notes/',
        sectionSpecificFiles: 'Specifieke bestanden',
        specificFilesOneExactDesc: 'Eén exact bestand',
        specificFilesRootDesc: 'Een bestand in de hoofdmap van de kluis',
        sectionPathsWithSpaces: 'Paden met spaties',
        pathsWithSpacesAsIsDesc: 'Schrijf het pad gewoon zoals het is',
        pathsWithSpacesNoQuotesDesc: 'Geen aanhalingstekens nodig rond spaties',
        sectionNonLatin: 'Niet-Latijnse tekens',
        nonLatinCyrillicDesc: 'Cyrillische mapnaam',
        nonLatinChineseDesc: 'Chinese tekens',
        nonLatinFullPathDesc: 'Volledig niet-Latijns pad',
        sectionObsidianExamples: 'Obsidian-specifieke voorbeelden',
        obsidianTemplateFolderDesc: 'Sjabloonmap',
        obsidianDailyFolderDesc: 'Map met dagelijkse notities',
        obsidianAttachmentsDesc: 'Map met bijlagen / media',
        obsidianCanvasDesc: 'Alle canvasbestanden',
        obsidianExcalidrawDesc: 'Alle Excalidraw-tekeningen',
        obsidianInboxDesc: 'Map voor inbox / kladblok',
        obsidianArchiveDesc: 'Gearchiveerde notities',
        sectionAllowlist:
          'Witte-lijstmodus (alleen specifieke mappen bijhouden)',
        allowlistExcludeEverythingDesc: 'Sluit eerst alles uit',
        allowlistReincludeWantedDesc: 'Neem dan alleen op wat u wilt',
        allowlistReincludeAnotherDesc: 'Neem nog een map terug op',
        emptyNote:
          'Wanneer dit veld leeg is, krijgen alle notities automatische datumupdates.',
      },
    },
    inversions: {
      heading: 'Datum van wijziging vóór datum van aanmaak',
      strategy: {
        name: 'Hoe datums in verkeerde volgorde te herstellen',
        desc: 'Wat te doen wanneer de laatst-bewerkt-datum vroeger is dan de aanmaakdatum. Geldt voor automatische bewerkingen en stelt de standaard in voor het bulkhulpmiddel.',
        optionDisabled: 'Niet herstellen (alleen detecteren)',
        optionCreatedToUpdated:
          'Stel de aanmaakdatum gelijk aan de laatst-bewerkt-datum',
        optionUpdatedToCreated:
          'Stel de laatst-bewerkt-datum gelijk aan de aanmaakdatum',
        optionMaxAll: 'Stel beide in op de meest recente datum',
      },
      tolerance: {
        name: 'Kleine verschillen negeren (seconden)',
        desc: 'Negeer datums in verkeerde volgorde wanneer het verschil kleiner is dan dit. Een kleine waarde verbergt kleine klokverschillen.',
      },
    },
    advanced: {
      summary: 'Geavanceerd',
      newFileDelay: {
        name: 'Vertraging voor nieuwe bestanden',
        desc: 'Wacht dit aantal milliseconden voordat een datum op een nieuw aangemaakte notitie wordt gezet. Helpt conflicten met sjabloon-plug-ins te voorkomen. Stel in op 0 om uit te schakelen.',
      },
      autoPopulateCache: {
        name: 'Cache automatisch vullen bij opstarten',
        desc: 'Wanneer de plug-in laadt, bouw wijzigingsdetectiegegevens op voor notities die deze nog niet hebben. Wordt op de achtergrond uitgevoerd.',
      },
      maxCacheEntries: {
        name: 'Maximaal aantal cache-items',
        desc: 'Wanneer de cache deze limiet overschrijdt, worden de oudste ongebruikte items verwijderd. 0 = geen limiet.',
      },
      postUpdateCommand: {
        name: 'Opdracht na update',
        desc: 'Voer een Obsidian-opdracht uit nadat een datum is bijgewerkt. Laat leeg om uit te schakelen.',
        optionNone: 'Geen',
      },
    },
    bulk: {
      heading: 'Bulkbewerkingen',
      populate: {
        name: 'Datums instellen vanuit de eigen datums van het bestand',
        desc: 'Vul de aanmaak- en laatst-bewerkt-datums in vanuit de eigen aanmaak- en wijzigingsdatums van elk bestand op schijf. Ideaal voor de eerste instelling.',
        button: 'Datums invullen',
      },
      rename: {
        name: 'Een eigenschap hernoemen',
        desc: 'Verplaats waarden van een oude eigenschapsnaam naar een nieuwe in alle notities. Handig na het wijzigen van een eigenschapsnaam hierboven.',
        button: 'Eigenschap hernoemen',
      },
      reformat: {
        name: 'Bestaande datums opnieuw opmaken',
        desc: 'Zoek datums in een oud formaat en herschrijf ze in uw huidige formaat. Handig na het wijzigen van het datumformaat hierboven.',
        button: 'Datums opnieuw opmaken',
      },
      findInversions: {
        name: 'Datums in verkeerde volgorde zoeken',
        desc: 'Scan uw notities en toon degene waarvan de laatst-bewerkt-datum vroeger is dan de aanmaakdatum. U kunt vervolgens de hierboven gekozen oplossing toepassen.',
        button: 'Datums in verkeerde volgorde zoeken',
      },
      rebuildCache: {
        name: 'Hashcache opnieuw opbouwen',
        desc: 'Herbereken wijzigingsdetectiegegevens (inhoud-hashes) voor al uw notities. Handig na het wijzigen van wat hierboven als een wijziging telt.',
        button: 'Cache opnieuw opbouwen',
      },
    },
  },
  modals: {
    populate: {
      configureTitle: 'Datums instellen vanuit de eigen datums van het bestand',
      configureSubtitleLine1: 'Vul de aanmaak- en laatst-bewerkt-datums in',
      configureSubtitleLine2:
        'vanuit de eigen aanmaak- en wijzigingsdatums van elk bestand op schijf.',
      modeName: 'Welke datums instellen',
      modeDesc: 'Kies welke datums u wilt invullen.',
      modeOptionBoth: 'Zowel aangemaakt als bijgewerkt',
      modeOptionCreated: 'Alleen aanmaakdatums',
      modeOptionUpdated: 'Alleen wijzigingsdatums',
      overrideName: 'Bestanden die al datums hebben',
      overrideDesc:
        'Vul alleen de ontbrekende datums in, of overschrijf de bestaande.',
      overrideOptionFillMissing: 'Alleen ontbrekende invullen (veilig)',
      overrideOptionOverwriteAll: 'Alles overschrijven (vervangt bestaande)',
      autoUpdateNoteTitle: 'Opmerking over automatisch bijwerken:',
      autoUpdateNoteBody:
        'Als automatisch bijwerken actief is geweest, weerspiegelen de eigen datums van het bestand op schijf mogelijk al de bewerkingen van de plug-in zelf, niet de oorspronkelijke datums. Gebruik deze functie voor het beste resultaat voordat u automatisch bijwerken inschakelt of direct na het installeren van de plug-in.',
      warningTitleCreatedUnreliable:
        'De aanmaakdatum van het bestand is onbetrouwbaar op sommige platforms',
      warningTitlePlatformNote: 'Platformopmerking',
      platformMacWin: 'macOS / Windows',
      platformMacWinNote: 'echte aanmaakdatum van het bestand',
      platformLinux: 'Linux',
      platformLinuxNote:
        'systeem meldt een latere datum, niet de echte aanmaakdatum',
      platformAndroid: 'Android',
      platformAndroidNote: 'hangt af van het apparaat, vaak onbetrouwbaar',
      platformIos: 'iOS',
      platformIosNote: 'doorgaans betrouwbaar',
      platformReliable: 'Betrouwbaar',
      platformUnreliable: 'ONBETROUWBAAR',
      platformLineName: '{name}: {prefix}',
      platformYourPlatformSuffix: ' (uw platform)',
      syncNoteLine1:
        'Gesynchroniseerde kluizen: bestandsdatums kunnen worden gereset door synchronisatiediensten',
      syncNoteLine2: '(Obsidian Sync, iCloud, Dropbox, Git).',
      syncNoteLine3:
        'De laatst-bewerkt-datum is doorgaans betrouwbaarder dan de aanmaakdatum.',
      recommendation:
        'Aanbeveling: controleer de resultaten na het uitvoeren. Maak eerst een back-up.',
      overwriteWarning:
        'Dit vervangt bestaande datums in uw notities. Dit kan niet ongedaan worden gemaakt. Maak eerst een back-up.',
      noPropertyConfigured:
        'Geen eigenschapsnaam geconfigureerd voor: {missing}. Controleer de plug-in-instellingen.',
      previewTitle: 'Voorbeeld: datums instellen',
      noFilesNeedUpdating:
        'Geen bestanden hoeven te worden bijgewerkt. Alle in aanmerking komende bestanden hebben al de gevraagde datums.',
      previewOverwriteWarning:
        'Overschrijfmodus: bestaande datums worden vervangen. Dit kan niet ongedaan worden gemaakt. Maak eerst een back-up.',
      settingDates: 'Datums instellen…',
      stopped: 'Gestopt.',
      doneWithErrorsSubtitle: '{processed} bestand(en) bijgewerkt.',
      doneTitle: 'Klaar! {processed} bestand(en) bijgewerkt.',
    },
    rename: {
      configureTitle: 'Een eigenschap hernoemen',
      configureSubtitle:
        'Verplaats waarden van de ene eigenschapsnaam naar de andere in alle notities.',
      validationEnterOld: 'Voer de oude eigenschapsnaam in om door te gaan.',
      validationEnterNew: 'Voer de nieuwe eigenschapsnaam in om door te gaan.',
      validationMustDiffer:
        'Oude en nieuwe eigenschapsnaam moeten verschillen.',
      oldKeyName: 'Oude eigenschapsnaam',
      oldKeyDesc:
        'De eigenschapsnaam die momenteel in uw notities wordt gebruikt.',
      oldKeyPlaceholder: 'Date_created',
      newKeyName: 'Nieuwe eigenschapsnaam',
      newKeyDesc: 'De nieuwe eigenschapsnaam om te gebruiken.',
      newKeyPlaceholder: 'Created',
      deleteOldName: 'Oude eigenschap verwijderen na hernoemen',
      deleteOldDesc:
        'Verwijder de oude eigenschap na het kopiëren van de waarde naar de nieuwe.',
      namesCannotBeEmpty: 'Eigenschapsnamen mogen niet leeg zijn.',
      previewTitle: 'Voorbeeld: eigenschap hernoemen',
      noNotesUseProperty:
        'Geen enkele notitie gebruikt de eigenschap "{oldKey}".',
      conflictWarning:
        '{conflicts} notitie(s) hebben al de eigenschap "{newKey}". De bestaande waarde wordt overschreven.',
      columnArrowNew: '→ {newKey}',
      deleteWarning:
        'De oude eigenschap wordt verwijderd na het kopiëren. Dit kan niet ongedaan worden gemaakt. Maak eerst een back-up.',
      renamingProperty: 'Eigenschap hernoemen…',
      renameStopped: 'Hernoemen gestopt.',
      doneWithErrorsSubtitle: '{processed} bestand(en) bijgewerkt.',
      doneTitle: 'Klaar! {processed} bestand(en) bijgewerkt.',
    },
    reformat: {
      configureTitle: 'Datumformaat standaardiseren',
      configureSubtitle:
        'Lees bestaande datumwaarden en herschrijf ze met het huidige formaat uit de instellingen.',
      invalidFormat: 'Ongeldig formaat',
      targetFormatName: 'Doelformaat',
      targetFormatDesc: '{currentFormat}',
      scopeName: 'Welke velden opnieuw opmaken',
      scopeDesc: 'Kies welke datums u wilt standaardiseren.',
      scopeOptionAll: 'Alle datums',
      scopeOptionCreated: 'Alleen aangemaakt',
      scopeOptionUpdated: 'Alleen bijgewerkt',
      scopeOptionViewed: 'Alleen bekeken',
      autoDetectNote:
        'Datums worden automatisch herkend uit gangbare formaten (ISO 8601, Europees, VS, numerieke datums) en herschreven in uw huidige formaat.',
      noPropertyConfigured:
        'Geen eigenschapsnaam geconfigureerd voor: {missing}. Controleer de plug-in-instellingen.',
      previewTitle: 'Voorbeeld: datums standaardiseren',
      noChangeAmbiguous:
        'Nog niets om te converteren. {ambiguousCount} datum(s) kunnen op twee manieren worden gelezen en blijven ongewijzigd - kies hierboven een dag/maand-volgorde om ze te converteren.',
      noChangeDefault:
        'Geen bestanden hoeven opnieuw te worden opgemaakt. Alle datums zijn al in het doelformaat of konden niet worden gelezen.',
      errorWarningNoChange:
        '{errorCount} bestand(en) hebben datums die niet konden worden gelezen.',
      errorWarningWillSkip:
        '{errorCount} bestand(en) hebben datums die niet konden worden gelezen. Deze worden overgeslagen.',
      checkNote:
        'Rijen met [check] kunnen op twee manieren worden gelezen - bevestig dat de nieuwe datum er goed uitziet.',
      rewriteWarning:
        'Dit herschrijft bestaande datumwaarden ter plaatse. Dit kan niet ongedaan worden gemaakt. Maak eerst een back-up.',
      ambiguityName: 'Datums die op twee manieren kunnen worden gelezen',
      ambiguityDesc:
        '{ambiguousCount} datum(s) kunnen dag-eerst of maand-eerst betekenen (bijv. 01/05/2024).{detectedHint}',
      detectedHintMonthFirst: ' Uw systeem stelt maand eerst voor.',
      detectedHintDayFirst: ' Uw systeem stelt dag eerst voor.',
      ambiguityOptionSkip: 'Onduidelijke datums ongewijzigd laten',
      ambiguityOptionDmy: 'Dag eerst (01/05 = dag 1, maand 5)',
      ambiguityOptionMdy: 'Maand eerst (01/05 = maand 1, dag 5)',
      cellCouldNotRead: '{oldValue} (kon datum niet lezen)',
      cellConversion: '{oldValue} → {newValue}{check}',
      cellNewValue: '{newValue}{check}',
      cellCheckSuffix: ' [check]',
      reformattingDates: 'Datums opnieuw opmaken…',
      reformatStopped: 'Opnieuw opmaken gestopt.',
      doneWithErrorsSubtitle: '{processed} bestand(en) bijgewerkt.',
      doneTitle: 'Klaar! {processed} bestand(en) bijgewerkt.',
    },
    inversions: {
      scanningTitle: 'Datums in verkeerde volgorde zoeken…',
      foundTitle: '{count} notities met datums in verkeerde volgorde gevonden',
      foundSubtitle:
        'Deze notities hebben een laatst-bewerkt-datum die vroeger is dan de aanmaakdatum. Kies hieronder hoe u ze wilt herstellen, of sluit om handmatig te controleren.',
      noneFound: 'Geen datums in verkeerde volgorde gevonden.',
      strategyName: 'Hoe te herstellen',
      strategyDesc: 'Kies hoe u de datums wilt corrigeren.',
      strategyOptionDisabled: 'Niet herstellen (alleen bekijken)',
      strategyOptionCreatedToUpdated:
        'Stel de aanmaakdatum gelijk aan de laatst-bewerkt-datum',
      strategyOptionUpdatedToCreated:
        'Stel de laatst-bewerkt-datum gelijk aan de aanmaakdatum',
      strategyOptionMaxAll: 'Stel beide in op de meest recente datum',
      toleranceNote:
        'Verschillen onder {tolerance} seconden worden genegeerd (ingesteld in de instellingen).',
      columnDelta: 'Δ',
      fixWarning:
        'Dit wijzigt {count} notities. Dit kan niet ongedaan worden gemaakt. Maak eerst een back-up.',
      fixingDates: 'Datums herstellen…',
      stopped: 'Bulkbewerking gestopt.',
      fixedNotice: '{processed} notitie(s) hersteld.',
      doneWithErrorsSubtitle: '{processed} notitie(s) hersteld.',
      doneTitle: 'Klaar! U kunt dit venster veilig sluiten.',
    },
    rebuildCache: {
      loadingFiles: 'Bestanden laden…',
      confirmTitle:
        'Wijzigingsdetectiegegevens opnieuw opbouwen voor {count} bestanden',
      confirmSubtitle:
        'Dit herberekent de inhoudsvingerafdrukken (inhoud-hashes) die worden gebruikt om echte bewerkingen te herkennen. Het wijzigt uw notities niet.',
      rebuilding: 'Opnieuw opbouwen…',
      stopped: 'Bulkbewerking gestopt.',
      doneWithErrorsSubtitle: '{processed} bestand(en) verwerkt.',
      doneTitle: 'Klaar! U kunt dit venster veilig sluiten.',
    },
  },
};
