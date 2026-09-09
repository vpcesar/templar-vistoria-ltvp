/** Cadastro local (neste navegador) dos responsáveis técnicos usados nas vistorias. */
const KEY = "templar_responsaveis";

export interface ResponsavelTecnico {
  id: string;
  nome: string;
  crea: string;
}

export const RESPONSAVEL_INICIAL: ResponsavelTecnico = {
  id: "padrao",
  nome: "Vinicius Cesar",
  crea: "RJ 2024100977",
};

export function listarResponsaveis(): ResponsavelTecnico[] {
  if (typeof window === "undefined") return [RESPONSAVEL_INICIAL];
  try {
    const raw = window.localStorage.getItem(KEY);
    const lista = raw ? (JSON.parse(raw) as ResponsavelTecnico[]) : [];
    return Array.isArray(lista) && lista.length > 0 ? lista : [RESPONSAVEL_INICIAL];
  } catch {
    return [RESPONSAVEL_INICIAL];
  }
}

export function salvarResponsaveis(lista: ResponsavelTecnico[]) {
  window.localStorage.setItem(KEY, JSON.stringify(lista));
}

export function adicionarResponsavel(nome: string, crea: string): ResponsavelTecnico[] {
  const novo: ResponsavelTecnico = {
    id: crypto.randomUUID(),
    nome: nome.trim(),
    crea: crea.trim(),
  };
  const lista = [...listarResponsaveis(), novo];
  salvarResponsaveis(lista);
  return lista;
}

export function removerResponsavel(id: string): ResponsavelTecnico[] {
  const lista = listarResponsaveis().filter((r) => r.id !== id);
  const final = lista.length > 0 ? lista : [RESPONSAVEL_INICIAL];
  salvarResponsaveis(final);
  return final;
}
