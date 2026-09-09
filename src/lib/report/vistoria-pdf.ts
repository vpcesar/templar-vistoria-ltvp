import { jsPDF } from "jspdf";
import { EMPRESA } from "../laudo";
import { carregarImagemRemota, carregarLogoProposta } from "./logo";
import {
  CONTATOS_TEMPLAR,
  TAGLINE,
  montarRelatorio,
  nomeArquivoVistoria,
  rotuloStatus,
  type DadosRelatorioVistoria,
} from "./vistoria-relatorio";

const NAVY: [number, number, number] = [26, 54, 93];
const GOLD: [number, number, number] = [212, 175, 55];
const TEXT: [number, number, number] = [45, 55, 72];
const WHITE: [number, number, number] = [255, 255, 255];
const VERDE: [number, number, number] = [21, 128, 61];
const VERMELHO: [number, number, number] = [185, 28, 28];
const CINZA: [number, number, number] = [113, 128, 150];

const M = { left: 18, right: 18, top: 46, bottom: 22 };
const PAGE_W = 210;
const PAGE_H = 297;
const W = PAGE_W - M.left - M.right;

function corDoStatus(status: string): [number, number, number] {
  if (status === "conforme") return VERDE;
  if (status === "nao_conforme") return VERMELHO;
  return CINZA;
}

export async function gerarVistoriaPdf(dados: DadosRelatorioVistoria) {
  const rel = montarRelatorio(dados);
  const logo = await carregarLogoProposta();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFont("helvetica", "normal");
  let y = M.top;

  const cabecalho = () => {
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, PAGE_W, 36, "F");
    doc.setFillColor(...WHITE);
    doc.roundedRect(M.left, 5, 56, 17, 1.5, 1.5, "F");
    if (logo) {
      const ratio = logo.width / logo.height;
      const h = Math.min(11, 50 / ratio);
      const w = h * ratio;
      try {
        doc.addImage(logo.dataUrl, "JPEG", M.left + (56 - w) / 2, 13.5 - h / 2, w, h);
      } catch {
        /* segue sem logo */
      }
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...WHITE);
    doc.text(TAGLINE, M.left, 27);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("RELATÓRIO DE VISTORIA", PAGE_W - M.right, 12, { align: "right" });
    doc.setFontSize(11);
    doc.setTextColor(...GOLD);
    doc.text(rel.vistoria.numero, PAGE_W - M.right, 18.5, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...WHITE);
    let x = PAGE_W - M.right;
    [...CONTATOS_TEMPLAR].reverse().forEach((c, idx) => {
      const largura = doc.getTextWidth(c.texto);
      doc.text(c.texto, x, 27, { align: "right" });
      doc.link(x - largura, 24, largura, 4, { url: c.url });
      x -= largura + 6;
      if (idx < CONTATOS_TEMPLAR.length - 1) {
        doc.text("|", x + 3, 27, { align: "right" });
      }
    });

    doc.setFillColor(...GOLD);
    doc.rect(0, 36, PAGE_W, 1.2, "F");
  };

  const novaPagina = () => {
    doc.addPage();
    cabecalho();
    y = M.top;
  };

  cabecalho();

  const ensure = (h: number) => {
    if (y + h > PAGE_H - M.bottom) novaPagina();
  };

  const tarja = (txt: string) => {
    ensure(14);
    doc.setFillColor(...NAVY);
    doc.rect(M.left, y - 4.5, W, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...WHITE);
    doc.text(txt.toUpperCase(), M.left + 3, y + 1);
    y += 11;
  };

  const campo = (rotulo: string, valor: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...TEXT);
    const rot = `${rotulo}: `;
    const rotW = doc.getTextWidth(rot);
    const linhas = doc.splitTextToSize(valor || "—", W - rotW) as string[];
    ensure(6);
    doc.text(rot, M.left, y);
    doc.setFont("helvetica", "normal");
    doc.text(linhas[0] ?? "—", M.left + rotW, y);
    y += 5;
    linhas.slice(1).forEach((l) => {
      ensure(6);
      doc.text(l, M.left + rotW, y);
      y += 5;
    });
  };

  const paragrafo = (txt: string, indent = 0) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...TEXT);
    (doc.splitTextToSize(txt, W - indent) as string[]).forEach((linha) => {
      ensure(6);
      doc.text(linha, M.left + indent, y, { maxWidth: W - indent, align: "justify" });
      y += 4.8;
    });
  };

  // ---- dados do cabeçalho
  tarja("Dados da Vistoria");
  rel.cabecalho.forEach(([rotulo, valor]) => campo(rotulo, valor));
  if (rel.vistoria.observacoes?.trim()) {
    y += 1;
    campo("Observações", rel.vistoria.observacoes.trim());
  }
  y += 3;

  // ---- ambientes
  for (const bloco of rel.porAmbiente) {
    tarja(bloco.ambiente.nome);
    if (bloco.itens.length === 0) {
      paragrafo("Nenhum item registrado neste ambiente.");
      y += 2;
      continue;
    }
    for (const linha of bloco.itens) {
      ensure(12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...TEXT);
      doc.text(`• ${linha.titulo}`, M.left, y);
      const status = rotuloStatus(linha.item);
      doc.setTextColor(...corDoStatus(linha.item.status));
      doc.text(status, PAGE_W - M.right, y, { align: "right" });
      y += 5;
      if (linha.observacao) paragrafo(linha.observacao, 4);

      const fotos = linha.item.status === "nao_conforme" ? linha.fotos : [];
      if (fotos.length > 0) {
        const gap = 3;
        const largura = (W - gap * 3) / 4;
        const altura = largura * 0.75;
        let coluna = 0;
        ensure(altura + 4);
        for (const foto of fotos) {
          if (coluna === 4) {
            coluna = 0;
            y += altura + gap;
            ensure(altura + 4);
          }
          const img = await carregarImagemRemota(foto.url);
          const x = M.left + coluna * (largura + gap);
          if (img) {
            try {
              doc.addImage(img.dataUrl, "JPEG", x, y, largura, altura);
            } catch {
              /* ignora foto inválida */
            }
          }
          coluna += 1;
        }
        y += altura + 4;
      }
      y += 1.5;
    }
    y += 2;
  }

  if (rel.semAmbiente.length > 0) {
    tarja("Outros itens");
    rel.semAmbiente.forEach((item) => {
      ensure(8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...TEXT);
      doc.text(`• ${item.titulo || item.item}`, M.left, y);
      doc.setTextColor(...corDoStatus(item.status));
      doc.text(rotuloStatus(item), PAGE_W - M.right, y, { align: "right" });
      y += 5;
      const obs = (item.observacao_aprimorada || item.observacoes || "").trim();
      if (obs) paragrafo(obs, 4);
    });
    y += 2;
  }

  // ---- resumo
  tarja("Resumo Final");
  campo("Total de itens", String(rel.resumo.total));
  campo("Aprovados", String(rel.resumo.conformes));
  campo("Reprovados", String(rel.resumo.naoConformes));
  campo("Não se aplica", String(rel.resumo.naoAplicaveis));
  campo("Pendentes", String(rel.resumo.total - rel.resumo.avaliados));

  // ---- rodapé
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFillColor(...GOLD);
    doc.rect(0, PAGE_H - 15, PAGE_W, 1, "F");
    doc.setFillColor(...NAVY);
    doc.rect(0, PAGE_H - 14, PAGE_W, 14, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...WHITE);
    doc.text(EMPRESA.nome, M.left, PAGE_H - 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    const meio = CONTATOS_TEMPLAR.map((c) => c.texto).join("  |  ");
    doc.text(meio, PAGE_W / 2, PAGE_H - 6, { align: "center" });
    doc.text(`Página ${i} de ${total}`, PAGE_W - M.right, PAGE_H - 6, { align: "right" });
  }

  doc.save(nomeArquivoVistoria(rel.vistoria, "pdf"));
}
