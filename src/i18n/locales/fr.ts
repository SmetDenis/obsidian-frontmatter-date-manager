// French. Machine-generated baseline. Improvements welcome - see CONTRIBUTING.md.
import type { Strings, DeepPartial } from '../index';

export const STRINGS_FR: DeepPartial<Strings> = {
  common: {
    run: 'Exécuter',
    back: 'Retour',
    cancel: 'Annuler',
    close: 'Fermer',
    file: 'Fichier',
    created: 'Créée',
    updated: 'Modifiée',
    viewed: 'Consultée',
    createdKeyed: 'Créée ({key})',
    updatedKeyed: 'Modifiée ({key})',
    viewedKeyed: 'Consultée ({key})',
    scanAndPreview: 'Analyser et prévisualiser',
    scanningFiles: 'Analyse des fichiers…',
    doneWithErrors: 'Terminé avec {errors} erreur(s).',
  },

  commands: {
    updateCurrentFile: 'Mettre à jour les dates du fichier actuel',
    toggleAutoUpdate: 'Activer/désactiver la mise à jour automatique',
    pauseAutoUpdate: 'Suspendre la mise à jour automatique pendant 5 minutes',
  },

  statusBar: {
    paused: 'En pause',
    pausedWithMinutes: 'En pause ({remaining}min)',
  },

  notices: {
    inversionDetectedAndFixed:
      'Frontmatter Date Manager : des dates dans le désordre ont été détectées et corrigées. Utilisez "Trouver les dates dans le désordre" dans les paramètres pour vérifier.',
    timestampsUpdated: 'Dates mises à jour.',
    fileIgnored: 'Le fichier est ignoré par les paramètres du module.',
    failedToUpdateWithReason: 'Échec de la mise à jour des dates : {reason}',
    failedToUpdate: 'Échec de la mise à jour des dates.',
    autoUpdateEnabled: 'Mise à jour automatique activée',
    autoUpdateDisabled: 'Mise à jour automatique désactivée',
    autoUpdatePausedForMinutes:
      'Mise à jour automatique suspendue pendant {minutes} minutes. Elle reprendra automatiquement.',
    autoUpdateResumed: 'Mise à jour automatique reprise.',
    malformedFrontmatter:
      'Échec de Frontmatter Date Manager\nPropriétés mal formées dans ce fichier : {filePath}\n\n{message}',
  },

  bulkChrome: {
    summaryWillChange: '{changed} fichier(s) seront modifiés',
    summarySkipped: '{skipped} ignorés',
    summaryErrors: '{errors} erreur(s)',
    pagerPrev: 'Précédent',
    pagerNext: 'Suivant',
    pageInfo: 'Page {current} sur {total}',
    downloadFullPreview: 'Télécharger l’aperçu complet',
    downloadSuccess:
      '{count} ligne(s) téléchargées sous {filename} dans votre dossier de téléchargements.',
    downloadFailed: 'Impossible de télécharger le fichier d’aperçu.',
    failureColumnError: 'Erreur',
    progressCounter: '{count}/{max}',
  },

  settings: {
    description: {
      syncIntro:
        'Les services de synchronisation, les outils de sauvegarde et d’autres modules réécrivent souvent les fichiers sans changer leur contenu - ce qui réinitialise les dates du fichier sur le disque. Il devient alors impossible de savoir quand vous avez réellement modifié une note pour la dernière fois.',
      pluginIntro:
        'Ce module écrit les dates de création et de dernière modification directement dans les propriétés de chaque note, et détecte les vrais changements en comparant le contenu, afin que vos dates reflètent les modifications réelles - et non les artefacts de synchronisation.',
    },
    dates: {
      heading: 'Dates à suivre',
      enableNoneHint:
        'Activez au moins une date ci-dessus pour configurer le module.',
      created: {
        enableName: 'Suivre la date de création',
        enableDesc:
          'Ajouter une date de création aux notes qui n’en ont pas encore.',
        propertyName: 'Propriété de création',
        propertyDesc:
          'Nom de la propriété où la date de création est enregistrée.',
      },
      updated: {
        enableName: 'Suivre la date de dernière modification',
        enableDesc:
          'Mettre à jour cette date chaque fois que vous modifiez la note.',
        propertyName: 'Propriété de modification',
        propertyDesc:
          'Nom de la propriété où la date de dernière modification est enregistrée.',
      },
      updateCount: {
        enableName: 'Compter les modifications',
        enableDesc:
          'Ajouter une propriété numérique qui augmente de un chaque fois que vous modifiez une note. Un décompte d’activité approximatif, pas un historique exact.',
        propertyName: 'Propriété du nombre de modifications',
        propertyDesc:
          'Nom de la propriété où le nombre de modifications est enregistré.',
      },
      viewed: {
        enableName: 'Suivre la date de dernière ouverture',
        enableDesc: 'Enregistrer la date à chaque ouverture de la note.',
        propertyName: 'Propriété de consultation',
        propertyDesc:
          'Nom de la propriété où la date de dernière ouverture est enregistrée.',
      },
    },
    formatting: {
      heading: 'Format des dates',
      dateFormat: {
        name: 'Format de date',
        desc: 'Comment les dates et heures sont écrites dans vos notes.',
        formatCodesLink: 'Voir les codes de format disponibles',
        currentlyPreview: 'Actuellement : {preview}',
        invalidWithHint: 'Format invalide. {hint}',
        invalidFormat: 'Chaîne de format de date invalide.',
        obsidianDefault:
          "Format Obsidian par défaut : yyyy-MM-dd'T'HH:mm:ss (date et heure, fuseau horaire local)",
      },
      timezone: {
        name: 'Fuseau horaire',
        desc: 'Fuseau horaire utilisé lors de l’écriture des dates. Laissez vide pour utiliser le fuseau horaire de votre appareil ({localTz}).',
        placeholder: 'Local ({localTz})',
        resetTooltip: 'Réinitialiser sur le fuseau horaire local',
      },
      numberProperties: {
        name: 'Enregistrer les dates en chiffres sans guillemets',
        desc: 'Si votre format de date ne contient que des chiffres (comme un horodatage unix), l’écrire comme un nombre simple (updated: 1712930400) plutôt que comme du texte entre guillemets (updated: "1712930400"). Sans effet si votre format contient des tirets ou des deux-points.',
      },
    },
    behavior: {
      heading: 'Comportement',
      autoUpdate: {
        name: 'Mise à jour automatique',
        desc: 'Mettre à jour automatiquement les dates quand vous modifiez une note. Également disponible depuis la palette de commandes.',
      },
      minSeconds: {
        name: 'Secondes minimum entre les mises à jour',
        desc: 'Évite de mettre à jour la date trop souvent pendant que vous tapez ou passez d’une note à l’autre.',
      },
      changeDetection: {
        name: 'Détection des changements (hachage du contenu)',
        descEnabled:
          'La date de dernière modification n’est écrite que lorsque le contenu de la note change réellement - cela évite les fausses mises à jour des modules de synchronisation.',
        descDisabled:
          'Désactivé - la date de dernière modification est écrite à chaque enregistrement, même si rien n’a changé.',
      },
      hashTrackingMode: {
        name: 'Ce qui compte comme un changement',
        desc: 'Quelle partie d’une note compte comme un changement. "Corps seulement" - modifier les propriétés (étiquettes, alias, etc.) ne mettra pas la date à jour. "Propriétés seulement" - modifier le texte de la note ne mettra pas la date à jour. "Les deux" - toute modification met la date à jour.',
        optionBody: 'Corps de la note seulement (par défaut)',
        optionFrontmatter: 'Propriétés seulement',
        optionBoth: 'Corps et propriétés',
        changedNotice:
          'Mode de suivi modifié. Reconstruisez le cache de hachage (dans les opérations groupées) pour que les dates restent exactes.',
      },
      excludeKeys: {
        name: 'Ignorer ces propriétés',
        desc: 'Modifier ces propriétés ne mettra pas la date à jour. Vous pouvez en ajouter plusieurs à la fois, séparées par des virgules. Les propriétés created, updated et viewed sont toujours ignorées automatiquement.',
        placeholder: 'Nom de propriété comme tags',
        addTooltip: 'Ajouter une propriété',
        chipRemoveAriaLabel: 'Supprimer {entry}',
      },
    },
    filterRules: {
      name: 'Fichiers et dossiers à ignorer',
      descIntro:
        'Choisissez les fichiers ou dossiers à laisser tranquilles (pas de mise à jour automatique des dates). ',
      descOnePerLine: 'Un motif par ligne. Les lignes commençant par ',
      descCommentsAre: ' sont des commentaires. Commencez une ligne par ',
      descAddBack: ' pour réintégrer un chemin. ',
      descLastWins: 'Si plusieurs lignes correspondent, la dernière l’emporte.',
      advancedSyntaxLink: 'Syntaxe avancée (style gitignore)',
      noRulesWarning:
        'Aucune règle définie - toutes les notes reçoivent des mises à jour automatiques des dates.',
      placeholderExcludeFolder: '# Exclure un dossier',
      placeholderExcludeByPattern: '# Exclure par motif',
      placeholderReinclude: '# Réintégrer un fichier spécifique',
      parseError: 'Ligne {lineNumber} : {message} - "{text}"',
      previewButton: 'Prévisualiser les fichiers correspondants',
      previewSummary: '{tracked} notes suivies, {excluded} notes ignorées',
      skippedFilesSummary: 'Fichiers ignorés ({excluded})',
      skippedMore: '...et {count} de plus',
      reference: {
        summary: 'Référence de syntaxe des motifs',
        sectionBasics: 'Bases de la syntaxe',
        basicsCommentDesc: 'Les lignes commençant par # sont ignorées',
        basicsBlankDesc: 'Les lignes vides sont ignorées',
        basicsExcludeDesc:
          'Exclure - les fichiers dans templates/ sont ignorés',
        basicsReincludeDesc:
          'Réintégrer - préfixez avec ! pour annuler l’exclusion',
        basicsLastWinsDesc:
          'Quand plusieurs règles correspondent, la dernière l’emporte',
        sectionExcludeFolder: 'Exclure un dossier',
        excludeFolderAllFilesDesc: 'Tous les fichiers dans templates/',
        excludeFolderSameEffectDesc:
          'Même effet (la barre oblique finale est facultative)',
        excludeFolderNestedDesc: 'Dossier imbriqué',
        sectionReinclude: 'Réintégrer (annuler une exclusion)',
        reincludeExcludeWholeDesc: 'Exclure tout le dossier',
        reincludeKeepDesc: 'Mais continuer à suivre ce fichier précis',
        sectionWildcards: 'Caractères génériques',
        wildcardStarDesc: 'N’importe quels caractères sauf /',
        wildcardDoubleStarDesc:
          'N’importe quels caractères y compris / (traverse les dossiers)',
        wildcardQuestionDesc: 'Exactement un caractère',
        sectionWildcardExamples: 'Exemples de caractères génériques',
        wildcardExCanvasRootDesc:
          'Fichiers se terminant par .canvas.md à la racine du coffre',
        wildcardExCanvasAnyDesc:
          'Fichiers se terminant par .canvas.md dans n’importe quel dossier',
        wildcardExDailyDesc: 'Fichiers comme daily/2024-01-01.md',
        wildcardExTwoCharDesc: 'Noms de fichiers à deux caractères dans notes/',
        sectionSpecificFiles: 'Fichiers spécifiques',
        specificFilesOneExactDesc: 'Un fichier précis',
        specificFilesRootDesc: 'Un fichier à la racine du coffre',
        sectionPathsWithSpaces: 'Chemins avec des espaces',
        pathsWithSpacesAsIsDesc: 'Écrivez simplement le chemin tel quel',
        pathsWithSpacesNoQuotesDesc:
          'Pas besoin de guillemets autour des espaces',
        sectionNonLatin: 'Caractères non latins',
        nonLatinCyrillicDesc: 'Nom de dossier en cyrillique',
        nonLatinChineseDesc: 'Caractères chinois',
        nonLatinFullPathDesc: 'Chemin complet non latin',
        sectionObsidianExamples: 'Exemples propres à Obsidian',
        obsidianTemplateFolderDesc: 'Dossier de modèles',
        obsidianDailyFolderDesc: 'Dossier des notes quotidiennes',
        obsidianAttachmentsDesc: 'Dossier des pièces jointes / médias',
        obsidianCanvasDesc: 'Tous les fichiers canvas',
        obsidianExcalidrawDesc: 'Tous les dessins Excalidraw',
        obsidianInboxDesc: 'Dossier boîte de réception / brouillons',
        obsidianArchiveDesc: 'Notes archivées',
        sectionAllowlist:
          'Mode liste blanche (suivre uniquement certains dossiers)',
        allowlistExcludeEverythingDesc: 'D’abord, tout exclure',
        allowlistReincludeWantedDesc:
          'Puis réintégrer uniquement ce que vous voulez',
        allowlistReincludeAnotherDesc: 'Réintégrer un autre dossier',
        emptyNote:
          'Quand ce champ est vide, toutes les notes reçoivent des mises à jour automatiques des dates.',
      },
    },
    inversions: {
      heading: 'Date de modification antérieure à la date de création',
      strategy: {
        name: 'Comment corriger les dates dans le désordre',
        desc: 'Que faire quand la date de dernière modification est antérieure à la date de création. S’applique aux modifications automatiques et définit la valeur par défaut de l’outil groupé.',
        optionDisabled: 'Ne pas corriger (détecter seulement)',
        optionCreatedToUpdated:
          'Définir la date de création sur la date de dernière modification',
        optionUpdatedToCreated:
          'Définir la date de dernière modification sur la date de création',
        optionMaxAll: 'Définir les deux sur la date la plus récente',
      },
      tolerance: {
        name: 'Ignorer les écarts minimes (secondes)',
        desc: 'Ignorer les dates dans le désordre quand l’écart est inférieur à cette valeur. Une petite valeur masque les minuscules différences d’horloge.',
      },
    },
    advanced: {
      summary: 'Avancé',
      newFileDelay: {
        name: 'Délai pour les nouveaux fichiers',
        desc: 'Attendre ce nombre de millisecondes avant d’apposer une date sur une note nouvellement créée. Aide à éviter les conflits avec les modules de modèles. Mettez 0 pour désactiver.',
      },
      autoPopulateCache: {
        name: 'Remplir le cache au démarrage',
        desc: 'Au chargement du module, construire les données de détection des changements pour les notes qui n’en ont pas encore. S’exécute en arrière-plan.',
      },
      maxCacheEntries: {
        name: 'Nombre maximum d’entrées du cache',
        desc: 'Quand le cache dépasse cette limite, les entrées inutilisées les plus anciennes sont supprimées. 0 = pas de limite.',
      },
      postUpdateCommand: {
        name: 'Commande après mise à jour',
        desc: 'Exécuter une commande Obsidian après la mise à jour d’une date. Laissez vide pour désactiver.',
        optionNone: 'Aucune',
      },
    },
    bulk: {
      heading: 'Opérations groupées',
      populate: {
        name: 'Définir les dates à partir des dates du fichier',
        desc: 'Remplir les dates de création et de dernière modification à partir des dates de création et de modification de chaque fichier sur le disque. Idéal pour une première configuration.',
        button: 'Remplir les dates',
      },
      rename: {
        name: 'Renommer une propriété',
        desc: 'Déplacer les valeurs d’un ancien nom de propriété vers un nouveau dans toutes les notes. Utile après avoir changé un nom de propriété ci-dessus.',
        button: 'Renommer la propriété',
      },
      reformat: {
        name: 'Reformater les dates existantes',
        desc: 'Trouver les dates écrites dans un ancien format et les réécrire dans votre format actuel. Utile après avoir changé le format de date ci-dessus.',
        button: 'Reformater les dates',
      },
      findInversions: {
        name: 'Trouver les dates dans le désordre',
        desc: 'Analyser vos notes et lister celles où la date de dernière modification est antérieure à la date de création. Vous pouvez ensuite appliquer la correction choisie ci-dessus.',
        button: 'Trouver les dates dans le désordre',
      },
      rebuildCache: {
        name: 'Reconstruire le cache de hachage',
        desc: 'Recalculer les données de détection des changements (hachages du contenu) pour toutes vos notes. Utile après avoir changé ce qui compte comme un changement ci-dessus.',
        button: 'Reconstruire le cache',
      },
    },
  },

  modals: {
    populate: {
      configureTitle: 'Définir les dates à partir des dates du fichier',
      configureSubtitleLine1:
        'Remplir les dates de création et de dernière modification',
      configureSubtitleLine2:
        'à partir des dates de création et de modification de chaque fichier sur le disque.',
      modeName: 'Quelles dates définir',
      modeDesc: 'Choisissez les dates à remplir.',
      modeOptionBoth: 'Création et modification',
      modeOptionCreated: 'Dates de création seulement',
      modeOptionUpdated: 'Dates de modification seulement',
      overrideName: 'Fichiers qui ont déjà des dates',
      overrideDesc:
        'Remplir uniquement les dates manquantes, ou écraser celles qui existent.',
      overrideOptionFillMissing: 'Manquantes seulement (sûr)',
      overrideOptionOverwriteAll:
        'Tout écraser (remplace les valeurs existantes)',
      autoUpdateNoteTitle: 'Remarque sur la mise à jour automatique :',
      autoUpdateNoteBody:
        'Si la mise à jour automatique a été active, les dates du fichier sur le disque peuvent déjà refléter les modifications du module, et non les dates d’origine. Pour de meilleurs résultats, utilisez cette fonction avant d’activer la mise à jour automatique ou juste après l’installation du module.',
      warningTitleCreatedUnreliable:
        'La date de création du fichier n’est pas fiable sur certaines plateformes',
      warningTitlePlatformNote: 'Remarque sur la plateforme',
      platformMacWinNote: 'date de création réelle du fichier',
      platformLinuxNote:
        'le système signale une date ultérieure, pas la date de création réelle',
      platformAndroidNote: 'dépend de l’appareil, souvent peu fiable',
      platformIosNote: 'généralement fiable',
      platformReliable: 'Fiable',
      platformUnreliable: 'NON FIABLE',
      platformYourPlatformSuffix: ' (votre plateforme)',
      syncNoteLine1:
        'Coffres synchronisés : les dates des fichiers peuvent être réinitialisées par les services de synchronisation',
      syncNoteLine3:
        'La date de dernière modification est généralement plus fiable que la date de création.',
      recommendation:
        'Recommandation : vérifiez les résultats après l’exécution. Faites d’abord une sauvegarde.',
      overwriteWarning:
        'Cela remplacera les dates existantes dans vos notes. C’est irréversible. Faites d’abord une sauvegarde.',
      noPropertyConfigured:
        'Aucun nom de propriété configuré pour : {missing}. Vérifiez les paramètres du module.',
      previewTitle: 'Aperçu : définir les dates',
      noFilesNeedUpdating:
        'Aucun fichier à mettre à jour. Tous les fichiers éligibles ont déjà les dates demandées.',
      previewOverwriteWarning:
        'Mode écrasement : les dates existantes seront remplacées. C’est irréversible. Faites d’abord une sauvegarde.',
      settingDates: 'Définition des dates…',
      stopped: 'Arrêté.',
      doneWithErrorsSubtitle: '{processed} fichier(s) mis à jour.',
      doneTitle: 'Terminé ! {processed} fichier(s) mis à jour.',
    },
    rename: {
      configureTitle: 'Renommer une propriété',
      configureSubtitle:
        'Déplacer les valeurs d’un nom de propriété vers un autre dans toutes les notes.',
      validationEnterOld: 'Saisissez l’ancien nom de propriété pour continuer.',
      validationEnterNew:
        'Saisissez le nouveau nom de propriété pour continuer.',
      validationMustDiffer:
        'L’ancien et le nouveau nom de propriété doivent être différents.',
      oldKeyName: 'Ancien nom de propriété',
      oldKeyDesc: 'Le nom de propriété actuellement utilisé dans vos notes.',
      newKeyName: 'Nouveau nom de propriété',
      newKeyDesc: 'Le nouveau nom de propriété à utiliser.',
      deleteOldName: 'Supprimer l’ancienne propriété après le renommage',
      deleteOldDesc:
        'Supprimer l’ancienne propriété après avoir copié sa valeur dans la nouvelle.',
      namesCannotBeEmpty: 'Les noms de propriété ne peuvent pas être vides.',
      previewTitle: 'Aperçu : renommer la propriété',
      noNotesUseProperty: 'Aucune note n’utilise la propriété "{oldKey}".',
      conflictWarning:
        '{conflicts} note(s) ont déjà la propriété "{newKey}". La valeur existante sera écrasée.',
      columnArrowNew: '→ {newKey}',
      deleteWarning:
        'L’ancienne propriété sera supprimée après la copie. C’est irréversible. Faites d’abord une sauvegarde.',
      renamingProperty: 'Renommage de la propriété…',
      renameStopped: 'Renommage arrêté.',
      doneWithErrorsSubtitle: '{processed} fichier(s) mis à jour.',
      doneTitle: 'Terminé ! {processed} fichier(s) mis à jour.',
    },
    reformat: {
      configureTitle: 'Uniformiser le format de date',
      configureSubtitle:
        'Analyser les valeurs de date existantes et les réécrire en utilisant le format actuel des paramètres.',
      invalidFormat: 'Format invalide',
      targetFormatName: 'Format cible',
      scopeName: 'Quels champs reformater',
      scopeDesc: 'Choisissez les dates à uniformiser.',
      scopeOptionAll: 'Toutes les dates',
      scopeOptionCreated: 'Création seulement',
      scopeOptionUpdated: 'Modification seulement',
      scopeOptionViewed: 'Consultation seulement',
      autoDetectNote:
        'Les dates sont détectées automatiquement à partir des formats courants (ISO 8601, européen, américain, dates numériques) et réécrites dans votre format actuel.',
      noPropertyConfigured:
        'Aucun nom de propriété configuré pour : {missing}. Vérifiez les paramètres du module.',
      previewTitle: 'Aperçu : uniformiser les dates',
      noChangeAmbiguous:
        'Rien à convertir pour l’instant. {ambiguousCount} date(s) peuvent se lire de deux façons et restent inchangées - choisissez un ordre jour/mois ci-dessus pour les convertir.',
      noChangeDefault:
        'Aucun fichier à reformater. Toutes les dates sont déjà au format cible ou n’ont pas pu être analysées.',
      errorWarningNoChange:
        '{errorCount} fichier(s) ont des dates qui n’ont pas pu être analysées.',
      errorWarningWillSkip:
        '{errorCount} fichier(s) ont des dates qui n’ont pas pu être analysées. Elles seront ignorées.',
      checkNote:
        'Les lignes marquées [check] peuvent se lire de deux façons - vérifiez que la nouvelle date semble correcte.',
      rewriteWarning:
        'Cela réécrit les valeurs de date existantes sur place. C’est irréversible. Faites d’abord une sauvegarde.',
      ambiguityName: 'Dates qui peuvent se lire de deux façons',
      ambiguityDesc:
        '{ambiguousCount} date(s) peuvent signifier jour en premier ou mois en premier (par exemple 01/05/2024).{detectedHint}',
      detectedHintMonthFirst: ' Votre système suggère le mois en premier.',
      detectedHintDayFirst: ' Votre système suggère le jour en premier.',
      ambiguityOptionSkip: 'Laisser les dates ambiguës inchangées',
      ambiguityOptionDmy: 'Jour en premier (01/05 = jour 1, mois 5)',
      ambiguityOptionMdy: 'Mois en premier (01/05 = mois 1, jour 5)',
      cellCouldNotRead: '{oldValue} (date illisible)',
      cellConversion: '{oldValue} → {newValue}{check}',
      cellNewValue: '{newValue}{check}',
      cellCheckSuffix: ' [check]',
      reformattingDates: 'Reformatage des dates…',
      reformatStopped: 'Reformatage arrêté.',
      doneWithErrorsSubtitle: '{processed} fichier(s) mis à jour.',
      doneTitle: 'Terminé ! {processed} fichier(s) mis à jour.',
    },
    inversions: {
      scanningTitle: 'Recherche des dates dans le désordre…',
      foundTitle: '{count} notes trouvées avec des dates dans le désordre',
      foundSubtitle:
        'Ces notes ont une date de dernière modification antérieure à la date de création. Choisissez ci-dessous comment les corriger, ou fermez pour vérifier manuellement.',
      noneFound: 'Aucune date dans le désordre trouvée.',
      strategyName: 'Comment corriger',
      strategyDesc: 'Choisissez comment corriger les dates.',
      strategyOptionDisabled: 'Ne pas corriger (vérifier seulement)',
      strategyOptionCreatedToUpdated:
        'Définir la date de création sur la date de dernière modification',
      strategyOptionUpdatedToCreated:
        'Définir la date de dernière modification sur la date de création',
      strategyOptionMaxAll: 'Définir les deux sur la date la plus récente',
      toleranceNote:
        'Les écarts inférieurs à {tolerance} secondes sont ignorés (défini dans les paramètres).',
      fixWarning:
        'Cela modifiera {count} notes. C’est irréversible. Faites d’abord une sauvegarde.',
      fixingDates: 'Correction des dates…',
      stopped: 'Opération groupée arrêtée.',
      fixedNotice: '{processed} note(s) corrigées.',
      doneWithErrorsSubtitle: '{processed} note(s) corrigées.',
      doneTitle:
        'Terminé ! Vous pouvez fermer cette fenêtre en toute sécurité.',
    },
    rebuildCache: {
      loadingFiles: 'Chargement des fichiers…',
      confirmTitle:
        'Reconstruire les données de détection des changements pour {count} fichiers',
      confirmSubtitle:
        'Cela recalcule les empreintes de contenu (hachages) utilisées pour détecter les vraies modifications. Vos notes ne sont pas modifiées.',
      rebuilding: 'Reconstruction…',
      stopped: 'Opération groupée arrêtée.',
      doneWithErrorsSubtitle: '{processed} fichier(s) traités.',
      doneTitle:
        'Terminé ! Vous pouvez fermer cette fenêtre en toute sécurité.',
    },
  },
};
