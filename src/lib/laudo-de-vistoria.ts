import { imovelVazio, listarVistorias as listarLaudos, salvarVistoriaSegura, uid } from "./storage";
import type { Foto, ItemAdicional, Vistoria as Laudo } from "./types";
import {
  ITEM_STATUS_LABEL,
  rotuloItem,
  type FotoVistoria,
  type ItemVistoria,
  type VistoriaCampo,
} from "./vistorias";

/** Retorna o laudo (módulo de Inspeção Predial) gerado a partir de uma vistoria de campo. */
export function laudoDaVistoria(vistoriaId: string): Laudo | undefined {
  return listarLaudos().find((l) => l.origem?.vistoriaId === vistoriaId);
}

/** Mapa vistoriaId -> laudoId para exibir a coluna "Laudo" na lista de vistorias. */
export function laudosPorVistoria(): Record<string, string> {
  const mapa: Record<string, string> = {};
  listarLaudos().forEach((l) => {
    if (l.origem?.vistoriaId) mapa[l.origem.vistoriaId] = l.id;
  });
  return mapa;
}

function fotoDe(f: FotoVistoria, legenda: string): Foto {
  return { id: f.id, dataUrl: f.url, legenda: f.legenda ?? legenda };
}

/**
 * Cria (ou reaproveita) um laudo em rascunho a partir de uma vistoria de campo
 * concluída, transferindo checklist e fotos.
 */
export async function gerarLaudoDaVistoria(
  vistoria: VistoriaCampo,
  itens: ItemVistoria[],
  fotos: FotoVistoria[],
): Promise<Laudo> {
  const existente = laudoDaVistoria(vistoria.id);
  const hoje = new Date().toISOString().slice(0, 10);
  const agora = new Date().toISOString();

  const porItem = new Map<string, ItemVistoria>(itens.map((i) => [i.id, i]));
  const fotosEdificacao: Foto[] = fotos.map((f) => {
    const item = f.item_vistoria_id ? porItem.get(f.item_vistoria_id) : undefined;
    return fotoDe(f, item ? rotuloItem(item) : `Registro fotográfico — ${vistoria.numero}`);
  });

  const categorias = new Map<string, ItemVistoria[]>();
  itens.forEach((i) => {
    const lista = categorias.get(i.categoria) ?? [];
    lista.push(i);
    categorias.set(i.categoria, lista);
  });

  const checklist: ItemAdicional[] = Array.from(categorias.entries()).map(([categoria, lista]) => ({
    id: uid(),
    titulo: `Checklist de Vistoria — ${categoria}`,
    conteudo: lista
      .map((i) => {
        const local = i.comodo?.trim() ? `${i.comodo.trim()} — ` : "";
        const texto = i.observacao_aprimorada?.trim() || i.observacoes?.trim() || "";
        const obs = texto ? ` Observação: ${texto}` : "";
        return `• ${local}${i.item}: ${ITEM_STATUS_LABEL[i.status]}.${obs}`;
      })
      .join("\n"),
  }));

  const origemTexto = `Gerado a partir da vistoria ${vistoria.numero}`;

  const laudo: Laudo = {
    id: existente?.id ?? uid(),
    status: "EM ANDAMENTO",
    criadoEm: existente?.criadoEm ?? agora,
    atualizadoEm: agora,
    origem: { vistoriaId: vistoria.id, numero: vistoria.numero },
    imovel: {
      ...imovelVazio(),
      ...(existente?.imovel ?? {}),
      tipoEdificacao: existente?.imovel.tipoEdificacao || "",
      logradouro: vistoria.imovel_endereco ?? "",
      proprietario: vistoria.cliente_nome,
      dataVistoria: existente?.imovel.dataVistoria || hoje,
      inspetor: vistoria.responsavel_tecnico_nome || "Vinicius Cesar",
      crea: vistoria.responsavel_tecnico_crea || "RJ 2024100977",
      observacoes: [
        origemTexto,
        `Tipo de serviço: ${vistoria.tipo_servico}`,
        vistoria.cliente_telefone ? `Telefone do cliente: ${vistoria.cliente_telefone}` : "",
        vistoria.observacoes?.trim() ?? "",
      ]
        .filter(Boolean)
        .join("\n"),
      fotosEdificacao,
      fotosSatelite: existente?.imovel.fotosSatelite ?? [],
    },
    anamnese: existente?.anamnese ?? { respostas: {}, observacoes: "" },
    patologias: existente?.patologias ?? [],
    itensAdicionais: checklist,
    ...(existente?.laudoEditavel ? { laudoEditavel: existente.laudoEditavel } : {}),
  };

  const resultado = await salvarVistoriaSegura(laudo);
  if (!resultado.ok) throw new Error(resultado.erro);
  return resultado.vistoria;
}
