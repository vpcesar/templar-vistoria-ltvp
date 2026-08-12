import { enderecoCompleto, gutTotal, riscoDe, type Vistoria } from "./types";
import {
  ENCERRAMENTO_PARTE_1,
  GLOSSARIO,
  anamneseResumo,
  encerramentoParte2,
  formatarData,
  legendaFoto,
  listaVerificacao,
  metodologia,
  nivelInspecao,
  normasAplicaveis,
  patologiasOrdenadas,
  sistemasInspecionados,
  textoArt,
  textoConclusao,
  textoSecao1,
  textoSecao12,
} from "./laudo";

export const TOKEN_PAGINAS = "{{paginas}}";

export interface ItemMetodologia {
  titulo: string;
  texto: string;
}

export interface ItemVerificacao {
  descricao: string;
  verificado: string;
  observacao: string;
}

export interface ItemAnamnese {
  pergunta: string;
  resposta: string;
}

export interface PatologiaEditavel {
  titulo: string;
  elemento: string;
  local: string;
  posicao: string;
  manifestacoes: string;
  classificacao: string;
  recomendacao: string;
  observacoes: string;
  legendas: string[];
  gravidade: number;
  urgencia: number;
  tendencia: number;
}

export interface LaudoEditavel {
  secao1: { texto: string };
  secao2: { texto: string };
  secao3: {
    tipoEdificacao: string;
    endereco: string;
    areaConstruida: string;
    solicitante: string;
    responsavel: string;
    crea: string;
    art: string;
    data: string;
  };
  secao4: {
    texto: string;
    observacoes: string;
    anamnese: ItemAnamnese[];
    observacoesAnamnese: string;
  };
  secao5: { legendasFachada: string[]; legendasSatelite: string[]; textoSemFoto: string };
  secao6: { texto: string };
  secao7: { itens: ItemMetodologia[]; glossario: [string, string][] };
  secao9: { sistemas: string[] };
  secao10: { itens: ItemVerificacao[] };
  secao11: { patologias: PatologiaEditavel[] };
  secao12: { texto: string };
  secao13: { texto: string };
  secao14: { normas: string[] };
  encerramento: { texto: string };
  assinatura: { cidade: string; data: string; nome: string; crea: string };
}

const legendasPadrao = (n: number, base: string) =>
  Array.from({ length: n }, (_, i) => `${base}${n > 1 ? ` ${i + 1}` : ""} — ${
    base.includes("satélite") ? "localização do imóvel." : "fachada do imóvel vistoriado."
  }`);

export function gerarLaudoPadrao(v: Vistoria): LaudoEditavel {
  const ordenadas = patologiasOrdenadas(v);
  return {
    secao1: { texto: textoSecao1(v) },
    secao2: {
      texto:
        "O presente laudo tem por objetivo apresentar o diagnóstico geral do estado de conservação da edificação, identificando as anomalias e falhas existentes, avaliando os riscos associados e indicando as recomendações técnicas corretivas e a ordem de prioridade de intervenção, conforme a ABNT NBR 16747, a ABNT NBR 5674 e a Norma de Inspeção Predial do IBAPE.",
    },
    secao3: {
      tipoEdificacao: v.imovel.tipoEdificacao || "—",
      endereco: enderecoCompleto(v.imovel),
      areaConstruida: v.imovel.areaConstruida ? `${v.imovel.areaConstruida} m²` : "—",
      solicitante: v.imovel.proprietario || "—",
      responsavel: v.imovel.inspetor || "—",
      crea: v.imovel.crea || "—",
      art: textoArt(v),
      data: formatarData(v.imovel.dataVistoria),
    },
    secao4: {
      texto: `A edificação está localizada em ${enderecoCompleto(v.imovel)}, possui ${
        v.imovel.pavimentos || "—"
      } pavimento(s), é classificada como ${
        v.imovel.tipoEdificacao || "—"
      } e apresenta idade aparente de ${v.imovel.idadeAparente} anos, com área construída de ${
        v.imovel.areaConstruida || "—"
      } m². Os sistemas componentes verificados incluem estrutura, vedações, revestimentos, cobertura, impermeabilização, instalações elétricas e hidrossanitárias, esquadrias e pisos.`,
      observacoes: v.imovel.observacoes ?? "",
      anamnese: anamneseResumo(v),
      observacoesAnamnese: v.anamnese.observacoes ?? "",
    },
    secao5: {
      legendasFachada: legendasPadrao(
        (v.imovel.fotosEdificacao ?? []).length,
        "Foto da fachada (in loco)",
      ),
      legendasSatelite: legendasPadrao(
        (v.imovel.fotosSatelite ?? []).length,
        "Foto de satélite (Google Earth)",
      ),
      textoSemFoto: "Não há registro fotográfico da edificação nesta vistoria.",
    },
    secao6: { texto: nivelInspecao(v).join("\n\n") },
    secao7: {
      itens: metodologia(v).map(([titulo, texto]) => ({ titulo, texto })),
      glossario: GLOSSARIO.map(([a, b]) => [a, b] as [string, string]),
    },
    secao9: { sistemas: sistemasInspecionados(v) },
    secao10: {
      itens: listaVerificacao(v).map((l) => ({
        descricao: l.descricao,
        verificado: l.verificado,
        observacao: l.observacao,
      })),
    },
    secao11: {
      patologias: ordenadas.map((pat, idx) => ({
        titulo: `${pat.elemento || "Elemento"} — ${pat.local || "Local"}`,
        elemento: pat.elemento || "—",
        local: pat.local || "—",
        posicao: pat.posicao || "—",
        manifestacoes: pat.manifestacoes.join("; ") || "—",
        classificacao: pat.classificacao || "—",
        recomendacao: pat.recomendacao || "—",
        observacoes: pat.observacoes || "—",
        legendas: pat.fotos.map((_, i) => legendaFoto(pat, idx + 1, i + 1)),
        gravidade: pat.gravidade,
        urgencia: pat.urgencia,
        tendencia: pat.tendencia,
      })),
    },
    secao12: { texto: textoSecao12(v) },
    secao13: { texto: textoConclusao(v).join("\n\n") },
    secao14: {
      normas: normasAplicaveis(v).map(([nome, desc]) => (desc ? `${nome} — ${desc}` : nome)),
    },
    encerramento: {
      texto: `${ENCERRAMENTO_PARTE_1}${TOKEN_PAGINAS}${encerramentoParte2(v)}`,
    },
    assinatura: {
      cidade: v.imovel.cidade || "—",
      data: formatarData(v.imovel.dataVistoria),
      nome: v.imovel.inspetor || "Responsável técnico",
      crea: v.imovel.crea || "—",
    },
  };
}

const mergeObj = <T extends object>(base: T, saved: unknown): T =>
  saved && typeof saved === "object" ? { ...base, ...(saved as Partial<T>) } : base;

const mergeStrings = (base: string[], saved: unknown): string[] =>
  Array.isArray(saved) ? saved.map((s) => String(s)) : base;

function mergeLista<T extends object>(base: T[], saved: unknown): T[] {
  if (!Array.isArray(saved)) return base;
  return base.map((item, i) => mergeObj(item, saved[i]));
}

/** Combina os valores padrão do sistema com as edições salvas do engenheiro. */
export function resolverLaudo(v: Vistoria): LaudoEditavel {
  const base = gerarLaudoPadrao(v);
  const s = v.laudoEditavel as Partial<LaudoEditavel> | undefined;
  if (!s) return base;
  return {
    secao1: mergeObj(base.secao1, s.secao1),
    secao2: mergeObj(base.secao2, s.secao2),
    secao3: mergeObj(base.secao3, s.secao3),
    secao4: {
      ...mergeObj(base.secao4, s.secao4),
      anamnese: mergeLista(base.secao4.anamnese, s.secao4?.anamnese),
    },
    secao5: {
      ...mergeObj(base.secao5, s.secao5),
      legendasFachada: mergeStrings(base.secao5.legendasFachada, s.secao5?.legendasFachada),
      legendasSatelite: mergeStrings(base.secao5.legendasSatelite, s.secao5?.legendasSatelite),
    },
    secao6: mergeObj(base.secao6, s.secao6),
    secao7: {
      itens: mergeLista(base.secao7.itens, s.secao7?.itens),
      glossario: base.secao7.glossario,
    },
    secao9: { sistemas: mergeStrings(base.secao9.sistemas, s.secao9?.sistemas) },
    secao10: { itens: mergeLista(base.secao10.itens, s.secao10?.itens) },
    secao11: {
      patologias: base.secao11.patologias.map((pat, i) => {
        const savedPat = (s.secao11?.patologias ?? [])[i];
        return {
          ...mergeObj(pat, savedPat),
          legendas: mergeStrings(pat.legendas, savedPat?.legendas),
        };
      }),
    },
    secao12: mergeObj(base.secao12, s.secao12),
    secao13: mergeObj(base.secao13, s.secao13),
    secao14: { normas: mergeStrings(base.secao14.normas, s.secao14?.normas) },
    encerramento: mergeObj(base.encerramento, s.encerramento),
    assinatura: mergeObj(base.assinatura, s.assinatura),
  };
}

/** Patologias na ordem do laudo, combinadas com os textos editados. */
export function patologiasParaLaudo(v: Vistoria, laudo: LaudoEditavel) {
  return patologiasOrdenadas(v).map((pat, i) => {
    const ed = laudo.secao11.patologias[i];
    const g = ed?.gravidade ?? pat.gravidade;
    const u = ed?.urgencia ?? pat.urgencia;
    const t = ed?.tendencia ?? pat.tendencia;
    const total = g * u * t;
    return {
      original: pat,
      ...(ed ?? {
        titulo: `${pat.elemento} — ${pat.local}`,
        elemento: pat.elemento,
        local: pat.local,
        posicao: pat.posicao,
        manifestacoes: pat.manifestacoes.join("; "),
        classificacao: pat.classificacao,
        recomendacao: pat.recomendacao,
        observacoes: pat.observacoes ?? "",
        legendas: [],
        gravidade: g,
        urgencia: u,
        tendencia: t,
      }),
      total,
      risco: riscoDe(total).label,
    };
  });
}

export const parágrafos = (texto: string) =>
  (texto || "")
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

export { gutTotal };
