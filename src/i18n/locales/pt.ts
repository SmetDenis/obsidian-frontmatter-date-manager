// Portuguese (European). Machine-generated baseline. Improvements welcome - see CONTRIBUTING.md.
import type { Strings, DeepPartial } from '../index';

export const STRINGS_PT: DeepPartial<Strings> = {
  common: {
    run: 'Executar',
    back: 'Voltar',
    cancel: 'Cancelar',
    close: 'Fechar',
    file: 'Ficheiro',
    created: 'Criado',
    updated: 'Atualizado',
    viewed: 'Visualizado',
    createdKeyed: 'Criado ({key})',
    updatedKeyed: 'Atualizado ({key})',
    viewedKeyed: 'Visualizado ({key})',
    scanAndPreview: 'Analisar e pré-visualizar',
    scanningFiles: 'A analisar ficheiros…',
    doneWithErrors: 'Concluído com {errors} erro(s).',
  },

  commands: {
    updateCurrentFile: 'Atualizar datas no ficheiro atual',
    toggleAutoUpdate: 'Ativar/desativar atualização automática',
    pauseAutoUpdate: 'Pausar a atualização automática durante 5 minutos',
  },

  statusBar: {
    paused: 'Em pausa',
    pausedWithMinutes: 'Em pausa ({remaining}m)',
  },

  notices: {
    inversionDetectedAndFixed:
      'Frontmatter Date Manager: foram detetadas e corrigidas datas fora de ordem. Use "Encontrar datas fora de ordem" nas definições para rever.',
    timestampsUpdated: 'Datas atualizadas.',
    fileIgnored: 'O ficheiro é ignorado pelas definições do plugin.',
    failedToUpdateWithReason: 'Falha ao atualizar as datas: {reason}',
    failedToUpdate: 'Falha ao atualizar as datas.',
    autoUpdateEnabled: 'Atualização automática ativada',
    autoUpdateDisabled: 'Atualização automática desativada',
    autoUpdatePausedForMinutes:
      'Atualização automática em pausa durante {minutes} minutos. Será retomada automaticamente.',
    autoUpdateResumed: 'Atualização automática retomada.',
    malformedFrontmatter:
      'Frontmatter Date Manager: falhou\nPropriedades malformadas neste ficheiro: {filePath}\n\n{message}',
  },

  bulkChrome: {
    summaryWillChange: '{changed} ficheiro(s) serão alterados',
    summarySkipped: '{skipped} ignorado(s)',
    summaryErrors: '{errors} erro(s)',
    pagerPrev: 'Anterior',
    pagerNext: 'Seguinte',
    pageInfo: 'Página {current} de {total}',
    downloadFullPreview: 'Transferir pré-visualização completa',
    downloadSuccess:
      'Transferidas {count} linha(s) como {filename} para a sua pasta de transferências.',
    downloadFailed:
      'Não foi possível transferir o ficheiro de pré-visualização.',
    failureColumnError: 'Erro',
    progressCounter: '{count}/{max}',
  },

  settings: {
    description: {
      syncIntro:
        'Os serviços de sincronização, as ferramentas de cópia de segurança e outros plugins reescrevem frequentemente os ficheiros sem alterar o seu conteúdo - o que repõe as datas do ficheiro no disco. Isso torna impossível saber quando editou realmente uma nota pela última vez.',
      pluginIntro:
        'Este plugin escreve as datas de criação e de última edição diretamente nas propriedades de cada nota e deteta alterações reais comparando o conteúdo, por isso as suas datas refletem edições reais, e não artefactos de sincronização.',
    },
    dates: {
      heading: 'Datas a acompanhar',
      enableNoneHint:
        'Ative pelo menos uma data acima para configurar o plugin.',
      created: {
        enableName: 'Acompanhar a data de criação',
        enableDesc:
          'Adicionar uma data de criação às notas que ainda não a têm.',
        propertyName: 'Propriedade de criação',
        propertyDesc: 'Nome da propriedade onde é guardada a data de criação.',
      },
      updated: {
        enableName: 'Acompanhar a data da última edição',
        enableDesc: 'Atualizar esta data sempre que editar a nota.',
        propertyName: 'Propriedade de atualização',
        propertyDesc:
          'Nome da propriedade onde é guardada a data da última edição.',
      },
      updateCount: {
        enableName: 'Contar edições',
        enableDesc:
          'Adicionar uma propriedade numérica que aumenta em um sempre que editar uma nota. Uma contagem de atividade aproximada, não um histórico exato.',
        propertyName: 'Propriedade da contagem de edições',
        propertyDesc:
          'Nome da propriedade onde é guardada a contagem de edições.',
      },
      viewed: {
        enableName: 'Acompanhar a data da última abertura',
        enableDesc: 'Guardar a data sempre que abrir a nota.',
        propertyName: 'Propriedade de visualização',
        propertyDesc:
          'Nome da propriedade onde é guardada a data da última abertura.',
      },
    },
    formatting: {
      heading: 'Formatação da data',
      dateFormat: {
        name: 'Formato da data',
        desc: 'Como as datas e horas são escritas nas suas notas.',
        formatCodesLink: 'Ver os códigos de formato disponíveis',
        currentlyPreview: 'Atualmente: {preview}',
        invalidWithHint: 'Formato inválido. {hint}',
        invalidFormat: 'Cadeia de formato de data inválida.',
        obsidianDefault:
          "Predefinição do Obsidian: yyyy-MM-dd'T'HH:mm:ss (data e hora, fuso horário local)",
      },
      timezone: {
        name: 'Fuso horário',
        desc: 'Fuso horário utilizado ao escrever as datas. Deixe em branco para usar o fuso horário do seu dispositivo ({localTz}).',
        placeholder: 'Local ({localTz})',
        resetTooltip: 'Repor o fuso horário local',
      },
      numberProperties: {
        name: 'Guardar datas só com números sem aspas',
        desc: 'Se o seu formato de data for apenas dígitos (como um carimbo de tempo unix), escrevê-la como um número simples (updated: 1712930400) em vez de texto entre aspas (updated: "1712930400"). Sem efeito quando o formato inclui hífenes ou dois-pontos.',
      },
    },
    behavior: {
      heading: 'Comportamento',
      autoUpdate: {
        name: 'Atualização automática',
        desc: 'Atualizar automaticamente as datas quando editar uma nota. Também disponível na paleta de comandos.',
      },
      minSeconds: {
        name: 'Mínimo de segundos entre atualizações',
        desc: 'Evita atualizar a data com demasiada frequência enquanto escreve ou alterna entre notas.',
      },
      changeDetection: {
        name: 'Deteção de alterações (hashing de conteúdo)',
        descEnabled:
          'A data da última edição só é escrita quando o conteúdo da nota muda realmente - isto evita atualizações falsas dos plugins de sincronização.',
        descDisabled:
          'Desativado - a data da última edição é escrita em cada gravação, mesmo que nada tenha mudado.',
      },
      hashTrackingMode: {
        name: 'O que conta como alteração',
        desc: 'Que parte de uma nota conta como alteração. "Só o corpo" - editar propriedades (etiquetas, aliases, etc.) não atualiza a data. "Só as propriedades" - editar o texto da nota não atualiza a data. "Ambos" - qualquer edição atualiza a data.',
        optionBody: 'Só o corpo da nota (predefinição)',
        optionFrontmatter: 'Só as propriedades',
        optionBoth: 'Corpo e propriedades',
        changedNotice:
          'Modo de acompanhamento alterado. Reconstrua a cache de hashes (nas operações em massa) para que as datas se mantenham exatas.',
      },
      excludeKeys: {
        name: 'Ignorar estas propriedades',
        desc: 'Editar estas propriedades não atualiza a data. Pode adicionar várias de uma vez, separadas por vírgulas. As propriedades created, updated e viewed são sempre ignoradas automaticamente.',
        placeholder: 'Nome de propriedade como tags',
        addTooltip: 'Adicionar propriedade',
        chipRemoveAriaLabel: 'Remover {entry}',
      },
    },
    filterRules: {
      name: 'Ficheiros e pastas a ignorar',
      descIntro:
        'Escolha os ficheiros ou pastas a deixar em paz (sem atualizações automáticas de datas). ',
      descOnePerLine: 'Um padrão por linha. As linhas que começam com ',
      descCommentsAre: ' são comentários. Comece uma linha com ',
      descAddBack: ' para voltar a incluir um caminho. ',
      descLastWins: 'Se várias linhas corresponderem, prevalece a última.',
      advancedSyntaxLink: 'Sintaxe avançada (ao estilo gitignore)',
      noRulesWarning:
        'Sem regras definidas - todas as notas recebem atualizações automáticas de datas.',
      placeholderExcludeFolder: '# Excluir uma pasta',
      placeholderExcludeByPattern: '# Excluir por padrão',
      placeholderReinclude: '# Voltar a incluir um ficheiro específico',
      parseError: 'Linha {lineNumber}: {message} - "{text}"',
      previewButton: 'Pré-visualizar ficheiros correspondentes',
      previewSummary:
        '{tracked} notas acompanhadas, {excluded} notas ignoradas',
      skippedFilesSummary: 'Ficheiros ignorados ({excluded})',
      skippedMore: '...e mais {count}',
      reference: {
        summary: 'Referência de sintaxe de padrões',
        sectionBasics: 'Noções básicas de sintaxe',
        basicsCommentDesc: 'As linhas que começam com # são ignoradas',
        basicsBlankDesc: 'As linhas em branco são ignoradas',
        basicsExcludeDesc:
          'Excluir - os ficheiros dentro de templates/ são ignorados',
        basicsReincludeDesc:
          'Voltar a incluir - prefixe com ! para anular a exclusão',
        basicsLastWinsDesc:
          'Quando várias regras correspondem, prevalece a última',
        sectionExcludeFolder: 'Excluir uma pasta',
        excludeFolderAllFilesDesc: 'Todos os ficheiros dentro de templates/',
        excludeFolderSameEffectDesc: 'Mesmo efeito (a barra final é opcional)',
        excludeFolderNestedDesc: 'Pasta aninhada',
        sectionReinclude: 'Voltar a incluir (anular uma exclusão)',
        reincludeExcludeWholeDesc: 'Excluir a pasta inteira',
        reincludeKeepDesc:
          'Mas continuar a acompanhar este ficheiro específico',
        sectionWildcards: 'Caracteres universais',
        wildcardStarDesc: 'Quaisquer caracteres exceto /',
        wildcardDoubleStarDesc:
          'Quaisquer caracteres, incluindo / (atravessa pastas)',
        wildcardQuestionDesc: 'Exatamente um caractere',
        sectionWildcardExamples: 'Exemplos de caracteres universais',
        wildcardExCanvasRootDesc:
          'Ficheiros terminados em .canvas.md na raiz do cofre',
        wildcardExCanvasAnyDesc:
          'Ficheiros terminados em .canvas.md em qualquer pasta',
        wildcardExDailyDesc: 'Ficheiros como daily/2024-01-01.md',
        wildcardExTwoCharDesc: 'Nomes de ficheiro de dois caracteres em notes/',
        sectionSpecificFiles: 'Ficheiros específicos',
        specificFilesOneExactDesc: 'Um ficheiro exato',
        specificFilesRootDesc: 'Um ficheiro na raiz do cofre',
        sectionPathsWithSpaces: 'Caminhos com espaços',
        pathsWithSpacesAsIsDesc: 'Basta escrever o caminho tal como está',
        pathsWithSpacesNoQuotesDesc:
          'Não são necessárias aspas à volta dos espaços',
        sectionNonLatin: 'Caracteres não latinos',
        nonLatinCyrillicDesc: 'Nome de pasta em cirílico',
        nonLatinChineseDesc: 'Caracteres chineses',
        nonLatinFullPathDesc: 'Caminho completo não latino',
        sectionObsidianExamples: 'Exemplos específicos do Obsidian',
        obsidianTemplateFolderDesc: 'Pasta de modelos',
        obsidianDailyFolderDesc: 'Pasta de notas diárias',
        obsidianAttachmentsDesc: 'Pasta de anexos / multimédia',
        obsidianCanvasDesc: 'Todos os ficheiros de tela',
        obsidianExcalidrawDesc: 'Todos os desenhos do Excalidraw',
        obsidianInboxDesc: 'Pasta de entrada / rascunhos',
        obsidianArchiveDesc: 'Notas arquivadas',
        sectionAllowlist:
          'Modo de lista de permissões (acompanhar só pastas específicas)',
        allowlistExcludeEverythingDesc: 'Primeiro, exclua tudo',
        allowlistReincludeWantedDesc: 'Depois volte a incluir só o que quiser',
        allowlistReincludeAnotherDesc: 'Voltar a incluir outra pasta',
        emptyNote:
          'Quando este campo está vazio, todas as notas recebem atualizações automáticas de datas.',
      },
    },
    inversions: {
      heading: 'Datas modificadas antes da criação',
      strategy: {
        name: 'Como corrigir datas fora de ordem',
        desc: 'O que fazer quando a data da última edição é anterior à data de criação. Aplica-se às edições automáticas e define a predefinição da ferramenta em massa.',
        optionDisabled: 'Não corrigir (só detetar)',
        optionCreatedToUpdated:
          'Definir a data de criação igual à data da última edição',
        optionUpdatedToCreated:
          'Definir a data da última edição igual à data de criação',
        optionMaxAll: 'Definir ambas para a data mais recente',
      },
      tolerance: {
        name: 'Ignorar diferenças mínimas (segundos)',
        desc: 'Ignorar datas fora de ordem quando a diferença for menor do que isto. Um valor pequeno oculta pequenas diferenças de relógio.',
      },
    },
    advanced: {
      summary: 'Avançado',
      newFileDelay: {
        name: 'Atraso para ficheiros novos',
        desc: 'Aguardar este número de milissegundos antes de carimbar uma data numa nota recém-criada. Ajuda a evitar conflitos com plugins de modelos. Defina como 0 para desativar.',
      },
      autoPopulateCache: {
        name: 'Preencher a cache automaticamente no arranque',
        desc: 'Quando o plugin é carregado, criar dados de deteção de alterações para as notas que ainda não os têm. Corre em segundo plano.',
      },
      maxCacheEntries: {
        name: 'Máximo de entradas na cache',
        desc: 'Quando a cache ultrapassa este limite, as entradas mais antigas não utilizadas são removidas. 0 = sem limite.',
      },
      postUpdateCommand: {
        name: 'Comando após a atualização',
        desc: 'Executar um comando do Obsidian depois de uma data ser atualizada. Deixe vazio para desativar.',
        optionNone: 'Nenhum',
      },
    },
    bulk: {
      heading: 'Operações em massa',
      populate: {
        name: 'Definir datas a partir das datas do próprio ficheiro',
        desc: 'Preencher as datas de criação e de última edição a partir das datas de criação e modificação de cada ficheiro no disco. Ótimo para a configuração inicial.',
        button: 'Preencher datas',
      },
      rename: {
        name: 'Mudar o nome de uma propriedade',
        desc: 'Mover valores de um nome de propriedade antigo para um novo em todas as notas. Útil depois de mudar o nome de uma propriedade acima.',
        button: 'Mudar o nome da propriedade',
      },
      reformat: {
        name: 'Reformatar datas existentes',
        desc: 'Encontrar datas escritas num formato antigo e reescrevê-las no seu formato atual. Útil depois de mudar o formato da data acima.',
        button: 'Reformatar datas',
      },
      findInversions: {
        name: 'Encontrar datas fora de ordem',
        desc: 'Analisar as suas notas e listar aquelas em que a data da última edição é anterior à data de criação. Pode depois aplicar a correção que escolheu acima.',
        button: 'Encontrar datas fora de ordem',
      },
      rebuildCache: {
        name: 'Reconstruir a cache de hashes',
        desc: 'Recalcular os dados de deteção de alterações (hashes de conteúdo) para todas as suas notas. Útil depois de mudar o que conta como alteração acima.',
        button: 'Reconstruir a cache',
      },
    },
  },

  modals: {
    populate: {
      configureTitle: 'Definir datas a partir das datas do próprio ficheiro',
      configureSubtitleLine1:
        'Preencher as datas de criação e de última edição',
      configureSubtitleLine2:
        'a partir das datas de criação e modificação de cada ficheiro no disco.',
      modeName: 'Que datas definir',
      modeDesc: 'Escolha que datas preencher.',
      modeOptionBoth: 'Tanto criação como atualização',
      modeOptionCreated: 'Só datas de criação',
      modeOptionUpdated: 'Só datas de atualização',
      overrideName: 'Ficheiros que já têm datas',
      overrideDesc:
        'Preencher só as datas em falta ou substituir as existentes.',
      overrideOptionFillMissing: 'Só preencher em falta (seguro)',
      overrideOptionOverwriteAll: 'Substituir tudo (substitui as existentes)',
      autoUpdateNoteTitle: 'Nota sobre a atualização automática:',
      autoUpdateNoteBody:
        'Se a atualização automática esteve ativa, as próprias datas do ficheiro no disco podem já refletir as edições do próprio plugin, e não as datas originais. Para melhores resultados, use esta funcionalidade antes de ativar a atualização automática ou logo após instalar o plugin.',
      warningTitleCreatedUnreliable:
        'A data de criação do ficheiro não é fiável em algumas plataformas',
      warningTitlePlatformNote: 'Nota sobre a plataforma',
      platformMacWinNote: 'data real de criação do ficheiro',
      platformLinuxNote:
        'o sistema indica uma data posterior, não a data real de criação',
      platformAndroidNote: 'depende do dispositivo, muitas vezes não é fiável',
      platformIosNote: 'geralmente fiável',
      platformReliable: 'Fiável',
      platformUnreliable: 'NÃO FIÁVEL',
      platformYourPlatformSuffix: ' (a sua plataforma)',
      syncNoteLine1:
        'Cofres sincronizados: as datas dos ficheiros podem ser repostas pelos serviços de sincronização',
      syncNoteLine3:
        'A data da última edição é normalmente mais fiável do que a data de criação.',
      recommendation:
        'Recomendação: reveja os resultados após a execução. Faça primeiro uma cópia de segurança.',
      overwriteWarning:
        'Isto irá substituir as datas existentes nas suas notas. Não pode ser anulado. Faça primeiro uma cópia de segurança.',
      noPropertyConfigured:
        'Nenhum nome de propriedade configurado para: {missing}. Verifique as definições do plugin.',
      previewTitle: 'Pré-visualização: definir datas',
      noFilesNeedUpdating:
        'Nenhum ficheiro precisa de ser atualizado. Todos os ficheiros elegíveis já têm as datas pedidas.',
      previewOverwriteWarning:
        'Modo de substituição: as datas existentes serão substituídas. Não pode ser anulado. Faça primeiro uma cópia de segurança.',
      settingDates: 'A definir datas…',
      stopped: 'Interrompido.',
      doneWithErrorsSubtitle: '{processed} ficheiro(s) atualizados.',
      doneTitle: 'Concluído! {processed} ficheiro(s) atualizados.',
    },
    rename: {
      configureTitle: 'Mudar o nome de uma propriedade',
      configureSubtitle:
        'Mover valores de um nome de propriedade para outro em todas as notas.',
      validationEnterOld:
        'Introduza o nome de propriedade antigo para continuar.',
      validationEnterNew:
        'Introduza o novo nome de propriedade para continuar.',
      validationMustDiffer:
        'O nome de propriedade antigo e o novo devem ser diferentes.',
      oldKeyName: 'Nome de propriedade antigo',
      oldKeyDesc: 'O nome de propriedade atualmente usado nas suas notas.',
      newKeyName: 'Novo nome de propriedade',
      newKeyDesc: 'O novo nome de propriedade a usar.',
      deleteOldName: 'Eliminar a propriedade antiga após a mudança de nome',
      deleteOldDesc:
        'Remover a propriedade antiga depois de copiar o seu valor para a nova.',
      namesCannotBeEmpty: 'Os nomes de propriedade não podem estar vazios.',
      previewTitle: 'Pré-visualização: mudar o nome da propriedade',
      noNotesUseProperty: 'Nenhuma nota usa a propriedade "{oldKey}".',
      conflictWarning:
        '{conflicts} nota(s) já têm a propriedade "{newKey}". O valor existente será substituído.',
      columnArrowNew: '→ {newKey}',
      deleteWarning:
        'A propriedade antiga será eliminada após a cópia. Não pode ser anulado. Faça primeiro uma cópia de segurança.',
      renamingProperty: 'A mudar o nome da propriedade…',
      renameStopped: 'Mudança de nome interrompida.',
      doneWithErrorsSubtitle: '{processed} ficheiro(s) atualizados.',
      doneTitle: 'Concluído! {processed} ficheiro(s) atualizados.',
    },
    reformat: {
      configureTitle: 'Uniformizar o formato da data',
      configureSubtitle:
        'Analisar os valores de data existentes e reescrevê-los usando o formato atual das definições.',
      invalidFormat: 'Formato inválido',
      targetFormatName: 'Formato de destino',
      scopeName: 'Que campos reformatar',
      scopeDesc: 'Escolha que datas uniformizar.',
      scopeOptionAll: 'Todas as datas',
      scopeOptionCreated: 'Só criação',
      scopeOptionUpdated: 'Só atualização',
      scopeOptionViewed: 'Só visualização',
      autoDetectNote:
        'As datas são detetadas automaticamente a partir de formatos comuns (ISO 8601, europeu, dos EUA, datas numéricas) e reescritas no seu formato atual.',
      noPropertyConfigured:
        'Nenhum nome de propriedade configurado para: {missing}. Verifique as definições do plugin.',
      previewTitle: 'Pré-visualização: uniformizar datas',
      noChangeAmbiguous:
        'Ainda não há nada para converter. {ambiguousCount} data(s) podem ser lidas de duas formas e ficam inalteradas - escolha uma ordem dia/mês acima para as converter.',
      noChangeDefault:
        'Nenhum ficheiro precisa de ser reformatado. Todas as datas já estão no formato de destino ou não puderam ser analisadas.',
      errorWarningNoChange:
        '{errorCount} ficheiro(s) têm datas que não puderam ser analisadas.',
      errorWarningWillSkip:
        '{errorCount} ficheiro(s) têm datas que não puderam ser analisadas. Estas serão ignoradas.',
      checkNote:
        'As linhas marcadas com [check] podem ser lidas de duas formas - confirme se a nova data parece correta.',
      rewriteWarning:
        'Isto reescreve os valores de data existentes no lugar. Não pode ser anulado. Faça primeiro uma cópia de segurança.',
      ambiguityName: 'Datas que podem ser lidas de duas formas',
      ambiguityDesc:
        '{ambiguousCount} data(s) podem significar dia primeiro ou mês primeiro (por exemplo, 01/05/2024).{detectedHint}',
      detectedHintMonthFirst: ' O seu sistema sugere o mês primeiro.',
      detectedHintDayFirst: ' O seu sistema sugere o dia primeiro.',
      ambiguityOptionSkip: 'Deixar as datas pouco claras inalteradas',
      ambiguityOptionDmy: 'Dia primeiro (01/05 = dia 1, mês 5)',
      ambiguityOptionMdy: 'Mês primeiro (01/05 = mês 1, dia 5)',
      cellCouldNotRead: '{oldValue} (não foi possível ler a data)',
      cellConversion: '{oldValue} → {newValue}{check}',
      cellNewValue: '{newValue}{check}',
      cellCheckSuffix: ' [check]',
      reformattingDates: 'A reformatar datas…',
      reformatStopped: 'Reformatação interrompida.',
      doneWithErrorsSubtitle: '{processed} ficheiro(s) atualizados.',
      doneTitle: 'Concluído! {processed} ficheiro(s) atualizados.',
    },
    inversions: {
      scanningTitle: 'A procurar datas fora de ordem…',
      foundTitle: 'Encontradas {count} notas com datas fora de ordem',
      foundSubtitle:
        'Estas notas têm uma data de última edição anterior à data de criação. Escolha abaixo como corrigi-las ou feche para rever manualmente.',
      noneFound: 'Nenhuma data fora de ordem encontrada.',
      strategyName: 'Como corrigir',
      strategyDesc: 'Escolha como corrigir as datas.',
      strategyOptionDisabled: 'Não corrigir (só rever)',
      strategyOptionCreatedToUpdated:
        'Definir a data de criação igual à data da última edição',
      strategyOptionUpdatedToCreated:
        'Definir a data da última edição igual à data de criação',
      strategyOptionMaxAll: 'Definir ambas para a data mais recente',
      toleranceNote:
        'A ignorar diferenças inferiores a {tolerance} segundos (definido nas definições).',
      fixWarning:
        'Isto irá modificar {count} notas. Não pode ser anulado. Faça primeiro uma cópia de segurança.',
      fixingDates: 'A corrigir datas…',
      stopped: 'Operação em massa interrompida.',
      fixedNotice: 'Corrigida(s) {processed} nota(s).',
      doneWithErrorsSubtitle: '{processed} nota(s) corrigidas.',
      doneTitle: 'Concluído! Pode fechar esta janela em segurança.',
    },
    rebuildCache: {
      loadingFiles: 'A carregar ficheiros…',
      confirmTitle:
        'Reconstruir os dados de deteção de alterações para {count} ficheiros',
      confirmSubtitle:
        'Isto recalcula as impressões digitais do conteúdo (hashes de conteúdo) usadas para detetar edições reais. Não altera as suas notas.',
      rebuilding: 'A reconstruir…',
      stopped: 'Operação em massa interrompida.',
      doneWithErrorsSubtitle: '{processed} ficheiro(s) processados.',
      doneTitle: 'Concluído! Pode fechar esta janela em segurança.',
    },
  },
};
