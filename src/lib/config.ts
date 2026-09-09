import { listarVistorias, salvarTodas } from "./storage";
import type { Vistoria } from "./types";

const CFG_KEY = "templar_config";
const ERP_KEY = "templar_config_erp";

/** Configuração central do ERP: dados profissionais, IA e identidade visual. */
export interface ConfigERP {
  /* A — profissional / empresa */
  nome: string;
  crea: string;
  cpf: string;
  telefone: string;
  email: string;
  site: string;
  cargo: string;
  endereco: string;
  tagline: string;
  /* B — IA (Google Gemini) */
  iaModelo: string;
  iaInstrucao: string;
  iaTemperatura: number;
  /* C — identidade visual / documentos */
  logoDataUrl: string;
  corNavy: string;
  corGold: string;
  prefixoProposta: string;
  prefixoVistoria: string;
  prefixoLaudo: string;
  formatoData: "DD/MM/AAAA" | "MM/DD/AAAA";
  pastaDrive: string;
}

export const INSTRUCAO_IA_PADRAO =
  "Assistente técnico de engenharia civil. Reescreva o texto de forma técnica, objetiva e concisa. " +
  "Complexidade média. NUNCA invente dados que não estão no texto original. " +
  "Mantenha o sentido original, apenas melhore a linguagem.";

export const MODELOS_IA = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash"] as const;

export const CONFIG_ERP_PADRAO: ConfigERP = {
  nome: "Vinicius Cesar",
  crea: "RJ 2024100977",
  cpf: "",
  telefone: "(21) 98180-8812",
  email: "templarengenharia@hotmail.com",
  site: "www.templarengenharia.com.br",
  cargo: "",
  endereco: "",
  tagline: "Vistorias • Inspeções • Laudos • Perícias",
  iaModelo: "gemini-2.0-flash",
  iaInstrucao: INSTRUCAO_IA_PADRAO,
  iaTemperatura: 0.3,
  logoDataUrl: "",
  corNavy: "#1a365d",
  corGold: "#d4af37",
  prefixoProposta: "PROP",
  prefixoVistoria: "VIST",
  prefixoLaudo: "LAU",
  formatoData: "DD/MM/AAAA",
  pastaDrive: "Vistoria de recebimento",
};

/** Campo vazio volta ao padrão, para nunca quebrar documentos existentes. */
function comPadroes(bruto: Partial<ConfigERP>): ConfigERP {
  const final = { ...CONFIG_ERP_PADRAO };
  for (const chave of Object.keys(CONFIG_ERP_PADRAO) as Array<keyof ConfigERP>) {
    const valor = bruto[chave];
    if (valor === undefined || valor === null || valor === "") continue;
    // @ts-expect-error atribuição homogênea por chave
    final[chave] = valor;
  }
  if (!Number.isFinite(final.iaTemperatura)) final.iaTemperatura = CONFIG_ERP_PADRAO.iaTemperatura;
  return final;
}

export function getConfig(): ConfigERP {
  if (typeof window === "undefined") return CONFIG_ERP_PADRAO;
  try {
    const raw = window.localStorage.getItem(ERP_KEY);
    const antigo = window.localStorage.getItem(CFG_KEY);
    const base = raw ? (JSON.parse(raw) as Partial<ConfigERP>) : {};
    const legado = antigo ? (JSON.parse(antigo) as Partial<ConfigERP>) : {};
    return comPadroes({ ...legado, ...base });
  } catch {
    return CONFIG_ERP_PADRAO;
  }
}

export function saveConfig(patch: Partial<ConfigERP>): ConfigERP {
  const final = comPadroes({ ...getConfig(), ...patch });
  window.localStorage.setItem(ERP_KEY, JSON.stringify(final));
  // mantém compatibilidade com a configuração antiga (nome/CREA)
  window.localStorage.setItem(CFG_KEY, JSON.stringify({ nome: final.nome, crea: final.crea }));
  return final;
}

/* ---------- derivados usados em telas e documentos ---------- */

export const siteUrl = () => {
  const site = getConfig().site.trim();
  return /^https?:\/\//i.test(site) ? site : `https://${site}`;
};

export const emailUrl = () => `mailto:${getConfig().email.trim()}`;

export const whatsLabel = () => `WhatsApp ${getConfig().telefone.trim()}`;

export const whatsUrl = () => {
  const digitos = getConfig().telefone.replace(/\D/g, "");
  const numero = digitos.startsWith("55") ? digitos : `55${digitos}`;
  return `https://wa.me/${numero}`;
};

/** Contatos do rodapé de PDFs/Word, na ordem: site, e-mail, WhatsApp. */
export function contatosDocumento(): Array<{ texto: string; url: string }> {
  const c = getConfig();
  return [
    { texto: c.site, url: siteUrl() },
    { texto: c.email, url: emailUrl() },
    { texto: whatsLabel(), url: whatsUrl() },
  ];
}

function hexParaRgb(hex: string): [number, number, number] {
  const limpo = hex.replace("#", "").trim();
  const v =
    limpo.length === 3
      ? limpo
          .split("")
          .map((c) => c + c)
          .join("")
      : limpo.padEnd(6, "0").slice(0, 6);
  const n = Number.parseInt(v, 16);
  if (!Number.isFinite(n)) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Cores da identidade visual para PDF (rgb) e Word (hex sem #). */
export function coresDocumento() {
  const c = getConfig();
  return {
    navyHex: c.corNavy.replace("#", "").toUpperCase(),
    goldHex: c.corGold.replace("#", "").toUpperCase(),
    navyRgb: hexParaRgb(c.corNavy),
    goldRgb: hexParaRgb(c.corGold),
  };
}

/** Formata data ISO conforme o formato escolhido nas configurações. */
export function formatarDataDoc(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  if (!y || !m || !d) return iso;
  return getConfig().formatoData === "MM/DD/AAAA" ? `${m}/${d}/${y}` : `${d}/${m}/${y}`;
}

/* ---------- compatibilidade com a configuração antiga ---------- */

export interface ConfigInspetor {
  nome: string;
  crea: string;
}

export const CONFIG_PADRAO: ConfigInspetor = {
  nome: CONFIG_ERP_PADRAO.nome,
  crea: CONFIG_ERP_PADRAO.crea,
};

export function carregarConfig(): ConfigInspetor {
  const c = getConfig();
  return { nome: c.nome, crea: c.crea };
}

export function salvarConfig(cfg: ConfigInspetor) {
  saveConfig({ nome: cfg.nome, crea: cfg.crea });
}

export function exportarJSON() {
  const dados = JSON.stringify({ vistorias: listarVistorias(), config: getConfig() }, null, 2);
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
      | { vistorias?: Vistoria[]; config?: Partial<ConfigERP> }
      | Vistoria[];
    const vistorias = Array.isArray(parsed) ? parsed : parsed.vistorias;
    if (!Array.isArray(vistorias))
      return { ok: false, erro: "Arquivo inválido: vistorias não encontradas." };
    salvarTodas(vistorias);
    if (!Array.isArray(parsed) && parsed.config) saveConfig(parsed.config);
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível importar o arquivo JSON." };
  }
}
