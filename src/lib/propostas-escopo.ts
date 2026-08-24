export interface EscopoServico {
  objetivo: string;
  itensConstantes: string;
  metodologia: string;
  entregaveis: string;
  naoIncluido: string;
}

/** Conteúdo técnico padrão por tipo de serviço (auto-preenchimento do escopo). */
export const escopoPorServico: Record<string, EscopoServico> = {
  "Laudo Técnico": {
    objetivo:
      "Diagnosticar, quantificar e qualificar anomalias construtivas, patologias ou vícios em edificações, com fundamentação normativa e conclusão técnica sobre causas e soluções.",
    itensConstantes:
      "Identificação do solicitante e do imóvel\nHistórico e documentação de referência\nDescrição detalhada das anomalias com classificação\nDiagnóstico das causas (origem construtiva, de projeto, de uso ou de manutenção)\nIndicação de responsabilidades (construtor, projetista, usuário)\nRecomendações de reparo e prazos",
    metodologia:
      "Inspeção técnica no local\nMedição das trincas\nVerificação de desníveis e desaprumo\nAnálise conforme normas (NBR)",
    entregaveis:
      "Laudo técnico completo com conclusão e recomendações\nRelatório fotográfico com anotações\nART do responsável técnico",
    naoIncluido:
      "Não incluídos nesta proposta:\n• Fornecimento de equipamentos extras (andaimes, plataformas elevatórias, drones, escadas especiais) — caso necessário, o contratante deverá providenciar ou autorizar a locação com custo adicional\n• Ensaios laboratoriais (termografia, pacometria, esclerometria, ensaios mecânicos ou químicos em telhas/estrutura)\n• Testes destrutivos (abertura de paredes, cortes em telhas, sondagens estruturais)\n• Projeto executivo ou orçamento de recuperação/substituição — o escopo se encerra no diagnóstico e recomendação\n• Vistoria de sistemas não relacionados diretamente ao objeto da perícia (elétrica predial, hidráulica interna, PPCI completo, SPDA, elevadores etc.)",
  },

  "Vistoria de Entrega e Recebimento de Obra": {
    objetivo:
      "Verificar a conformidade da obra executada em relação ao projeto, às normas técnicas aplicáveis (NBR 15575:2024) e às condições contratuais, no ato de entrega e recebimento da edificação, conforme NBR 13752:2024.",
    itensConstantes:
      "Verificação de todos os sistemas (estrutural, vedações, revestimentos, instalações elétricas, hidráulicas, gás, drenagem)\nConferência com projetos aprovados\nIdentificação de não conformidades construtivas\nVerificação de acabamentos finais\nConferência de áreas comuns e unidades autônomas\nVerificação de sistemas específicos (NBR 5410, 5626, 13753, 7199, 9050, 9077, 15526)\nVerificação de manual do proprietário (NBR 14037)",
    metodologia:
      "Inspeção técnica no local com checklist por sistema\nTestes funcionais (tomadas, pressão, vazamentos)\nTeste de aderência (martelo oco / cabo de vassoura)\nVerificação de prumo e nivelamento (régua de alumínio, nível)\nTeste de caimento de pisos e ralos (bolinhas de gude)\nVerificação de esquadrias (abertura, vedação, ferragens)\nFotografia documental de cada item verificado",
    entregaveis:
      "Relatório de vistoria com checklist detalhado por sistema\nRelatório fotográfico\nLista de não conformidades classificadas por criticidade\nART do responsável técnico",
    naoIncluido:
      "Não incluídos nesta proposta:\n• Fornecimento de equipamentos extras (andaimes, plataformas elevatórias, drones, escadas especiais)\n• Ensaios laboratoriais (termografia, pacometria, esclerometria)\n• Testes destrutivos (abertura de paredes, cortes em telhas, sondagens estruturais)\n• Projeto executivo ou orçamento de recuperação/substituição\n• Vistoria de sistemas não relacionados diretamente ao recebimento da obra\n• Inspeção predial completa conforme NBR 16747 (escopo diferente)",
  },

  "Vistoria de Entrega das Chaves": {
    objetivo:
      "Verificar as condições de acabamento e funcionamento dos sistemas da unidade autônoma nova, no ato de entrega das chaves pelo construtor/incorporador ao adquirente, conforme NBR 13752:2024 e NBR 15575:2024.",
    itensConstantes:
      "Verificação de paredes (prumo, planeza, fissuras)\nPisos (nivelamento, rejunte, som cavo, lascas)\nTeto (manchas, fissuras)\nEsquadrias (alinhamento, vedação, borrachas, ferragens)\nInstalações elétricas (tomadas, interruptores, QDL, disjuntores)\nInstalações hidráulicas (torneiras, pressão, vazamentos, ralos)\nLouças e metais sanitários (bacias, pias, válvulas)\nPortas (alinhamento, fechamento, dobradiças, maçanetas)\nPintura (uniformidade, manchas, respingos)\nRodapés (aderência, juntas)\nLimpeza final\nVerificação de acessibilidade (NBR 9050) quando aplicável",
    metodologia:
      "Inspeção técnica sensorial com checklist por ambiente\nTestes funcionais em todas as tomadas (carregador/caneta medidora)\nTeste de pressão e vazamento em pontos hidráulicos\nTeste de aderência em revestimentos cerâmicos (martelo oco)\nVerificação de prumo, nivelamento e esquadro (régua de alumínio)\nTeste de caimento de pisos (bolinhas de gude)\nRegistro fotográfico de cada ambiente",
    entregaveis:
      "Relatório de vistoria com checklist por ambiente\nRelatório fotográfico comparativo\nLista de pendências para correção pelo construtor\nART do responsável técnico",
    naoIncluido:
      "Não incluídos nesta proposta:\n• Vistoria de áreas comuns (salão de festas, portaria, lazer) — exceto se solicitado separadamente\n• Ensaios laboratoriais ou testes destrutivos\n• Verificação de sistemas prediais (elevadores, bombas, geradores, PPCI)\n• Inspeção estrutural completa\n• Projeto executivo ou orçamento de reparos",
  },

  "Vistoria Locativa de Entrada": {
    objetivo:
      "Documentar tecnicamente o estado de conservação e funcionamento do imóvel no início da relação locatícia, estabelecendo parâmetro objetivo de comparação para a devolução.",
    itensConstantes:
      "Registro fotográfico detalhado de todos os ambientes\nVerificação de paredes, pisos, tetos, esquadrias\nTeste de instalações elétricas (tomadas, interruptores)\nTeste de instalações hidráulicas (torneiras, pressão, vazamentos)\nVerificação de louças e metais sanitários\nVerificação de portas e janelas (funcionamento, vedação)\nIdentificação de danos pré-existentes\nEstado de pintura e revestimentos\nVerificação de piso (nivelamento, som cavo, lascas)\nLimpeza e estado geral",
    metodologia:
      "Inspeção técnica sensorial em todos os ambientes\nTestes funcionais em instalações elétricas e hidráulicas\nRegistro fotográfico sistemático com legenda por ambiente\nPreenchimento de checklist por ambiente\nAnotação de todas as imperfeições existentes com classificação\nVerificação de prumo e nivelamento",
    entregaveis:
      "Laudo de vistoria locativa de entrada\nRelatório fotográfico completo por ambiente\nLista de condições pré-existentes\nART do responsável técnico",
    naoIncluido:
      "Não incluídos nesta proposta:\n• Análise de causalidade de anomalias existentes\n• Ensaios laboratoriais ou testes destrutivos\n• Avaliação do valor do imóvel (NBR 14653)\n• Vistoria de áreas externas ou estrutura (exceto se solicitado)\n• Projeto de reforma ou reparo",
  },

  "Vistoria Locativa de Saída": {
    objetivo:
      "Comparar o estado de conservação do imóvel no término da locação com o registrado na vistoria de entrada, distinguindo desgaste natural de danos imputáveis ao locatário.",
    itensConstantes:
      "Vistoria de todos os ambientes com mesmo checklist da entrada\nComparação fotográfica com vistoria de entrada\nIdentificação de danos novos não presentes na entrada\nClassificação de desgaste natural vs. dano imputável\nVerificação de instalações elétricas e hidráulicas\nVerificação de pintura, pisos, paredes\nVerificação de louças, metais e esquadrias\nAvaliação de reformas não autorizadas (quando aplicável)",
    metodologia:
      "Inspeção técnica sensorial em todos os ambientes\nComparação direta com laudo de vistoria de entrada\nTestes funcionais em instalações\nRegistro fotográfico com mesma sequência da entrada\nAvaliação de cada item conforme classificação (conforme/não conforme em relação à entrada)\nAnálise de modificações não autorizadas",
    entregaveis:
      "Laudo de vistoria locativa de saída\nRelatório fotográfico comparativo (entrada vs. saída)\nLista de danos imputáveis e desgaste natural\nART do responsável técnico",
    naoIncluido:
      "Não incluídos nesta proposta:\n• Vistoria de entrada (deve ser contratada separadamente se não existir)\n• Análise de causalidade de danos\n• Ensaios laboratoriais ou testes destrutivos\n• Avaliação do valor do imóvel (NBR 14653)\n• Projeto de reparo dos danos identificados",
  },

  "Vistoria de Constatação": {
    objetivo:
      "Realizar levantamento técnico de características e anomalias construtivas existentes em uma edificação, sem análise de causalidade, para fins de documentação e registro técnico.",
    itensConstantes:
      "Identificação do imóvel e do solicitante\nLevantamento de características construtivas\nRegistro de anomalias e patologias (fissuras, infiltrações, descolamentos, empolamentos)\nClassificação das anomalias conforme NBR 16747 (crítica, média, mínima)\nRegistro fotográfico documental\nAnálise documental (anamnese)\nVerificação de sistemas (elétrico, hidráulico, estrutural, coberta)",
    metodologia:
      "Inspeção técnica sensorial no local\nMedição de fissuras e trincas (fissurômetro)\nTeste de aderência (martelo oco)\nVerificação de umidade e infiltrações\nAnálise de documentação e histórico\nRegistro fotográfico sistemático\nVerificação de prumo, nivelamento e esquadro",
    entregaveis:
      "Laudo de vistoria de constatação\nRelatório fotográfico com anotações\nPlanilha de anomalias classificadas\nART do responsável técnico",
    naoIncluido:
      "Não incluídos nesta proposta:\n• Análise de causalidade (origem e responsabilidade das anomalias)\n• Ensaios laboratoriais (termografia, pacometria, esclerometria)\n• Testes destrutivos\n• Projeto executivo ou orçamento de recuperação\n• Avaliação do valor do imóvel (NBR 14653)",
  },

  "Vistoria de Constatação de Obra": {
    objetivo:
      "Documentar tecnicamente o estado atual de uma obra (em andamento, paralisada/embargada ou pré-entrega), registrando estágio de execução, etapas concluídas, qualidade construtiva e eventuais não conformidades.",
    itensConstantes:
      "Identificação da obra e do solicitante\nRegistro do estágio de execução por sistema (estrutura, alvenaria, revestimentos, instalações)\nVerificação de qualidade de execução\nConferência com projeto aprovado\nIdentificação de não conformidades construtivas\nVerificação de insumos e materiais aplicados\nRegistro fotográfico documental por etapa\nAnálise de cronograma físico-financeiro (quando aplicável)",
    metodologia:
      "Inspeção técnica no canteiro de obras\nVerificação dimensional e de prumo/nivelamento\nTestes de aderência e qualidade de revestimentos\nConferência com projetos e especificações\nAnálise de etapas concluídas e em andamento\nRegistro fotográfico sistemático\nVerificação das condições de segurança no canteiro",
    entregaveis:
      "Laudo de vistoria de constatação de obra\nRelatório fotográfico por etapa\nPlanilha de não conformidades identificadas\nART do responsável técnico",
    naoIncluido:
      "Não incluídos nesta proposta:\n• Gerenciamento ou fiscalização da obra\n• Acompanhamento periódico da execução\n• Ensaios laboratoriais de materiais\n• Projeto executivo ou modificações de projeto\n• Orçamento de serviços\n• Análise de causalidade de falhas construtivas",
  },

  "Vistoria Cautelar de Vizinhança": {
    objetivo:
      "Documentar tecnicamente o estado de conservação de imóveis vizinhos a uma obra ou intervenção, antes do início dos serviços, como medida preventiva para proteção contra futuras reclamações de danos.",
    itensConstantes:
      "Identificação dos imóveis vizinhos e do solicitante\nRegistro fotográfico detalhado de todas as fachadas e ambientes acessíveis\nVerificação de fissuras, trincas e patologias pré-existentes\nVerificação de desníveis, rachaduras e infiltrações existentes\nEstado de pintura, revestimentos e esquadrias\nDocumentação de condições estruturais aparentes\nVerificação de pisos, tetos e paredes",
    metodologia:
      "Inspeção técnica sensorial em todos os imóveis vizinhos acessíveis\nMedição e marcação de fissuras pré-existentes (fissurômetro)\nRegistro fotográfico sistemático com identificação de cada anomalia\nAnálise de documentação dos imóveis (quando disponível)\nPreenchimento de checklist por imóvel\nIdentificação e mapeamento de cada anomalia pré-existente",
    entregaveis:
      "Laudo de vistoria cautelar de vizinhança\nRelatório fotográfico completo por imóvel\nPlanilha de anomalias pré-existentes\nART do responsável técnico",
    naoIncluido:
      "Não incluídos nesta proposta:\n• Análise de causalidade de anomalias pré-existentes\n• Ensaios laboratoriais ou testes destrutivos\n• Monitoramento contínuo durante a obra\n• Vistoria de saída (ao término da obra)\n• Avaliação do valor dos imóveis (NBR 14653)\n• Projeto de reparo de anomalias existentes",
  },

  "Vistoria de Análise de Causalidade": {
    objetivo:
      "Investigar tecnicamente as origens e causas de falhas construtivas, patologias ou vícios em edificações, determinando responsabilidades e indicando soluções corretivas, conforme NBR 13752:2024.",
    itensConstantes:
      "Anamnese completa (histórico do imóvel, documentação, manutenções prévias, reclamações anteriores)\nInspeção técnica detalhada das anomalias\nAnálise de projetos e especificações originais\nVerificação de execução conforme projeto\nDeterminação da origem das patologias (construtiva, de projeto, de uso, de manutenção)\nIndicação de responsabilidades (construtor, projetista, usuário, mantenedor)\nRecomendações de reparo e soluções técnicas\nFundamentação normativa (NBR 6118, 15575, 13753, etc.)",
    metodologia:
      "Análise documental e histórica completa (anamnese)\nInspeção técnica no local com testes específicos\nMedição de fissuras, desníveis e desaprumo (fissurômetro, nível)\nTestes de umidade e infiltração\nAnálise estrutural quando aplicável (NBR 6118)\nComparação com normas técnicas (NBR)\nCorrelação causa-efeito\nVerificação de projetos e memoriais descritivos",
    entregaveis:
      "Laudo de análise de causalidade com conclusão fundamentada\nRelatório fotográfico com anotações técnicas\nCronologia de eventos e manifestações patológicas\nIndicação de responsabilidades e soluções\nART do responsável técnico",
    naoIncluido:
      "Não incluídos nesta proposta:\n• Fornecimento de equipamentos extras (andaimes, plataformas, drones)\n• Ensaios laboratoriais (termografia, pacometria, esclerometria, ensaios químicos)\n• Testes destrutivos (abertura de paredes, cortes, sondagens)\n• Projeto executivo de recuperação/substituição\n• Orçamento detalhado de reparos\n• Acompanhamento da execução dos reparos",
  },

  "Vistoria de Análise Comparativa de Conformidade": {
    objetivo:
      "Verificar a conformidade de uma edificação ou sistema construtivo em relação a normas técnicas, projetos aprovados, especificações contratuais ou requisitos legais aplicáveis, conforme NBR 13752:2024.",
    itensConstantes:
      "Identificação do imóvel e requisitos de comparação\nAnálise de projeto aprovado e especificações\nVerificação dimensional e construtiva\nConferência de cada sistema com normas técnicas aplicáveis (NBR 5410, 5626, 13753, 7199, 9050, 9077, 15526, 6118)\nIdentificação de não conformidades\nClassificação de conformidade por item\nReferência normativa para cada item verificado\nVerificação de NBR 15575 (desempenho) quando aplicável",
    metodologia:
      "Análise documental (projetos, memoriais, contratos)\nInspeção técnica com checklist normativo\nTestes funcionais por sistema\nVerificação dimensional e de especificações\nComparação direta com requisitos normativos\nRegistro fotográfico de cada item verificado\nConferência de materiais e dimensionamentos",
    entregaveis:
      "Laudo de análise comparativa de conformidade\nRelatório fotográfico com anotações\nPlanilha de conformidade por item (conforme/não conforme)\nReferência normativa para cada não conformidade\nART do responsável técnico",
    naoIncluido:
      "Não incluídos nesta proposta:\n• Análise de causalidade de não conformidades\n• Ensaios laboratoriais ou testes destrutivos\n• Projeto executivo de adequação\n• Orçamento de correções\n• Avaliação do valor do imóvel (NBR 14653)\n• Acompanhamento da regularização",
  },

  "Vistoria de Reforma": {
    objetivo:
      "Avaliar tecnicamente o estado atual de uma edificação e especificar as intervenções necessárias para reforma, incluindo diagnóstico de patologias, recomendações de reparo e subsídios para orçamentação.",
    itensConstantes:
      "Levantamento de todas as áreas da edificação\nDiagnóstico de patologias e anomalias existentes\nVerificação de todos os sistemas (estrutural, elétrico, hidráulico, gás)\nIdentificação de elementos a serem removidos\nEspecificação de intervenções necessárias\nRecomendações de melhoria e adequação normativa\nSubsídios para elaboração de projeto e orçamento\nVerificação de NBR 15575 (desempenho) e NBR 9050 (acessibilidade)",
    metodologia:
      "Inspeção técnica sensorial em todos os ambientes\nTestes funcionais em instalações elétricas e hidráulicas\nMedição de fissuras e desníveis (fissurômetro, nível)\nAnálise de estrutura e vedações (NBR 6118)\nVerificação de conformidade com normas atuais\nRegistro fotográfico completo\nAnálise documental (projetos originais, quando disponível)",
    entregaveis:
      "Laudo de vistoria para reforma\nRelatório fotográfico completo por ambiente\nEspecificação de intervenções por sistema/ambiente\nLista de materiais e serviços sugeridos\nART do responsável técnico",
    naoIncluido:
      "Não incluídos nesta proposta:\n• Projeto executivo da reforma\n• Orçamento detalhado dos serviços\n• Execução dos serviços de reforma\n• Gerenciamento da obra\n• Ensaios laboratoriais ou testes destrutivos\n• Análise de causalidade de patologias (exceto se solicitado separadamente)",
  },

  "Inspeção Predial": {
    objetivo:
      "Realizar inspeção predial sistêmica e periódica em edificação existente, conforme NBR 16747:2020, para avaliar o estado de conservação, identificar anomalias, orientar a manutenção e verificar o sistema de gestão de manutenção (NBR 5674:2024).",
    itensConstantes:
      "Identificação da edificação e do solicitante\nAnamnese documental (histórico, manual do proprietário, manutenções prévias)\nInspeção de todos os sistemas (estrutura, fachadas, coberta, instalações elétricas, hidráulicas, gás, elevadores, PPCI, SPDA)\nClassificação de anomalias conforme NBR 16747 (crítica, média, mínima)\nAvaliação do sistema de gestão de manutenção (NBR 5674)\nMatriz de priorização de intervenções\nRecomendações de manutenção preventiva e corretiva\nVerificação de prazos de garantia (NBR 17170:2022)\nAvaliação de manual do proprietário (NBR 14037:2024)",
    metodologia:
      "Análise documental e anamnese (histórico, documentação, manutenções)\nInspeção técnica sensorial em todas as áreas acessíveis\nTestes específicos por sistema (aderência, estanqueidade, funcionamento)\nTeste de aderência em fachadas (martelo oco / cabo de vassoura)\nVerificação de infiltrações e umidade\nRegistro fotográfico sistemático\nClassificação de anomalias conforme NBR 16747 (crítica/média/mínima)\nAvaliação de prazos de garantia (NBR 17170)\nElaboração de matriz de priorização",
    entregaveis:
      "Laudo de inspeção predial conforme NBR 16747\nRelatório fotográfico completo\nPlanilha de anomalias classificadas (crítica/média/mínima)\nMatriz de priorização de intervenções\nRecomendações de manutenção (NBR 5674)\nART do responsável técnico",
    naoIncluido:
      "Não incluídos nesta proposta:\n• Fornecimento de equipamentos extras (andaimes, plataformas, drones)\n• Ensaios laboratoriais (termografia, pacometria, esclerometria)\n• Testes destrutivos\n• Projeto executivo de recuperação/substituição\n• Orçamento detalhado de reparos\n• Avaliação do valor do imóvel (NBR 14653)\n• Análise de causalidade de patologias (exceto se solicitado separadamente)\n• Inspeção em áreas não acessíveis (forros fechados, subsolos não acessíveis, etc.)",
  },
};

export const TIPOS_SERVICO = Object.keys(escopoPorServico);
