import { AlignmentType, Document, Footer, ImageRun, Packer, Paragraph, TextRun } from "docx";
import { EMPRESA } from "../laudo";
import { formatarDataBR, formatarMoeda, type Proposta } from "../propostas";
import { carregarLogo, dataUrlToBytes } from "./logo";

const BRAND = "8B1A1A";
const SLATE = "2D3748";

const p = (
  text: string,
  opts: {
    bold?: boolean;
    size?: number;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    color?: string;
  } = {},
) =>
  new Paragraph({
    alignment: opts.align ?? AlignmentType.JUSTIFIED,
    spacing: { after: 120 },
    children: [
      new TextRun({
        text,
        bold: opts.bold ?? false,
        size: opts.size ?? 21,
        font: "Arial",
        color: opts.color ?? SLATE,
      }),
    ],
  });

const titulo = (text: string) =>
  new Paragraph({
    spacing: { before: 260, after: 140 },
    border: { bottom: { style: "single", size: 6, color: BRAND, space: 1 } },
    children: [
      new TextRun({ text: text.toUpperCase(), bold: true, size: 24, font: "Arial", color: BRAND }),
    ],
  });

const campo = (rotulo: string, valor: string) =>
  new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: `${rotulo}: `, bold: true, size: 21, font: "Arial", color: SLATE }),
      new TextRun({ text: valor || "—", size: 21, font: "Arial", color: SLATE }),
    ],
  });

const linhas = (conteudo: string) =>
  (conteudo || "—")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) =>
      p(l.startsWith("•") || l.startsWith("-") ? l : `• ${l}`, { align: AlignmentType.LEFT }),
    );

export async function gerarPropostaDocx(prop: Proposta) {
  const logo = await carregarLogo();
  const filhos: Paragraph[] = [];

  if (logo) {
    const ratio = logo.width / logo.height;
    const height = 62;
    filhos.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new ImageRun({
            type: "png",
            data: dataUrlToBytes(logo.dataUrl),
            transformation: { width: Math.min(ratio * height, 200), height },
            altText: {
              title: "TEMPLAR ENGENHARIA",
              description: "Logomarca TEMPLAR ENGENHARIA",
              name: "logo",
            },
          }),
        ],
      }),
    );
  }

  filhos.push(
    p(EMPRESA.nome, { bold: true, size: 30, align: AlignmentType.CENTER, color: BRAND }),
    p(EMPRESA.slogan, { size: 19, align: AlignmentType.CENTER }),
    p(`PROPOSTA COMERCIAL — Nº ${prop.numero}`, {
      bold: true,
      size: 25,
      align: AlignmentType.CENTER,
    }),
    p(`Data: ${formatarDataBR(prop.data_emissao)}`, { align: AlignmentType.CENTER }),

    titulo("Responsável Técnico"),
    campo("Nome", prop.responsavel_tecnico_nome),
    campo("CREA", prop.responsavel_tecnico_crea),

    titulo("Dados do Cliente"),
    campo("Nome", prop.cliente_nome),
    campo("CPF/CNPJ", prop.cliente_cpf ?? ""),
    campo("Telefone/WhatsApp", prop.cliente_telefone ?? ""),
    campo("Endereço", prop.cliente_endereco ?? ""),

    titulo("Dados do Imóvel / Objeto"),
    campo("Endereço", prop.imovel_endereco ?? ""),
    campo("Observações", prop.imovel_observacoes ?? ""),

    titulo("Serviço Contratado"),
    p(prop.tipo_servico, { bold: true }),

    titulo("Escopo dos Serviços"),
    p("Objetivo", { bold: true, color: BRAND }),
    p(prop.escopo_objetivo ?? "—"),
    p("Itens constantes", { bold: true, color: BRAND }),
    ...linhas(prop.escopo_itens_constantes ?? ""),
    p("Metodologia", { bold: true, color: BRAND }),
    ...linhas(prop.escopo_metodologia ?? ""),
    p("Entregáveis", { bold: true, color: BRAND }),
    ...linhas(prop.escopo_entregaveis ?? ""),

    titulo("Valores e Condições"),
    campo("Valor total", formatarMoeda(prop.valor_total)),
    campo("Condições de pagamento", prop.condicoes_pagamento ?? ""),
    campo("Validade da proposta", `${prop.validade_dias} dias`),
    campo("Prazo de execução", prop.prazo_execucao ?? ""),

    titulo("Não Incluído"),
    ...(prop.nao_incluido ?? "—")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => p(l, { align: AlignmentType.LEFT })),
  );

  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 21 } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              p(`${EMPRESA.site} | ${EMPRESA.email} | ${EMPRESA.whats}`, {
                size: 16,
                align: AlignmentType.CENTER,
                color: BRAND,
              }),
              p(`Proposta ${prop.numero}`, { size: 16, align: AlignmentType.CENTER }),
            ],
          }),
        },
        children: filhos,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Proposta-${prop.numero}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
