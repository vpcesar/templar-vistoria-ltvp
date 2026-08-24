import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Footer,
  Header,
  ImageRun,
  LevelFormat,
  PageNumber,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { EMPRESA } from "../laudo";
import { formatarDataBR, formatarMoeda, type Proposta } from "../propostas";
import { carregarLogoProposta, dataUrlToBytes } from "./logo";

const NAVY = "1A365D";
const BLUE = "2C5282";
const GOLD = "D4AF37";
const SLATE = "2D3748";
const FOOTER = "718096";
const WHITE = "FFFFFF";
const CONTENT_WIDTH = 9026;

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
        size: opts.size ?? 20,
        font: "Arial",
        color: opts.color ?? SLATE,
      }),
    ],
  });

const titulo = (text: string) =>
  new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [3200, CONTENT_WIDTH - 3200],
    margins: { top: 70, bottom: 70 },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 3200, type: WidthType.DXA },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            margins: { top: 70, bottom: 70, left: 0, right: 160 },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: text.toUpperCase(),
                    bold: true,
                    size: 22,
                    font: "Arial",
                    color: NAVY,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: CONTENT_WIDTH - 3200, type: WidthType.DXA },
            verticalAlign: "center",
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.SINGLE, size: 8, color: GOLD },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            margins: { top: 70, bottom: 70, left: 0, right: 0 },
            children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [] })],
          }),
        ],
      }),
    ],
  });

const campo = (rotulo: string, valor: string) =>
  new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: `${rotulo}: `, bold: true, size: 20, font: "Arial", color: SLATE }),
      new TextRun({ text: valor || "—", size: 20, font: "Arial", color: SLATE }),
    ],
  });

const linhas = (conteudo: string, reference = "proposal-bullets") =>
  (conteudo || "—")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map(
      (l) =>
        new Paragraph({
          numbering: { reference, level: 0 },
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 100, line: 276 },
          children: [
            new TextRun({
              text: l.replace(/^[•-]\s*/, ""),
              size: 20,
              font: "Arial",
              color: SLATE,
            }),
          ],
        }),
    );

export async function gerarPropostaDocx(prop: Proposta) {
  const logo = await carregarLogoProposta();
  const filhos: (Paragraph | Table)[] = [];

  const headerLogo = logo
    ? new ImageRun({
        type: logo.type,
        data: dataUrlToBytes(logo.dataUrl),
        transformation: { width: 170, height: 170 / (logo.width / logo.height) },
        altText: {
          title: "TEMPLAR ENGENHARIA",
          description: "Logotipo horizontal da TEMPLAR ENGENHARIA",
          name: "logo-templar",
        },
      })
    : new TextRun({ text: EMPRESA.nome, bold: true, size: 32, font: "Arial", color: NAVY });

  filhos.push(
    p("PROPOSTA COMERCIAL", {
      bold: true,
      size: 32,
      align: AlignmentType.CENTER,
      color: NAVY,
    }),
    p(`Nº ${prop.numero}`, { bold: true, size: 28, align: AlignmentType.CENTER, color: GOLD }),
    p(`Data de emissão: ${formatarDataBR(prop.data_emissao)}`, {
      align: AlignmentType.CENTER,
      color: FOOTER,
    }),

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
    p("Objetivo", { bold: true, color: BLUE }),
    p(prop.escopo_objetivo ?? "—"),
    p("Itens Constantes", { bold: true, color: BLUE }),
    ...linhas(prop.escopo_itens_constantes ?? ""),
    p("Metodologia", { bold: true, color: BLUE }),
    ...linhas(prop.escopo_metodologia ?? ""),
    p("Entregáveis", { bold: true, color: BLUE }),
    ...linhas(prop.escopo_entregaveis ?? ""),

    titulo("Valores e Condições"),
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: "Valor total: ", bold: true, size: 20, font: "Arial", color: SLATE }),
        new TextRun({
          text: formatarMoeda(Number(prop.valor_total)),
          bold: true,
          size: 20,
          font: "Arial",
          color: GOLD,
        }),
      ],
    }),
    campo("Condições de pagamento", prop.condicoes_pagamento ?? ""),
    campo("Validade da proposta", `${prop.validade_dias} dias`),
    campo("Prazo de execução", prop.prazo_execucao ?? ""),

    titulo("Não Incluído"),
    ...linhas(prop.nao_incluido ?? "—", "proposal-exclusions"),
  );

  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 20, color: SLATE } } } },
    numbering: {
      config: ["proposal-bullets", "proposal-exclusions"].map((reference) => ({
        reference,
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 420, hanging: 220 } } },
          },
        ],
      })),
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1700, right: 1440, bottom: 1300, left: 1440, header: 360, footer: 360 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Table({
                width: { size: CONTENT_WIDTH, type: WidthType.DXA },
                columnWidths: [3300, 5726],
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 3300, type: WidthType.DXA },
                        shading: { fill: WHITE, type: ShadingType.CLEAR },
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 20, color: NAVY },
                          bottom: { style: BorderStyle.SINGLE, size: 20, color: NAVY },
                          left: { style: BorderStyle.SINGLE, size: 20, color: NAVY },
                          right: { style: BorderStyle.SINGLE, size: 20, color: NAVY },
                        },
                        margins: { top: 100, bottom: 100, left: 160, right: 160 },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 0, after: 0 },
                            children: [headerLogo],
                          }),
                        ],
                      }),
                      new TableCell({
                        width: { size: 5726, type: WidthType.DXA },
                        shading: { fill: NAVY, type: ShadingType.CLEAR },
                        borders: {
                          top: { style: BorderStyle.NONE },
                          bottom: { style: BorderStyle.NONE },
                          left: { style: BorderStyle.NONE },
                          right: { style: BorderStyle.NONE },
                        },
                        margins: { top: 170, bottom: 120, left: 300, right: 160 },
                        children: [
                          new Paragraph({
                            spacing: { before: 0, after: 50 },
                            children: [
                              new TextRun({ text: EMPRESA.nome, bold: true, size: 24, font: "Arial", color: WHITE }),
                            ],
                          }),
                          new Paragraph({
                            spacing: { before: 0, after: 0 },
                            children: [
                              new TextRun({ text: EMPRESA.slogan, size: 16, font: "Arial", color: WHITE }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({
                        columnSpan: 2,
                        shading: { fill: GOLD, type: ShadingType.CLEAR },
                        borders: {
                          top: { style: BorderStyle.NONE },
                          bottom: { style: BorderStyle.NONE },
                          left: { style: BorderStyle.NONE },
                          right: { style: BorderStyle.NONE },
                        },
                        margins: { top: 25, bottom: 25, left: 0, right: 0 },
                        children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [] })],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Table({
                width: { size: CONTENT_WIDTH, type: WidthType.DXA },
                columnWidths: [3008, 3008, 3010],
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        columnSpan: 3,
                        shading: { fill: GOLD, type: ShadingType.CLEAR },
                        margins: { top: 25, bottom: 25, left: 0, right: 0 },
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                        children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [] })],
                      }),
                    ],
                  }),
                  new TableRow({
                    children: ([
                      [EMPRESA.site, EMPRESA.siteUrl],
                      [EMPRESA.email, `mailto:${EMPRESA.email}`],
                      [EMPRESA.whats, EMPRESA.whatsUrl],
                    ] satisfies Array<[string, string]>).map(([text, link]) =>
                      new TableCell({
                        shading: { fill: NAVY, type: ShadingType.CLEAR },
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                        margins: { top: 120, bottom: 100, left: 60, right: 60 },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 0, after: 0 },
                            children: [new ExternalHyperlink({ link, children: [new TextRun({ text, color: WHITE, underline: {}, size: 13, font: "Arial" })] })],
                          }),
                        ],
                      }),
                    ),
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                shading: { fill: NAVY, type: ShadingType.CLEAR },
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: `Proposta ${prop.numero} • Página `,
                    size: 14,
                    color: WHITE,
                  }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 14, color: WHITE }),
                  new TextRun({ text: " de ", size: 14, color: WHITE }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 14, color: WHITE }),
                ],
              }),
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
