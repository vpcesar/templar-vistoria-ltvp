import { getConfig } from "@/lib/config";
import { supabase } from "@/lib/supabase";
import { checklistDoServico } from "@/lib/vistorias-checklist";

export const VISTORIA_STATUS = ["agendada", "em_andamento", "concluida", "cancelada"] as const;
export type VistoriaStatus = (typeof VISTORIA_STATUS)[number];

export const VISTORIA_STATUS_LABEL: Record<VistoriaStatus, string> = {
  agendada: "Agendada",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export const VISTORIA_STATUS_CLASSE: Record<VistoriaStatus, string> = {
  agendada: "bg-blue-100 text-blue-800 border-blue-200",
  em_andamento: "bg-amber-100 text-amber-800 border-amber-200",
  concluida: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelada: "bg-red-100 text-red-800 border-red-200",
};

export const ITEM_STATUS = ["pendente", "conforme", "nao_conforme", "nao_aplicavel"] as const;
export type ItemStatus = (typeof ITEM_STATUS)[number];

export const ITEM_STATUS_LABEL: Record<ItemStatus, string> = {
  pendente: "Pendente",
  conforme: "Conforme",
  nao_conforme: "Não conforme",
  nao_aplicavel: "Não aplicável",
};

/** Rótulos usados no fluxo de ambientes (imóvel novo). */
export const ITEM_STATUS_LABEL_AMBIENTE: Record<ItemStatus, string> = {
  pendente: "Pendente",
  conforme: "Aprovado",
  nao_conforme: "Reprovado",
  nao_aplicavel: "Não se aplica",
};

export const ITEM_STATUS_CLASSE: Record<ItemStatus, string> = {
  pendente: "bg-slate-100 text-slate-700 border-slate-200",
  conforme: "bg-emerald-100 text-emerald-800 border-emerald-200",
  nao_conforme: "bg-red-100 text-red-800 border-red-200",
  nao_aplicavel: "bg-slate-200 text-slate-600 border-slate-300",
};

export interface VistoriaCampo {
  id: string;
  numero: string;
  proposta_id: string | null;
  lead_id: string | null;
  data_vistoria: string;
  hora_vistoria: string | null;
  cliente_nome: string;
  cliente_telefone: string | null;
  imovel_endereco: string | null;
  unidade: string | null;
  tipo_imovel: string | null;
  responsavel_construtora: string | null;
  tipo_servico: string;
  fluxo: string | null;
  responsavel_tecnico_nome: string;
  responsavel_tecnico_crea: string;
  observacoes: string | null;
  concluida: boolean | null;
  status: VistoriaStatus;
  created_at: string;
  updated_at: string;
}

export type VistoriaCampoInput = Omit<VistoriaCampo, "id" | "created_at" | "updated_at">;

/** Cômodos/ambientes pré-cadastrados. */
export const COMODOS_PADRAO = [
  "Sala",
  "Sala de Estar",
  "Sala de Jantar",
  "Cozinha",
  "Quarto",
  "Suíte",
  "Banheiro",
  "Lavabo",
  "WC",
  "Sanitário",
  "Varanda",
  "Sacada",
  "Corredor",
  "Área de Serviço",
  "Lavanderia",
  "Garagem",
  "Escritório",
  "Depósito",
  "Terraço",
  "Hall de Entrada",
  "Circulação",
  "Área Externa",
  "Fachada",
  "Cobertura",
] as const;

export const TIPOS_IMOVEL = [
  "Apartamento",
  "Casa",
  "Sala Comercial",
  "Galpão",
  "Outro",
] as const;

export interface ItemVistoria {
  id: string;
  vistoria_id: string;
  ambiente_id: string | null;
  categoria: string;
  item: string;
  titulo: string | null;
  orientacoes: string | null;
  teste: string | null;
  atencao: string | null;
  personalizado: boolean | null;
  existe_sistema: boolean | null;
  comodo: string | null;
  status: ItemStatus;
  observacoes: string | null;
  observacao_aprimorada: string | null;
  ordem: number;
  created_at: string;
}

/** Rótulo do item para relatórios: "Sala — Paredes — Fissuras/trincas". */
export function rotuloItem(item: Pick<ItemVistoria, "categoria" | "item" | "comodo">): string {
  return [item.comodo?.trim(), item.categoria, item.item].filter(Boolean).join(" — ");
}

export interface FotoVistoria {
  id: string;
  vistoria_id: string;
  item_vistoria_id: string | null;
  url: string;
  legenda: string | null;
  ordem: number | null;
  created_at: string;
}

export const BUCKET_FOTOS = "vistorias-fotos";

/** Extrai o caminho do arquivo dentro do bucket a partir da URL pública. */
export function caminhoDaFoto(url: string): string | null {
  const marcador = `/${BUCKET_FOTOS}/`;
  const pos = url.indexOf(marcador);
  if (pos === -1) return null;
  try {
    return decodeURIComponent(url.slice(pos + marcador.length));
  } catch {
    return url.slice(pos + marcador.length);
  }
}

/* ---------- vistorias ---------- */

export async function listarVistorias(): Promise<VistoriaCampo[]> {
  const { data, error } = await supabase
    .from("vistorias")
    .select("*")
    .order("data_vistoria", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as VistoriaCampo[];
}

export async function obterVistoriaCampo(id: string): Promise<VistoriaCampo | null> {
  const { data, error } = await supabase.from("vistorias").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as VistoriaCampo | null) ?? null;
}

/** Gera o próximo número sequencial no formato VIST-0001. */
export async function proximoNumeroVistoria(): Promise<string> {
  const { data, error } = await supabase
    .from("vistorias")
    .select("numero")
    .order("numero", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  const ultimo = (data ?? [])[0]?.numero as string | undefined;
  const seq = ultimo ? Number(ultimo.replace(/\D/g, "")) : 0;
  return `${getConfig().prefixoVistoria}-${String((Number.isFinite(seq) ? seq : 0) + 1).padStart(4, "0")}`;
}

/** Cria a vistoria. O checklist por categoria só é gerado no fluxo de campo. */
export async function criarVistoria(
  input: VistoriaCampoInput,
  opcoes: { gerarChecklistPadrao?: boolean } = {},
): Promise<VistoriaCampo> {
  const { data, error } = await supabase.from("vistorias").insert(input).select("*").single();
  if (error) throw new Error(error.message);
  const vistoria = data as VistoriaCampo;
  if (opcoes.gerarChecklistPadrao !== false) {
    await gerarChecklist(vistoria.id, vistoria.tipo_servico);
  }
  return vistoria;
}

export async function atualizarVistoria(
  id: string,
  input: Partial<VistoriaCampoInput>,
): Promise<VistoriaCampo> {
  const { data, error } = await supabase
    .from("vistorias")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as VistoriaCampo;
}

export async function excluirVistoria(id: string): Promise<void> {
  const { error } = await supabase.from("vistorias").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------- checklist (fluxo de campo / legado) ---------- */

export async function gerarChecklist(vistoriaId: string, tipoServico: string): Promise<void> {
  const modelo = checklistDoServico(tipoServico);
  if (modelo.length === 0) return;
  const { error } = await supabase.from("itens_vistoria").insert(
    modelo.map((m) => ({
      vistoria_id: vistoriaId,
      categoria: m.categoria,
      item: m.item,
      titulo: m.item,
      ordem: m.ordem,
      status: "pendente" as ItemStatus,
    })),
  );
  if (error) throw new Error(error.message);
}

export async function listarItens(vistoriaId: string): Promise<ItemVistoria[]> {
  const { data, error } = await supabase
    .from("itens_vistoria")
    .select("*")
    .eq("vistoria_id", vistoriaId)
    .order("ordem", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ItemVistoria[];
}

export async function atualizarItem(
  id: string,
  input: Partial<
    Pick<
      ItemVistoria,
      | "status"
      | "observacoes"
      | "observacao_aprimorada"
      | "comodo"
      | "existe_sistema"
      | "titulo"
      | "ordem"
    >
  >,
): Promise<ItemVistoria> {
  const { data, error } = await supabase
    .from("itens_vistoria")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as ItemVistoria;
}

export async function adicionarItem(
  vistoriaId: string,
  categoria: string,
  item: string,
  ordem: number,
): Promise<ItemVistoria> {
  const { data, error } = await supabase
    .from("itens_vistoria")
    .insert({
      vistoria_id: vistoriaId,
      categoria,
      item,
      titulo: item,
      ordem,
      status: "pendente",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as ItemVistoria;
}

export async function excluirItem(id: string): Promise<void> {
  const { error } = await supabase.from("itens_vistoria").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------- fotos ---------- */

export async function listarFotos(vistoriaId: string): Promise<FotoVistoria[]> {
  const { data, error } = await supabase
    .from("fotos_vistoria")
    .select("*")
    .eq("vistoria_id", vistoriaId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as FotoVistoria[];
}

/** Comprime a imagem no navegador antes do upload (máx. 1600px, JPEG 0.8). */
async function comprimir(file: File): Promise<Blob> {
  if (typeof document === "undefined") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const escala = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.8));
    return blob ?? file;
  } catch {
    return file;
  }
}

export async function enviarFoto(
  vistoriaId: string,
  file: File,
  itemId?: string | null,
  legenda?: string,
): Promise<FotoVistoria> {
  const blob = await comprimir(file);
  const caminho = itemId
    ? `${vistoriaId}/${itemId}/${Date.now()}.jpg`
    : `${vistoriaId}/${Date.now()}.jpg`;
  const up = await supabase.storage
    .from(BUCKET_FOTOS)
    .upload(caminho, blob, { contentType: "image/jpeg", upsert: false });
  if (up.error) throw new Error(up.error.message);
  const { data: pub } = supabase.storage.from(BUCKET_FOTOS).getPublicUrl(caminho);
  const { data, error } = await supabase
    .from("fotos_vistoria")
    .insert({
      vistoria_id: vistoriaId,
      item_vistoria_id: itemId ?? null,
      url: pub.publicUrl,
      legenda: legenda ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as FotoVistoria;
}

export async function excluirFoto(foto: FotoVistoria): Promise<void> {
  const caminho = caminhoDaFoto(foto.url);
  if (caminho) await supabase.storage.from(BUCKET_FOTOS).remove([caminho]);
  const { error } = await supabase.from("fotos_vistoria").delete().eq("id", foto.id);
  if (error) throw new Error(error.message);
}

export async function atualizarLegenda(id: string, legenda: string): Promise<void> {
  const { error } = await supabase.from("fotos_vistoria").update({ legenda }).eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------- métricas ---------- */

export function progresso(itens: ItemVistoria[]) {
  const total = itens.length;
  const avaliados = itens.filter((i) => i.status !== "pendente").length;
  const naoConformes = itens.filter((i) => i.status === "nao_conforme").length;
  return {
    total,
    avaliados,
    naoConformes,
    conformes: itens.filter((i) => i.status === "conforme").length,
    naoAplicaveis: itens.filter((i) => i.status === "nao_aplicavel").length,
    percentual: total === 0 ? 0 : Math.round((avaliados / total) * 100),
  };
}
