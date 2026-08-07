import { jsPDF } from "jspdf";
import { enderecoCompleto, gutTotal, riscoDe, type Vistoria } from "../types";
import {
  EMPRESA,
  GLOSSARIO,
  NORMAS,
  TABELA_GUT_PESOS,
  TABELA_PRIORIDADES,
  anamneseResumo,
  classificacoesTexto,
  formatarData,
  grauRiscoGlobal,
  grausRiscoIbape,
  legendaFoto,
  listaVerificacao,
  metodologia,
  nivelInspecao,
  patologiasOrdenadas,
  sistemasInspecionados,
  textoConclusao,
  textoEncerramento,
  textoSecao1,
  textoSecao12,
} from "../laudo";
import { carregarLogo, type LogoLaudo } from "./logo";

const BRAND: [number, number, number] = [139, 26, 26];
const SLATE: [number, number, number] = [45, 55, 72];
const GRAY: [number, number, number] = [102, 102, 102];
const M = { left: 20, right: 20, top: 26, bottom: 25 };
const PAGE_W = 210;
const PAGE_H = 297;
const W = PAGE_W - M.left - M.right;

class Builder {
  doc: jsPDF;
  y = M.top;
  logo: LogoLaudo | null;

  constructor(logo: LogoLaudo | null) {
    this.logo = logo;
    this.doc = new jsPDF({ unit: "mm", format: "a4" });
    this.doc.setFont("helvetica", "normal");
  }

  ensure(h: number) {
    if (this.y + h > PAGE_H - M.bottom) {
      this.doc.addPage();
      this.y = M.top;
    }
  }

  h1(text: string) {
    this.ensure(14);
    this.y += 4;
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(14);
    this.doc.setTextColor(...BRAND);
    this.doc.text(text, M.left, this.y);
    this.y += 7;
  }

  h2(text: string) {
    this.ensure(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(11.5);
    this.doc.setTextColor(...BRAND);
    this.doc.text(text, M.left, this.y);
    this.y += 6;
  }

  /** Texto corrido; justificado por padrão (exceto quando centralizado ou marcado). */
  text(
    txt: string,
    opts: { bold?: boolean; size?: number; center?: boolean; justify?: boolean } = {},
  ) {
    this.doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    this.doc.setFontSize(opts.size ?? 11);
    this.doc.setTextColor(...SLATE);
    const justificar = !opts.center && (opts.justify ?? true);
    const lines = this.doc.splitTextToSize(txt, W) as string[];
    lines.forEach((line, i) => {
      this.ensure(6);
      const ultima = i === lines.length - 1;
      if (opts.center) {
        this.doc.text(line, PAGE_W / 2, this.y, { align: "center" });
      } else if (justificar && !ultima) {
        this.doc.text(line, M.left, this.y, { align: "justify", maxWidth: W });
      } else {
        this.doc.text(line, M.left, this.y);
      }
      this.y += 5.4;
    });
    this.y += 1.5;
  }

  table(rows: string[][], widths: number[], head = true) {
    const cols = widths.map((w) => (w / widths.reduce((a, b) => a + b, 0)) * W);
    rows.forEach((row, ri) => {
      this.doc.setFont("helvetica", head && ri === 0 ? "bold" : "normal");
      this.doc.setFontSize(9);
      const cells = row.map(
        (c, ci) => this.doc.splitTextToSize(c, (cols[ci] ?? 20) - 4) as string[],
      );
      const rowH = Math.max(...cells.map((c) => c.length)) * 4.4 + 3;
      this.ensure(rowH);
      let x = M.left;
      cells.forEach((lines, ci) => {
        const w = cols[ci] ?? 20;
        if (head && ri === 0) {
          this.doc.setFillColor(241, 229, 229);
          this.doc.rect(x, this.y - 4, w, rowH, "F");
        }
        this.doc.setDrawColor(205, 205, 205);
        this.doc.rect(x, this.y - 4, w, rowH);
        this.doc.setTextColor(...(head && ri === 0 ? BRAND : SLATE));
        lines.forEach((l, li) => this.doc.text(l, x + 2, this.y + li * 4.4));
        x += w;
      });
      this.y += rowH;
    });
    this.y += 3;
  }

  image(dataUrl: string, w = 110, h = 78) {
    this.ensure(h + 4);
    try {
      this.doc.addImage(dataUrl, (PAGE_W - w) / 2, this.y, w, h);
    } catch {
      /* imagem inválida ignorada */
    }
    this.y += h + 3;
  }

  finalize() {
    const total = this.doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      this.doc.setPage(i);
      // Cabeçalho: nome à esquerda, slogan à direita, linha vermelha abaixo
      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(8);
      this.doc.setTextColor(...BRAND);
      this.doc.text(EMPRESA.nome, M.left, 14);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(EMPRESA.slogan, PAGE_W - M.right, 14, { align: "right" });
      this.doc.setDrawColor(...BRAND);
      this.doc.line(M.left, 17, PAGE_W - M.right, 17);

      // Rodapé
      this.doc.line(M.left, PAGE_H - 20, PAGE_W - M.right, PAGE_H - 20);
      this.doc.setFontSize(7.5);
      this.doc.setTextColor(...BRAND);
      this.doc.textWithLink(EMPRESA.site, M.left, PAGE_H - 15, { url: EMPRESA.siteUrl });
      this.doc.textWithLink(EMPRESA.email, PAGE_W / 2, PAGE_H - 15, {
        url: `mailto:${EMPRESA.email}`,
        align: "center",
      });
      this.doc.textWithLink(EMPRESA.whats, PAGE_W - M.right - 32, PAGE_H - 15, {
        url: EMPRESA.whatsUrl,
      });
      this.doc.setTextColor(...SLATE);
      this.doc.text(`Página ${i} de ${total}`, PAGE_W / 2, PAGE_H - 10, { align: "center" });
    }
  }
}

function render(v: Vistoria, logo: LogoLaudo | null, paginas: string | number) {
  const b = new Builder(logo);
  const ordenadas = patologiasOrdenadas(v);
  const risco = grauRiscoGlobal(v);

  // Capa — escudo centralizado no corpo da página
  b.y = 72;
  if (logo) {
    const h = 28;
    const w = (logo.width / logo.height) * h;
    try {
      b.doc.addImage(logo.dataUrl, (PAGE_W - w) / 2, b.y, w, h);
    } catch {
      /* ignora logo inválido */
    }
    b.y += h + 8;
  }
  b.text(EMPRESA.nome, { bold: true, size: 22, center: true });
  b.text(EMPRESA.slogan, { size: 10, center: true });
  b.y += 24;
  b.text("LAUDO TÉCNICO DE VISTORIA PREDIAL (LTVP)", { bold: true, size: 17, center: true });
  b.y += 6;
  b.text(enderecoCompleto(v.imovel), { size: 12, center: true });
  b.text(`Data da vistoria: ${formatarData(v.imovel.dataVistoria)}`, { size: 11, center: true });

  b.doc.addPage();
  b.y = M.top;

  b.h1("1. IDENTIFICAÇÃO DO SOLICITANTE");
  b.text(textoSecao1(v));

  b.h1("2. OBJETIVO");
  b.text(
    "O presente laudo tem por objetivo apresentar o diagnóstico geral do estado de conservação da edificação, identificando as anomalias e falhas existentes, avaliando os riscos associados e indicando as recomendações técnicas corretivas e a ordem de prioridade de intervenção, conforme a ABNT NBR 16747, a ABNT NBR 5674 e a Norma de Inspeção Predial do IBAPE.",
  );

  b.h1("3. DADOS INICIAIS");
  b.h2("3.1 Identificação");
  b.table(
    [
      ["Item", "Descrição"],
      ["Tipo de edificação", v.imovel.tipoEdificacao || "—"],
      ["Endereço", enderecoCompleto(v.imovel)],
      ["Área construída", v.imovel.areaConstruida ? `${v.imovel.areaConstruida} m²` : "—"],
      ["Solicitante", v.imovel.proprietario || "—"],
    ],
    [35, 65],
  );
  b.h2("3.2 Realização");
  b.table(
    [
      ["Item", "Descrição"],
      ["Responsável técnico", v.imovel.inspetor || "—"],
      ["CREA", v.imovel.crea || "—"],
    ],
    [35, 65],
  );
  b.h2("3.3 Data da vistoria");
  b.text(formatarData(v.imovel.dataVistoria), { justify: false });

  b.h1("4. DESCRIÇÃO DO IMÓVEL");
  b.text(
    `A edificação está localizada em ${enderecoCompleto(v.imovel)}, possui ${
      v.imovel.pavimentos || "—"
    } pavimento(s), é classificada como ${v.imovel.tipoEdificacao || "—"} e apresenta idade aparente de ${
      v.imovel.idadeAparente
    } anos, com área construída de ${v.imovel.areaConstruida || "—"} m². Os sistemas componentes verificados incluem estrutura, vedações, revestimentos, cobertura, impermeabilização, instalações elétricas e hidrossanitárias, esquadrias e pisos.`,
  );
  if (v.imovel.observacoes) b.text(`Observações gerais: ${v.imovel.observacoes}`);
  b.h2("4.1 Anamnese prévia");
  b.table(
    [["Questão", "Resposta"], ...anamneseResumo(v).map((a) => [a.pergunta, a.resposta])],
    [70, 30],
  );
  if (v.anamnese.observacoes) b.text(`Observações da anamnese: ${v.anamnese.observacoes}`);

  b.h1("5. FOTO DA EDIFICAÇÃO");
  const fotosEdificacao = v.imovel.fotosEdificacao ?? [];
  if (fotosEdificacao.length > 0) {
    fotosEdificacao.forEach((f, i) => {
      b.image(f.dataUrl, 130, 90);
      b.text(`Foto da edificação ${i + 1} — fachada do imóvel vistoriado.`, {
        size: 8.5,
        center: true,
      });
    });
  } else {
    b.text("Não há registro fotográfico da fachada nesta vistoria.");
  }

  b.h1("6. CLASSIFICAÇÃO DA INSPEÇÃO");
  b.text(nivelInspecao(v));

  b.h1("7. METODOLOGIA");
  metodologia().forEach(([t, txt]) => {
    b.h2(t);
    b.text(txt);
  });
  b.h2("7.4 Glossário (ABNT NBR 16747)");
  b.table([["Termo", "Definição"], ...GLOSSARIO.map(([t, d]) => [t, d])], [28, 72]);

  b.h1("8. GRAU DE RISCO E PRIORIDADES");
  b.h2("8.1 Graus de risco (IBAPE)");
  b.table([["Grau", "Definição"], ...grausRiscoIbape()], [24, 76]);
  b.h2("8.2 Matriz GUT — pesos");
  b.table(
    [["Peso", "Gravidade", "Urgência", "Tendência"], ...TABELA_GUT_PESOS.map((r) => [...r])],
    [10, 30, 30, 30],
  );
  b.h2("8.3 Classificação de anomalias e falhas");
  b.table([["Classificação", "Definição"], ...classificacoesTexto()], [32, 68]);

  b.h1("9. SISTEMAS CONSTRUTIVOS INSPECIONADOS");
  sistemasInspecionados(v).forEach((s) => b.text(`• ${s}`, { justify: false }));

  b.h1("10. LISTA DE VERIFICAÇÃO");
  b.table(
    [
      ["ITEM", "DESCRIÇÃO", "VERIFICADO", "OBSERVAÇÃO"],
      ...listaVerificacao(v).map((l) => [l.item, l.descricao, l.verificado, l.observacao]),
    ],
    [8, 32, 16, 44],
  );

  b.h1("11. VISTORIA DA ÁREA — RELATÓRIO FOTOGRÁFICO");
  ordenadas.forEach((pat, idx) => {
    const total = gutTotal(pat);
    b.h2(`11.${idx + 1} ${pat.elemento || "Elemento"} — ${pat.local || "Local"}`);
    pat.fotos.forEach((f, i) => {
      b.image(f.dataUrl);
      b.text(legendaFoto(pat, idx + 1, i + 1), { size: 8.5, center: true });
    });
    b.table(
      [
        ["Item", "Descrição"],
        ["Elemento inspecionado", pat.elemento || "—"],
        ["Local / posição", `${pat.local || "—"} / ${pat.posicao || "—"}`],
        ["Manifestações patológicas", pat.manifestacoes.join("; ") || "—"],
        ["Classificação", pat.classificacao || "—"],
        ["Recomendações técnicas", pat.recomendacao || "—"],
        ["Observações", pat.observacoes || "—"],
      ],
      [32, 68],
    );
    b.table(
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
      [20, 20, 20, 20, 20],
    );
  });

  b.h1("12. LISTA DE PRIORIDADES");
  b.text(textoSecao12(v));
  b.table(
    [["Prioridade", "Pontuação", "Prazo"], ...TABELA_PRIORIDADES.map((r) => [...r])],
    [25, 30, 45],
  );
  b.table(
    [
      ["Ordem", "Elemento / Local", "Pontuação GUT", "Grau de risco"],
      ...ordenadas.map((pat, i) => [
        `${i + 1}º`,
        `${pat.elemento} — ${pat.local}`,
        String(gutTotal(pat)),
        riscoDe(gutTotal(pat)).label,
      ]),
    ],
    [12, 48, 20, 20],
  );

  b.h1("13. CONCLUSÕES");
  textoConclusao(v).forEach((t) => b.text(t));
  b.text(`Classificação global do grau de risco: ${risco.label.toUpperCase()}.`, {
    bold: true,
    justify: false,
  });

  b.h1("14. NORMAS TÉCNICAS");
  NORMAS.forEach((n) => b.text(`• ${n}`, { size: 10, justify: false }));

  b.h1("15. ENCERRAMENTO");
  b.text(textoEncerramento(paginas));

  b.h1("16. ASSINATURA");
  b.text(`${v.imovel.cidade || "—"}, ${formatarData(v.imovel.dataVistoria)}.`, { center: true });
  b.y += 10;
  b.text("_______________________________________", { center: true });
  b.text(v.imovel.inspetor || "Responsável técnico", { bold: true, center: true });
  b.text(`CREA ${v.imovel.crea || "—"}`, { center: true });

  b.finalize();
  return b.doc;
}

export async function gerarPdf(v: Vistoria) {
  const logo = await carregarLogo();
  // 1ª passagem: descobre a quantidade real de páginas.
  const previa = render(v, logo, "xx");
  let paginas = previa.getNumberOfPages();
  // 2ª passagem: grava o número real no texto de encerramento.
  let doc = render(v, logo, paginas);
  if (doc.getNumberOfPages() !== paginas) {
    paginas = doc.getNumberOfPages();
    doc = render(v, logo, paginas);
  }
  doc.save(`LTVP-${(v.imovel.proprietario || "vistoria").replace(/\s+/g, "-")}.pdf`);
}
