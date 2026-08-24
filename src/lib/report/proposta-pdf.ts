import { jsPDF } from "jspdf";
import { EMPRESA } from "../laudo";
import { formatarDataBR, formatarMoeda, type Proposta } from "../propostas";
import { carregarLogoProposta } from "./logo";

const NAVY: [number, number, number] = [26, 54, 93];
const BLUE: [number, number, number] = [44, 82, 130];
const GOLD: [number, number, number] = [212, 175, 55];
const TEXT: [number, number, number] = [45, 55, 72];
const FOOTER: [number, number, number] = [113, 128, 150];
const WHITE: [number, number, number] = [255, 255, 255];
const M = { left: 20, right: 20, top: 38, bottom: 25 };
const PAGE_W = 210;
const PAGE_H = 297;
const W = PAGE_W - M.left - M.right;

export async function gerarPropostaPdf(prop: Proposta) {
  const logo = await carregarLogoProposta();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFont("helvetica", "normal");
  let y = M.top;

  const desenharCabecalho = () => {
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, PAGE_W, 29, "F");
    doc.setFillColor(...WHITE);
    doc.roundedRect(M.left, 5, 54, 18, 1.5, 1.5, "F");
    if (logo) {
      const maxW = 48;
      const maxH = 12;
      const ratio = logo.width / logo.height;
      const w = Math.min(maxW, maxH * ratio);
      const h = w / ratio;
      try {
        doc.addImage(
          logo.dataUrl,
          logo.type.toUpperCase(),
          M.left + (54 - w) / 2,
          14 - h / 2,
          w,
          h,
        );
      } catch {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...NAVY);
        doc.text(EMPRESA.nome, M.left + 27, 15, { align: "center" });
      }
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...NAVY);
      doc.text(EMPRESA.nome, M.left + 27, 15, { align: "center" });
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...WHITE);
    doc.text(EMPRESA.nome, PAGE_W - M.right, 12, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(EMPRESA.slogan, PAGE_W - M.right, 17, { align: "right" });
    doc.setFillColor(...GOLD);
    doc.rect(0, 29, PAGE_W, 1, "F");
  };

  const novaPagina = () => {
    doc.addPage();
    desenharCabecalho();
    y = M.top;
  };

  desenharCabecalho();

  const ensure = (h: number) => {
    if (y + h > PAGE_H - M.bottom) {
      novaPagina();
    }
  };

  const titulo = (txt: string) => {
    ensure(10);
    y += 3;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...NAVY);
    const label = txt.toUpperCase();
    doc.text(label, M.left, y);
    const start = M.left + doc.getTextWidth(label) + 4;
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.35);
    doc.line(start, y - 1, PAGE_W - M.right, y - 1);
    y += 7;
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

  y += 4;
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
    doc.setFillColor(...GOLD);
    doc.rect(0, PAGE_H - 16, PAGE_W, 1, "F");
    doc.setFillColor(...NAVY);
    doc.rect(0, PAGE_H - 15, PAGE_W, 15, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...WHITE);
    const links = [
      { text: "www.templarengenharia.com.br", url: "https://www.templarengenharia.com.br", x: 30 },
      {
        text: "templarengenharia@hotmail.com",
        url: "mailto:templarengenharia@hotmail.com",
        x: 95,
      },
      { text: "WhatsApp (21) 98180-8812", url: "https://wa.me/5521981808812", x: 155 },
    ];
    links.forEach((link) => {
      const linkWidth = doc.getTextWidth(link.text);
      doc.text(link.text, link.x, PAGE_H - 9.2, { align: "center" });
      doc.link(link.x - linkWidth / 2, PAGE_H - 12.3, linkWidth, 4, { url: link.url });
    });
    doc.setFontSize(7);
    doc.setTextColor(...WHITE);
    doc.text(`Proposta ${prop.numero} • Página ${i} de ${total}`, PAGE_W / 2, PAGE_H - 3.2, {
      align: "center",
    });
  }

  doc.save(`Proposta-${prop.numero}.pdf`);
}
