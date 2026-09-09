import { formatarDataBR } from "@/lib/propostas";
import { contatosDocumento, getConfig } from "@/lib/config";
import { tituloItem } from "@/lib/vistorias-ambientes";
import type { AmbienteVistoria } from "@/lib/vistorias-ambientes";
import {
  ITEM_STATUS_LABEL_AMBIENTE,
  progresso,
  type FotoVistoria,
  type ItemVistoria,
  type VistoriaCampo,
} from "@/lib/vistorias";

export interface DadosRelatorioVistoria {
  vistoria: VistoriaCampo;
  ambientes: AmbienteVistoria[];
  itens: ItemVistoria[];
  fotos: FotoVistoria[];
}

/** Contatos e tagline vêm das Configurações. */
export const contatosTemplar = () => contatosDocumento();

export const tagline = () => getConfig().tagline;

/** Nome do arquivo: VISTORIA_[Cliente]_[DD-MM-AAAA]. */
export function nomeArquivoVistoria(v: VistoriaCampo, extensao: "pdf" | "docx"): string {
  const cliente = (v.cliente_nome || "Cliente")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const [ano, mes, dia] = (v.data_vistoria || "").split("-");
  const data = ano && mes && dia ? `${dia}-${mes}-${ano}` : "sem-data";
  return `VISTORIA_${cliente}_${data}.${extensao}`;
}

export interface AmbienteRelatorio {
  ambiente: AmbienteVistoria;
  itens: Array<{ item: ItemVistoria; titulo: string; observacao: string; fotos: FotoVistoria[] }>;
}

export function montarRelatorio(dados: DadosRelatorioVistoria) {
  const { vistoria, ambientes, itens, fotos } = dados;
  const porAmbiente: AmbienteRelatorio[] = ambientes.map((ambiente) => ({
    ambiente,
    itens: itens
      .filter((i) => i.ambiente_id === ambiente.id)
      .sort((a, b) => a.ordem - b.ordem)
      .map((item) => ({
        item,
        titulo: tituloItem(item),
        observacao: (item.observacao_aprimorada || item.observacoes || "").trim(),
        fotos: fotos.filter((f) => f.item_vistoria_id === item.id),
      })),
  }));

  const semAmbiente = itens.filter((i) => !i.ambiente_id);

  return {
    vistoria,
    porAmbiente,
    semAmbiente,
    resumo: progresso(itens),
    cabecalho: [
      ["Cliente", vistoria.cliente_nome],
      ["Telefone", vistoria.cliente_telefone ?? "—"],
      ["Data da vistoria", formatarDataBR(vistoria.data_vistoria)],
      ["Hora", vistoria.hora_vistoria ?? "—"],
      ["Localização", vistoria.imovel_endereco ?? "—"],
      ["Unidade", vistoria.unidade ?? "—"],
      ["Tipo de imóvel", vistoria.tipo_imovel ?? "—"],
      ["Tipo de serviço", vistoria.tipo_servico],
      [
        "Responsável da vistoria",
        `${vistoria.responsavel_tecnico_nome} — CREA ${vistoria.responsavel_tecnico_crea}`,
      ],
      ["Responsável da construtora", vistoria.responsavel_construtora ?? "—"],
    ] as Array<[string, string]>,
  };
}

export function rotuloStatus(item: ItemVistoria): string {
  return ITEM_STATUS_LABEL_AMBIENTE[item.status];
}
