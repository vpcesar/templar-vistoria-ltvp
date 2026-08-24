import { jsPDF } from "jspdf";
import { EMPRESA } from "../laudo";
import { formatarDataBR, formatarMoeda, type Proposta } from "../propostas";
import { carregarLogoProposta } from "./logo";

const NAVY: [number, number, number] = [26, 54, 93];
const BLUE: [number, number, number] = [44, 82, 130];
const GOLD: [number, number, number] = [214, 158, 46];
const TEXT: [number, number, number] = [45, 55, 72];
const FOOTER: [number, number, number] = [113, 128, 150];
const WHITE: [number, number, number] = [255, 255, 255];
const M = { left: 20, right: 20, top: 31, bottom: 29 };
const PAGE_W = 210;
const PAGE_H = 297;
const W = PAGE_W - M.left - M.right;

export async function gerarPropostaPdf(prop: Proposta) {
  const logo = await carregarLogoProposta();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFont("helvetica", "normal");
  let y = M.top;

  const desenharCabecalho = () => {
    if (logo) {
      const w = 48;
      const h = w / (logo.width / logo.height);
      try {
        doc.addImage(logo.dataUrl, logo.type.toUpperCase(), (PAGE_W - w) / 2, 6, w, h);
      } catch {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(...NAVY);
        doc.text(EMPRESA.nome, PAGE_W / 2, 15, { align: "center" });
      }
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(...NAVY);
      doc.text(EMPRESA.nome, PAGE_W / 2, 15, { align: "center" });
    }
    doc.setFillColor(...NAVY);
    doc.rect(0, 24, PAGE_W, 6, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...WHITE);
    doc.text(EMPRESA.slogan, PAGE_W / 2, 28, { align: "center" });
  };

  const novaPagina = () => {
    doc.addPage();
    desenharCabecalho();
    y = M.top + 4;
  };

  desenharCabecalho();

  const ensure = (h: number) => {
    if (y + h > PAGE_H - M.bottom) {
      novaPagina();
    }
  };

  const titulo = (txt: string) => {
    ensure(13);
    y += 3;
    doc.setFillColor(...NAVY);
    doc.rect(M.left, y - 4.5, W, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...WHITE);
    doc.text(txt.toUpperCase(), M.left + 3, y + 0.5);
    y += 9;
  };

  const texto = (
    txt: string,
    opts: {
      bold?: boolean;
      size?: number;
      center?: boolean;
      color?: [number, number, number];
    } = {},
  ) => {
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(opts.size ?? 10);
    doc.setTextColor(...(opts.color ?? TEXT));
    (doc.splitTextToSize(txt || "—", W) as string[]).forEach((linha) => {
      ensure(6);
      if (opts.center) doc.text(linha, PAGE_W / 2, y, { align: "center" });
      else doc.text(linha, M.left, y, { maxWidth: W, align: "justify" });
      y += 5;
    });
    y += 1;
  };

  const campo = (rotulo: string, valor: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...TEXT);
    const rot = `${rotulo}: `;
    const rotW = doc.getTextWidth(rot);
    const linhas = doc.splitTextToSize(valor || "—", W - rotW) as string[];
    ensure(6);
    doc.text(rot, M.left, y);
    doc.setFont("helvetica", "normal");
    doc.text(linhas[0] ?? "—", M.left + rotW, y);
    y += 5.2;
    linhas.slice(1).forEach((l) => {
      ensure(6);
      doc.text(l, M.left + rotW, y);
      y += 5.2;
    });
  };

  const campoValor = (rotulo: string, valor: string) => {
    ensure(7);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...TEXT);
    const rot = `${rotulo}: `;
    doc.text(rot, M.left, y);
    doc.setTextColor(...GOLD);
    doc.text(valor || "—", M.left + doc.getTextWidth(rot), y);
    y += 6;
  };

  const lista = (rotulo: string, conteudo: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...BLUE);
    ensure(6);
    doc.text(rotulo, M.left, y);
    y += 5.4;
    (conteudo || "—")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((linha) => {
        const limpo = linha.replace(/^[•-]\s*/, "");
        texto(`• ${limpo}`);
      });
    y += 1;
  };

  y += 8;
  texto("PROPOSTA COMERCIAL", { bold: true, size: 18, center: true, color: NAVY });
  texto(`Nº ${prop.numero}`, { bold: true, size: 14, center: true, color: GOLD });
  texto(`Data de emissão: ${formatarDataBR(prop.data_emissao)}`, {
    size: 9.5,
    center: true,
    color: FOOTER,
  });
  y += 3;

  titulo("Responsável Técnico");
  campo("Nome", prop.responsavel_tecnico_nome);
  campo("CREA", prop.responsavel_tecnico_crea);

  titulo("Dados do Cliente");
  campo("Nome", prop.cliente_nome);
  campo("CPF/CNPJ", prop.cliente_cpf ?? "");
  campo("Telefone/WhatsApp", prop.cliente_telefone ?? "");
  campo("Endereço", prop.cliente_endereco ?? "");

  titulo("Dados do Imóvel / Objeto");
  campo("Endereço", prop.imovel_endereco ?? "");
  campo("Observações", prop.imovel_observacoes ?? "");

  titulo("Serviço Contratado");
  texto(prop.tipo_servico, { bold: true });

  titulo("Escopo dos Serviços");
  texto("Objetivo", { bold: true, color: BLUE });
  texto(prop.escopo_objetivo ?? "");
  lista("Itens constantes", prop.escopo_itens_constantes ?? "");
  lista("Metodologia", prop.escopo_metodologia ?? "");
  lista("Entregáveis", prop.escopo_entregaveis ?? "");

  titulo("Valores e Condições");
  campoValor("Valor total", formatarMoeda(Number(prop.valor_total)));
  campo("Condições de pagamento", prop.condicoes_pagamento ?? "");
  campo("Validade da proposta", `${prop.validade_dias} dias`);
  campo("Prazo de execução", prop.prazo_execucao ?? "");

  titulo("Não Incluído");
  lista("Itens não incluídos", prop.nao_incluido ?? "—");

  // Rodapé em todas as páginas
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(...NAVY);
    doc.setLineWidth(0.3);
    doc.line(M.left, PAGE_H - 20, PAGE_W - M.right, PAGE_H - 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...BLUE);
    const links = [
      { text: EMPRESA.site, url: EMPRESA.siteUrl },
      { text: EMPRESA.email, url: `mailto:${EMPRESA.email}` },
      { text: EMPRESA.whats, url: EMPRESA.whatsUrl },
    ];
    const separator = "   |   ";
    const totalWidth =
      links.reduce((sum, link) => sum + doc.getTextWidth(link.text), 0) +
      doc.getTextWidth(separator) * 2;
    let linkX = (PAGE_W - totalWidth) / 2;
    links.forEach((link, index) => {
      doc.textWithLink(link.text, linkX, PAGE_H - 15, { url: link.url });
      const linkWidth = doc.getTextWidth(link.text);
      doc.line(linkX, PAGE_H - 14.5, linkX + linkWidth, PAGE_H - 14.5);
      linkX += linkWidth;
      if (index < links.length - 1) {
        doc.setTextColor(...FOOTER);
        doc.text(separator, linkX, PAGE_H - 15);
        linkX += doc.getTextWidth(separator);
        doc.setTextColor(...BLUE);
      }
    });
    doc.setTextColor(...FOOTER);
    doc.text(`Proposta ${prop.numero} • Página ${i} de ${total}`, PAGE_W / 2, PAGE_H - 10, {
      align: "center",
    });
  }

  doc.save(`Proposta-${prop.numero}.pdf`);
}
