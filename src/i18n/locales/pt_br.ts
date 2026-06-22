// Portuguese (Brazilian). Machine-generated baseline. Improvements welcome - see CONTRIBUTING.md.
import type { Strings } from '../index';

export const STRINGS_PT_BR: Strings = {
  common: {
    run: 'Executar',
    back: 'Voltar',
    cancel: 'Cancelar',
    close: 'Fechar',
    file: 'Arquivo',
    created: 'Criado',
    updated: 'Atualizado',
    viewed: 'Visualizado',
    createdKeyed: 'Criado ({key})',
    updatedKeyed: 'Atualizado ({key})',
    viewedKeyed: 'Visualizado ({key})',
    scanAndPreview: 'Escanear e visualizar',
    scanningFiles: 'Escaneando arquivos…',
    doneWithErrors: 'Concluído com {errors} erro(s).',
  },
  commands: {
    updateCurrentFile: 'Atualizar datas do arquivo atual',
    toggleAutoUpdate: 'Ativar/desativar atualização automática',
    pauseAutoUpdate: 'Pausar atualização automática por 5 minutos',
  },
  statusBar: {
    paused: 'Pausado',
    pausedWithMinutes: 'Pausado ({remaining}m)',
  },
  notices: {
    inversionDetectedAndFixed:
      'Frontmatter Date Manager: foram detectadas e corrigidas datas fora de ordem. Use "Encontrar datas fora de ordem" nas configurações para revisar.',
    timestampsUpdated: 'Datas atualizadas.',
    fileIgnored: 'O arquivo é ignorado pelas configurações do plugin.',
    failedToUpdateWithReason: 'Falha ao atualizar as datas: {reason}',
    failedToUpdate: 'Falha ao atualizar as datas.',
    autoUpdateEnabled: 'Atualização automática ativada',
    autoUpdateDisabled: 'Atualização automática desativada',
    autoUpdatePausedForMinutes:
      'Atualização automática pausada por {minutes} minutos. Será retomada automaticamente.',
    autoUpdateResumed: 'Atualização automática retomada.',
    malformedFrontmatter:
      'Frontmatter Date Manager falhou\nPropriedades malformadas neste arquivo: {filePath}\n\n{message}',
  },
  bulkChrome: {
    summaryWillChange: '{changed} arquivo(s) serão alterados',
    summarySkipped: '{skipped} ignorado(s)',
    summaryErrors: '{errors} erro(s)',
    pagerPrev: 'Anterior',
    pagerNext: 'Próxima',
    pageInfo: 'Página {current} de {total}',
    downloadFullPreview: 'Baixar visualização completa',
    downloadSuccess:
      'Baixado(s) {count} linha(s) como {filename} na sua pasta de downloads.',
    downloadFailed: 'Não foi possível baixar o arquivo de visualização.',
    failureColumnError: 'Erro',
    progressCounter: '{count}/{max}',
  },
  settings: {
    description: {
      syncIntro:
        'Serviços de sincronização, ferramentas de backup e outros plugins costumam reescrever arquivos sem alterar o conteúdo - o que reinicia as datas do arquivo no disco. Isso torna impossível saber quando você realmente editou uma nota pela última vez.',
      pluginIntro:
        'Este plugin grava as datas de criação e de última edição diretamente nas propriedades de cada nota e detecta alterações reais comparando o conteúdo, para que suas datas reflitam edições de verdade - e não artefatos da sincronização.',
    },
    dates: {
      heading: 'Datas a rastrear',
      enableNoneHint:
        'Ative pelo menos uma data acima para configurar o plugin.',
      created: {
        enableName: 'Rastrear data de criação',
        enableDesc: 'Adicionar uma data de criação às notas que ainda não têm.',
        propertyName: 'Propriedade de criação',
        propertyDesc: 'Nome da propriedade onde a data de criação é salva.',
        propertyPlaceholder: 'Created',
      },
      updated: {
        enableName: 'Rastrear data da última edição',
        enableDesc: 'Atualizar esta data sempre que você editar a nota.',
        propertyName: 'Propriedade de atualização',
        propertyDesc:
          'Nome da propriedade onde a data da última edição é salva.',
        propertyPlaceholder: 'Updated',
      },
      updateCount: {
        enableName: 'Contar edições',
        enableDesc:
          'Adicionar uma propriedade numérica que aumenta em um a cada vez que você edita uma nota. Uma contagem aproximada de atividade, não um histórico exato.',
        propertyName: 'Propriedade da contagem de edições',
        propertyDesc: 'Nome da propriedade onde a contagem de edições é salva.',
      },
      viewed: {
        enableName: 'Rastrear data da última abertura',
        enableDesc: 'Salvar a data cada vez que você abre a nota.',
        propertyName: 'Propriedade de visualização',
        propertyDesc:
          'Nome da propriedade onde a data da última abertura é salva.',
        propertyPlaceholder: 'Viewed',
      },
    },
    formatting: {
      heading: 'Formatação de data',
      dateFormat: {
        name: 'Formato de data',
        desc: 'Como as datas e horas são gravadas nas suas notas.',
        formatCodesLink: 'Ver os códigos de formato disponíveis',
        currentlyPreview: 'Atualmente: {preview}',
        invalidWithHint: 'Formato inválido. {hint}',
        invalidFormat: 'String de formato de data inválida.',
        obsidianDefault:
          "Padrão do Obsidian: yyyy-MM-dd'T'HH:mm:ss (data e hora, fuso horário local)",
      },
      timezone: {
        name: 'Fuso horário',
        desc: 'Fuso horário usado ao gravar as datas. Deixe em branco para usar o fuso horário do seu dispositivo ({localTz}).',
        placeholder: 'Local ({localTz})',
        resetTooltip: 'Redefinir para o fuso horário local',
      },
      numberProperties: {
        name: 'Salvar datas só com números sem aspas',
        desc: 'Se o seu formato de data tiver apenas dígitos (como um carimbo unix), gravá-la como um número simples (updated: 1712930400) em vez de texto entre aspas (updated: "1712930400"). Sem efeito quando o formato inclui hifens ou dois-pontos.',
      },
    },
    behavior: {
      heading: 'Comportamento',
      autoUpdate: {
        name: 'Atualização automática',
        desc: 'Atualizar as datas automaticamente quando você edita uma nota. Também disponível na paleta de comandos.',
      },
      minSeconds: {
        name: 'Mínimo de segundos entre atualizações',
        desc: 'Evita atualizar a data com muita frequência enquanto você digita ou alterna entre notas.',
      },
      changeDetection: {
        name: 'Detecção de alterações (hash de conteúdo)',
        descEnabled:
          'A data da última edição é gravada apenas quando o conteúdo da nota realmente muda - isso evita atualizações falsas de plugins de sincronização.',
        descDisabled:
          'Desativado - a data da última edição é gravada a cada salvamento, mesmo que nada tenha mudado.',
      },
      hashTrackingMode: {
        name: 'O que conta como alteração',
        desc: 'Qual parte de uma nota conta como alteração. "Somente o corpo" - editar as propriedades (tags, aliases etc.) não atualizará a data. "Somente propriedades" - editar o texto da nota não atualizará a data. "Ambos" - qualquer edição atualiza a data.',
        optionBody: 'Somente o corpo da nota (padrão)',
        optionFrontmatter: 'Somente propriedades',
        optionBoth: 'Corpo e propriedades',
        changedNotice:
          'Modo de rastreamento alterado. Reconstrua o cache de hashes (nas operações em massa) para que as datas permaneçam precisas.',
      },
      excludeKeys: {
        name: 'Ignorar estas propriedades',
        desc: 'Editar estas propriedades não atualizará a data. Você pode adicionar várias de uma vez, separadas por vírgulas. As propriedades created, updated e viewed são sempre ignoradas automaticamente.',
        placeholder: 'Nome da propriedade, como tags',
        addTooltip: 'Adicionar propriedade',
        chipRemoveAriaLabel: 'Remover {entry}',
      },
    },
    filterRules: {
      name: 'Arquivos e pastas a ignorar',
      descIntro:
        'Escolha arquivos ou pastas para deixar em paz (sem atualizações automáticas de data). ',
      descOnePerLine: 'Um padrão por linha. Linhas que começam com ',
      descCommentsAre: ' são comentários. Comece uma linha com ',
      descAddBack: ' para incluir um caminho de volta. ',
      descLastWins: 'Se várias linhas corresponderem, a última vence.',
      advancedSyntaxLink: 'Sintaxe avançada (estilo gitignore)',
      noRulesWarning:
        'Nenhuma regra definida - todas as notas recebem atualizações automáticas de data.',
      placeholderExcludeFolder: '# Excluir uma pasta',
      placeholderExcludeByPattern: '# Excluir por padrão',
      placeholderReinclude: '# Incluir de volta um arquivo específico',
      parseError: 'Linha {lineNumber}: {message} - "{text}"',
      previewButton: 'Visualizar arquivos correspondentes',
      previewSummary: '{tracked} notas rastreadas, {excluded} notas ignoradas',
      skippedFilesSummary: 'Arquivos ignorados ({excluded})',
      skippedMore: '...e mais {count}',
      reference: {
        summary: 'Referência da sintaxe de padrões',
        sectionBasics: 'Noções básicas de sintaxe',
        basicsCommentDesc: 'Linhas que começam com # são ignoradas',
        basicsBlankDesc: 'Linhas em branco são ignoradas',
        basicsExcludeDesc:
          'Excluir - arquivos dentro de templates/ são ignorados',
        basicsReincludeDesc:
          'Incluir de volta - prefixe com ! para desfazer a exclusão',
        basicsLastWinsDesc: 'Quando várias regras correspondem, a última vence',
        sectionExcludeFolder: 'Excluir uma pasta',
        excludeFolderAllFilesDesc: 'Todos os arquivos dentro de templates/',
        excludeFolderSameEffectDesc: 'Mesmo efeito (a barra final é opcional)',
        excludeFolderNestedDesc: 'Pasta aninhada',
        sectionReinclude: 'Incluir de volta (desfazer uma exclusão)',
        reincludeExcludeWholeDesc: 'Excluir a pasta inteira',
        reincludeKeepDesc: 'Mas continuar rastreando este arquivo específico',
        sectionWildcards: 'Curingas',
        wildcardStarDesc: 'Quaisquer caracteres, exceto /',
        wildcardDoubleStarDesc:
          'Quaisquer caracteres, incluindo / (atravessa pastas)',
        wildcardQuestionDesc: 'Exatamente um caractere',
        sectionWildcardExamples: 'Exemplos com curingas',
        wildcardExCanvasRootDesc:
          'Arquivos terminados em .canvas.md na raiz do cofre',
        wildcardExCanvasAnyDesc:
          'Arquivos terminados em .canvas.md em qualquer pasta',
        wildcardExDailyDesc: 'Arquivos como daily/2024-01-01.md',
        wildcardExTwoCharDesc: 'Nomes de arquivo de dois caracteres em notes/',
        sectionSpecificFiles: 'Arquivos específicos',
        specificFilesOneExactDesc: 'Um arquivo exato',
        specificFilesRootDesc: 'Um arquivo na raiz do cofre',
        sectionPathsWithSpaces: 'Caminhos com espaços',
        pathsWithSpacesAsIsDesc: 'Basta escrever o caminho como está',
        pathsWithSpacesNoQuotesDesc:
          'Não são necessárias aspas em volta dos espaços',
        sectionNonLatin: 'Caracteres não latinos',
        nonLatinCyrillicDesc: 'Nome de pasta em cirílico',
        nonLatinChineseDesc: 'Caracteres chineses',
        nonLatinFullPathDesc: 'Caminho completo não latino',
        sectionObsidianExamples: 'Exemplos específicos do Obsidian',
        obsidianTemplateFolderDesc: 'Pasta de modelos',
        obsidianDailyFolderDesc: 'Pasta de notas diárias',
        obsidianAttachmentsDesc: 'Pasta de anexos / mídia',
        obsidianCanvasDesc: 'Todos os arquivos de canvas',
        obsidianExcalidrawDesc: 'Todos os desenhos do Excalidraw',
        obsidianInboxDesc: 'Pasta de entrada / rascunhos',
        obsidianArchiveDesc: 'Notas arquivadas',
        sectionAllowlist:
          'Modo de lista de permissões (rastrear somente pastas específicas)',
        allowlistExcludeEverythingDesc: 'Primeiro, exclua tudo',
        allowlistReincludeWantedDesc:
          'Depois, inclua de volta apenas o que você quer',
        allowlistReincludeAnotherDesc: 'Incluir de volta outra pasta',
        emptyNote:
          'Quando este campo está vazio, todas as notas recebem atualizações automáticas de data.',
      },
    },
    inversions: {
      heading: 'Data de edição anterior à de criação',
      strategy: {
        name: 'Como corrigir datas fora de ordem',
        desc: 'O que fazer quando a data da última edição é anterior à data de criação. Aplica-se às edições automáticas e define o padrão para a ferramenta em massa.',
        optionDisabled: 'Não corrigir (somente detectar)',
        optionCreatedToUpdated:
          'Definir a data de criação igual à data da última edição',
        optionUpdatedToCreated:
          'Definir a data da última edição igual à data de criação',
        optionMaxAll: 'Definir ambas com a data mais recente',
      },
      tolerance: {
        name: 'Ignorar diferenças mínimas (segundos)',
        desc: 'Ignorar datas fora de ordem quando a diferença for menor que isto. Um valor pequeno oculta pequenas diferenças de relógio.',
      },
    },
    advanced: {
      summary: 'Avançado',
      newFileDelay: {
        name: 'Atraso para arquivos novos',
        desc: 'Aguardar esta quantidade de milissegundos antes de carimbar uma data em uma nota recém-criada. Ajuda a evitar conflitos com plugins de modelos. Defina como 0 para desativar.',
      },
      autoPopulateCache: {
        name: 'Preencher o cache automaticamente na inicialização',
        desc: 'Quando o plugin carrega, criar os dados de detecção de alterações para as notas que ainda não os têm. É executado em segundo plano.',
      },
      maxCacheEntries: {
        name: 'Máximo de entradas no cache',
        desc: 'Quando o cache cresce além deste limite, as entradas mais antigas e sem uso são removidas. 0 = sem limite.',
      },
      postUpdateCommand: {
        name: 'Comando após a atualização',
        desc: 'Executar um comando do Obsidian depois que uma data é atualizada. Deixe em branco para desativar.',
        optionNone: 'Nenhum',
      },
    },
    bulk: {
      heading: 'Operações em massa',
      populate: {
        name: 'Definir datas a partir das próprias datas do arquivo',
        desc: 'Preencher as datas de criação e de última edição a partir das próprias datas de criação e modificação de cada arquivo no disco. Ótimo para a configuração inicial.',
        button: 'Preencher datas',
      },
      rename: {
        name: 'Renomear uma propriedade',
        desc: 'Mover valores de um nome de propriedade antigo para um novo em todas as notas. Útil após alterar um nome de propriedade acima.',
        button: 'Renomear propriedade',
      },
      reformat: {
        name: 'Reformatar datas existentes',
        desc: 'Encontrar datas em um formato antigo e reescrevê-las no seu formato atual. Útil após alterar o formato de data acima.',
        button: 'Reformatar datas',
      },
      findInversions: {
        name: 'Encontrar datas fora de ordem',
        desc: 'Escanear suas notas e listar aquelas em que a data da última edição é anterior à data de criação. Depois você pode aplicar a correção escolhida acima.',
        button: 'Encontrar datas fora de ordem',
      },
      rebuildCache: {
        name: 'Reconstruir o cache de hashes',
        desc: 'Recalcular os dados de detecção de alterações (hashes de conteúdo) para todas as suas notas. Útil após alterar o que conta como alteração acima.',
        button: 'Reconstruir cache',
      },
    },
  },
  modals: {
    populate: {
      configureTitle: 'Definir datas a partir das próprias datas do arquivo',
      configureSubtitleLine1:
        'Preencher as datas de criação e de última edição',
      configureSubtitleLine2:
        'a partir das próprias datas de criação e modificação de cada arquivo no disco.',
      modeName: 'Quais datas definir',
      modeDesc: 'Escolha quais datas preencher.',
      modeOptionBoth: 'Tanto criação quanto atualização',
      modeOptionCreated: 'Somente datas de criação',
      modeOptionUpdated: 'Somente datas de atualização',
      overrideName: 'Arquivos que já têm datas',
      overrideDesc:
        'Preencher apenas as datas que faltam ou sobrescrever as existentes.',
      overrideOptionFillMissing: 'Preencher só as que faltam (seguro)',
      overrideOptionOverwriteAll: 'Sobrescrever tudo (substitui as existentes)',
      autoUpdateNoteTitle: 'Observação sobre a atualização automática:',
      autoUpdateNoteBody:
        'Se a atualização automática estava ativa, as próprias datas do arquivo no disco podem já refletir as edições do próprio plugin, e não as datas originais. Para melhores resultados, use este recurso antes de ativar a atualização automática ou logo após instalar o plugin.',
      warningTitleCreatedUnreliable:
        'A data de criação do arquivo não é confiável em algumas plataformas',
      warningTitlePlatformNote: 'Observação sobre a plataforma',
      platformMacWin: 'macOS / Windows',
      platformMacWinNote: 'data de criação real do arquivo',
      platformLinux: 'Linux',
      platformLinuxNote:
        'o sistema informa uma data posterior, e não a data de criação real',
      platformAndroid: 'Android',
      platformAndroidNote: 'depende do dispositivo, muitas vezes não confiável',
      platformIos: 'iOS',
      platformIosNote: 'geralmente confiável',
      platformReliable: 'Confiável',
      platformUnreliable: 'NÃO CONFIÁVEL',
      platformLineName: '{name}: {prefix}',
      platformYourPlatformSuffix: ' (sua plataforma)',
      syncNoteLine1:
        'Cofres sincronizados: as datas dos arquivos podem ser reiniciadas pelos serviços de sincronização',
      syncNoteLine2: '(Obsidian Sync, iCloud, Dropbox, Git).',
      syncNoteLine3:
        'A data da última edição costuma ser mais confiável que a data de criação.',
      recommendation:
        'Recomendação: revise os resultados após executar. Faça um backup antes.',
      overwriteWarning:
        'Isto substituirá as datas existentes nas suas notas. Isto não pode ser desfeito. Faça um backup antes.',
      noPropertyConfigured:
        'Nenhum nome de propriedade configurado para: {missing}. Verifique as configurações do plugin.',
      previewTitle: 'Visualização: definir datas',
      noFilesNeedUpdating:
        'Nenhum arquivo precisa de atualização. Todos os arquivos elegíveis já têm as datas solicitadas.',
      previewOverwriteWarning:
        'Modo de sobrescrita: as datas existentes serão substituídas. Isto não pode ser desfeito. Faça um backup antes.',
      settingDates: 'Definindo datas…',
      stopped: 'Interrompido.',
      doneWithErrorsSubtitle: '{processed} arquivo(s) atualizado(s).',
      doneTitle: 'Concluído! {processed} arquivo(s) atualizado(s).',
    },
    rename: {
      configureTitle: 'Renomear uma propriedade',
      configureSubtitle:
        'Mover valores de um nome de propriedade para outro em todas as notas.',
      validationEnterOld:
        'Informe o nome antigo da propriedade para continuar.',
      validationEnterNew: 'Informe o novo nome da propriedade para continuar.',
      validationMustDiffer:
        'Os nomes de propriedade antigo e novo devem ser diferentes.',
      oldKeyName: 'Nome antigo da propriedade',
      oldKeyDesc: 'O nome de propriedade usado atualmente nas suas notas.',
      oldKeyPlaceholder: 'Date_created',
      newKeyName: 'Novo nome da propriedade',
      newKeyDesc: 'O novo nome de propriedade a ser usado.',
      newKeyPlaceholder: 'Created',
      deleteOldName: 'Excluir a propriedade antiga após renomear',
      deleteOldDesc:
        'Remover a propriedade antiga após copiar o seu valor para a nova.',
      namesCannotBeEmpty: 'Os nomes das propriedades não podem ficar vazios.',
      previewTitle: 'Visualização: renomear propriedade',
      noNotesUseProperty: 'Nenhuma nota usa a propriedade "{oldKey}".',
      conflictWarning:
        '{conflicts} nota(s) já têm a propriedade "{newKey}". O valor existente será sobrescrito.',
      columnArrowNew: '→ {newKey}',
      deleteWarning:
        'A propriedade antiga será excluída após a cópia. Isto não pode ser desfeito. Faça um backup antes.',
      renamingProperty: 'Renomeando propriedade…',
      renameStopped: 'Renomeação interrompida.',
      doneWithErrorsSubtitle: '{processed} arquivo(s) atualizado(s).',
      doneTitle: 'Concluído! {processed} arquivo(s) atualizado(s).',
    },
    reformat: {
      configureTitle: 'Padronizar o formato de data',
      configureSubtitle:
        'Interpretar os valores de data existentes e reescrevê-los usando o formato atual das configurações.',
      invalidFormat: 'Formato inválido',
      targetFormatName: 'Formato de destino',
      targetFormatDesc: '{currentFormat}',
      scopeName: 'Quais campos reformatar',
      scopeDesc: 'Escolha quais datas padronizar.',
      scopeOptionAll: 'Todas as datas',
      scopeOptionCreated: 'Somente criação',
      scopeOptionUpdated: 'Somente atualização',
      scopeOptionViewed: 'Somente visualização',
      autoDetectNote:
        'As datas são detectadas automaticamente a partir de formatos comuns (ISO 8601, europeu, dos EUA, datas numéricas) e reescritas no seu formato atual.',
      noPropertyConfigured:
        'Nenhum nome de propriedade configurado para: {missing}. Verifique as configurações do plugin.',
      previewTitle: 'Visualização: padronizar datas',
      noChangeAmbiguous:
        'Nada para converter ainda. {ambiguousCount} data(s) poderiam ser lidas de duas formas e foram mantidas sem alteração - escolha uma ordem de dia/mês acima para convertê-las.',
      noChangeDefault:
        'Nenhum arquivo precisa de reformatação. Todas as datas já estão no formato de destino ou não puderam ser interpretadas.',
      errorWarningNoChange:
        '{errorCount} arquivo(s) têm datas que não puderam ser interpretadas.',
      errorWarningWillSkip:
        '{errorCount} arquivo(s) têm datas que não puderam ser interpretadas. Estes serão ignorados.',
      checkNote:
        'As linhas marcadas com [check] poderiam ser lidas de duas formas - confirme se a nova data está correta.',
      rewriteWarning:
        'Isto reescreve os valores de data existentes no lugar. Isto não pode ser desfeito. Faça um backup antes.',
      ambiguityName: 'Datas que poderiam ser lidas de duas formas',
      ambiguityDesc:
        '{ambiguousCount} data(s) poderiam significar dia primeiro ou mês primeiro (por exemplo, 01/05/2024).{detectedHint}',
      detectedHintMonthFirst: ' Seu sistema sugere o mês primeiro.',
      detectedHintDayFirst: ' Seu sistema sugere o dia primeiro.',
      ambiguityOptionSkip: 'Manter as datas ambíguas sem alteração',
      ambiguityOptionDmy: 'Dia primeiro (01/05 = dia 1, mês 5)',
      ambiguityOptionMdy: 'Mês primeiro (01/05 = mês 1, dia 5)',
      cellCouldNotRead: '{oldValue} (não foi possível ler a data)',
      cellConversion: '{oldValue} → {newValue}{check}',
      cellNewValue: '{newValue}{check}',
      cellCheckSuffix: ' [check]',
      reformattingDates: 'Reformatando datas…',
      reformatStopped: 'Reformatação interrompida.',
      doneWithErrorsSubtitle: '{processed} arquivo(s) atualizado(s).',
      doneTitle: 'Concluído! {processed} arquivo(s) atualizado(s).',
    },
    inversions: {
      scanningTitle: 'Procurando datas fora de ordem…',
      foundTitle: 'Encontradas {count} notas com datas fora de ordem',
      foundSubtitle:
        'Estas notas têm uma data de última edição anterior à data de criação. Escolha abaixo como corrigi-las ou feche para revisar manualmente.',
      noneFound: 'Nenhuma data fora de ordem encontrada.',
      strategyName: 'Como corrigir',
      strategyDesc: 'Escolha como corrigir as datas.',
      strategyOptionDisabled: 'Não corrigir (somente revisar)',
      strategyOptionCreatedToUpdated:
        'Definir a data de criação igual à data da última edição',
      strategyOptionUpdatedToCreated:
        'Definir a data da última edição igual à data de criação',
      strategyOptionMaxAll: 'Definir ambas com a data mais recente',
      toleranceNote:
        'Ignorando diferenças abaixo de {tolerance} segundos (definido nas configurações).',
      columnDelta: 'Δ',
      fixWarning:
        'Isto modificará {count} notas. Isto não pode ser desfeito. Faça um backup antes.',
      fixingDates: 'Corrigindo datas…',
      stopped: 'Operação em massa interrompida.',
      fixedNotice: '{processed} nota(s) corrigida(s).',
      doneWithErrorsSubtitle: '{processed} nota(s) corrigida(s).',
      doneTitle: 'Concluído! Você pode fechar esta janela com segurança.',
    },
    rebuildCache: {
      loadingFiles: 'Carregando arquivos…',
      confirmTitle:
        'Reconstruir os dados de detecção de alterações para {count} arquivos',
      confirmSubtitle:
        'Isto recalcula as impressões digitais do conteúdo (hashes de conteúdo) usadas para detectar edições reais. Não altera as suas notas.',
      rebuilding: 'Reconstruindo…',
      stopped: 'Operação em massa interrompida.',
      doneWithErrorsSubtitle: '{processed} arquivo(s) processado(s).',
      doneTitle: 'Concluído! Você pode fechar esta janela com segurança.',
    },
  },
};
