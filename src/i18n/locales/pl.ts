// Polish. Machine-generated baseline. Improvements welcome - see CONTRIBUTING.md.
import type { Strings, DeepPartial } from '../index';

export const STRINGS_PL: DeepPartial<Strings> = {
  common: {
    run: 'Uruchom',
    back: 'Wstecz',
    cancel: 'Anuluj',
    close: 'Zamknij',
    file: 'Plik',
    created: 'Utworzono',
    updated: 'Zaktualizowano',
    viewed: 'Wyświetlono',
    createdKeyed: 'Utworzono ({key})',
    updatedKeyed: 'Zaktualizowano ({key})',
    viewedKeyed: 'Wyświetlono ({key})',
    scanAndPreview: 'Skanuj i podejrzyj',
    scanningFiles: 'Skanowanie plików…',
    doneWithErrors: 'Gotowe. Liczba błędów: {errors}.',
  },

  commands: {
    updateCurrentFile: 'Zaktualizuj daty w bieżącym pliku',
    toggleAutoUpdate: 'Włącz/wyłącz automatyczną aktualizację',
    pauseAutoUpdate: 'Wstrzymaj automatyczną aktualizację na 5 minut',
  },

  statusBar: {
    paused: 'Wstrzymano',
    pausedWithMinutes: 'Wstrzymano ({remaining}m)',
  },

  notices: {
    inversionDetectedAndFixed:
      'Frontmatter Date Manager: wykryto i poprawiono daty w złej kolejności. Otwórz "Znajdź daty w złej kolejności" w ustawieniach, aby je przejrzeć.',
    timestampsUpdated: 'Daty zaktualizowane.',
    fileIgnored: 'Plik jest pomijany przez ustawienia wtyczki.',
    failedToUpdateWithReason: 'Nie udało się zaktualizować dat: {reason}',
    failedToUpdate: 'Nie udało się zaktualizować dat.',
    autoUpdateEnabled: 'Automatyczna aktualizacja włączona',
    autoUpdateDisabled: 'Automatyczna aktualizacja wyłączona',
    autoUpdatePausedForMinutes:
      'Automatyczna aktualizacja wstrzymana na {minutes} minut. Wznowi się automatycznie.',
    autoUpdateResumed: 'Automatyczna aktualizacja wznowiona.',
    malformedFrontmatter:
      'Frontmatter Date Manager: niepowodzenie\nNieprawidłowe właściwości w pliku: {filePath}\n\n{message}',
  },

  bulkChrome: {
    summaryWillChange: 'Plików do zmiany: {changed}',
    summarySkipped: 'Pominięto: {skipped}',
    summaryErrors: 'Błędów: {errors}',
    pagerPrev: 'Poprzednia',
    pagerNext: 'Następna',
    pageInfo: 'Strona {current} z {total}',
    downloadFullPreview: 'Pobierz pełny podgląd',
    downloadSuccess:
      'Pobrano wierszy: {count}. Plik {filename} w folderze pobranych.',
    downloadFailed: 'Nie udało się pobrać pliku podglądu.',
    failureColumnError: 'Błąd',
    progressCounter: '{count}/{max}',
  },

  settings: {
    description: {
      syncIntro:
        'Usługi synchronizacji, narzędzia kopii zapasowych i inne wtyczki często nadpisują pliki bez zmiany ich treści - co resetuje daty pliku na dysku. Przez to nie da się stwierdzić, kiedy naprawdę ostatnio edytowano notatkę.',
      pluginIntro:
        'Ta wtyczka zapisuje daty utworzenia i ostatniej edycji bezpośrednio we właściwościach każdej notatki oraz wykrywa rzeczywiste zmiany, porównując treść, więc daty odzwierciedlają faktyczne edycje, a nie artefakty synchronizacji.',
    },
    dates: {
      heading: 'Daty do śledzenia',
      enableNoneHint:
        'Włącz powyżej co najmniej jedną datę, aby skonfigurować wtyczkę.',
      created: {
        enableName: 'Śledź datę utworzenia',
        enableDesc:
          'Dodaj datę utworzenia notatkom, które jej jeszcze nie mają.',
        propertyName: 'Właściwość daty utworzenia',
        propertyDesc:
          'Nazwa właściwości, w której zapisywana jest data utworzenia.',
      },
      updated: {
        enableName: 'Śledź datę ostatniej edycji',
        enableDesc: 'Aktualizuj tę datę przy każdej edycji notatki.',
        propertyName: 'Właściwość daty edycji',
        propertyDesc:
          'Nazwa właściwości, w której zapisywana jest data ostatniej edycji.',
      },
      updateCount: {
        enableName: 'Licz edycje',
        enableDesc:
          'Dodaj właściwość liczbową, która rośnie o jeden przy każdej edycji notatki. Przybliżony licznik aktywności, a nie dokładna historia.',
        propertyName: 'Właściwość licznika edycji',
        propertyDesc:
          'Nazwa właściwości, w której zapisywany jest licznik edycji.',
      },
      viewed: {
        enableName: 'Śledź datę ostatniego otwarcia',
        enableDesc: 'Zapisuj datę przy każdym otwarciu notatki.',
        propertyName: 'Właściwość daty otwarcia',
        propertyDesc:
          'Nazwa właściwości, w której zapisywana jest data ostatniego otwarcia.',
      },
    },
    formatting: {
      heading: 'Format daty',
      dateFormat: {
        name: 'Format daty',
        desc: 'Jak daty i godziny są zapisywane w twoich notatkach.',
        formatCodesLink: 'Zobacz dostępne kody formatu',
        currentlyPreview: 'Aktualnie: {preview}',
        invalidWithHint: 'Nieprawidłowy format. {hint}',
        invalidFormat: 'Nieprawidłowy ciąg formatu daty.',
        obsidianDefault:
          "Domyślny format Obsidian: yyyy-MM-dd'T'HH:mm:ss (data i godzina, lokalna strefa czasowa)",
      },
      timezone: {
        name: 'Strefa czasowa',
        desc: 'Strefa czasowa używana przy zapisie dat. Pozostaw puste, aby użyć strefy czasowej urządzenia ({localTz}).',
        placeholder: 'Lokalna ({localTz})',
        resetTooltip: 'Przywróć lokalną strefę czasową',
      },
      numberProperties: {
        name: 'Zapisuj daty liczbowe bez cudzysłowów',
        desc: 'Jeśli twój format daty to tylko cyfry (jak znacznik czasu unix), zapisuj ją jako zwykłą liczbę (updated: 1712930400) zamiast tekstu w cudzysłowach (updated: "1712930400"). Bez efektu, gdy format zawiera myślniki lub dwukropki.',
      },
    },
    behavior: {
      heading: 'Zachowanie',
      autoUpdate: {
        name: 'Automatyczna aktualizacja',
        desc: 'Automatycznie aktualizuj daty przy edycji notatki. Dostępne także z palety poleceń.',
      },
      minSeconds: {
        name: 'Minimalna liczba sekund między aktualizacjami',
        desc: 'Zapobiega zbyt częstej aktualizacji daty podczas pisania lub przełączania między notatkami.',
      },
      changeDetection: {
        name: 'Wykrywanie zmian (haszowanie treści)',
        descEnabled:
          'Data ostatniej edycji jest zapisywana tylko wtedy, gdy treść notatki rzeczywiście się zmienia - zapobiega to fałszywym aktualizacjom od wtyczek synchronizacji.',
        descDisabled:
          'Wyłączone - data ostatniej edycji jest zapisywana przy każdym zapisie, nawet jeśli nic się nie zmieniło.',
      },
      hashTrackingMode: {
        name: 'Co liczy się jako zmiana',
        desc: 'Która część notatki liczy się jako zmiana. "Tylko treść" - edycja właściwości (tagi, aliasy itp.) nie zaktualizuje daty. "Tylko właściwości" - edycja tekstu notatki nie zaktualizuje daty. "Oba" - każda edycja aktualizuje datę.',
        optionBody: 'Tylko treść notatki (domyślnie)',
        optionFrontmatter: 'Tylko właściwości',
        optionBoth: 'Treść i właściwości',
        changedNotice:
          'Tryb śledzenia zmieniony. Przebuduj pamięć podręczną haszy (w operacjach zbiorczych), aby daty pozostały dokładne.',
      },
      excludeKeys: {
        name: 'Ignoruj te właściwości',
        desc: 'Edycja tych właściwości nie zaktualizuje daty. Możesz dodać kilka naraz, oddzielając je przecinkami. Właściwości created, updated i viewed są zawsze ignorowane automatycznie.',
        placeholder: 'Nazwa właściwości, np. tags',
        addTooltip: 'Dodaj właściwość',
        chipRemoveAriaLabel: 'Usuń {entry}',
      },
    },
    filterRules: {
      name: 'Pliki i foldery do pominięcia',
      descIntro:
        'Wybierz pliki lub foldery, które mają pozostać nietknięte (bez automatycznej aktualizacji dat). ',
      descOnePerLine: 'Jeden wzorzec w wierszu. Wiersze zaczynające się od ',
      descCommentsAre: ' to komentarze. Zacznij wiersz od ',
      descAddBack: ' aby ponownie dodać ścieżkę. ',
      descLastWins: 'Jeśli pasuje kilka wierszy, wygrywa ostatni.',
      advancedSyntaxLink: 'Zaawansowana składnia (w stylu gitignore)',
      noRulesWarning:
        'Brak reguł - wszystkie notatki otrzymują automatyczną aktualizację dat.',
      placeholderExcludeFolder: '# Wyklucz folder',
      placeholderExcludeByPattern: '# Wyklucz według wzorca',
      placeholderReinclude: '# Ponownie uwzględnij konkretny plik',
      parseError: 'Wiersz {lineNumber}: {message} - "{text}"',
      previewButton: 'Pokaż pasujące pliki',
      previewSummary: 'Śledzonych notatek: {tracked}, pominiętych: {excluded}',
      skippedFilesSummary: 'Pominięte pliki ({excluded})',
      skippedMore: '...i jeszcze {count}',
      reference: {
        summary: 'Dokumentacja składni wzorców',
        sectionBasics: 'Podstawy składni',
        basicsCommentDesc: 'Wiersze zaczynające się od # są ignorowane',
        basicsBlankDesc: 'Puste wiersze są ignorowane',
        basicsExcludeDesc:
          'Wykluczenie - pliki wewnątrz templates/ są pomijane',
        basicsReincludeDesc:
          'Ponowne uwzględnienie - prefiks ! cofa wykluczenie',
        basicsLastWinsDesc: 'Gdy pasuje wiele reguł, wygrywa ostatnia',
        sectionExcludeFolder: 'Wyklucz folder',
        excludeFolderAllFilesDesc: 'Wszystkie pliki wewnątrz templates/',
        excludeFolderSameEffectDesc:
          'Ten sam efekt (końcowy ukośnik jest opcjonalny)',
        excludeFolderNestedDesc: 'Zagnieżdżony folder',
        sectionReinclude: 'Ponowne uwzględnienie (cofnięcie wykluczenia)',
        reincludeExcludeWholeDesc: 'Wyklucz cały folder',
        reincludeKeepDesc: 'Ale śledź dalej ten konkretny plik',
        sectionWildcards: 'Symbole wieloznaczne',
        wildcardStarDesc: 'Dowolne znaki oprócz /',
        wildcardDoubleStarDesc:
          'Dowolne znaki włącznie z / (przechodzi przez foldery)',
        wildcardQuestionDesc: 'Dokładnie jeden znak',
        sectionWildcardExamples: 'Przykłady z symbolami wieloznacznymi',
        wildcardExCanvasRootDesc:
          'Pliki kończące się na .canvas.md w katalogu głównym skarbca',
        wildcardExCanvasAnyDesc:
          'Pliki kończące się na .canvas.md w dowolnym folderze',
        wildcardExDailyDesc: 'Pliki w rodzaju daily/2024-01-01.md',
        wildcardExTwoCharDesc: 'Dwuznakowe nazwy plików w notes/',
        sectionSpecificFiles: 'Konkretne pliki',
        specificFilesOneExactDesc: 'Jeden dokładny plik',
        specificFilesRootDesc: 'Plik w katalogu głównym skarbca',
        sectionPathsWithSpaces: 'Ścieżki ze spacjami',
        pathsWithSpacesAsIsDesc: 'Po prostu wpisz ścieżkę bez zmian',
        pathsWithSpacesNoQuotesDesc: 'Cudzysłowy wokół spacji nie są potrzebne',
        sectionNonLatin: 'Znaki niełacińskie',
        nonLatinCyrillicDesc: 'Nazwa folderu cyrylicą',
        nonLatinChineseDesc: 'Znaki chińskie',
        nonLatinFullPathDesc: 'Pełna ścieżka niełacińska',
        sectionObsidianExamples: 'Przykłady dla Obsidian',
        obsidianTemplateFolderDesc: 'Folder szablonów',
        obsidianDailyFolderDesc: 'Folder notatek dziennych',
        obsidianAttachmentsDesc: 'Folder załączników / mediów',
        obsidianCanvasDesc: 'Wszystkie pliki kanw',
        obsidianExcalidrawDesc: 'Wszystkie rysunki Excalidraw',
        obsidianInboxDesc: 'Folder skrzynki / brudnopisu',
        obsidianArchiveDesc: 'Zarchiwizowane notatki',
        sectionAllowlist:
          'Tryb listy dozwolonych (śledź tylko określone foldery)',
        allowlistExcludeEverythingDesc: 'Najpierw wyklucz wszystko',
        allowlistReincludeWantedDesc:
          'Następnie uwzględnij tylko to, co chcesz',
        allowlistReincludeAnotherDesc: 'Uwzględnij kolejny folder',
        emptyNote:
          'Gdy to pole jest puste, wszystkie notatki otrzymują automatyczną aktualizację dat.',
      },
    },
    inversions: {
      heading: 'Data edycji wcześniejsza niż data utworzenia',
      strategy: {
        name: 'Jak poprawiać daty w złej kolejności',
        desc: 'Co robić, gdy data ostatniej edycji jest wcześniejsza niż data utworzenia. Dotyczy automatycznych edycji i ustawia wartość domyślną dla narzędzia zbiorczego.',
        optionDisabled: 'Nie poprawiaj (tylko wykrywaj)',
        optionCreatedToUpdated:
          'Ustaw datę utworzenia na datę ostatniej edycji',
        optionUpdatedToCreated:
          'Ustaw datę ostatniej edycji na datę utworzenia',
        optionMaxAll: 'Ustaw obie na najnowszą datę',
      },
      tolerance: {
        name: 'Ignoruj drobne różnice (sekundy)',
        desc: 'Ignoruj daty w złej kolejności, gdy różnica jest mniejsza niż ta wartość. Mała wartość ukrywa drobne różnice zegara.',
      },
    },
    advanced: {
      summary: 'Zaawansowane',
      newFileDelay: {
        name: 'Opóźnienie dla nowych plików',
        desc: 'Ile milisekund odczekać przed zapisaniem daty w nowo utworzonej notatce. Pomaga uniknąć konfliktów z wtyczkami szablonów. Ustaw 0, aby wyłączyć.',
      },
      autoPopulateCache: {
        name: 'Zapełniaj pamięć podręczną przy starcie',
        desc: 'Przy ładowaniu wtyczki buduj dane wykrywania zmian dla notatek, które ich jeszcze nie mają. Działa w tle.',
      },
      maxCacheEntries: {
        name: 'Maksymalna liczba wpisów w pamięci podręcznej',
        desc: 'Gdy pamięć podręczna przekroczy ten limit, najstarsze nieużywane wpisy są usuwane. 0 = bez limitu.',
      },
      postUpdateCommand: {
        name: 'Polecenie po aktualizacji',
        desc: 'Uruchom polecenie Obsidian po aktualizacji daty. Pozostaw puste, aby wyłączyć.',
        optionNone: 'Brak',
      },
    },
    bulk: {
      heading: 'Operacje zbiorcze',
      populate: {
        name: 'Ustaw daty z własnych dat pliku',
        desc: 'Wypełnij daty utworzenia i ostatniej edycji z własnych dat utworzenia i modyfikacji każdego pliku na dysku. Świetne do pierwszej konfiguracji.',
        button: 'Wypełnij daty',
      },
      rename: {
        name: 'Zmień nazwę właściwości',
        desc: 'Przenieś wartości ze starej nazwy właściwości do nowej we wszystkich notatkach. Przydatne po zmianie nazwy właściwości powyżej.',
        button: 'Zmień nazwę właściwości',
      },
      reformat: {
        name: 'Przeformatuj istniejące daty',
        desc: 'Znajdź daty w starym formacie i przepisz je w twoim aktualnym formacie. Przydatne po zmianie formatu daty powyżej.',
        button: 'Przeformatuj daty',
      },
      findInversions: {
        name: 'Znajdź daty w złej kolejności',
        desc: 'Przeskanuj notatki i wypisz te, w których data ostatniej edycji jest wcześniejsza niż data utworzenia. Następnie możesz zastosować wybraną powyżej poprawkę.',
        button: 'Znajdź daty w złej kolejności',
      },
      rebuildCache: {
        name: 'Przebuduj pamięć podręczną haszy',
        desc: 'Przelicz dane wykrywania zmian (hasze treści) dla wszystkich twoich notatek. Przydatne po zmianie tego, co liczy się jako zmiana powyżej.',
        button: 'Przebuduj pamięć podręczną',
      },
    },
  },

  modals: {
    populate: {
      configureTitle: 'Ustaw daty z własnych dat pliku',
      configureSubtitleLine1: 'Wypełnij daty utworzenia i ostatniej edycji',
      configureSubtitleLine2:
        'z własnych dat utworzenia i modyfikacji każdego pliku na dysku.',
      modeName: 'Które daty ustawić',
      modeDesc: 'Wybierz, które daty wypełnić.',
      modeOptionBoth: 'I utworzenie, i edycję',
      modeOptionCreated: 'Tylko daty utworzenia',
      modeOptionUpdated: 'Tylko daty edycji',
      overrideName: 'Pliki, które już mają daty',
      overrideDesc: 'Wypełnij tylko brakujące daty lub nadpisz istniejące.',
      overrideOptionFillMissing: 'Tylko brakujące (bezpiecznie)',
      overrideOptionOverwriteAll: 'Nadpisz wszystkie (zastępuje istniejące)',
      autoUpdateNoteTitle: 'Uwaga o automatycznej aktualizacji:',
      autoUpdateNoteBody:
        'Jeśli automatyczna aktualizacja była aktywna, własne daty pliku na dysku mogą już odzwierciedlać edycje samej wtyczki, a nie pierwotne daty. Dla najlepszych wyników użyj tej funkcji przed włączeniem automatycznej aktualizacji lub zaraz po instalacji wtyczki.',
      warningTitleCreatedUnreliable:
        'Data utworzenia pliku jest niewiarygodna na niektórych platformach',
      warningTitlePlatformNote: 'Uwaga o platformie',
      platformMacWinNote: 'prawdziwa data utworzenia pliku',
      platformLinuxNote:
        'system zgłasza późniejszą datę, a nie prawdziwą datę utworzenia',
      platformAndroidNote: 'zależy od urządzenia, często niewiarygodna',
      platformIosNote: 'zwykle wiarygodna',
      platformReliable: 'Wiarygodna',
      platformUnreliable: 'NIEWIARYGODNA',
      platformYourPlatformSuffix: ' (twoja platforma)',
      syncNoteLine1:
        'Synchronizowane skarbce: daty plików mogą być resetowane przez usługi synchronizacji',
      syncNoteLine3:
        'Data ostatniej edycji jest zwykle bardziej wiarygodna niż data utworzenia.',
      recommendation:
        'Zalecenie: sprawdź wyniki po uruchomieniu. Najpierw zrób kopię zapasową.',
      overwriteWarning:
        'To zastąpi istniejące daty w twoich notatkach. Nie można tego cofnąć. Najpierw zrób kopię zapasową.',
      noPropertyConfigured:
        'Nie skonfigurowano nazwy właściwości dla: {missing}. Sprawdź ustawienia wtyczki.',
      previewTitle: 'Podgląd: ustaw daty',
      noFilesNeedUpdating:
        'Brak plików do aktualizacji. Wszystkie kwalifikujące się pliki mają już żądane daty.',
      previewOverwriteWarning:
        'Tryb nadpisywania: istniejące daty zostaną zastąpione. Nie można tego cofnąć. Najpierw zrób kopię zapasową.',
      settingDates: 'Ustawianie dat…',
      stopped: 'Zatrzymano.',
      doneWithErrorsSubtitle: 'Zaktualizowano plików: {processed}.',
      doneTitle: 'Gotowe! Zaktualizowano plików: {processed}.',
    },
    rename: {
      configureTitle: 'Zmień nazwę właściwości',
      configureSubtitle:
        'Przenieś wartości z jednej nazwy właściwości do innej we wszystkich notatkach.',
      validationEnterOld: 'Wpisz starą nazwę właściwości, aby kontynuować.',
      validationEnterNew: 'Wpisz nową nazwę właściwości, aby kontynuować.',
      validationMustDiffer: 'Stara i nowa nazwa właściwości muszą się różnić.',
      oldKeyName: 'Stara nazwa właściwości',
      oldKeyDesc: 'Nazwa właściwości obecnie używana w twoich notatkach.',
      newKeyName: 'Nowa nazwa właściwości',
      newKeyDesc: 'Nowa nazwa właściwości do użycia.',
      deleteOldName: 'Usuń starą właściwość po zmianie nazwy',
      deleteOldDesc:
        'Usuń starą właściwość po skopiowaniu jej wartości do nowej.',
      namesCannotBeEmpty: 'Nazwy właściwości nie mogą być puste.',
      previewTitle: 'Podgląd: zmiana nazwy właściwości',
      noNotesUseProperty: 'Żadna notatka nie używa właściwości "{oldKey}".',
      conflictWarning:
        'Notatki w liczbie {conflicts} mają już właściwość "{newKey}". Istniejąca wartość zostanie nadpisana.',
      columnArrowNew: '→ {newKey}',
      deleteWarning:
        'Stara właściwość zostanie usunięta po skopiowaniu. Nie można tego cofnąć. Najpierw zrób kopię zapasową.',
      renamingProperty: 'Zmiana nazwy właściwości…',
      renameStopped: 'Zmiana nazwy zatrzymana.',
      doneWithErrorsSubtitle: 'Zaktualizowano plików: {processed}.',
      doneTitle: 'Gotowe! Zaktualizowano plików: {processed}.',
    },
    reformat: {
      configureTitle: 'Ujednolić format daty',
      configureSubtitle:
        'Odczytaj istniejące wartości dat i przepisz je w aktualnym formacie z ustawień.',
      invalidFormat: 'Nieprawidłowy format',
      targetFormatName: 'Format docelowy',
      scopeName: 'Które pola przeformatować',
      scopeDesc: 'Wybierz, które daty ujednolicić.',
      scopeOptionAll: 'Wszystkie daty',
      scopeOptionCreated: 'Tylko utworzenie',
      scopeOptionUpdated: 'Tylko edycja',
      scopeOptionViewed: 'Tylko wyświetlenie',
      autoDetectNote:
        'Daty są automatycznie wykrywane z popularnych formatów (ISO 8601, europejski, amerykański, daty liczbowe) i przepisywane w twoim aktualnym formacie.',
      noPropertyConfigured:
        'Nie skonfigurowano nazwy właściwości dla: {missing}. Sprawdź ustawienia wtyczki.',
      previewTitle: 'Podgląd: ujednolicenie dat',
      noChangeAmbiguous:
        'Na razie nie ma czego konwertować. Liczba dat ({ambiguousCount}) może być odczytana na dwa sposoby i pozostaje bez zmian - wybierz powyżej kolejność dzień/miesiąc, aby je przekonwertować.',
      noChangeDefault:
        'Brak plików do przeformatowania. Wszystkie daty są już w formacie docelowym lub nie udało się ich odczytać.',
      errorWarningNoChange:
        'Pliki w liczbie {errorCount} mają daty, których nie udało się odczytać.',
      errorWarningWillSkip:
        'Pliki w liczbie {errorCount} mają daty, których nie udało się odczytać. Zostaną pominięte.',
      checkNote:
        'Wiersze oznaczone [check] można odczytać na dwa sposoby - sprawdź, czy nowa data wygląda poprawnie.',
      rewriteWarning:
        'To przepisuje istniejące wartości dat na miejscu. Nie można tego cofnąć. Najpierw zrób kopię zapasową.',
      ambiguityName: 'Daty, które można odczytać na dwa sposoby',
      ambiguityDesc:
        'Liczba dat ({ambiguousCount}) może oznaczać dzień najpierw lub miesiąc najpierw (np. 01/05/2024).{detectedHint}',
      detectedHintMonthFirst: ' Twój system sugeruje miesiąc najpierw.',
      detectedHintDayFirst: ' Twój system sugeruje dzień najpierw.',
      ambiguityOptionSkip: 'Pozostaw niejasne daty bez zmian',
      ambiguityOptionDmy: 'Dzień najpierw (01/05 = dzień 1, miesiąc 5)',
      ambiguityOptionMdy: 'Miesiąc najpierw (01/05 = miesiąc 1, dzień 5)',
      cellCouldNotRead: '{oldValue} (nie udało się odczytać daty)',
      cellConversion: '{oldValue} → {newValue}{check}',
      cellNewValue: '{newValue}{check}',
      cellCheckSuffix: ' [check]',
      reformattingDates: 'Przeformatowywanie dat…',
      reformatStopped: 'Przeformatowywanie zatrzymane.',
      doneWithErrorsSubtitle: 'Zaktualizowano plików: {processed}.',
      doneTitle: 'Gotowe! Zaktualizowano plików: {processed}.',
    },
    inversions: {
      scanningTitle: 'Wyszukiwanie dat w złej kolejności…',
      foundTitle: 'Znaleziono notatek z datami w złej kolejności: {count}',
      foundSubtitle:
        'Te notatki mają datę ostatniej edycji wcześniejszą niż data utworzenia. Wybierz poniżej, jak je poprawić, lub zamknij, aby przejrzeć ręcznie.',
      noneFound: 'Nie znaleziono dat w złej kolejności.',
      strategyName: 'Jak poprawić',
      strategyDesc: 'Wybierz, jak poprawić daty.',
      strategyOptionDisabled: 'Nie poprawiaj (tylko przegląd)',
      strategyOptionCreatedToUpdated:
        'Ustaw datę utworzenia na datę ostatniej edycji',
      strategyOptionUpdatedToCreated:
        'Ustaw datę ostatniej edycji na datę utworzenia',
      strategyOptionMaxAll: 'Ustaw obie na najnowszą datę',
      toleranceNote:
        'Ignorowane są różnice mniejsze niż {tolerance} sekund (ustawione w ustawieniach).',
      fixWarning:
        'To zmieni {count} notatek. Nie można tego cofnąć. Najpierw zrób kopię zapasową.',
      fixingDates: 'Poprawianie dat…',
      stopped: 'Operacja zbiorcza zatrzymana.',
      fixedNotice: 'Poprawiono notatek: {processed}.',
      doneWithErrorsSubtitle: 'Poprawiono notatek: {processed}.',
      doneTitle: 'Gotowe! To okno można bezpiecznie zamknąć.',
    },
    rebuildCache: {
      loadingFiles: 'Ładowanie plików…',
      confirmTitle: 'Przebuduj dane wykrywania zmian dla {count} plików',
      confirmSubtitle:
        'To przelicza odciski treści (hasze), używane do wykrywania rzeczywistych edycji. Twoje notatki nie ulegają zmianie.',
      rebuilding: 'Przebudowywanie…',
      stopped: 'Operacja zbiorcza zatrzymana.',
      doneWithErrorsSubtitle: 'Przetworzono plików: {processed}.',
      doneTitle: 'Gotowe! To okno można bezpiecznie zamknąć.',
    },
  },
};
