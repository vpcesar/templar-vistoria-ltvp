import { supabase } from "@/lib/supabase";

export const LEAD_STATUS = [
  "novo",
  "em_contato",
  "proposta_enviada",
  "ganho",
  "perdido",
] as const;
export type LeadStatus = (typeof LEAD_STATUS)[number];

export const LEAD_ORIGENS = ["indicacao", "site", "redes_social", "google", "outro"] as const;
export type LeadOrigem = (typeof LEAD_ORIGENS)[number];

export const INTERACAO_TIPOS = ["whatsapp", "email", "telefone", "visita", "reuniao"] as const;
export type InteracaoTipo = (typeof INTERACAO_TIPOS)[number];

export const STATUS_LABEL: Record<LeadStatus, string> = {
  novo: "Novo",
  em_contato: "Em contato",
  proposta_enviada: "Proposta enviada",
  ganho: "Ganho",
  perdido: "Perdido",
};

export const STATUS_CLASSE: Record<LeadStatus, string> = {
  novo: "bg-blue-100 text-blue-800 border-blue-200",
  em_contato: "bg-amber-100 text-amber-800 border-amber-200",
  proposta_enviada: "bg-purple-100 text-purple-800 border-purple-200",
  ganho: "bg-emerald-100 text-emerald-800 border-emerald-200",
  perdido: "bg-red-100 text-red-800 border-red-200",
};

export const ORIGEM_LABEL: Record<LeadOrigem, string> = {
  indicacao: "Indicação",
  site: "Site",
  redes_social: "Redes sociais",
  google: "Google",
  outro: "Outro",
};

export const TIPO_INTERACAO_LABEL: Record<InteracaoTipo, string> = {
  whatsapp: "WhatsApp",
  email: "E-mail",
  telefone: "Telefone",
  visita: "Visita",
  reuniao: "Reunião",
};

export interface Lead {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  tipo_pessoa: "PF" | "PJ";
  documento: string | null;
  origem: LeadOrigem;
  status: LeadStatus;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InteracaoLead {
  id: string;
  lead_id: string;
  tipo: InteracaoTipo;
  descricao: string;
  data_interacao: string;
  created_at: string;
}

export type LeadInput = Omit<Lead, "id" | "created_at" | "updated_at">;

/* ---------- máscaras e formatação ---------- */

export function soDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

export function mascaraTelefone(valor: string) {
  const d = soDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function mascaraCPF(valor: string) {
  const d = soDigitos(valor).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

export function mascaraCNPJ(valor: string) {
  const d = soDigitos(valor).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export function mascaraDocumento(valor: string, tipo: "PF" | "PJ") {
  return tipo === "PF" ? mascaraCPF(valor) : mascaraCNPJ(valor);
}

export function emailValido(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function formatarDataHora(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function formatarDataCurta(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

/* ---------- acesso a dados ---------- */

export async function listarLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Lead[];
}

export async function obterLead(id: string): Promise<Lead | null> {
  const { data, error } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Lead | null) ?? null;
}

export async function criarLead(input: LeadInput): Promise<Lead> {
  const { data, error } = await supabase.from("leads").insert(input).select("*").single();
  if (error) throw new Error(error.message);
  return data as Lead;
}

export async function atualizarLead(id: string, input: Partial<LeadInput>): Promise<Lead> {
  const { data, error } = await supabase
    .from("leads")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as Lead;
}

export async function excluirLead(id: string): Promise<void> {
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listarInteracoes(leadId: string): Promise<InteracaoLead[]> {
  const { data, error } = await supabase
    .from("interacoes_lead")
    .select("*")
    .eq("lead_id", leadId)
    .order("data_interacao", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as InteracaoLead[];
}

export async function criarInteracao(input: {
  lead_id: string;
  tipo: InteracaoTipo;
  descricao: string;
  data_interacao: string;
}): Promise<InteracaoLead> {
  const { data, error } = await supabase
    .from("interacoes_lead")
    .insert(input)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as InteracaoLead;
}
