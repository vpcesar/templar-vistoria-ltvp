/** Cadastro local (neste navegador) dos responsáveis técnicos usados nas vistorias. */
import { getConfig } from "./config";

const KEY = "templar_responsaveis";

export interface ResponsavelTecnico {
  id: string;
  nome: string;
  crea: string;
  padrao?: boolean;
}

function inicial(): ResponsavelTecnico {
  const c = getConfig();
  return { id: "padrao", nome: c.nome, crea: c.crea, padrao: true };
}

export const RESPONSAVEL_INICIAL: ResponsavelTecnico = {
  id: "padrao",
  nome: "Vinicius Cesar",
  crea: "RJ 2024100977",
  padrao: true,
};

/** Lista com o responsável padrão sempre em primeiro lugar. */
export function listarResponsaveis(): ResponsavelTecnico[] {
  if (typeof window === "undefined") return [inicial()];
  try {
    const raw = window.localStorage.getItem(KEY);
    const lista = raw ? (JSON.parse(raw) as ResponsavelTecnico[]) : [];
    if (!Array.isArray(lista) || lista.length === 0) return [inicial()];
    const comPadrao = lista.some((r) => r.padrao)
      ? lista
      : lista.map((r, i) => (i === 0 ? { ...r, padrao: true } : r));
    return [...comPadrao].sort((a, b) => Number(!!b.padrao) - Number(!!a.padrao));
  } catch {
    return [inicial()];
  }
}

/** Responsável marcado como padrão (usado como default nas novas vistorias). */
export function responsavelPadrao(): ResponsavelTecnico {
  return listarResponsaveis().find((r) => r.padrao) ?? inicial();
}

export function salvarResponsaveis(lista: ResponsavelTecnico[]) {
  window.localStorage.setItem(KEY, JSON.stringify(lista));
}

export function adicionarResponsavel(nome: string, crea: string): ResponsavelTecnico[] {
  const atuais = listarResponsaveis();
  const novo: ResponsavelTecnico = {
    id: crypto.randomUUID(),
    nome: nome.trim(),
    crea: crea.trim(),
    padrao: atuais.length === 0,
  };
  const lista = [...atuais, novo];
  salvarResponsaveis(lista);
  return listarResponsaveis();
}

export function atualizarResponsavel(
  id: string,
  dados: { nome: string; crea: string },
): ResponsavelTecnico[] {
  const lista = listarResponsaveis().map((r) =>
    r.id === id ? { ...r, nome: dados.nome.trim(), crea: dados.crea.trim() } : r,
  );
  salvarResponsaveis(lista);
  return listarResponsaveis();
}

export function definirResponsavelPadrao(id: string): ResponsavelTecnico[] {
  const lista = listarResponsaveis().map((r) => ({ ...r, padrao: r.id === id }));
  salvarResponsaveis(lista);
  return listarResponsaveis();
}

export function removerResponsavel(id: string): ResponsavelTecnico[] {
  const restantes = listarResponsaveis().filter((r) => r.id !== id);
  const final =
    restantes.length > 0
      ? restantes.some((r) => r.padrao)
        ? restantes
        : restantes.map((r, i) => (i === 0 ? { ...r, padrao: true } : r))
      : [inicial()];
  salvarResponsaveis(final);
  return listarResponsaveis();
}
