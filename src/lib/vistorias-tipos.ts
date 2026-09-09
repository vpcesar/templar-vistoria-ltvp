/**
 * Tipos de serviço agrupados e roteamento do fluxo de preenchimento.
 *
 * - "ambientes": imóvel novo (entrega) → checklist por ambiente
 * - "campo": demais tipos → fluxo de coleta de campo com 4 etapas (já existente)
 */
export type FluxoVistoria = "ambientes" | "campo";

export interface GrupoServico {
  grupo: string;
  fluxo: FluxoVistoria;
  tipos: readonly string[];
}

export const GRUPOS_SERVICO: readonly GrupoServico[] = [
  {
    grupo: "Imóvel Novo (Entrega)",
    fluxo: "ambientes",
    tipos: [
      "Vistoria de Entrega das Chaves",
      "Vistoria de Entrega e Recebimento de Obra",
      "Vistoria de Constatação de Obra",
    ],
  },
  {
    grupo: "Edificação Existente",
    fluxo: "campo",
    tipos: ["Inspeção Predial", "Vistoria de Reforma"],
  },
  {
    grupo: "Vistorias Locativas",
    fluxo: "campo",
    tipos: ["Vistoria Locativa de Entrada", "Vistoria Locativa de Saída"],
  },
  {
    grupo: "Vistorias Cautelares",
    fluxo: "campo",
    tipos: ["Vistoria Cautelar de Vizinhança"],
  },
  {
    grupo: "Laudos Técnicos",
    fluxo: "campo",
    tipos: [
      "Laudo Técnico",
      "Vistoria de Análise de Causalidade",
      "Vistoria de Análise Comparativa de Conformidade",
      "Vistoria de Constatação",
    ],
  },
];

/** Rótulo exibido no dropdown (a Inspeção Predial ganha a referência normativa). */
export function rotuloTipo(tipo: string): string {
  return tipo === "Inspeção Predial" ? "Inspeção Predial (NBR 16747)" : tipo;
}

export function fluxoDoTipo(tipo: string): FluxoVistoria {
  const grupo = GRUPOS_SERVICO.find((g) => g.tipos.includes(tipo));
  return grupo?.fluxo ?? "campo";
}

export const DICA_FLUXO: Record<FluxoVistoria, string> = {
  ambientes: "Este tipo usa o checklist por ambientes.",
  campo: "Este tipo usa o fluxo de campo com 4 etapas.",
};
