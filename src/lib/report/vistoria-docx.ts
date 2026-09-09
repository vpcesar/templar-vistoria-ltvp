import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Footer,
  Header,
  ImageRun,
  PageNumber,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  UnderlineType,
  WidthType,
} from "docx";
import { EMPRESA } from "../laudo";
import { carregarImagemRemota, carregarLogoProposta, dataUrlToBytes } from "./logo";
import {
  CONTATOS_TEMPLAR,
  TAGLINE,
  montarRelatorio,
  nomeArquivoVistoria,
  rotuloStatus,
  type DadosRelatorioVistoria,
} from "./vistoria-relatorio";

const NAVY = "1A365D";
const GOLD = "D4AF37";
const SLATE = "2D3748";
const FOOTER = "718096";
const WHITE = "FFFFFF";
const VERDE = "15803D";
const VERMELHO = "B91C1C";
const CINZA = "718096";
const CONTENT_WIDTH = 9026;

const semBordas = {
  top: { style: BorderStyle.NONE },
  bottom: { style: BorderStyle.NONE },
  left: { style: BorderStyle.NONE },
  right: { style: BorderStyle.NONE },
};

const corStatus = (status: string) =>
  status === "conforme" ? VERDE : status === "nao_conforme" ? VERMELHO : CINZA;

const paragrafo = (texto: string, indent = 0) =>
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 100 },
    indent: indent ? { left: indent } : undefined,
    children: [new TextRun({ text: texto, size: 20, font: "Arial", color: SLATE })],
  });

const campo = (rotulo: string, valor: string) =>
  new Paragraph({
    spacing: { after: 70 },
    children: [
      new TextRun({ text: `${rotulo}: `, bold: true, size: 20, font: "Arial", color: SLATE }),
      new TextRun({ text: valor || "—", size: 20, font: "Arial", color: SLATE }),
    ],
  });

const tarja = (texto: string) =>
  new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: CONTENT_WIDTH, type: WidthType.DXA },
            shading: { fill: NAVY, type: ShadingType.CLEAR },
            borders: semBordas,
            margins: { top: 80, bottom: 80, left: 140, right: 140 },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: texto.toUpperCase(),
                    bold: true,
                    size: 22,
                    font: "Arial",
                    color: WHITE,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

export async function gerarVistoriaDocx(dados: DadosRelatorioVistoria) {
  const rel = montarRelatorio(dados);
  const logo = await carregarLogoProposta();

  const headerLogo = logo
    ? new ImageRun({
        data: dataUrlToBytes(logo.dataUrl),
        transformation: { width: 150, height: Math.round((150 * logo.height) / logo.width) },
        type: "jpg",
      })
    : new TextRun({ text: EMPRESA.nome, bold: true, size: 20, font: "Arial", color: NAVY });

  const filhos: Array<Paragraph | Table> = [];

  filhos.push(
    tarja("Dados da Vistoria"),
    new Paragraph({ spacing: { after: 120 }, children: [] }),
  );
  rel.cabecalho.forEach(([rotulo, valor]) => filhos.push(campo(rotulo, valor)));
  if (rel.vistoria.observacoes?.trim()) {
    filhos.push(campo("Observações", rel.vistoria.observacoes.trim()));
  }

  for (const bloco of rel.porAmbiente) {
    filhos.push(
      new Paragraph({ spacing: { after: 120 }, children: [] }),
      tarja(bloco.ambiente.nome),
      new Paragraph({ spacing: { after: 100 }, children: [] }),
    );
    if (bloco.itens.length === 0) {
      filhos.push(paragrafo("Nenhum item registrado neste ambiente."));
      continue;
    }
    for (const linha of bloco.itens) {
      filhos.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: `• ${linha.titulo} — `,
              bold: true,
              size: 20,
              font: "Arial",
              color: SLATE,
            }),
            new TextRun({
              text: rotuloStatus(linha.item),
              bold: true,
              size: 20,
              font: "Arial",
              color: corStatus(linha.item.status),
            }),
          ],
        }),
      );
      if (linha.observacao) filhos.push(paragrafo(linha.observacao, 300));

      const fotos = linha.item.status === "nao_conforme" ? linha.fotos : [];
      if (fotos.length > 0) {
        const imagens: ImageRun[] = [];
        for (const foto of fotos) {
          const img = await carregarImagemRemota(foto.url);
          if (!img) continue;
          imagens.push(
            new ImageRun({
              data: dataUrlToBytes(img.dataUrl),
              transformation: { width: 105, height: Math.round((105 * img.height) / img.width) },
              type: "jpg",
            }),
          );
        }
        for (let i = 0; i < imagens.length; i += 4) {
          filhos.push(
            new Paragraph({
              spacing: { after: 120 },
              indent: { left: 300 },
              children: imagens.slice(i, i + 4).flatMap((img, idx) =>
                idx === 0 ? [img] : [new TextRun({ text: "  " }), img],
              ),
            }),
          );
        }
      }
    }
  }

  if (rel.semAmbiente.length > 0) {
    filhos.push(
      new Paragraph({ spacing: { after: 120 }, children: [] }),
      tarja("Outros itens"),
      new Paragraph({ spacing: { after: 100 }, children: [] }),
    );
    rel.semAmbiente.forEach((item) => {
      filhos.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: `• ${item.titulo || item.item} — `,
              bold: true,
              size: 20,
              font: "Arial",
              color: SLATE,
            }),
            new TextRun({
              text: rotuloStatus(item),
              bold: true,
              size: 20,
              font: "Arial",
              color: corStatus(item.status),
            }),
          ],
        }),
      );
      const obs = (item.observacao_aprimorada || item.observacoes || "").trim();
      if (obs) filhos.push(paragrafo(obs, 300));
    });
  }

  filhos.push(
    new Paragraph({ spacing: { after: 120 }, children: [] }),
    tarja("Resumo Final"),
    new Paragraph({ spacing: { after: 100 }, children: [] }),
    campo("Total de itens", String(rel.resumo.total)),
    campo("Aprovados", String(rel.resumo.conformes)),
    campo("Reprovados", String(rel.resumo.naoConformes)),
    campo("Não se aplica", String(rel.resumo.naoAplicaveis)),
    campo("Pendentes", String(rel.resumo.total - rel.resumo.avaliados)),
  );

  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 20, color: SLATE } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 2000, right: 1440, bottom: 1300, left: 1440, header: 360, footer: 360 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Table({
                width: { size: CONTENT_WIDTH, type: WidthType.DXA },
                columnWidths: [3300, 5726],
                layout: TableLayoutType.FIXED,
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
                            spacing: { before: 0, after: 60 },
                            children: [headerLogo],
                          }),
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 0, after: 0 },
                            children: [
                              new TextRun({
                                text: TAGLINE,
                                size: 14,
                                font: "Arial",
                                color: NAVY,
                              }),
                            ],
                          }),
                        ],
                      }),
                      new TableCell({
                        width: { size: 5726, type: WidthType.DXA },
                        shading: { fill: NAVY, type: ShadingType.CLEAR },
                        borders: semBordas,
                        margins: { top: 150, bottom: 120, left: 300, right: 160 },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            spacing: { before: 0, after: 40 },
                            children: [
                              new TextRun({
                                text: "RELATÓRIO DE VISTORIA",
                                bold: true,
                                size: 24,
                                font: "Arial",
                                color: WHITE,
                              }),
                            ],
                          }),
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            spacing: { before: 0, after: 40 },
                            children: [
                              new TextRun({
                                text: rel.vistoria.numero,
                                bold: true,
                                size: 22,
                                font: "Arial",
                                color: GOLD,
                              }),
                            ],
                          }),
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            spacing: { before: 0, after: 0 },
                            children: CONTATOS_TEMPLAR.flatMap((c, idx) => [
                              ...(idx > 0
                                ? [
                                    new TextRun({
                                      text: "  |  ",
                                      size: 14,
                                      font: "Arial",
                                      color: WHITE,
                                    }),
                                  ]
                                : []),
                              new ExternalHyperlink({
                                link: c.url,
                                children: [
                                  new TextRun({
                                    text: c.texto,
                                    size: 14,
                                    font: "Arial",
                                    color: WHITE,
                                    underline: { type: UnderlineType.NONE },
                                  }),
                                ],
                              }),
                            ]),
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
                        borders: semBordas,
                        margins: { top: 25, bottom: 25, left: 0, right: 0 },
                        children: [
                          new Paragraph({ spacing: { before: 0, after: 0 }, children: [] }),
                        ],
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
                columnWidths: [3009, 3009, 3008],
                layout: TableLayoutType.FIXED,
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        columnSpan: 3,
                        shading: { fill: GOLD, type: ShadingType.CLEAR },
                        borders: semBordas,
                        margins: { top: 25, bottom: 25, left: 0, right: 0 },
                        children: [
                          new Paragraph({ spacing: { before: 0, after: 0 }, children: [] }),
                        ],
                      }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 3009, type: WidthType.DXA },
                        shading: { fill: NAVY, type: ShadingType.CLEAR },
                        borders: semBordas,
                        margins: { top: 120, bottom: 100, left: 60, right: 60 },
                        children: [
                          new Paragraph({
                            spacing: { before: 0, after: 0 },
                            children: [
                              new TextRun({
                                text: EMPRESA.nome,
                                bold: true,
                                size: 16,
                                font: "Arial",
                                color: WHITE,
                              }),
                            ],
                          }),
                        ],
                      }),
                      new TableCell({
                        width: { size: 3009, type: WidthType.DXA },
                        shading: { fill: NAVY, type: ShadingType.CLEAR },
                        borders: semBordas,
                        margins: { top: 120, bottom: 100, left: 60, right: 60 },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 0, after: 0 },
                            children: CONTATOS_TEMPLAR.flatMap((c, idx) => [
                              ...(idx > 0
                                ? [
                                    new TextRun({
                                      text: " | ",
                                      size: 14,
                                      font: "Arial",
                                      color: WHITE,
                                    }),
                                  ]
                                : []),
                              new ExternalHyperlink({
                                link: c.url,
                                children: [
                                  new TextRun({
                                    text: c.texto,
                                    size: 14,
                                    font: "Arial",
                                    color: WHITE,
                                    underline: { type: UnderlineType.NONE },
                                  }),
                                ],
                              }),
                            ]),
                          }),
                        ],
                      }),
                      new TableCell({
                        width: { size: 3008, type: WidthType.DXA },
                        shading: { fill: NAVY, type: ShadingType.CLEAR },
                        borders: semBordas,
                        margins: { top: 120, bottom: 100, left: 60, right: 60 },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            spacing: { before: 0, after: 0 },
                            children: [
                              new TextRun({
                                text: "Página ",
                                size: 16,
                                font: "Arial",
                                color: WHITE,
                              }),
                              new TextRun({
                                children: [PageNumber.CURRENT],
                                size: 16,
                                font: "Arial",
                                color: WHITE,
                              }),
                              new TextRun({
                                text: " de ",
                                size: 16,
                                font: "Arial",
                                color: WHITE,
                              }),
                              new TextRun({
                                children: [PageNumber.TOTAL_PAGES],
                                size: 16,
                                font: "Arial",
                                color: WHITE,
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 60, after: 0 },
                children: [
                  new TextRun({
                    text: `Relatório de Vistoria ${rel.vistoria.numero}`,
                    size: 16,
                    font: "Arial",
                    color: FOOTER,
                  }),
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
  a.download = nomeArquivoVistoria(rel.vistoria, "docx");
  a.click();
  URL.revokeObjectURL(url);
}
