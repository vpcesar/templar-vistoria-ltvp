import { listarVistorias, salvarTodas } from "./storage";
import type { Vistoria } from "./types";

const CFG_KEY = "templar_config";

export interface ConfigInspetor {
  nome: string;
  crea: string;
}

export const CONFIG_PADRAO: ConfigInspetor = {
  nome: "Vinicius Paulino Cesar",
  crea: "RJ 2024100977",
};

export function carregarConfig(): ConfigInspetor {
  if (typeof window === "undefined") return CONFIG_PADRAO;
  try {
    const raw = window.localStorage.getItem(CFG_KEY);
    return raw
      ? { ...CONFIG_PADRAO, ...(JSON.parse(raw) as Partial<ConfigInspetor>) }
      : CONFIG_PADRAO;
  } catch {
    return CONFIG_PADRAO;
  }
}

export function salvarConfig(cfg: ConfigInspetor) {
  window.localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
}

export function exportarJSON() {
  const dados = JSON.stringify({ vistorias: listarVistorias(), config: carregarConfig() }, null, 2);
  const url = URL.createObjectURL(new Blob([dados], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `templar-vistorias-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importarJSON(
  file: File,
): Promise<{ ok: true } | { ok: false; erro: string }> {
  try {
    const texto = await file.text();
    const parsed = JSON.parse(texto) as
      { vistorias?: Vistoria[]; config?: ConfigInspetor } | Vistoria[];
    const vistorias = Array.isArray(parsed) ? parsed : parsed.vistorias;
    if (!Array.isArray(vistorias))
      return { ok: false, erro: "Arquivo inválido: vistorias não encontradas." };
    salvarTodas(vistorias);
    if (!Array.isArray(parsed) && parsed.config)
      salvarConfig({ ...CONFIG_PADRAO, ...parsed.config });
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível importar o arquivo JSON." };
  }
}
