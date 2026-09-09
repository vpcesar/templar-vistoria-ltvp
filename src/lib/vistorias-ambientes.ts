import { supabase } from "@/lib/supabase";
import {
  catalogoLocal,
  tipoAmbienteDe,
  type ItemCatalogo,
} from "@/lib/vistorias-catalogo";
import type { ItemStatus, ItemVistoria } from "@/lib/vistorias";

export interface AmbienteVistoria {
  id: string;
  vistoria_id: string;
  nome: string;
  ordem: number;
  created_at: string;
}

/* ---------- catálogo ---------- */

const cacheCatalogo = new Map<string, ItemCatalogo[]>();

/** Busca o catálogo no Supabase; cai para o catálogo local em caso de falha. */
export async function carregarCatalogo(tipoAmbiente: string): Promise<ItemCatalogo[]> {
  const emCache = cacheCatalogo.get(tipoAmbiente);
  if (emCache) return emCache;
  try {
    const { data, error } = await supabase
      .from("catalogo_checklist")
      .select("*")
      .eq("tipo_ambiente", tipoAmbiente)
      .order("ordem", { ascending: true });
    if (error) throw new Error(error.message);
    const lista = (data ?? []) as ItemCatalogo[];
    const resultado = lista.length > 0 ? lista : catalogoLocal(tipoAmbiente);
    cacheCatalogo.set(tipoAmbiente, resultado);
    return resultado;
  } catch {
    const resultado = catalogoLocal(tipoAmbiente);
    cacheCatalogo.set(tipoAmbiente, resultado);
    return resultado;
  }
}

/* ---------- ambientes ---------- */

export async function listarAmbientes(vistoriaId: string): Promise<AmbienteVistoria[]> {
  const { data, error } = await supabase
    .from("ambientes_vistoria")
    .select("*")
    .eq("vistoria_id", vistoriaId)
    .order("ordem", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as AmbienteVistoria[];
}

/** Cria os ambientes na ordem informada e gera os itens do catálogo de cada um. */
export async function criarAmbientesComItens(
  vistoriaId: string,
  nomes: string[],
): Promise<AmbienteVistoria[]> {
  if (nomes.length === 0) return [];
  const existentes = await listarAmbientes(vistoriaId);
  const base = existentes.length;
  const { data, error } = await supabase
    .from("ambientes_vistoria")
    .insert(nomes.map((nome, idx) => ({ vistoria_id: vistoriaId, nome, ordem: base + idx + 1 })))
    .select("*");
  if (error) throw new Error(error.message);
  const ambientes = (data ?? []) as AmbienteVistoria[];
  for (const ambiente of ambientes) {
    await gerarItensDoAmbiente(vistoriaId, ambiente);
  }
  return ambientes;
}

export async function gerarItensDoAmbiente(
  vistoriaId: string,
  ambiente: AmbienteVistoria,
): Promise<void> {
  const catalogo = await carregarCatalogo(tipoAmbienteDe(ambiente.nome));
  if (catalogo.length === 0) return;
  const { error } = await supabase.from("itens_vistoria").insert(
    catalogo.map((c, idx) => ({
      vistoria_id: vistoriaId,
      ambiente_id: ambiente.id,
      categoria: ambiente.nome,
      comodo: ambiente.nome,
      item: c.titulo,
      titulo: c.titulo,
      orientacoes: c.orientacoes ?? null,
      teste: c.teste ?? null,
      atencao: c.atencao ?? null,
      personalizado: false,
      status: "pendente" as ItemStatus,
      ordem: ambiente.ordem * 1000 + (c.ordem ?? idx + 1),
    })),
  );
  if (error) throw new Error(error.message);
}

export async function excluirAmbiente(id: string): Promise<void> {
  const { error } = await supabase.from("ambientes_vistoria").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function reordenarAmbientes(ambientes: AmbienteVistoria[]): Promise<void> {
  for (let i = 0; i < ambientes.length; i++) {
    const a = ambientes[i];
    if (!a) continue;
    const { error } = await supabase
      .from("ambientes_vistoria")
      .update({ ordem: i + 1 })
      .eq("id", a.id);
    if (error) throw new Error(error.message);
  }
}

/* ---------- itens personalizados ---------- */

export async function adicionarItemPersonalizado(
  vistoriaId: string,
  ambiente: AmbienteVistoria,
  titulo: string,
  ordem: number,
): Promise<ItemVistoria> {
  const { data, error } = await supabase
    .from("itens_vistoria")
    .insert({
      vistoria_id: vistoriaId,
      ambiente_id: ambiente.id,
      categoria: ambiente.nome,
      comodo: ambiente.nome,
      item: titulo,
      titulo,
      personalizado: true,
      status: "pendente",
      ordem,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as ItemVistoria;
}

export async function reordenarItens(itens: ItemVistoria[]): Promise<void> {
  for (let i = 0; i < itens.length; i++) {
    const it = itens[i];
    if (!it) continue;
    const { error } = await supabase
      .from("itens_vistoria")
      .update({ ordem: it.ordem })
      .eq("id", it.id);
    if (error) throw new Error(error.message);
  }
}

/** Título exibido do item (o fluxo de ambientes usa `titulo`). */
export function tituloItem(item: ItemVistoria): string {
  return item.titulo?.trim() || item.item;
}
