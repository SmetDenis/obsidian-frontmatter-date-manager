// Spanish. Machine-generated baseline. Improvements welcome - see CONTRIBUTING.md.
import type { Strings } from '../index';

export const STRINGS_ES: Strings = {
  common: {
    run: 'Ejecutar',
    back: 'Atrás',
    cancel: 'Cancelar',
    close: 'Cerrar',
    file: 'Archivo',
    created: 'Creado',
    updated: 'Actualizado',
    viewed: 'Visto',
    createdKeyed: 'Creado ({key})',
    updatedKeyed: 'Actualizado ({key})',
    viewedKeyed: 'Visto ({key})',
    scanAndPreview: 'Analizar y previsualizar',
    scanningFiles: 'Analizando archivos…',
    doneWithErrors: 'Listo con {errors} error(es).',
  },
  commands: {
    updateCurrentFile: 'Actualizar fechas del archivo actual',
    toggleAutoUpdate: 'Activar/desactivar actualización automática',
    pauseAutoUpdate: 'Pausar la actualización automática durante 5 minutos',
  },
  statusBar: {
    paused: 'En pausa',
    pausedWithMinutes: 'En pausa ({remaining}m)',
  },
  notices: {
    inversionDetectedAndFixed:
      'Frontmatter Date Manager: se detectaron y corrigieron fechas en orden incorrecto. Usa "Buscar fechas en orden incorrecto" en los ajustes para revisarlas.',
    timestampsUpdated: 'Fechas actualizadas.',
    fileIgnored: 'El archivo está ignorado por los ajustes del plugin.',
    failedToUpdateWithReason: 'No se pudieron actualizar las fechas: {reason}',
    failedToUpdate: 'No se pudieron actualizar las fechas.',
    autoUpdateEnabled: 'Actualización automática activada',
    autoUpdateDisabled: 'Actualización automática desactivada',
    autoUpdatePausedForMinutes:
      'Actualización automática en pausa durante {minutes} minutos. Se reanudará automáticamente.',
    autoUpdateResumed: 'Actualización automática reanudada.',
    malformedFrontmatter:
      'Frontmatter Date Manager falló\nPropiedades con formato incorrecto en este archivo: {filePath}\n\n{message}',
  },
  bulkChrome: {
    summaryWillChange: 'Se cambiarán {changed} archivo(s)',
    summarySkipped: '{skipped} omitidos',
    summaryErrors: '{errors} error(es)',
    pagerPrev: 'Anterior',
    pagerNext: 'Siguiente',
    pageInfo: 'Página {current} de {total}',
    downloadFullPreview: 'Descargar vista previa completa',
    downloadSuccess:
      'Se descargaron {count} fila(s) como {filename} en tu carpeta de descargas.',
    downloadFailed: 'No se pudo descargar el archivo de vista previa.',
    failureColumnError: 'Error',
    progressCounter: '{count}/{max}',
  },
  settings: {
    description: {
      syncIntro:
        'Los servicios de sincronización, las herramientas de copia de seguridad y otros plugins suelen reescribir los archivos sin cambiar su contenido, lo que reinicia las fechas del archivo en el disco. Esto hace imposible saber cuándo editaste realmente una nota por última vez.',
      pluginIntro:
        'Este plugin escribe las fechas de creación y de última edición directamente en las propiedades de cada nota, y detecta los cambios reales comparando el contenido, para que tus fechas reflejen ediciones reales y no artefactos de sincronización.',
    },
    dates: {
      heading: 'Fechas a registrar',
      enableNoneHint:
        'Activa al menos una fecha arriba para configurar el plugin.',
      created: {
        enableName: 'Registrar la fecha de creación',
        enableDesc:
          'Añade una fecha de creación a las notas que aún no la tienen.',
        propertyName: 'Propiedad de creación',
        propertyDesc:
          'Nombre de la propiedad donde se guarda la fecha de creación.',
        propertyPlaceholder: 'Created',
      },
      updated: {
        enableName: 'Registrar la fecha de última edición',
        enableDesc: 'Actualiza esta fecha cada vez que editas la nota.',
        propertyName: 'Propiedad de actualización',
        propertyDesc:
          'Nombre de la propiedad donde se guarda la fecha de última edición.',
        propertyPlaceholder: 'Updated',
      },
      updateCount: {
        enableName: 'Contar ediciones',
        enableDesc:
          'Añade una propiedad numérica que aumenta en uno cada vez que editas una nota. Es un recuento de actividad aproximado, no un historial exacto.',
        propertyName: 'Propiedad del recuento de ediciones',
        propertyDesc:
          'Nombre de la propiedad donde se guarda el recuento de ediciones.',
      },
      viewed: {
        enableName: 'Registrar la fecha de última apertura',
        enableDesc: 'Guarda la fecha cada vez que abres la nota.',
        propertyName: 'Propiedad de visualización',
        propertyDesc:
          'Nombre de la propiedad donde se guarda la fecha de última apertura.',
        propertyPlaceholder: 'Viewed',
      },
    },
    formatting: {
      heading: 'Formato de fecha',
      dateFormat: {
        name: 'Formato de fecha',
        desc: 'Cómo se escriben las fechas y horas en tus notas.',
        formatCodesLink: 'Ver los códigos de formato disponibles',
        currentlyPreview: 'Actualmente: {preview}',
        invalidWithHint: 'Formato no válido. {hint}',
        invalidFormat: 'Cadena de formato de fecha no válida.',
        obsidianDefault:
          "Predeterminado de Obsidian: yyyy-MM-dd'T'HH:mm:ss (fecha y hora, zona horaria local)",
      },
      timezone: {
        name: 'Zona horaria',
        desc: 'Zona horaria que se usa al escribir las fechas. Déjalo en blanco para usar la zona horaria de tu dispositivo ({localTz}).',
        placeholder: 'Local ({localTz})',
        resetTooltip: 'Restablecer a la zona horaria local',
      },
      numberProperties: {
        name: 'Guardar las fechas solo numéricas sin comillas',
        desc: 'Si tu formato de fecha es solo dígitos (como una marca de tiempo unix), escríbela como un número simple (updated: 1712930400) en lugar de texto entre comillas (updated: "1712930400"). No tiene efecto cuando tu formato incluye guiones o dos puntos.',
      },
    },
    behavior: {
      heading: 'Comportamiento',
      autoUpdate: {
        name: 'Actualización automática',
        desc: 'Actualiza automáticamente las fechas cuando editas una nota. También está disponible desde la paleta de comandos.',
      },
      minSeconds: {
        name: 'Segundos mínimos entre actualizaciones',
        desc: 'Evita actualizar la fecha con demasiada frecuencia mientras escribes o cambias entre notas.',
      },
      changeDetection: {
        name: 'Detección de cambios (hash de contenido)',
        descEnabled:
          'La fecha de última edición se escribe solo cuando el contenido de la nota cambia realmente, lo que evita actualizaciones falsas de los plugins de sincronización.',
        descDisabled:
          'Desactivado - la fecha de última edición se escribe en cada guardado, incluso si nada cambió.',
      },
      hashTrackingMode: {
        name: 'Qué cuenta como un cambio',
        desc: 'Qué parte de una nota cuenta como un cambio. "Solo el cuerpo" - editar las propiedades (etiquetas, alias, etc.) no actualizará la fecha. "Solo las propiedades" - editar el texto de la nota no actualizará la fecha. "Ambos" - cualquier edición actualiza la fecha.',
        optionBody: 'Solo el cuerpo de la nota (predeterminado)',
        optionFrontmatter: 'Solo las propiedades',
        optionBoth: 'Cuerpo y propiedades',
        changedNotice:
          'Modo de registro cambiado. Reconstruye la caché de hashes (en las operaciones masivas) para que las fechas se mantengan precisas.',
      },
      excludeKeys: {
        name: 'Ignorar estas propiedades',
        desc: 'Editar estas propiedades no actualizará la fecha. Puedes añadir varias a la vez, separadas por comas. Las propiedades created, updated y viewed siempre se ignoran automáticamente.',
        placeholder: 'Nombre de propiedad como tags',
        addTooltip: 'Añadir propiedad',
        chipRemoveAriaLabel: 'Eliminar {entry}',
      },
    },
    filterRules: {
      name: 'Archivos y carpetas a omitir',
      descIntro:
        'Elige los archivos o carpetas que dejar en paz (sin actualizaciones automáticas de fechas). ',
      descOnePerLine: 'Un patrón por línea. Las líneas que empiezan con ',
      descCommentsAre: ' son comentarios. Empieza una línea con ',
      descAddBack: ' para volver a añadir una ruta. ',
      descLastWins: 'Si varias líneas coinciden, gana la última.',
      advancedSyntaxLink: 'Sintaxis avanzada (estilo gitignore)',
      noRulesWarning:
        'No hay reglas definidas - todas las notas reciben actualizaciones automáticas de fechas.',
      placeholderExcludeFolder: '# Excluir una carpeta',
      placeholderExcludeByPattern: '# Excluir por patrón',
      placeholderReinclude: '# Volver a incluir un archivo específico',
      parseError: 'Línea {lineNumber}: {message} - "{text}"',
      previewButton: 'Previsualizar archivos coincidentes',
      previewSummary: '{tracked} notas registradas, {excluded} notas omitidas',
      skippedFilesSummary: 'Archivos omitidos ({excluded})',
      skippedMore: '...y {count} más',
      reference: {
        summary: 'Referencia de la sintaxis de patrones',
        sectionBasics: 'Conceptos básicos de la sintaxis',
        basicsCommentDesc: 'Las líneas que empiezan con # se ignoran',
        basicsBlankDesc: 'Las líneas en blanco se ignoran',
        basicsExcludeDesc:
          'Excluir - los archivos dentro de templates/ se omiten',
        basicsReincludeDesc:
          'Volver a incluir - usa el prefijo ! para deshacer la exclusión',
        basicsLastWinsDesc: 'Cuando varias reglas coinciden, gana la última',
        sectionExcludeFolder: 'Excluir una carpeta',
        excludeFolderAllFilesDesc: 'Todos los archivos dentro de templates/',
        excludeFolderSameEffectDesc:
          'Mismo efecto (la barra final es opcional)',
        excludeFolderNestedDesc: 'Carpeta anidada',
        sectionReinclude: 'Volver a incluir (deshacer una exclusión)',
        reincludeExcludeWholeDesc: 'Excluir toda la carpeta',
        reincludeKeepDesc: 'Pero seguir registrando este archivo específico',
        sectionWildcards: 'Comodines',
        wildcardStarDesc: 'Cualquier carácter excepto /',
        wildcardDoubleStarDesc:
          'Cualquier carácter incluyendo / (cruza carpetas)',
        wildcardQuestionDesc: 'Exactamente un carácter',
        sectionWildcardExamples: 'Ejemplos de comodines',
        wildcardExCanvasRootDesc:
          'Archivos que terminan en .canvas.md en la raíz de la bóveda',
        wildcardExCanvasAnyDesc:
          'Archivos que terminan en .canvas.md en cualquier carpeta',
        wildcardExDailyDesc: 'Archivos como daily/2024-01-01.md',
        wildcardExTwoCharDesc: 'Nombres de archivo de dos caracteres en notes/',
        sectionSpecificFiles: 'Archivos específicos',
        specificFilesOneExactDesc: 'Un archivo exacto',
        specificFilesRootDesc: 'Un archivo en la raíz de la bóveda',
        sectionPathsWithSpaces: 'Rutas con espacios',
        pathsWithSpacesAsIsDesc: 'Solo escribe la ruta tal cual',
        pathsWithSpacesNoQuotesDesc:
          'No hacen falta comillas alrededor de los espacios',
        sectionNonLatin: 'Caracteres no latinos',
        nonLatinCyrillicDesc: 'Nombre de carpeta en cirílico',
        nonLatinChineseDesc: 'Caracteres chinos',
        nonLatinFullPathDesc: 'Ruta completa no latina',
        sectionObsidianExamples: 'Ejemplos específicos de Obsidian',
        obsidianTemplateFolderDesc: 'Carpeta de plantillas',
        obsidianDailyFolderDesc: 'Carpeta de notas diarias',
        obsidianAttachmentsDesc: 'Carpeta de adjuntos / medios',
        obsidianCanvasDesc: 'Todos los archivos de lienzo',
        obsidianExcalidrawDesc: 'Todos los dibujos de Excalidraw',
        obsidianInboxDesc: 'Carpeta de entrada / borradores',
        obsidianArchiveDesc: 'Notas archivadas',
        sectionAllowlist:
          'Modo de lista de permitidos (registrar solo carpetas específicas)',
        allowlistExcludeEverythingDesc: 'Primero, excluye todo',
        allowlistReincludeWantedDesc:
          'Luego vuelve a incluir solo lo que quieras',
        allowlistReincludeAnotherDesc: 'Volver a incluir otra carpeta',
        emptyNote:
          'Cuando este campo está vacío, todas las notas reciben actualizaciones automáticas de fechas.',
      },
    },
    inversions: {
      heading: 'Fecha de modificación anterior a la de creación',
      strategy: {
        name: 'Cómo corregir las fechas en orden incorrecto',
        desc: 'Qué hacer cuando la fecha de última edición es anterior a la fecha de creación. Se aplica a las ediciones automáticas y establece el valor predeterminado de la herramienta masiva.',
        optionDisabled: 'No corregir (solo detectar)',
        optionCreatedToUpdated:
          'Igualar la fecha de creación a la de última edición',
        optionUpdatedToCreated:
          'Igualar la fecha de última edición a la de creación',
        optionMaxAll: 'Igualar ambas a la fecha más reciente',
      },
      tolerance: {
        name: 'Ignorar diferencias mínimas (segundos)',
        desc: 'Ignora las fechas en orden incorrecto cuando la diferencia es menor que esto. Un valor pequeño oculta diferencias mínimas del reloj.',
      },
    },
    advanced: {
      summary: 'Avanzado',
      newFileDelay: {
        name: 'Retraso para archivos nuevos',
        desc: 'Espera esta cantidad de milisegundos antes de estampar una fecha en una nota recién creada. Ayuda a evitar conflictos con los plugins de plantillas. Ponlo en 0 para desactivarlo.',
      },
      autoPopulateCache: {
        name: 'Llenar la caché automáticamente al iniciar',
        desc: 'Cuando el plugin se carga, crea los datos de detección de cambios para las notas que aún no los tienen. Se ejecuta en segundo plano.',
      },
      maxCacheEntries: {
        name: 'Máximo de entradas en la caché',
        desc: 'Cuando la caché supera este límite, se eliminan las entradas más antiguas sin usar. 0 = sin límite.',
      },
      postUpdateCommand: {
        name: 'Comando después de actualizar',
        desc: 'Ejecuta un comando de Obsidian después de actualizar una fecha. Déjalo vacío para desactivarlo.',
        optionNone: 'Ninguno',
      },
    },
    bulk: {
      heading: 'Operaciones masivas',
      populate: {
        name: 'Establecer las fechas a partir de las propias fechas del archivo',
        desc: 'Rellena las fechas de creación y de última edición a partir de las propias fechas de creación y modificación de cada archivo en el disco. Ideal para la configuración inicial.',
        button: 'Rellenar fechas',
      },
      rename: {
        name: 'Renombrar una propiedad',
        desc: 'Mueve los valores de un nombre de propiedad antiguo a uno nuevo en todas las notas. Útil después de cambiar el nombre de una propiedad arriba.',
        button: 'Renombrar propiedad',
      },
      reformat: {
        name: 'Reformatear las fechas existentes',
        desc: 'Busca las fechas escritas en un formato antiguo y reescríbelas en tu formato actual. Útil después de cambiar el formato de fecha arriba.',
        button: 'Reformatear fechas',
      },
      findInversions: {
        name: 'Buscar fechas en orden incorrecto',
        desc: 'Analiza tus notas y enumera aquellas donde la fecha de última edición es anterior a la fecha de creación. Luego puedes aplicar la corrección que elegiste arriba.',
        button: 'Buscar fechas en orden incorrecto',
      },
      rebuildCache: {
        name: 'Reconstruir la caché de hashes',
        desc: 'Recalcula los datos de detección de cambios (hashes de contenido) de todas tus notas. Útil después de cambiar qué cuenta como un cambio arriba.',
        button: 'Reconstruir caché',
      },
    },
  },
  modals: {
    populate: {
      configureTitle:
        'Establecer las fechas a partir de las propias fechas del archivo',
      configureSubtitleLine1:
        'Rellena las fechas de creación y de última edición',
      configureSubtitleLine2:
        'a partir de las propias fechas de creación y modificación de cada archivo en el disco.',
      modeName: 'Qué fechas establecer',
      modeDesc: 'Elige qué fechas rellenar.',
      modeOptionBoth: 'Creación y actualización',
      modeOptionCreated: 'Solo fechas de creación',
      modeOptionUpdated: 'Solo fechas de actualización',
      overrideName: 'Archivos que ya tienen fechas',
      overrideDesc:
        'Rellena solo las fechas que faltan o sobrescribe las existentes.',
      overrideOptionFillMissing: 'Solo rellenar las que faltan (seguro)',
      overrideOptionOverwriteAll:
        'Sobrescribir todas (reemplaza las existentes)',
      autoUpdateNoteTitle: 'Nota sobre la actualización automática:',
      autoUpdateNoteBody:
        'Si la actualización automática ha estado activa, las propias fechas del archivo en el disco pueden reflejar ya las ediciones del propio plugin, no las fechas originales. Para mejores resultados, usa esta función antes de activar la actualización automática o justo después de instalar el plugin.',
      warningTitleCreatedUnreliable:
        'La fecha de creación del archivo no es fiable en algunas plataformas',
      warningTitlePlatformNote: 'Nota sobre la plataforma',
      platformMacWin: 'macOS / Windows',
      platformMacWinNote: 'fecha de creación real del archivo',
      platformLinux: 'Linux',
      platformLinuxNote:
        'el sistema informa de una fecha posterior, no de la fecha de creación real',
      platformAndroid: 'Android',
      platformAndroidNote: 'depende del dispositivo, a menudo no es fiable',
      platformIos: 'iOS',
      platformIosNote: 'generalmente fiable',
      platformReliable: 'Fiable',
      platformUnreliable: 'NO FIABLE',
      platformLineName: '{name}: {prefix}',
      platformYourPlatformSuffix: ' (tu plataforma)',
      syncNoteLine1:
        'Bóvedas sincronizadas: las fechas de los archivos pueden ser reiniciadas por los servicios de sincronización',
      syncNoteLine2: '(Obsidian Sync, iCloud, Dropbox, Git).',
      syncNoteLine3:
        'La fecha de última edición suele ser más fiable que la de creación.',
      recommendation:
        'Recomendación: revisa los resultados después de ejecutar. Haz una copia de seguridad primero.',
      overwriteWarning:
        'Esto reemplazará las fechas existentes en tus notas. No se puede deshacer. Haz una copia de seguridad primero.',
      noPropertyConfigured:
        'No hay un nombre de propiedad configurado para: {missing}. Revisa los ajustes del plugin.',
      previewTitle: 'Vista previa: establecer fechas',
      noFilesNeedUpdating:
        'No hay archivos que actualizar. Todos los archivos aptos ya tienen las fechas solicitadas.',
      previewOverwriteWarning:
        'Modo de sobrescritura: las fechas existentes se reemplazarán. No se puede deshacer. Haz una copia de seguridad primero.',
      settingDates: 'Estableciendo fechas…',
      stopped: 'Detenido.',
      doneWithErrorsSubtitle: '{processed} archivo(s) actualizado(s).',
      doneTitle: '¡Listo! {processed} archivo(s) actualizado(s).',
    },
    rename: {
      configureTitle: 'Renombrar una propiedad',
      configureSubtitle:
        'Mueve los valores de un nombre de propiedad a otro en todas las notas.',
      validationEnterOld:
        'Introduce el nombre de la propiedad antigua para continuar.',
      validationEnterNew:
        'Introduce el nombre de la propiedad nueva para continuar.',
      validationMustDiffer:
        'Los nombres de propiedad antiguo y nuevo deben ser diferentes.',
      oldKeyName: 'Nombre de la propiedad antigua',
      oldKeyDesc: 'El nombre de propiedad que se usa actualmente en tus notas.',
      oldKeyPlaceholder: 'Date_created',
      newKeyName: 'Nombre de la propiedad nueva',
      newKeyDesc: 'El nuevo nombre de propiedad a usar.',
      newKeyPlaceholder: 'Created',
      deleteOldName: 'Eliminar la propiedad antigua después de renombrar',
      deleteOldDesc:
        'Elimina la propiedad antigua después de copiar su valor a la nueva.',
      namesCannotBeEmpty: 'Los nombres de propiedad no pueden estar vacíos.',
      previewTitle: 'Vista previa: renombrar propiedad',
      noNotesUseProperty: 'Ninguna nota usa la propiedad "{oldKey}".',
      conflictWarning:
        '{conflicts} nota(s) ya tienen la propiedad "{newKey}". El valor existente se sobrescribirá.',
      columnArrowNew: '→ {newKey}',
      deleteWarning:
        'La propiedad antigua se eliminará después de copiar. No se puede deshacer. Haz una copia de seguridad primero.',
      renamingProperty: 'Renombrando propiedad…',
      renameStopped: 'Renombrado detenido.',
      doneWithErrorsSubtitle: '{processed} archivo(s) actualizado(s).',
      doneTitle: '¡Listo! {processed} archivo(s) actualizado(s).',
    },
    reformat: {
      configureTitle: 'Estandarizar el formato de fecha',
      configureSubtitle:
        'Analiza los valores de fecha existentes y reescríbelos usando el formato actual de los ajustes.',
      invalidFormat: 'Formato no válido',
      targetFormatName: 'Formato de destino',
      targetFormatDesc: '{currentFormat}',
      scopeName: 'Qué campos reformatear',
      scopeDesc: 'Elige qué fechas estandarizar.',
      scopeOptionAll: 'Todas las fechas',
      scopeOptionCreated: 'Solo creación',
      scopeOptionUpdated: 'Solo actualización',
      scopeOptionViewed: 'Solo visualización',
      autoDetectNote:
        'Las fechas se detectan automáticamente a partir de formatos comunes (ISO 8601, europeo, estadounidense, fechas numéricas) y se reescriben en tu formato actual.',
      noPropertyConfigured:
        'No hay un nombre de propiedad configurado para: {missing}. Revisa los ajustes del plugin.',
      previewTitle: 'Vista previa: estandarizar fechas',
      noChangeAmbiguous:
        'Aún no hay nada que convertir. {ambiguousCount} fecha(s) se pueden leer de dos maneras y se dejan sin cambios - elige un orden de día/mes arriba para convertirlas.',
      noChangeDefault:
        'No hay archivos que reformatear. Todas las fechas ya están en el formato de destino o no se pudieron analizar.',
      errorWarningNoChange:
        '{errorCount} archivo(s) tienen fechas que no se pudieron analizar.',
      errorWarningWillSkip:
        '{errorCount} archivo(s) tienen fechas que no se pudieron analizar. Se omitirán.',
      checkNote:
        'Las filas marcadas con [check] se pueden leer de dos maneras - confirma que la nueva fecha sea correcta.',
      rewriteWarning:
        'Esto reescribe los valores de fecha existentes en su lugar. No se puede deshacer. Haz una copia de seguridad primero.',
      ambiguityName: 'Fechas que se pueden leer de dos maneras',
      ambiguityDesc:
        '{ambiguousCount} fecha(s) pueden significar día primero o mes primero (p. ej. 01/05/2024).{detectedHint}',
      detectedHintMonthFirst: ' Tu sistema sugiere mes primero.',
      detectedHintDayFirst: ' Tu sistema sugiere día primero.',
      ambiguityOptionSkip: 'Dejar sin cambios las fechas ambiguas',
      ambiguityOptionDmy: 'Día primero (01/05 = día 1, mes 5)',
      ambiguityOptionMdy: 'Mes primero (01/05 = mes 1, día 5)',
      cellCouldNotRead: '{oldValue} (no se pudo leer la fecha)',
      cellConversion: '{oldValue} → {newValue}{check}',
      cellNewValue: '{newValue}{check}',
      cellCheckSuffix: ' [check]',
      reformattingDates: 'Reformateando fechas…',
      reformatStopped: 'Reformateo detenido.',
      doneWithErrorsSubtitle: '{processed} archivo(s) actualizado(s).',
      doneTitle: '¡Listo! {processed} archivo(s) actualizado(s).',
    },
    inversions: {
      scanningTitle: 'Buscando fechas en orden incorrecto…',
      foundTitle: 'Se encontraron {count} notas con fechas en orden incorrecto',
      foundSubtitle:
        'Estas notas tienen una fecha de última edición anterior a la de creación. Elige abajo cómo corregirlas, o cierra para revisarlas manualmente.',
      noneFound: 'No se encontraron fechas en orden incorrecto.',
      strategyName: 'Cómo corregir',
      strategyDesc: 'Elige cómo corregir las fechas.',
      strategyOptionDisabled: 'No corregir (solo revisar)',
      strategyOptionCreatedToUpdated:
        'Igualar la fecha de creación a la de última edición',
      strategyOptionUpdatedToCreated:
        'Igualar la fecha de última edición a la de creación',
      strategyOptionMaxAll: 'Igualar ambas a la fecha más reciente',
      toleranceNote:
        'Se ignoran las diferencias menores de {tolerance} segundos (definido en los ajustes).',
      columnDelta: 'Δ',
      fixWarning:
        'Esto modificará {count} notas. No se puede deshacer. Haz una copia de seguridad primero.',
      fixingDates: 'Corrigiendo fechas…',
      stopped: 'Operación masiva detenida.',
      fixedNotice: '{processed} nota(s) corregida(s).',
      doneWithErrorsSubtitle: '{processed} nota(s) corregida(s).',
      doneTitle: '¡Listo! Puedes cerrar esta ventana con seguridad.',
    },
    rebuildCache: {
      loadingFiles: 'Cargando archivos…',
      confirmTitle:
        'Reconstruir los datos de detección de cambios de {count} archivos',
      confirmSubtitle:
        'Esto recalcula las huellas de contenido (hashes) que se usan para detectar ediciones reales. No cambia tus notas.',
      rebuilding: 'Reconstruyendo…',
      stopped: 'Operación masiva detenida.',
      doneWithErrorsSubtitle: '{processed} archivo(s) procesado(s).',
      doneTitle: '¡Listo! Puedes cerrar esta ventana con seguridad.',
    },
  },
};
