import { supabase } from "@/lib/supabase";

export const PROPOSTA_STATUS = ["rascunho", "enviada", "aceita", "recusada", "expirada"] as const;
export type PropostaStatus = (typeof PROPOSTA_STATUS)[number];

export const PROPOSTA_STATUS_LABEL: Record<PropostaStatus, string> = {
  rascunho: "Rascunho",
  enviada: "Enviada",
  aceita: "Aceita",
  recusada: "Recusada",
  expirada: "Expirada",
};

export const PROPOSTA_STATUS_CLASSE: Record<PropostaStatus, string> = {
  rascunho: "bg-slate-100 text-slate-700 border-slate-200",
  enviada: "bg-blue-100 text-blue-800 border-blue-200",
  aceita: "bg-emerald-100 text-emerald-800 border-emerald-200",
  recusada: "bg-red-100 text-red-800 border-red-200",
  expirada: "bg-amber-100 text-amber-800 border-amber-200",
};

export interface Proposta {
  id: string;
  numero: string;
  lead_id: string | null;
  data_emissao: string;
  responsavel_tecnico_nome: string;
  responsavel_tecnico_crea: string;
  cliente_nome: string;
  cliente_cpf: string | null;
  cliente_telefone: string | null;
  cliente_endereco: string | null;
  imovel_endereco: string | null;
  imovel_observacoes: string | null;
  tipo_servico: string;
  escopo_objetivo: string | null;
  escopo_itens_constantes: string | null;
  escopo_metodologia: string | null;
  escopo_entregaveis: string | null;
  valor_total: number;
  condicoes_pagamento: string | null;
  validade_dias: number;
  prazo_execucao: string | null;
  nao_incluido: string | null;
  status: PropostaStatus;
  created_at: string;
  updated_at: string;
}

export type PropostaInput = Omit<Proposta, "id" | "created_at" | "updated_at">;

export const RESPONSAVEL_PADRAO = {
  nome: "Vinicius Cesar",
  crea: "RJ 2024100977",
};

/* ---------- formatação ---------- */

export function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatarDataBR(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Converte "1.234,56" ou "1234.56" em número. */
export function parseValor(texto: string) {
  const limpo = texto.replace(/[^\d,.-]/g, "");
  const normalizado =
    limpo.includes(",") && limpo.lastIndexOf(",") > limpo.lastIndexOf(".")
      ? limpo.replace(/\./g, "").replace(",", ".")
      : limpo.replace(/,/g, "");
  const n = Number(normalizado);
  return Number.isFinite(n) ? n : 0;
}

/* ---------- acesso a dados ---------- */

export async function listarPropostas(): Promise<Proposta[]> {
  const { data, error } = await supabase
    .from("propostas")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Proposta[];
}

export async function obterProposta(id: string): Promise<Proposta | null> {
  const { data, error } = await supabase.from("propostas").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Proposta | null) ?? null;
}

/** Gera o próximo número sequencial no formato PROP-0001. */
export async function proximoNumero(): Promise<string> {
  const { data, error } = await supabase
    .from("propostas")
    .select("numero")
    .order("numero", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  const ultimo = (data ?? [])[0]?.numero as string | undefined;
  const seq = ultimo ? Number(ultimo.replace(/\D/g, "")) : 0;
  return `PROP-${String((Number.isFinite(seq) ? seq : 0) + 1).padStart(4, "0")}`;
}

export async function criarProposta(input: PropostaInput): Promise<Proposta> {
  const { data, error } = await supabase.from("propostas").insert(input).select("*").single();
  if (error) throw new Error(error.message);
  return data as Proposta;
}

export async function atualizarProposta(
  id: string,
  input: Partial<PropostaInput>,
): Promise<Proposta> {
  const { data, error } = await supabase
    .from("propostas")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as Proposta;
}

export async function excluirProposta(id: string): Promise<void> {
  const { error } = await supabase.from("propostas").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
