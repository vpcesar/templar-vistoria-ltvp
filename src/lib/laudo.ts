import { enderecoCompleto, gutTotal, riscoDe, type Vistoria } from "./types";
import { ANAMNESE_ITENS } from "./catalogos";

export const EMPRESA = {
  nome: "TEMPLAR ENGENHARIA",
  slogan: "Vistorias • Inspeções • Laudos • Perícias",
  site: "www.templarengenharia.com.br",
  siteUrl: "https://www.templarengenharia.com.br",
  email: "templarengenharia@hotmail.com",
  whats: "WhatsApp (21) 98180-8812",
  whatsUrl: "https://wa.me/5521981808812",
};

export const formatarData = (iso: string) => {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
};

export const patologiasOrdenadas = (v: Vistoria) =>
  [...v.patologias].sort((a, b) => gutTotal(b) - gutTotal(a));

export function nivelInspecao(_v: Vistoria): string[] {
  return [
    "A presente inspeção predial é classificada como Nível 1, conforme estabelecido pela ABNT NBR 16747:2020.",
    "Nível 1 — inspeção predial de menor complexidade técnica, realizada por profissional habilitado, em edificações com sistemas construtivos simples e sem manutenção programada formalizada. A classificação como Nível 1 justifica-se pela simplicidade dos sistemas construtivos da edificação e pela ausência de manutenção programada formalizada, sendo as verificações realizadas por inspeção visual sensorial e testes expeditos não destrutivos.",
  ];
}


export function grauRiscoGlobal(v: Vistoria) {
  const totais = v.patologias.map(gutTotal);
  const max = totais.length ? Math.max(...totais) : 0;
  return riscoDe(max);
}

export const GLOSSARIO: [string, string][] = [
  [
    "Agentes de degradação",
    "Tudo aquilo que atua sobre a edificação contribuindo para reduzir seu desempenho ao longo do tempo.",
  ],
  [
    "Anomalia",
    "Irregularidade oriunda de problemas construtivos, de projeto, de materiais ou de agentes naturais e externos.",
  ],
  [
    "Desempenho",
    "Comportamento em uso de uma edificação e de seus sistemas frente às exigências dos usuários.",
  ],
  [
    "Deterioração",
    "Perda progressiva de desempenho de um sistema, elemento ou componente construtivo.",
  ],
  [
    "Falha",
    "Irregularidade decorrente da operação, do uso ou da manutenção inadequada ou inexistente da edificação.",
  ],
  [
    "Manifestação patológica",
    "Sintoma perceptível resultante de anomalia ou falha, que evidencia a perda de desempenho.",
  ],
  [
    "Plano de manutenção",
    "Documento que define as atividades, periodicidades e responsáveis pela manutenção da edificação (NBR 5674).",
  ],
  [
    "Sistema",
    "Conjunto principal de elementos e componentes destinados a atender a uma função da edificação.",
  ],
  [
    "Vida útil",
    "Período estimado em que a edificação ou seus sistemas mantêm o desempenho previsto, desde que atendida a manutenção.",
  ],
];

export const TABELA_GUT_PESOS: [string, string, string, string][] = [
  ["5", "Gravidade extremamente grave", "Urgência imediata", "Agrava-se rapidamente"],
  ["4", "Gravidade muito grave", "Urgência com alguma urgência", "Agrava-se em curto prazo"],
  ["3", "Gravidade grave", "Urgência o mais cedo possível", "Agrava-se em médio prazo"],
  ["2", "Gravidade pouco grave", "Urgência pode aguardar", "Agrava-se em longo prazo"],
  ["1", "Gravidade sem gravidade", "Urgência sem pressa", "Não se agrava"],
];

export const TABELA_PRIORIDADES: [string, string, string][] = [
  ["1ª", "81 a 150", "Até 30 dias"],
  ["2ª", "75 a 80", "30 dias a 120 dias"],
  ["3ª", "60 a 64", "120 dias a 150 dias"],
  ["4ª", "30 a 59", "150 dias a 210 dias"],
  ["5ª", "10 a 29", "210 dias a 240 dias"],
  ["6ª", "1 a 9", "240 dias a 360 dias"],
];

/** Normas técnicas sempre aplicáveis: [identificação com ano vigente, descrição]. */
export const NORMAS_BASE: [string, string][] = [
  ["ABNT NBR 5410:2004", "Instalações elétricas de baixa tensão"],
  ["ABNT NBR 5419:2015", "Proteção de estruturas contra descargas atmosféricas"],
  ["ABNT NBR 5626:2020", "Instalações prediais de água fria"],
  [
    "ABNT NBR 5674:2024",
    "Manutenção de edificações — Requisitos para o sistema de gestão de manutenção",
  ],
  ["ABNT NBR 6118:2023", "Projeto de estruturas de concreto — Procedimento"],
  ["ABNT NBR 7200:1998", "Execução de impermeabilização"],
  ["ABNT NBR 8160:1999", "Sistemas prediais de esgoto sanitário — Projeto e execução"],
  ["ABNT NBR 9574:2008", "Impermeabilização — Diretrizes para elaboração de projetos"],
  ["ABNT NBR 9575:2010", "Impermeabilização — Seleção e projeto"],
  ["ABNT NBR 10844:1989", "Instalações prediais de águas pluviais"],
  ["ABNT NBR 12962:2017", "Recuperação de estruturas de concreto — Requisitos"],
  ["ABNT NBR 13752:2017", "Perícias de engenharia na construção civil"],
  ["ABNT NBR 15575:2013", "Edificações habitacionais — Desempenho"],
  [
    "ABNT NBR 16747:2020",
    "Inspeção predial — Diretrizes, conceitos, terminologia e procedimento",
  ],
  ["Norma de Inspeção Predial do IBAPE/SP", ""],
];

/** Normas condicionais, filtradas pelo tipo de edificação e nº de pavimentos. */
export function normasAplicaveis(v: Vistoria): [string, string][] {
  const pav = parseInt(v.imovel.pavimentos || "1", 10) || 1;
  const tipo = v.imovel.tipoEdificacao;
  const naoResidencial = tipo === "Comercial" || tipo === "Misto";
  const lista: [string, string][] = [...NORMAS_BASE];

  if (naoResidencial || pav > 1) {
    lista.push(
      ["ABNT NBR 10898:2013", "Sistema de iluminação de emergência"],
      ["ABNT NBR 13933:2019", "Acessibilidade a edificações e ao mobiliário urbano"],
    );
  }
  if (naoResidencial || pav >= 4) {
    lista.push(
      ["ABNT NBR 14712:2020", "Elevadores elétricos — Requisitos de segurança"],
      ["ABNT NBR 14718:2020", "Escadas e esteiras rolantes — Requisitos de segurança"],
    );
  }
  lista.push(
    [
      "ABNT NBR 13103:2022",
      "Fogões domésticos e aquecedores de água para uso com gás liquefeito de petróleo (GLP)",
    ],
    ["ABNT NBR 13127:2020", "Portas corta-fogo com núcleo de madeira para edificações"],
    [
      "ABNT NBR 14037:2024",
      "Diretrizes para elaboração de manuais de uso, operação e manutenção das edificações",
    ],
  );
  return lista;
}

export const LISTA_VERIFICACAO_BASE = [
  "Estrutura (pilares, vigas e lajes)",
  "Alvenarias e vedações",
  "Revestimentos e pinturas",
  "Cobertura, telhado e calhas",
  "Impermeabilização de áreas molhadas",
  "Instalações elétricas e QDC",
  "Instalações hidrossanitárias",
  "Esquadrias e vidros",
  "Pisos e pavimentação",
  "Acessibilidade e circulação",
];

/** Queixas da anamnese que vinculam sistemas da lista de verificação. */
const QUEIXAS_ANAMNESE: { id: string; alvo: string; observacao: string }[] = [
  {
    id: "infiltracoes",
    alvo: "Instalações hidrossanitárias",
    observacao: "Verificada a queixa de umidade relatada na anamnese.",
  },
  {
    id: "infiltracoes",
    alvo: "Impermeabilização de áreas molhadas",
    observacao: "Verificada a queixa de umidade relatada na anamnese.",
  },
  {
    id: "contas_agua",
    alvo: "Instalações hidrossanitárias",
    observacao: "Verificada a queixa de consumo de água relatada na anamnese.",
  },
  {
    id: "eletrica",
    alvo: "Instalações elétricas e QDC",
    observacao: "Verificada a queixa elétrica relatada na anamnese.",
  },
  {
    id: "trincas",
    alvo: "Estrutura (pilares, vigas e lajes)",
    observacao: "Verificada a queixa de trincas/fissuras relatada na anamnese.",
  },
  {
    id: "telhado",
    alvo: "Cobertura, telhado e calhas",
    observacao: "Verificada a queixa de manutenção de cobertura relatada na anamnese.",
  },
];

export function listaVerificacao(v: Vistoria) {
  return LISTA_VERIFICACAO_BASE.map((desc, i) => {
    const relacionadas = v.patologias.filter((p) =>
      desc.toLowerCase().includes(p.elemento.split(" ")[0]?.toLowerCase() ?? "@"),
    );
    const queixas = QUEIXAS_ANAMNESE.filter(
      (q) => q.alvo === desc && v.anamnese.respostas[q.id] === "SIM",
    ).map((q) => q.observacao);
    const observacao = relacionadas.length
      ? [`${relacionadas.length} não conformidade(s) registrada(s).`, ...queixas].join(" ")
      : queixas.length
        ? queixas.join(" ")
        : "Sem não conformidade registrada nesta inspeção.";
    return {
      item: String(i + 1),
      descricao: desc,
      verificado: "SIM",
      observacao,
    };
  });
}

export function sistemasInspecionados(v: Vistoria) {
  const set = new Set(v.patologias.map((p) => p.elemento).filter(Boolean));
  return set.size ? [...set] : ["Não foram registrados sistemas com não conformidade."];
}

export function anamneseResumo(v: Vistoria) {
  return ANAMNESE_ITENS.map((i) => ({
    pergunta: i.pergunta,
    resposta: v.anamnese.respostas[i.id] ?? "NÃO INFORMADO",
  }));
}

export function textoSecao1(v: Vistoria) {
  return `O presente Laudo Técnico de Vistoria Predial (LTVP) foi elaborado a pedido de ${
    v.imovel.proprietario || "solicitante"
  }, responsável pelo imóvel situado em ${enderecoCompleto(v.imovel)}, com o objetivo de verificar o estado de conservação e o desempenho dos sistemas construtivos da edificação. Para os fins deste laudo, adota-se a terminologia da ABNT NBR 16747, na qual ANOMALIA é a irregularidade decorrente de problemas de projeto, de execução, de materiais ou da ação de agentes naturais e externos, enquanto FALHA é a irregularidade decorrente da operação, do uso ou da manutenção inadequada ou inexistente da edificação.`;
}

export function textoSecao12(v: Vistoria) {
  return `Com o intuito de subsidiar a administração da edificação em relação às principais não conformidades, as anomalias e falhas de manutenção constatadas e analisadas na inspeção predial da ${
    v.imovel.tipoEdificacao || "edificação"
  } situada em ${enderecoCompleto(
    v.imovel,
  )}, foram classificadas conforme apresentado nas tabelas a seguir. É recomendável ainda que o imóvel estabeleça uma programação de manutenção, inicialmente, corretiva, com posterior implantação de procedimentos de manutenção preventiva, com base em suas características e nas legislações e normas técnicas aplicáveis.`;
}

export function textoConclusao(v: Vistoria) {
  const risco = grauRiscoGlobal(v);
  const ordenadas = patologiasOrdenadas(v);
  const criticos = ordenadas.filter((p) => gutTotal(p) >= 81);
  const sistemasCriticos = [...new Set(criticos.map((p) => p.elemento))];
  return [
    `A partir da inspeção realizada em ${formatarData(v.imovel.dataVistoria)}, foram constatadas ${
      v.patologias.length
    } não conformidades, cuja análise pela Matriz GUT resultou na classificação global de ${risco.label.toUpperCase()} para a edificação.`,
    sistemasCriticos.length
      ? `Os sistemas construtivos que demandam intervenção prioritária são: ${sistemasCriticos.join(
          "; ",
        )}.`
      : "Não foram identificadas não conformidades classificadas como de risco crítico nesta inspeção.",
    `Recomenda-se a execução imediata das medidas corretivas indicadas para os itens de maior pontuação GUT, seguida da implantação de um plano de manutenção preventiva conforme a ABNT NBR 5674, de modo a preservar o desempenho e a vida útil da edificação.`,
  ];
}

export const ENCERRAMENTO_PARTE_1 =
  "Nada mais havendo a relatar, encerra-se o presente Laudo Técnico de Vistoria Predial, composto por ";

/** Parte final do encerramento com nome e CREA dinâmicos da Etapa 1. */
export const encerramentoParte2 = (v: Vistoria) =>
  ` folhas digitadas de um só lado, elaborado sob a responsabilidade técnica do Engenheiro Civil ${
    v.imovel.inspetor || "—"
  }, CREA ${v.imovel.crea || "—"}, que o assina para os devidos fins.`;

export function textoEncerramento(v: Vistoria, paginas: string | number = "xx") {
  return `${ENCERRAMENTO_PARTE_1}${paginas}${encerramentoParte2(v)}`;
}

/** ART informada na Etapa 1 ou aviso padrão. */
export const textoArt = (v: Vistoria) =>
  v.imovel.art?.trim() ? v.imovel.art.trim() : "A ser emitida.";

/** Legenda de foto: "Foto 3.2 — Manifestações. Local / Posição" */
export function legendaFoto(
  pat: { manifestacoes: string[]; local: string; posicao: string },
  indiceSistema: number,
  indiceFoto: number,
) {
  const manif = pat.manifestacoes.filter(Boolean).join(", ") || "Registro fotográfico";
  const lugar = [pat.local, pat.posicao].filter(Boolean).join(" / ");
  return `Foto ${indiceSistema}.${indiceFoto} — ${manif}.${lugar ? ` ${lugar}` : ""}`;
}

export function metodologia(v: Vistoria) {
  const extras = v.imovel.equipamentos?.trim();
  return [
    [
      "7.1 Fase inicial e documental",
      "Levantamento das informações disponíveis sobre a edificação, análise da documentação apresentada, aplicação de anamnese junto aos usuários e definição do nível de inspeção conforme a ABNT NBR 16747 e a Norma de Inspeção Predial do IBAPE.",
    ],
    [
      "7.2 Vistoria das áreas",
      `Foram utilizados na vistoria equipamentos de auxílio ao diagnóstico como trena, martelo oco, nível de bolha e/ou nível a laser, câmera fotográfica, medidor de umidade FNIRSI WMT-10${
        extras ? `, ${extras}` : ""
      }. A vistoria consistiu em inspeção visual sensorial e verificações expeditas em todos os ambientes acessíveis da edificação, com registro fotográfico das manifestações patológicas encontradas.`,
    ],
    [
      "7.3 Elaboração do laudo",
      "Consolidação dos dados coletados, classificação das anomalias e falhas quanto à origem, atribuição de grau de risco pela Matriz GUT, definição de recomendações técnicas corretivas e ordenação das prioridades de intervenção.",
    ],
  ] as [string, string][];
}

export function grausRiscoIbape() {
  return [
    [
      "Risco Crítico",
      "Pode provocar danos contra a saúde e segurança das pessoas e do meio ambiente, perda excessiva de desempenho e funcionalidade, causando possíveis paralisações, aumento de custo e comprometimento sensível de vida útil.",
    ],
    [
      "Risco Médio",
      "Pode provocar a perda parcial de desempenho e funcionalidade da edificação sem prejuízo à operação direta de sistemas, além de deterioração precoce.",
    ],
    [
      "Risco Baixo",
      "Pode provocar pequenos prejuízos à estética ou atividade programável e planejada, sem incidência ou probabilidade de ocorrência dos riscos críticos e médios.",
    ],
  ] as [string, string][];
}

export function classificacoesTexto() {
  return [
    ["Anomalia Endógena", "Originária da própria edificação (projeto, materiais ou execução)."],
    ["Anomalia Exógena", "Provocada por fatores externos à edificação, por ação de terceiros."],
    ["Anomalia Natural", "Provocada por fenômenos da natureza."],
    ["Anomalia Funcional", "Originária da degradação natural dos sistemas por fim da vida útil."],
    [
      "Falha de Planejamento",
      "Decorrente de falhas de procedimentos e especificações inadequadas.",
    ],
    ["Falha de Execução", "Proveniente da execução inadequada de procedimentos de manutenção."],
    ["Falha Operacional", "Relativa aos procedimentos internos de operação e uso da edificação."],
    ["Falha Gerencial", "Decorrente da ausência de gestão da manutenção e de controles."],
  ] as [string, string][];
}
