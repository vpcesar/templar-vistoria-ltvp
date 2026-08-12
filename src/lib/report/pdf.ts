import { jsPDF } from "jspdf";
import { enderecoCompleto, type Vistoria } from "../types";
import {
  EMPRESA,
  TABELA_GUT_PESOS,
  TABELA_PRIORIDADES,
  classificacoesTexto,
  formatarData,
  grauRiscoGlobal,
  grausRiscoIbape,
} from "../laudo";
import {
  TOKEN_PAGINAS,
  paragrafos,
  patologiasParaLaudo,
  resolverLaudo,
} from "../laudo-editavel";
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

  /** Item numerado de norma: identificação em negrito + descrição normal, justificado. */
  normaItem(n: number, nome: string, desc: string) {
    const prefixo = `${n}. ${nome}`;
    this.doc.setFontSize(10);
    this.doc.setTextColor(...SLATE);
    this.doc.setFont("helvetica", "bold");
    const prefixoW = this.doc.getTextWidth(prefixo);
    this.ensure(6);
    this.doc.text(prefixo, M.left, this.y);
    if (!desc) {
      this.y += 5.4;
      return;
    }
    this.doc.setFont("helvetica", "normal");
    const restante = ` — ${desc}`;
    const primeira = this.doc.splitTextToSize(restante, W - prefixoW) as string[];
    this.doc.text(primeira[0] ?? "", M.left + prefixoW, this.y);
    this.y += 5.4;
    const sobra = restante.slice((primeira[0] ?? "").length).trim();
    if (sobra) {
      (this.doc.splitTextToSize(sobra, W) as string[]).forEach((l) => {
        this.ensure(6);
        this.doc.text(l, M.left, this.y);
        this.y += 5.4;
      });
    }
    this.y += 0.8;
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
  const L = resolverLaudo(v);
  const pats = patologiasParaLaudo(v, L);
  const risco = grauRiscoGlobal(v);

  // Capa — escudo centralizado no corpo da página
  b.y = 52;
  if (logo) {
    const ratio = logo.width / logo.height;
    let h = 84; // ~240px
    let w = ratio * h;
    if (w > W) {
      w = W;
      h = W / ratio;
    }
    try {
      b.doc.addImage(logo.dataUrl, (PAGE_W - w) / 2, b.y, w, h);
    } catch {
      /* ignora logo inválido */
    }
    b.y += h + 8;
  }
  b.text(EMPRESA.slogan, { size: 10, center: true });
  b.y += 24;
  b.text("LAUDO TÉCNICO DE VISTORIA PREDIAL (LTVP)", { bold: true, size: 17, center: true });
  b.y += 6;
  b.text(enderecoCompleto(v.imovel), { size: 12, center: true });
  b.text(`Data da vistoria: ${formatarData(v.imovel.dataVistoria)}`, { size: 11, center: true });

  b.doc.addPage();
  b.y = M.top;

  b.h1("1. IDENTIFICAÇÃO DO SOLICITANTE");
  paragrafos(L.secao1.texto).forEach((t) => b.text(t));

  b.h1("2. OBJETIVO");
  paragrafos(L.secao2.texto).forEach((t) => b.text(t));

  b.h1("3. DADOS INICIAIS");
  b.h2("3.1 Identificação");
  b.table(
    [
      ["Item", "Descrição"],
      ["Tipo de edificação", L.secao3.tipoEdificacao],
      ["Endereço", L.secao3.endereco],
      ["Área construída", L.secao3.areaConstruida],
      ["Solicitante", L.secao3.solicitante],
    ],
    [35, 65],
  );
  b.h2("3.2 Realização");
  b.table(
    [
      ["Item", "Descrição"],
      ["Responsável", L.secao3.responsavel],
      ["CREA", L.secao3.crea],
      ["ART – Anotação de Responsabilidade Técnica", L.secao3.art],
    ],
    [35, 65],
  );
  b.h2("3.3 Data da vistoria");
  b.text(L.secao3.data, { justify: false });

  b.h1("4. DESCRIÇÃO DO IMÓVEL");
  paragrafos(L.secao4.texto).forEach((t) => b.text(t));
  if (L.secao4.observacoes.trim()) b.text(`Observações gerais: ${L.secao4.observacoes}`);
  b.h2("4.1 Anamnese prévia");
  b.table(
    [["Questão", "Resposta"], ...L.secao4.anamnese.map((a) => [a.pergunta, a.resposta])],
    [70, 30],
  );
  if (L.secao4.observacoesAnamnese.trim())
    b.text(`Observações da anamnese: ${L.secao4.observacoesAnamnese}`);

  b.h1("5. FOTO DA EDIFICAÇÃO");
  const fotosEdificacao = v.imovel.fotosEdificacao ?? [];
  const fotosSatelite = v.imovel.fotosSatelite ?? [];
  if (fotosEdificacao.length === 0 && fotosSatelite.length === 0) {
    b.text(L.secao5.textoSemFoto);
  } else {
    fotosEdificacao.forEach((f, i) => {
      b.image(f.dataUrl, 130, 90);
      b.text(L.secao5.legendasFachada[i] ?? "", { size: 8.5, center: true });
    });
    fotosSatelite.forEach((f, i) => {
      b.image(f.dataUrl, 130, 90);
      b.text(L.secao5.legendasSatelite[i] ?? "", { size: 8.5, center: true });
    });
  }

  b.h1("6. CLASSIFICAÇÃO DA INSPEÇÃO");
  paragrafos(L.secao6.texto).forEach((t) => b.text(t));

  b.h1("7. METODOLOGIA");
  L.secao7.itens.forEach((item) => {
    b.h2(item.titulo);
    paragrafos(item.texto).forEach((t) => b.text(t));
  });
  b.h2("7.4 Glossário (ABNT NBR 16747)");
  b.table([["Termo", "Definição"], ...L.secao7.glossario.map(([t, d]) => [t, d])], [28, 72]);

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
  L.secao9.sistemas.filter((s) => s.trim()).forEach((s) => b.text(`• ${s}`, { justify: false }));

  b.h1("10. LISTA DE VERIFICAÇÃO");
  b.table(
    [
      ["ITEM", "DESCRIÇÃO", "VERIFICADO", "OBSERVAÇÃO"],
      ...L.secao10.itens.map((l, i) => [String(i + 1), l.descricao, l.verificado, l.observacao]),
    ],
    [8, 32, 16, 44],
  );

  b.h1("11. VISTORIA DA ÁREA — RELATÓRIO FOTOGRÁFICO");
  pats.forEach((pat, idx) => {
    b.h2(`11.${idx + 1} ${pat.titulo || "Elemento"}`);
    pat.original.fotos.forEach((f, i) => {
      b.image(f.dataUrl);
      b.text(pat.legendas[i] ?? "", { size: 8.5, center: true });
    });
    b.table(
      [
        ["Item", "Descrição"],
        ["Elemento construtivo", pat.elemento || "—"],
        ["Local / posição", `${pat.local || "—"} / ${pat.posicao || "—"}`],
        ["Manifestações patológicas", pat.manifestacoes || "—"],
        ["Classificação", pat.classificacao || "—"],
        ["Recomendações técnicas", pat.recomendacao || "—"],
        ["Observações", pat.observacoes || "—"],
      ],
      [32, 68],
    );
    b.text("Determinação do Grau de Risco e Prioridades", {
      bold: true,
      size: 12,
      justify: false,
    });
    b.table(
      [
        ["Gravidade", "Urgência", "Tendência", "Pontuação", "Grau de risco"],
        [
          String(pat.gravidade),
          String(pat.urgencia),
          String(pat.tendencia),
          String(pat.total),
          pat.risco,
        ],
      ],
      [20, 20, 20, 20, 20],
    );
  });

  b.h1("12. LISTA DE PRIORIDADES");
  paragrafos(L.secao12.texto).forEach((t) => b.text(t));
  b.table(
    [["Prioridade", "Pontuação", "Prazo"], ...TABELA_PRIORIDADES.map((r) => [...r])],
    [25, 30, 45],
  );
  b.table(
    [
      ["Ordem", "Elemento / Local", "Pontuação GUT", "Grau de risco"],
      ...[...pats]
        .sort((a, z) => z.total - a.total)
        .map((pat, i) => [
          `${i + 1}º`,
          `${pat.elemento} — ${pat.local}`,
          String(pat.total),
          pat.risco,
        ]),
    ],
    [12, 48, 20, 20],
  );

  b.h1("13. CONCLUSÕES");
  paragrafos(L.secao13.texto).forEach((t) => b.text(t));
  b.text(`Classificação global do grau de risco: ${risco.label.toUpperCase()}.`, {
    bold: true,
    justify: false,
  });

  b.h1("14. NORMAS TÉCNICAS");
  L.secao14.normas
    .map((n) => n.trim())
    .filter(Boolean)
    .forEach((norma, i) => {
      const [nome, ...resto] = norma.split(" — ");
      b.normaItem(i + 1, nome ?? norma, resto.join(" — "));
    });

  const itensAdicionais = (v.itensAdicionais ?? []).filter(
    (it) => it.titulo.trim() || it.conteudo.trim(),
  );
  itensAdicionais.forEach((item, i) => {
    b.h1(`${15 + i}. ${(item.titulo.trim() || "Item adicional").toUpperCase()}`);
    paragrafos(item.conteudo).forEach((linha) => b.text(linha));
  });

  const numEncerramento = 15 + itensAdicionais.length;

  b.h1(`${numEncerramento}. ENCERRAMENTO`);
  b.text(L.encerramento.texto.split(TOKEN_PAGINAS).join(String(paginas)));

  b.h1(`${numEncerramento + 1}. ASSINATURA`);

  b.text(`${L.assinatura.cidade}, ${L.assinatura.data}.`, { center: true });
  b.y += 10;
  b.text("_______________________________________", { center: true });
  b.text(`${L.assinatura.nome} — Engenheiro Civil`, {
    bold: true,
    center: true,
  });
  b.text(`CREA: ${L.assinatura.crea}`, { center: true });

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
