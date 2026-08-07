import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TabStopType,
  TextRun,
  WidthType,

} from "docx";
import { enderecoCompleto, gutTotal, riscoDe, type Vistoria } from "../types";
import {
  EMPRESA,
  GLOSSARIO,
  normasAplicaveis,
  textoArt,
  TABELA_GUT_PESOS,
  TABELA_PRIORIDADES,
  anamneseResumo,
  classificacoesTexto,
  formatarData,
  grauRiscoGlobal,
  grausRiscoIbape,
  listaVerificacao,
  metodologia,
  nivelInspecao,
  patologiasOrdenadas,
  sistemasInspecionados,
  legendaFoto,
  textoConclusao,
  ENCERRAMENTO_PARTE_1,
  encerramentoParte2,
  textoSecao1,
  textoSecao12,
} from "../laudo";
import { carregarLogo } from "./logo";

const BRAND = "8B1A1A";
const SLATE = "2D3748";
const CONTENT_WIDTH = 9638; // A4 com margens de 2cm

const p = (
  text: string,
  opts: {
    bold?: boolean;
    size?: number;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
  } = {},
) =>
  new Paragraph({
    alignment: opts.align ?? AlignmentType.JUSTIFIED,
    spacing: { after: 120 },
    children: [
      new TextRun({
        text,
        bold: opts.bold ?? false,
        size: opts.size ?? 22,
        font: "Arial",
        color: SLATE,
      }),
    ],
  });

const h = (text: string, level = 1) =>
  new Paragraph({
    heading: level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 160 },
    children: [
      new TextRun({ text, bold: true, size: level === 1 ? 28 : 24, font: "Arial", color: BRAND }),
    ],
  });

const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

function cell(text: string, width: number, opts: { head?: boolean } = {}) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    ...(opts.head ? { shading: { fill: "F1E5E5", type: ShadingType.CLEAR } } : {}),
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: opts.head ?? false,
            size: 20,
            font: "Arial",
            color: opts.head ? BRAND : SLATE,
          }),
        ],
      }),
    ],
  });
}

function table(rows: string[][], widths: number[], withHead = true) {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map(
      (r, i) =>
        new TableRow({
          children: r.map((c, j) => cell(c, widths[j] ?? 1000, { head: withHead && i === 0 })),
        }),
    ),
  });
}

function imageType(dataUrl: string): "png" | "jpg" | "gif" | "bmp" {
  if (dataUrl.includes("image/png")) return "png";
  if (dataUrl.includes("image/gif")) return "gif";
  if (dataUrl.includes("image/bmp")) return "bmp";
  return "jpg";
}

function dataUrlToBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export async function gerarDocx(v: Vistoria) {
  const ordenadas = patologiasOrdenadas(v);
  const risco = grauRiscoGlobal(v);
  const children: (Paragraph | Table)[] = [];

  const logo = await carregarLogo();

  // CAPA — escudo no corpo da página, centralizado
  children.push(new Paragraph({ spacing: { after: 1400 }, children: [] }));
  if (logo) {
    const ratio = logo.width / logo.height;
    const MAX_W = 440; // largura útil da página (pt)
    let capaH = 270;
    let capaW = Math.round(ratio * capaH);
    if (capaW > MAX_W) {
      capaW = MAX_W;
      capaH = Math.round(MAX_W / ratio);
    }
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new ImageRun({
            type: imageType(logo.dataUrl),
            data: dataUrlToBytes(logo.dataUrl),
            transformation: { width: capaW, height: capaH },
            altText: {
              title: "TEMPLAR ENGENHARIA",
              description: "Escudo Templar",
              name: "escudo-capa",
            },
          }),
        ],
      }),
    );
  }
  children.push(
    p(EMPRESA.slogan, { size: 20, align: AlignmentType.CENTER }),
    new Paragraph({ spacing: { after: 1200 }, children: [] }),
    p("LAUDO TÉCNICO DE VISTORIA PREDIAL (LTVP)", {
      bold: true,
      size: 36,
      align: AlignmentType.CENTER,
    }),
    p(enderecoCompleto(v.imovel), { size: 24, align: AlignmentType.CENTER }),
    p(`Data da vistoria: ${formatarData(v.imovel.dataVistoria)}`, {
      size: 22,
      align: AlignmentType.CENTER,
    }),
    new Paragraph({ pageBreakBefore: true, children: [] }),
  );


  children.push(h("1. IDENTIFICAÇÃO DO SOLICITANTE"), p(textoSecao1(v)));

  children.push(
    h("2. OBJETIVO"),
    p(
      "O presente laudo tem por objetivo apresentar o diagnóstico geral do estado de conservação da edificação, identificando as anomalias e falhas existentes, avaliando os riscos associados e indicando as recomendações técnicas corretivas e a ordem de prioridade de intervenção, conforme a ABNT NBR 16747, a ABNT NBR 5674 e a Norma de Inspeção Predial do IBAPE.",
    ),
  );

  children.push(
    h("3. DADOS INICIAIS"),
    h("3.1 Identificação", 2),
    table(
      [
        ["Item", "Descrição"],
        ["Tipo de edificação", v.imovel.tipoEdificacao || "—"],
        ["Endereço", enderecoCompleto(v.imovel)],
        ["Área construída", v.imovel.areaConstruida ? `${v.imovel.areaConstruida} m²` : "—"],
        ["Solicitante", v.imovel.proprietario || "—"],
      ],
      [3200, 6438],
    ),
    h("3.2 Realização", 2),
    table(
      [
        ["Item", "Descrição"],
        ["Responsável", v.imovel.inspetor || "—"],
        ["RRT – Registro de Responsabilidade Técnica", `CREA – nº ${v.imovel.crea || "—"}`],
        ["ART – Anotação de Responsabilidade Técnica", textoArt(v)],
      ],
      [3200, 6438],
    ),
    h("3.3 Data da vistoria", 2),
    p(formatarData(v.imovel.dataVistoria)),
  );

  children.push(
    h("4. DESCRIÇÃO DO IMÓVEL"),
    p(
      `A edificação está localizada em ${enderecoCompleto(v.imovel)}, possui ${
        v.imovel.pavimentos || "—"
      } pavimento(s), é classificada como ${v.imovel.tipoEdificacao || "—"} e apresenta idade aparente de ${
        v.imovel.idadeAparente
      } anos, com área construída de ${v.imovel.areaConstruida || "—"} m². Os sistemas componentes verificados incluem estrutura, vedações, revestimentos, cobertura, impermeabilização, instalações elétricas e hidrossanitárias, esquadrias e pisos.`,
    ),
    v.imovel.observacoes ? p(`Observações gerais: ${v.imovel.observacoes}`) : p(""),
    h("4.1 Anamnese prévia", 2),
    table(
      [
        ["Questão", "Resposta"],
        ...anamneseResumo(v).map((a: { pergunta: string; resposta: string }) => [
          a.pergunta,
          a.resposta,
        ]),
      ],
      [6800, 2838],
    ),
    v.anamnese.observacoes ? p(`Observações da anamnese: ${v.anamnese.observacoes}`) : p(""),
  );

  const fotosEdificacao = v.imovel.fotosEdificacao ?? [];
  const fotosSatelite = v.imovel.fotosSatelite ?? [];
  children.push(h("5. FOTO DA EDIFICAÇÃO"));
  const pushFoto = (dataUrl: string, legenda: string, nome: string) =>
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            type: imageType(dataUrl),
            data: dataUrlToBytes(dataUrl),
            transformation: { width: 400, height: 280 },
            altText: { title: legenda, description: legenda, name: nome },
          }),
        ],
      }),
      p(legenda, { size: 18, align: AlignmentType.CENTER }),
    );

  if (fotosEdificacao.length === 0 && fotosSatelite.length === 0) {
    children.push(p("Não há registro fotográfico da edificação nesta vistoria."));
  } else {
    fotosEdificacao.forEach((f, i) =>
      pushFoto(
        f.dataUrl,
        `Foto da fachada (in loco)${fotosEdificacao.length > 1 ? ` ${i + 1}` : ""} — fachada do imóvel vistoriado.`,
        `fachada-${i}`,
      ),
    );
    fotosSatelite.forEach((f, i) =>
      pushFoto(
        f.dataUrl,
        `Foto de satélite (Google Earth)${fotosSatelite.length > 1 ? ` ${i + 1}` : ""} — localização do imóvel.`,
        `satelite-${i}`,
      ),
    );
  }

  children.push(h("6. CLASSIFICAÇÃO DA INSPEÇÃO"), ...nivelInspecao(v).map((t) => p(t)));

  children.push(h("7. METODOLOGIA"));
  metodologia(v).forEach(([titulo, texto]: [string, string]) =>
    children.push(h(titulo, 2), p(texto)),
  );
  children.push(
    h("7.4 Glossário (ABNT NBR 16747)", 2),
    table(
      [["Termo", "Definição"], ...GLOSSARIO.map(([t, d]: [string, string]) => [t, d])],
      [2600, 7038],
    ),
  );

  children.push(h("8. GRAU DE RISCO E PRIORIDADES"), h("8.1 Graus de risco (IBAPE)", 2));
  children.push(table([["Grau", "Definição"], ...grausRiscoIbape()], [2200, 7438]));
  children.push(
    h("8.2 Matriz GUT — pesos", 2),
    table(
      [
        ["Peso", "Gravidade", "Urgência", "Tendência"],
        ...TABELA_GUT_PESOS.map((r: string[]) => [...r]),
      ],
      [900, 2900, 2900, 2938],
    ),
    h("8.3 Classificação de anomalias e falhas", 2),
    table([["Classificação", "Definição"], ...classificacoesTexto()], [3000, 6638]),
  );

  children.push(h("9. SISTEMAS CONSTRUTIVOS INSPECIONADOS"));
  sistemasInspecionados(v).forEach((s: string) =>
    children.push(p(`• ${s}`, { align: AlignmentType.LEFT })),
  );

  children.push(
    h("10. LISTA DE VERIFICAÇÃO"),
    table(
      [
        ["ITEM", "DESCRIÇÃO", "VERIFICADO", "OBSERVAÇÃO"],
        ...listaVerificacao(v).map(
          (l: { item: string; descricao: string; verificado: string; observacao: string }) => [
            l.item,
            l.descricao,
            l.verificado,
            l.observacao,
          ],
        ),
      ],
      [800, 3200, 1400, 4238],
    ),
  );

  children.push(h("11. VISTORIA DA ÁREA — RELATÓRIO FOTOGRÁFICO"));
  ordenadas.forEach((pat, idx: number) => {
    const total = gutTotal(pat);
    children.push(h(`11.${idx + 1} ${pat.elemento || "Elemento"} — ${pat.local || "Local"}`, 2));
    pat.fotos.forEach((f, i: number) => {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              type: imageType(f.dataUrl),
              data: dataUrlToBytes(f.dataUrl),
              transformation: { width: 340, height: 240 },
              altText: {
                title: `Foto ${i + 1}`,
                description: pat.manifestacoes.join(", "),
                name: `foto-${idx}-${i}`,
              },
            }),
          ],
        }),
        p(legendaFoto(pat, idx + 1, i + 1), {
          size: 18,
          align: AlignmentType.CENTER,
        }),
      );
    });
    children.push(
      table(
        [
          ["Item", "Descrição"],
          ["Elemento inspecionado", pat.elemento || "—"],
          ["Local / posição", `${pat.local || "—"} / ${pat.posicao || "—"}`],
          ["Manifestações patológicas", pat.manifestacoes.join("; ") || "—"],
          ["Classificação", pat.classificacao || "—"],
          ["Recomendações técnicas", pat.recomendacao || "—"],
          ["Observações", pat.observacoes || "—"],
        ],
        [3000, 6638],
      ),
      p("Determinação do Grau de Risco e Prioridades", {
        bold: true,
        size: 24,
        align: AlignmentType.LEFT,
      }),
      table(
        [
          ["Gravidade", "Urgência", "Tendência", "Pontuação", "Grau de risco"],
          [
            String(pat.gravidade),
            String(pat.urgencia),
            String(pat.tendencia),
            String(total),
            riscoDe(total).label,
          ],
        ],
        [1900, 1900, 1900, 1900, 2038],
      ),
    );
  });

  children.push(
    h("12. LISTA DE PRIORIDADES"),
    p(textoSecao12(v)),
    table(
      [["Prioridade", "Pontuação", "Prazo"], ...TABELA_PRIORIDADES.map((r: string[]) => [...r])],
      [2600, 3000, 4038],
    ),
    p(""),
    table(
      [
        ["Ordem", "Elemento / Local", "Pontuação GUT", "Grau de risco"],
        ...ordenadas.map((pat, i: number) => [
          `${i + 1}º`,
          `${pat.elemento} — ${pat.local}`,
          String(gutTotal(pat)),
          riscoDe(gutTotal(pat)).label,
        ]),
      ],
      [1200, 4838, 1800, 1800],
    ),
  );

  children.push(h("13. CONCLUSÕES"));
  textoConclusao(v).forEach((t: string) => children.push(p(t)));
  children.push(
    p(`Classificação global do grau de risco: ${risco.label.toUpperCase()}.`, { bold: true }),
  );

  children.push(h("14. NORMAS TÉCNICAS"));
  normasAplicaveis(v).forEach(([nome, desc]: [string, string], i: number) =>
    children.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: `${i + 1}. ${nome}`,
            bold: true,
            size: 20,
            font: "Arial",
            color: SLATE,
          }),
          ...(desc
            ? [new TextRun({ text: ` — ${desc}`, size: 20, font: "Arial", color: SLATE })]
            : []),
        ],
      }),
    ),
  );

  children.push(
    h("15. ENCERRAMENTO"),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 120 },
      children: [
        new TextRun({ text: ENCERRAMENTO_PARTE_1, size: 22, font: "Arial", color: SLATE }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 22, font: "Arial", color: SLATE }),
        new TextRun({ text: encerramentoParte2(v), size: 22, font: "Arial", color: SLATE }),
      ],
    }),
  );

  children.push(
    h("16. ASSINATURA"),
    p(`${v.imovel.cidade || "—"}, ${formatarData(v.imovel.dataVistoria)}.`, {
      align: AlignmentType.CENTER,
    }),
    p(""),
    p("_______________________________________", { align: AlignmentType.CENTER }),
    p(`${v.imovel.inspetor || "Responsável técnico"} — Engenheiro Civil`, {
      bold: true,
      align: AlignmentType.CENTER,
    }),
    p(`CREA: ${v.imovel.crea || "—"}`, { align: AlignmentType.CENTER }),
  );

  // Cabeçalho de todas as páginas: nome à esquerda, slogan à direita, linha vermelha abaixo
  const headerChildren: Paragraph[] = [
    new Paragraph({
      tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_WIDTH }],
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BRAND, space: 4 } },
      children: [
        new TextRun({ text: EMPRESA.nome, bold: true, size: 16, color: BRAND, font: "Arial" }),
        new TextRun({ text: `\t${EMPRESA.slogan}`, size: 16, color: BRAND, font: "Arial" }),
      ],
    }),
  ];


  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 22, color: SLATE } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1417, right: 1134, bottom: 1417, left: 1134 },
          },
        },
        headers: {
          default: new Header({ children: headerChildren }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new ExternalHyperlink({
                    link: EMPRESA.siteUrl,
                    children: [new TextRun({ text: EMPRESA.site, size: 16, style: "Hyperlink" })],
                  }),
                  new TextRun({ text: "  |  ", size: 16 }),
                  new ExternalHyperlink({
                    link: `mailto:${EMPRESA.email}`,
                    children: [new TextRun({ text: EMPRESA.email, size: 16, style: "Hyperlink" })],
                  }),
                  new TextRun({ text: "  |  ", size: 16 }),
                  new ExternalHyperlink({
                    link: EMPRESA.whatsUrl,
                    children: [new TextRun({ text: EMPRESA.whats, size: 16, style: "Hyperlink" })],
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "Página ", size: 16 }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16 }),
                  new TextRun({ text: " de ", size: 16 }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16 }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  baixar(blob, `LTVP-${(v.imovel.proprietario || "vistoria").replace(/\s+/g, "-")}.docx`);
}

export function baixar(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}
