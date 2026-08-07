export type StatusVistoria = "EM ANDAMENTO" | "AGUARDANDO REVISAO" | "CONCLUIDA";

export type RespostaAnamnese = "SIM" | "NAO" | "NAO SABE";

export interface Foto {
  id: string;
  dataUrl: string;
  legenda?: string;
}

export interface Patologia {
  id: string;
  fotos: Foto[];
  setor: string;
  elemento: string;
  local: string;
  posicao: string;
  manifestacoes: string[];
  classificacao: string;
  iaConfianca?: string;
  iaJustificativa?: string;
  recomendacao: string;
  gravidade: number;
  urgencia: number;
  tendencia: number;
  gutAjustado?: boolean;
  justificativaG?: string;
  justificativaU?: string;
  justificativaT?: string;
  observacoes?: string;
}

export interface DadosImovel {
  tipoEdificacao: string;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  idadeAparente: number;
  pavimentos: string;
  areaConstruida: string;
  proprietario: string;
  dataVistoria: string;
  inspetor: string;
  crea: string;
  observacoes?: string;
}

export interface Anamnese {
  respostas: Record<string, RespostaAnamnese>;
  observacoes?: string;
}

export interface Vistoria {
  id: string;
  status: StatusVistoria;
  criadoEm: string;
  atualizadoEm: string;
  imovel: DadosImovel;
  anamnese: Anamnese;
  patologias: Patologia[];
}

export const gutTotal = (p: Patologia) => p.gravidade * p.urgencia * p.tendencia;

export const riscoDe = (total: number) =>
  total >= 81
    ? { label: "Risco Crítico", tone: "critico" as const }
    : total >= 30
      ? { label: "Risco Médio", tone: "medio" as const }
      : { label: "Risco Baixo", tone: "baixo" as const };

export const enderecoCompleto = (i: DadosImovel) =>
  [
    [i.logradouro, i.numero].filter(Boolean).join(", "),
    i.bairro,
    [i.cidade, i.uf].filter(Boolean).join(" - "),
    i.cep,
  ]
    .filter(Boolean)
    .join(" • ");
