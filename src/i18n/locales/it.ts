// Italian. Machine-generated baseline. Improvements welcome - see CONTRIBUTING.md.
import type { Strings, DeepPartial } from '../index';

export const STRINGS_IT: DeepPartial<Strings> = {
  common: {
    run: 'Esegui',
    back: 'Indietro',
    cancel: 'Annulla',
    close: 'Chiudi',
    file: 'File',
    created: 'Creato',
    updated: 'Aggiornato',
    viewed: 'Visualizzato',
    createdKeyed: 'Creato ({key})',
    updatedKeyed: 'Aggiornato ({key})',
    viewedKeyed: 'Visualizzato ({key})',
    scanAndPreview: 'Scansiona e mostra anteprima',
    scanningFiles: 'Scansione dei file…',
    doneWithErrors: 'Completato con {errors} errore/i.',
  },

  commands: {
    updateCurrentFile: 'Aggiorna le date del file corrente',
    toggleAutoUpdate: 'Attiva/disattiva aggiornamento automatico',
    pauseAutoUpdate: 'Sospendi aggiornamento automatico per 5 minuti',
  },

  statusBar: {
    paused: 'In pausa',
    pausedWithMinutes: 'In pausa ({remaining}m)',
  },

  notices: {
    inversionDetectedAndFixed:
      'Frontmatter Date Manager: sono state rilevate e corrette date in ordine errato. Usa "Trova date in ordine errato" nelle impostazioni per verificarle.',
    timestampsUpdated: 'Date aggiornate.',
    fileIgnored: 'Il file viene ignorato dalle impostazioni del plugin.',
    failedToUpdateWithReason: 'Impossibile aggiornare le date: {reason}',
    failedToUpdate: 'Impossibile aggiornare le date.',
    autoUpdateEnabled: 'Aggiornamento automatico attivato',
    autoUpdateDisabled: 'Aggiornamento automatico disattivato',
    autoUpdatePausedForMinutes:
      'Aggiornamento automatico sospeso per {minutes} minuti. Riprenderà automaticamente.',
    autoUpdateResumed: 'Aggiornamento automatico ripreso.',
    malformedFrontmatter:
      'Frontmatter Date Manager non è riuscito\nProprietà non valide in questo file: {filePath}\n\n{message}',
  },

  bulkChrome: {
    summaryWillChange: 'File che verranno modificati: {changed}',
    summarySkipped: 'Saltati: {skipped}',
    summaryErrors: 'Errori: {errors}',
    pagerPrev: 'Precedente',
    pagerNext: 'Successiva',
    pageInfo: 'Pagina {current} di {total}',
    downloadFullPreview: 'Scarica anteprima completa',
    downloadSuccess:
      'Scaricate {count} riga/righe come {filename} nella cartella dei download.',
    downloadFailed: 'Impossibile scaricare il file di anteprima.',
    failureColumnError: 'Errore',
    progressCounter: '{count}/{max}',
  },

  settings: {
    description: {
      syncIntro:
        'I servizi di sincronizzazione, gli strumenti di backup e altri plugin spesso riscrivono i file senza modificarne il contenuto - e questo azzera le date del file sul disco. Così diventa impossibile sapere quando hai davvero modificato una nota per l’ultima volta.',
      pluginIntro:
        'Questo plugin scrive le date di creazione e di ultima modifica direttamente nelle proprietà di ogni nota e rileva le modifiche reali confrontando il contenuto, così le tue date riflettono le modifiche effettive - non gli artefatti della sincronizzazione.',
    },
    dates: {
      heading: 'Date da tracciare',
      enableNoneHint:
        'Attiva almeno una data qui sopra per configurare il plugin.',
      created: {
        enableName: 'Traccia la data di creazione',
        enableDesc:
          'Aggiunge una data di creazione alle note che non l’hanno ancora.',
        propertyName: 'Proprietà di creazione',
        propertyDesc:
          'Nome della proprietà in cui viene salvata la data di creazione.',
      },
      updated: {
        enableName: 'Traccia la data di ultima modifica',
        enableDesc: 'Aggiorna questa data ogni volta che modifichi la nota.',
        propertyName: 'Proprietà di aggiornamento',
        propertyDesc:
          'Nome della proprietà in cui viene salvata la data di ultima modifica.',
      },
      updateCount: {
        enableName: 'Conta le modifiche',
        enableDesc:
          'Aggiunge una proprietà numerica che aumenta di uno a ogni modifica di una nota. Un conteggio approssimativo dell’attività, non una cronologia esatta.',
        propertyName: 'Proprietà del conteggio modifiche',
        propertyDesc:
          'Nome della proprietà in cui viene salvato il conteggio delle modifiche.',
      },
      viewed: {
        enableName: 'Traccia la data di ultima apertura',
        enableDesc: 'Salva la data ogni volta che apri la nota.',
        propertyName: 'Proprietà di visualizzazione',
        propertyDesc:
          'Nome della proprietà in cui viene salvata la data di ultima apertura.',
      },
    },
    formatting: {
      heading: 'Formato delle date',
      dateFormat: {
        name: 'Formato della data',
        desc: 'Come le date e gli orari vengono scritti nelle tue note.',
        formatCodesLink: 'Vedi i codici di formato disponibili',
        currentlyPreview: 'Attualmente: {preview}',
        invalidWithHint: 'Formato non valido. {hint}',
        invalidFormat: 'Stringa di formato data non valida.',
        obsidianDefault:
          "Predefinito di Obsidian: yyyy-MM-dd'T'HH:mm:ss (data e ora, fuso orario locale)",
      },
      timezone: {
        name: 'Fuso orario',
        desc: 'Fuso orario usato per scrivere le date. Lascia vuoto per usare il fuso orario del tuo dispositivo ({localTz}).',
        placeholder: 'Locale ({localTz})',
        resetTooltip: 'Ripristina il fuso orario locale',
      },
      numberProperties: {
        name: 'Salva le date solo numeriche senza virgolette',
        desc: 'Se il tuo formato data è composto solo da cifre (come un timestamp unix), scrivila come numero semplice (updated: 1712930400) invece che come testo tra virgolette (updated: "1712930400"). Nessun effetto se il formato contiene trattini o due punti.',
      },
    },
    behavior: {
      heading: 'Comportamento',
      autoUpdate: {
        name: 'Aggiornamento automatico',
        desc: 'Aggiorna automaticamente le date quando modifichi una nota. Disponibile anche dalla tavolozza dei comandi.',
      },
      minSeconds: {
        name: 'Secondi minimi tra gli aggiornamenti',
        desc: 'Evita di aggiornare la data troppo spesso mentre digiti o passi da una nota all’altra.',
      },
      changeDetection: {
        name: 'Rilevamento delle modifiche (hashing del contenuto)',
        descEnabled:
          'La data di ultima modifica viene scritta solo quando il contenuto della nota cambia davvero - questo previene falsi aggiornamenti dovuti ai plugin di sincronizzazione.',
        descDisabled:
          'Disattivato - la data di ultima modifica viene scritta a ogni salvataggio, anche se nulla è cambiato.',
      },
      hashTrackingMode: {
        name: 'Cosa conta come modifica',
        desc: 'Quale parte di una nota conta come modifica. "Solo corpo" - modificare le proprietà (tag, alias, ecc.) non aggiornerà la data. "Solo proprietà" - modificare il testo della nota non aggiornerà la data. "Entrambi" - qualsiasi modifica aggiorna la data.',
        optionBody: 'Solo corpo della nota (predefinito)',
        optionFrontmatter: 'Solo proprietà',
        optionBoth: 'Corpo e proprietà',
        changedNotice:
          'Modalità di tracciamento cambiata. Ricostruisci la cache degli hash (nelle operazioni in blocco) affinché le date restino accurate.',
      },
      excludeKeys: {
        name: 'Ignora queste proprietà',
        desc: 'Modificare queste proprietà non aggiornerà la data. Puoi aggiungerne diverse in una volta, separate da virgole. Le proprietà created, updated e viewed vengono sempre ignorate automaticamente.',
        placeholder: 'Nome di una proprietà, ad esempio tags',
        addTooltip: 'Aggiungi proprietà',
        chipRemoveAriaLabel: 'Rimuovi {entry}',
      },
    },
    filterRules: {
      name: 'File e cartelle da saltare',
      descIntro:
        'Scegli i file o le cartelle da lasciare intatti (nessun aggiornamento automatico delle date). ',
      descOnePerLine: 'Un modello per riga. Le righe che iniziano con ',
      descCommentsAre: ' sono commenti. Inizia una riga con ',
      descAddBack: ' per riaggiungere un percorso. ',
      descLastWins: 'Se più righe corrispondono, vince l’ultima.',
      advancedSyntaxLink: 'Sintassi avanzata (stile gitignore)',
      noRulesWarning:
        'Nessuna regola impostata - tutte le note ricevono aggiornamenti automatici delle date.',
      placeholderExcludeFolder: '# Escludi una cartella',
      placeholderExcludeByPattern: '# Escludi per modello',
      placeholderReinclude: '# Riaggiungi un file specifico',
      parseError: 'Riga {lineNumber}: {message} - "{text}"',
      previewButton: 'Mostra anteprima dei file corrispondenti',
      previewSummary: '{tracked} note tracciate, {excluded} note saltate',
      skippedFilesSummary: 'File saltati ({excluded})',
      skippedMore: '...e altri {count}',
      reference: {
        summary: 'Riferimento alla sintassi dei modelli',
        sectionBasics: 'Nozioni di base sulla sintassi',
        basicsCommentDesc: 'Le righe che iniziano con # vengono ignorate',
        basicsBlankDesc: 'Le righe vuote vengono ignorate',
        basicsExcludeDesc: 'Escludi - i file dentro templates/ vengono saltati',
        basicsReincludeDesc:
          'Riaggiungi - usa il prefisso ! per annullare l’esclusione',
        basicsLastWinsDesc: 'Quando più regole corrispondono, vince l’ultima',
        sectionExcludeFolder: 'Escludi una cartella',
        excludeFolderAllFilesDesc: 'Tutti i file dentro templates/',
        excludeFolderSameEffectDesc:
          'Stesso effetto (la barra finale è facoltativa)',
        excludeFolderNestedDesc: 'Cartella annidata',
        sectionReinclude: 'Riaggiungi (annulla un’esclusione)',
        reincludeExcludeWholeDesc: 'Escludi l’intera cartella',
        reincludeKeepDesc: 'Ma continua a tracciare questo file specifico',
        sectionWildcards: 'Caratteri jolly',
        wildcardStarDesc: 'Qualsiasi carattere tranne /',
        wildcardDoubleStarDesc:
          'Qualsiasi carattere incluso / (attraversa le cartelle)',
        wildcardQuestionDesc: 'Esattamente un carattere',
        sectionWildcardExamples: 'Esempi con caratteri jolly',
        wildcardExCanvasRootDesc:
          'File che terminano in .canvas.md nella radice del vault',
        wildcardExCanvasAnyDesc:
          'File che terminano in .canvas.md in qualsiasi cartella',
        wildcardExDailyDesc: 'File come daily/2024-01-01.md',
        wildcardExTwoCharDesc: 'Nomi di file di due caratteri in notes/',
        sectionSpecificFiles: 'File specifici',
        specificFilesOneExactDesc: 'Un file esatto',
        specificFilesRootDesc: 'Un file nella radice del vault',
        sectionPathsWithSpaces: 'Percorsi con spazi',
        pathsWithSpacesAsIsDesc: 'Scrivi semplicemente il percorso così com’è',
        pathsWithSpacesNoQuotesDesc:
          'Non servono virgolette attorno agli spazi',
        sectionNonLatin: 'Caratteri non latini',
        nonLatinCyrillicDesc: 'Nome di cartella in cirillico',
        nonLatinChineseDesc: 'Caratteri cinesi',
        nonLatinFullPathDesc: 'Percorso completo non latino',
        sectionObsidianExamples: 'Esempi specifici per Obsidian',
        obsidianTemplateFolderDesc: 'Cartella dei modelli',
        obsidianDailyFolderDesc: 'Cartella delle note giornaliere',
        obsidianAttachmentsDesc: 'Cartella degli allegati / media',
        obsidianCanvasDesc: 'Tutti i file canvas',
        obsidianExcalidrawDesc: 'Tutti i disegni Excalidraw',
        obsidianInboxDesc: 'Cartella in arrivo / blocco appunti',
        obsidianArchiveDesc: 'Note archiviate',
        sectionAllowlist:
          'Modalità lista consentiti (traccia solo cartelle specifiche)',
        allowlistExcludeEverythingDesc: 'Prima escludi tutto',
        allowlistReincludeWantedDesc: 'Poi riaggiungi solo ciò che vuoi',
        allowlistReincludeAnotherDesc: 'Riaggiungi un’altra cartella',
        emptyNote:
          'Quando questo campo è vuoto, tutte le note ricevono aggiornamenti automatici delle date.',
      },
    },
    inversions: {
      heading: 'Data di modifica precedente alla data di creazione',
      strategy: {
        name: 'Come correggere le date in ordine errato',
        desc: 'Cosa fare quando la data di ultima modifica è precedente alla data di creazione. Si applica alle modifiche automatiche e imposta il valore predefinito per lo strumento in blocco.',
        optionDisabled: 'Non correggere (solo rileva)',
        optionCreatedToUpdated:
          'Imposta la data di creazione uguale alla data di ultima modifica',
        optionUpdatedToCreated:
          'Imposta la data di ultima modifica uguale alla data di creazione',
        optionMaxAll: 'Imposta entrambe alla data più recente',
      },
      tolerance: {
        name: 'Ignora differenze minime (secondi)',
        desc: 'Ignora le date in ordine errato quando lo scarto è inferiore a questo valore. Un valore piccolo nasconde minime differenze dell’orologio.',
      },
    },
    advanced: {
      summary: 'Avanzate',
      newFileDelay: {
        name: 'Ritardo per i nuovi file',
        desc: 'Attendi questi millisecondi prima di applicare una data a una nota appena creata. Aiuta a evitare conflitti con i plugin dei modelli. Imposta a 0 per disattivare.',
      },
      autoPopulateCache: {
        name: 'Popola la cache all’avvio',
        desc: 'Quando il plugin si carica, crea i dati di rilevamento delle modifiche per le note che non li hanno ancora. Funziona in background.',
      },
      maxCacheEntries: {
        name: 'Numero massimo di voci nella cache',
        desc: 'Quando la cache supera questo limite, le voci inutilizzate più vecchie vengono rimosse. 0 = nessun limite.',
      },
      postUpdateCommand: {
        name: 'Comando dopo l’aggiornamento',
        desc: 'Esegui un comando di Obsidian dopo l’aggiornamento di una data. Lascia vuoto per disattivare.',
        optionNone: 'Nessuno',
      },
    },
    bulk: {
      heading: 'Operazioni in blocco',
      populate: {
        name: 'Imposta le date dalle date proprie del file',
        desc: 'Compila le date di creazione e di ultima modifica dalle date di creazione e modifica proprie di ogni file sul disco. Ottimo per la prima configurazione.',
        button: 'Compila le date',
      },
      rename: {
        name: 'Rinomina una proprietà',
        desc: 'Sposta i valori da un vecchio nome di proprietà a uno nuovo in tutte le note. Utile dopo aver cambiato il nome di una proprietà qui sopra.',
        button: 'Rinomina proprietà',
      },
      reformat: {
        name: 'Riformatta le date esistenti',
        desc: 'Trova le date scritte in un vecchio formato e riscrivile nel tuo formato attuale. Utile dopo aver cambiato il formato della data qui sopra.',
        button: 'Riformatta le date',
      },
      findInversions: {
        name: 'Trova date in ordine errato',
        desc: 'Scansiona le tue note ed elenca quelle in cui la data di ultima modifica è precedente alla data di creazione. Puoi poi applicare la correzione scelta qui sopra.',
        button: 'Trova date in ordine errato',
      },
      rebuildCache: {
        name: 'Ricostruisci la cache degli hash',
        desc: 'Ricalcola i dati di rilevamento delle modifiche (hash del contenuto) per tutte le tue note. Utile dopo aver cambiato cosa conta come modifica qui sopra.',
        button: 'Ricostruisci la cache',
      },
    },
  },

  modals: {
    populate: {
      configureTitle: 'Imposta le date dalle date proprie del file',
      configureSubtitleLine1:
        'Compila le date di creazione e di ultima modifica',
      configureSubtitleLine2:
        'dalle date di creazione e modifica proprie di ogni file sul disco.',
      modeName: 'Quali date impostare',
      modeDesc: 'Scegli quali date compilare.',
      modeOptionBoth: 'Sia creazione che aggiornamento',
      modeOptionCreated: 'Solo date di creazione',
      modeOptionUpdated: 'Solo date di aggiornamento',
      overrideName: 'File che hanno già delle date',
      overrideDesc:
        'Compila solo le date mancanti o sovrascrivi quelle esistenti.',
      overrideOptionFillMissing: 'Solo quelle mancanti (sicuro)',
      overrideOptionOverwriteAll:
        'Sovrascrivi tutte (sostituisce quelle esistenti)',
      autoUpdateNoteTitle: 'Nota sull’aggiornamento automatico:',
      autoUpdateNoteBody:
        'Se l’aggiornamento automatico è stato attivo, le date proprie del file sul disco potrebbero già riflettere le modifiche del plugin stesso, non le date originali. Per risultati ottimali, usa questa funzione prima di attivare l’aggiornamento automatico o subito dopo aver installato il plugin.',
      warningTitleCreatedUnreliable:
        'La data di creazione del file è inaffidabile su alcune piattaforme',
      warningTitlePlatformNote: 'Nota sulla piattaforma',
      platformMacWinNote: 'data di creazione reale del file',
      platformLinuxNote:
        'il sistema riporta una data più recente, non la data di creazione reale',
      platformAndroidNote: 'dipende dal dispositivo, spesso inaffidabile',
      platformIosNote: 'generalmente affidabile',
      platformReliable: 'Affidabile',
      platformUnreliable: 'INAFFIDABILE',
      platformYourPlatformSuffix: ' (la tua piattaforma)',
      syncNoteLine1:
        'Vault sincronizzati: le date dei file possono essere azzerate dai servizi di sincronizzazione',
      syncNoteLine3:
        'La data di ultima modifica è di solito più affidabile della data di creazione.',
      recommendation:
        'Consiglio: controlla i risultati dopo l’esecuzione. Fai prima un backup.',
      overwriteWarning:
        'Questo sostituirà le date esistenti nelle tue note. Non si può annullare. Fai prima un backup.',
      noPropertyConfigured:
        'Nessun nome di proprietà configurato per: {missing}. Controlla le impostazioni del plugin.',
      previewTitle: 'Anteprima: imposta le date',
      noFilesNeedUpdating:
        'Nessun file da aggiornare. Tutti i file idonei hanno già le date richieste.',
      previewOverwriteWarning:
        'Modalità di sovrascrittura: le date esistenti verranno sostituite. Non si può annullare. Fai prima un backup.',
      settingDates: 'Impostazione delle date…',
      stopped: 'Interrotto.',
      doneWithErrorsSubtitle: 'File aggiornati: {processed}.',
      doneTitle: 'Fatto! File aggiornati: {processed}.',
    },
    rename: {
      configureTitle: 'Rinomina una proprietà',
      configureSubtitle:
        'Sposta i valori da un nome di proprietà a un altro in tutte le note.',
      validationEnterOld:
        'Inserisci il vecchio nome della proprietà per continuare.',
      validationEnterNew:
        'Inserisci il nuovo nome della proprietà per continuare.',
      validationMustDiffer:
        'Il vecchio e il nuovo nome della proprietà devono essere diversi.',
      oldKeyName: 'Vecchio nome della proprietà',
      oldKeyDesc: 'Il nome della proprietà attualmente usato nelle tue note.',
      newKeyName: 'Nuovo nome della proprietà',
      newKeyDesc: 'Il nuovo nome di proprietà da usare.',
      deleteOldName: 'Elimina la vecchia proprietà dopo la rinomina',
      deleteOldDesc:
        'Rimuovi la vecchia proprietà dopo aver copiato il suo valore in quella nuova.',
      namesCannotBeEmpty: 'I nomi delle proprietà non possono essere vuoti.',
      previewTitle: 'Anteprima: rinomina proprietà',
      noNotesUseProperty: 'Nessuna nota usa la proprietà "{oldKey}".',
      conflictWarning:
        '{conflicts} nota/e hanno già la proprietà "{newKey}". Il valore esistente verrà sovrascritto.',
      columnArrowNew: '→ {newKey}',
      deleteWarning:
        'La vecchia proprietà verrà eliminata dopo la copia. Non si può annullare. Fai prima un backup.',
      renamingProperty: 'Rinomina della proprietà…',
      renameStopped: 'Rinomina interrotta.',
      doneWithErrorsSubtitle: 'File aggiornati: {processed}.',
      doneTitle: 'Fatto! File aggiornati: {processed}.',
    },
    reformat: {
      configureTitle: 'Standardizza il formato delle date',
      configureSubtitle:
        'Analizza i valori di data esistenti e riscrivili usando il formato attuale dalle impostazioni.',
      invalidFormat: 'Formato non valido',
      targetFormatName: 'Formato di destinazione',
      scopeName: 'Quali campi riformattare',
      scopeDesc: 'Scegli quali date standardizzare.',
      scopeOptionAll: 'Tutte le date',
      scopeOptionCreated: 'Solo creazione',
      scopeOptionUpdated: 'Solo aggiornamento',
      scopeOptionViewed: 'Solo visualizzazione',
      autoDetectNote:
        'Le date vengono rilevate automaticamente dai formati comuni (ISO 8601, europeo, statunitense, date numeriche) e riscritte nel tuo formato attuale.',
      noPropertyConfigured:
        'Nessun nome di proprietà configurato per: {missing}. Controlla le impostazioni del plugin.',
      previewTitle: 'Anteprima: standardizza le date',
      noChangeAmbiguous:
        'Ancora nulla da convertire. {ambiguousCount} data/e possono essere lette in due modi e vengono lasciate invariate - scegli un ordine giorno/mese qui sopra per convertirle.',
      noChangeDefault:
        'Nessun file da riformattare. Tutte le date sono già nel formato di destinazione oppure non sono state interpretate.',
      errorWarningNoChange:
        '{errorCount} file hanno date che non sono state interpretate.',
      errorWarningWillSkip:
        '{errorCount} file hanno date che non sono state interpretate. Verranno saltati.',
      checkNote:
        'Le righe contrassegnate con [check] possono essere lette in due modi - verifica che la nuova data sia corretta.',
      rewriteWarning:
        'Questo riscrive sul posto i valori di data esistenti. Non si può annullare. Fai prima un backup.',
      ambiguityName: 'Date che possono essere lette in due modi',
      ambiguityDesc:
        '{ambiguousCount} data/e possono significare giorno-prima o mese-prima (ad esempio 01/05/2024).{detectedHint}',
      detectedHintMonthFirst: ' Il tuo sistema suggerisce il mese prima.',
      detectedHintDayFirst: ' Il tuo sistema suggerisce il giorno prima.',
      ambiguityOptionSkip: 'Lascia invariate le date poco chiare',
      ambiguityOptionDmy: 'Giorno prima (01/05 = giorno 1, mese 5)',
      ambiguityOptionMdy: 'Mese prima (01/05 = mese 1, giorno 5)',
      cellCouldNotRead: '{oldValue} (impossibile leggere la data)',
      cellConversion: '{oldValue} → {newValue}{check}',
      cellNewValue: '{newValue}{check}',
      cellCheckSuffix: ' [check]',
      reformattingDates: 'Riformattazione delle date…',
      reformatStopped: 'Riformattazione interrotta.',
      doneWithErrorsSubtitle: 'File aggiornati: {processed}.',
      doneTitle: 'Fatto! File aggiornati: {processed}.',
    },
    inversions: {
      scanningTitle: 'Ricerca di date in ordine errato…',
      foundTitle: 'Trovate {count} note con date in ordine errato',
      foundSubtitle:
        'Queste note hanno una data di ultima modifica precedente alla data di creazione. Scegli qui sotto come correggerle, oppure chiudi per verificarle manualmente.',
      noneFound: 'Nessuna data in ordine errato trovata.',
      strategyName: 'Come correggere',
      strategyDesc: 'Scegli come correggere le date.',
      strategyOptionDisabled: 'Non correggere (solo verifica)',
      strategyOptionCreatedToUpdated:
        'Imposta la data di creazione uguale alla data di ultima modifica',
      strategyOptionUpdatedToCreated:
        'Imposta la data di ultima modifica uguale alla data di creazione',
      strategyOptionMaxAll: 'Imposta entrambe alla data più recente',
      toleranceNote:
        'Vengono ignorate le differenze inferiori a {tolerance} secondi (impostato nelle impostazioni).',
      fixWarning:
        'Questo modificherà {count} note. Non si può annullare. Fai prima un backup.',
      fixingDates: 'Correzione delle date…',
      stopped: 'Operazione in blocco interrotta.',
      fixedNotice: 'Note corrette: {processed}.',
      doneWithErrorsSubtitle: 'Note corrette: {processed}.',
      doneTitle: 'Fatto! Puoi chiudere tranquillamente questa finestra.',
    },
    rebuildCache: {
      loadingFiles: 'Caricamento dei file…',
      confirmTitle:
        'Ricostruisci i dati di rilevamento delle modifiche per {count} file',
      confirmSubtitle:
        'Questo ricalcola le impronte del contenuto (hash del contenuto) usate per rilevare le modifiche reali. Non cambia le tue note.',
      rebuilding: 'Ricostruzione…',
      stopped: 'Operazione in blocco interrotta.',
      doneWithErrorsSubtitle: 'File elaborati: {processed}.',
      doneTitle: 'Fatto! Puoi chiudere tranquillamente questa finestra.',
    },
  },
};
