/**
 * Catálogo de itens do checklist por tipo de ambiente (fluxo de imóvel novo).
 * Usado como base local; quando a tabela `catalogo_checklist` estiver
 * disponível no Supabase, ela tem prioridade.
 */
export interface ItemCatalogo {
  tipo_ambiente: string;
  titulo: string;
  orientacoes: string;
  teste: string;
  atencao: string;
  ordem: number;
}

export const TIPO_AMBIENTE_BANHEIRO = "Banheiro";
export const TIPO_AMBIENTE_PADRAO = "Padrão";

/** Identifica o catálogo aplicável ao nome do ambiente. */
export function tipoAmbienteDe(nome: string): string {
  const n = nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (/banheiro|lavabo|\bwc\b|sanitario/.test(n)) return TIPO_AMBIENTE_BANHEIRO;
  return TIPO_AMBIENTE_PADRAO;
}

const BANHEIRO: ReadonlyArray<Omit<ItemCatalogo, "tipo_ambiente" | "ordem">> = [
  {
    titulo: "Porta e batente",
    orientacoes: "Verifique alinhamento, prumo, folgas uniformes e acabamento do batente.",
    teste: "Abra e feche a porta completamente; observe se trava ou raspa no piso.",
    atencao: "Portas de banheiro devem ter folga inferior para ventilação (NBR 15575).",
  },
  {
    titulo: "Fechadura e ferragens",
    orientacoes: "Confira maçaneta, fechadura, dobradiças e parafusos.",
    teste: "Trave e destrave a porta pelos dois lados por três vezes.",
    atencao: "Fechadura que não trava por dentro é não conformidade de uso.",
  },
  {
    titulo: "Revestimento das paredes (azulejos)",
    orientacoes: "Verifique alinhamento, planeza, peças trincadas, lascadas ou tonalidades diferentes.",
    teste: "Percuta as peças com o cabo de uma vassoura para identificar som cavo (descolamento).",
    atencao: "Som cavo indica falha de aderência e exige substituição.",
  },
  {
    titulo: "Rejuntamento das paredes",
    orientacoes: "Observe uniformidade, largura e ausência de falhas ou manchas.",
    teste: "Passe o dedo nas juntas verificando falhas e desprendimento.",
    atencao: "Rejunte falhado permite infiltração para os ambientes vizinhos.",
  },
  {
    titulo: "Piso cerâmico",
    orientacoes: "Verifique nivelamento, peças trincadas, lascadas e alinhamento das juntas.",
    teste: "Percuta o piso para identificar som cavo; verifique degraus entre peças.",
    atencao: "Desnível entre peças acima de 2 mm é não conformidade.",
  },
  {
    titulo: "Caimento do piso e ralo",
    orientacoes: "O piso deve escoar integralmente para o ralo, sem empoçamento.",
    teste: "Jogue água (ou bolinhas de gude) no piso e observe o escoamento até o ralo.",
    atencao: "Empoçamento é não conformidade grave de estanqueidade.",
  },
  {
    titulo: "Ralo e grelha",
    orientacoes: "Confira fixação, nivelamento, vedação e presença de sifão.",
    teste: "Retire a grelha, verifique o sifão e devolva; teste o escoamento.",
    atencao: "Ralo sem sifão permite retorno de odores.",
  },
  {
    titulo: "Teto e forro",
    orientacoes: "Verifique planeza, fissuras, manchas de umidade e acabamento de emendas.",
    teste: "Observe o teto com iluminação rasante para revelar ondulações.",
    atencao: "Manchas no teto podem indicar vazamento na unidade superior.",
  },
  {
    titulo: "Pintura",
    orientacoes: "Verifique cobertura uniforme, ausência de respingos, escorridos e retoques aparentes.",
    teste: "Observe a superfície contra a luz e em diferentes ângulos.",
    atencao: "Banheiro exige tinta lavável/acetinada resistente à umidade.",
  },
  {
    titulo: "Bacia sanitária",
    orientacoes: "Confira fixação, nivelamento, vedação na base e ausência de trincas.",
    teste: "Acione a descarga três vezes e verifique vazamento na base e no anel de vedação.",
    atencao: "Bacia solta ou com vazamento na base é não conformidade.",
  },
  {
    titulo: "Válvula/caixa de descarga",
    orientacoes: "Verifique acionamento, fechamento completo e ausência de gotejamento.",
    teste: "Acione e aguarde 1 minuto observando se a água para de correr.",
    atencao: "Descarga que não fecha gera desperdício e é não conformidade.",
  },
  {
    titulo: "Lavatório / cuba",
    orientacoes: "Confira fixação, nivelamento, trincas, riscos e vedação com a parede.",
    teste: "Apoie peso leve na borda e verifique estabilidade.",
    atencao: "Cubas com trincas capilares tendem a evoluir para vazamento.",
  },
  {
    titulo: "Torneira e metais",
    orientacoes: "Verifique acabamento, fixação, alinhamento e ausência de gotejamento.",
    teste: "Abra e feche a torneira totalmente; observe vazamento na base e na haste.",
    atencao: "Registro que gira com dificuldade indica instalação forçada.",
  },
  {
    titulo: "Sifão e ligações hidráulicas",
    orientacoes: "Confira sifão, engates flexíveis e vedações sob o lavatório.",
    teste: "Encha a cuba e esvazie de uma vez observando vazamentos nas conexões.",
    atencao: "Vazamentos sob a bancada danificam o armário e a alvenaria.",
  },
  {
    titulo: "Chuveiro / ducha",
    orientacoes: "Verifique fixação, vedação na parede, alinhamento e pressão da água.",
    teste: "Acione o chuveiro por 1 minuto verificando pressão, vazamentos e temperatura.",
    atencao: "Pressão insuficiente pode indicar entupimento ou registro semiaberto.",
  },
  {
    titulo: "Instalações elétricas (tomadas e interruptores)",
    orientacoes: "Confira fixação, nivelamento, acabamento das placas e aterramento.",
    teste: "Teste cada tomada com o testador e acione todos os interruptores.",
    atencao: "Tomada de banheiro deve estar fora da zona de projeção do chuveiro (NBR 5410).",
  },
  {
    titulo: "Ventilação e exaustão",
    orientacoes: "Verifique janela, veneziana ou duto de exaustão desobstruído.",
    teste: "Aproxime uma folha de papel do duto e observe a sucção.",
    atencao: "Banheiro sem ventilação natural exige exaustão mecânica.",
  },
  {
    titulo: "Limpeza e acabamento final",
    orientacoes: "Confira ausência de restos de rejunte, tinta, cimento e etiquetas.",
    teste: "Inspecione cantos, ralos e sob as louças.",
    atencao: "Restos de obra no ralo causam entupimento na primeira utilização.",
  },
];

const PADRAO: ReadonlyArray<Omit<ItemCatalogo, "tipo_ambiente" | "ordem">> = [
  {
    titulo: "Paredes",
    orientacoes: "Verifique prumo, planeza, fissuras, manchas de umidade e alinhamento.",
    teste: "Use régua de alumínio e nível; observe a parede com iluminação rasante.",
    atencao: "Fissuras acima de 0,5 mm devem ser registradas e fotografadas.",
  },
  {
    titulo: "Piso",
    orientacoes: "Confira nivelamento, peças trincadas ou lascadas, rejunte e rodapés.",
    teste: "Percuta o piso para identificar som cavo; verifique degraus entre peças.",
    atencao: "Som cavo indica falha de aderência e exige substituição.",
  },
  {
    titulo: "Teto e forro",
    orientacoes: "Verifique planeza, fissuras, manchas e acabamento das emendas.",
    teste: "Observe o teto com iluminação rasante em diferentes ângulos.",
    atencao: "Manchas podem indicar vazamento proveniente do pavimento superior.",
  },
  {
    titulo: "Pintura",
    orientacoes: "Confira cobertura uniforme, ausência de respingos, escorridos e retoques.",
    teste: "Observe a superfície contra a luz natural e artificial.",
    atencao: "Diferença de tonalidade indica retoque sem demão completa.",
  },
  {
    titulo: "Instalações elétricas",
    orientacoes: "Verifique tomadas, interruptores, luminárias, placas e aterramento.",
    teste: "Teste cada tomada com testador e acione todos os interruptores.",
    atencao: "Ausência de aterramento é não conformidade (NBR 5410).",
  },
  {
    titulo: "Instalações hidráulicas",
    orientacoes: "Confira pontos de água, registros, vazamentos aparentes e escoamento.",
    teste: "Abra os pontos de água por 1 minuto observando pressão e vazamentos.",
    atencao: "Manchas de umidade próximas a prumadas indicam vazamento.",
  },
  {
    titulo: "Esquadrias e janelas",
    orientacoes: "Verifique alinhamento, vedação, ferragens, vidros e trilhos.",
    teste: "Abra e feche todas as folhas; verifique travamento e vedação.",
    atencao: "Infiltração por esquadria é uma das falhas mais frequentes na entrega.",
  },
  {
    titulo: "Portas e ferragens",
    orientacoes: "Confira alinhamento, batente, folgas, dobradiças e fechadura.",
    teste: "Abra, feche e trave a porta pelos dois lados.",
    atencao: "Porta que se move sozinha indica batente fora de prumo.",
  },
  {
    titulo: "Limpeza e acabamento final",
    orientacoes: "Verifique ausência de restos de obra, etiquetas e sujeira.",
    teste: "Inspecione cantos, soleiras, ralos e atrás das portas.",
    atencao: "A unidade deve ser entregue limpa e pronta para uso.",
  },
  {
    titulo: "Observações gerais do ambiente",
    orientacoes: "Registre qualquer constatação não contemplada nos itens anteriores.",
    teste: "Faça uma leitura visual completa do ambiente antes de encerrar.",
    atencao: "Fotografe toda constatação relevante, mesmo aprovada com ressalva.",
  },
];

function comOrdem(
  tipo: string,
  itens: ReadonlyArray<Omit<ItemCatalogo, "tipo_ambiente" | "ordem">>,
): ItemCatalogo[] {
  return itens.map((i, idx) => ({ ...i, tipo_ambiente: tipo, ordem: idx + 1 }));
}

export const CATALOGO_LOCAL: Record<string, ItemCatalogo[]> = {
  [TIPO_AMBIENTE_BANHEIRO]: comOrdem(TIPO_AMBIENTE_BANHEIRO, BANHEIRO),
  [TIPO_AMBIENTE_PADRAO]: comOrdem(TIPO_AMBIENTE_PADRAO, PADRAO),
};

export function catalogoLocal(tipoAmbiente: string): ItemCatalogo[] {
  return CATALOGO_LOCAL[tipoAmbiente] ?? CATALOGO_LOCAL[TIPO_AMBIENTE_PADRAO] ?? [];
}
