import type { Anamnese, DadosImovel, Patologia, Vistoria } from "./types";

const KEY = "templar_vistorias";

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const imovelVazio = (): DadosImovel => ({
  tipoEdificacao: "",
  cep: "",
  logradouro: "",
  numero: "",
  bairro: "",
  cidade: "",
  uf: "",
  idadeAparente: 0,
  pavimentos: "",
  areaConstruida: "",
  proprietario: "",
  dataVistoria: new Date().toISOString().slice(0, 10),
  inspetor: "Vinicius Paulino Cesar",
  crea: "",
  observacoes: "",
});

export const anamneseVazia = (): Anamnese => ({ respostas: {}, observacoes: "" });

export const patologiaVazia = (): Patologia => ({
  id: uid(),
  fotos: [],
  setor: "",
  elemento: "",
  local: "",
  posicao: "",
  manifestacoes: [],
  classificacao: "",
  recomendacao: "",
  gravidade: 3,
  urgencia: 3,
  tendencia: 3,
  observacoes: "",
});

export function listarVistorias(): Vistoria[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Vistoria[]) : [];
    return parsed.sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm));
  } catch {
    return [];
  }
}

export function salvarTodas(lista: Vistoria[]) {
  window.localStorage.setItem(KEY, JSON.stringify(lista));
}

export function obterVistoria(id: string): Vistoria | undefined {
  return listarVistorias().find((v) => v.id === id);
}

export function salvarVistoria(v: Vistoria) {
  const lista = listarVistorias().filter((x) => x.id !== v.id);
  lista.push({ ...v, atualizadoEm: new Date().toISOString() });
  salvarTodas(lista);
}

export function excluirVistoria(id: string) {
  salvarTodas(listarVistorias().filter((v) => v.id !== id));
}

export function novaVistoria(): Vistoria {
  const agora = new Date().toISOString();
  return {
    id: uid(),
    status: "EM ANDAMENTO",
    criadoEm: agora,
    atualizadoEm: agora,
    imovel: imovelVazio(),
    anamnese: anamneseVazia(),
    patologias: [],
  };
}

/** Lista customizada de opções adicionadas pelo usuário (por campo). */
export function opcoesCustom(campo: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(`templar_opts_${campo}`) || "[]") as string[];
  } catch {
    return [];
  }
}

export function addOpcaoCustom(campo: string, valor: string) {
  const atuais = opcoesCustom(campo);
  if (!atuais.includes(valor)) {
    window.localStorage.setItem(`templar_opts_${campo}`, JSON.stringify([...atuais, valor]));
  }
}
