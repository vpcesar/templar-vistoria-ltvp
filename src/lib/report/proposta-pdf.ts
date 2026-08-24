import { jsPDF } from "jspdf";
import { EMPRESA } from "../laudo";
import { formatarDataBR, formatarMoeda, type Proposta } from "../propostas";
import { carregarLogo } from "./logo";

const BRAND: [number, number, number] = [139, 26, 26];
const SLATE: [number, number, number] = [45, 55, 72];
const M = { left: 20, right: 20, top: 30, bottom: 25 };
const PAGE_W = 210;
const PAGE_H = 297;
const W = PAGE_W - M.left - M.right;

export async function gerarPropostaPdf(prop: Proposta) {
  const logo = await carregarLogo();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFont("helvetica", "normal");
  let y = M.top;

  const ensure = (h: number) => {
    if (y + h > PAGE_H - M.bottom) {
      doc.addPage();
      y = M.top;
    }
  };

  const titulo = (txt: string) => {
    ensure(12);
    y += 3;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(...BRAND);
    doc.text(txt.toUpperCase(), M.left, y);
    doc.setDrawColor(...BRAND);
    doc.line(M.left, y + 1.5, PAGE_W - M.right, y + 1.5);
    y += 7;
  };

  const texto = (txt: string, opts: { bold?: boolean; size?: number; center?: boolean } = {}) => {
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(opts.size ?? 10.5);
    doc.setTextColor(...SLATE);
    (doc.splitTextToSize(txt || "—", W) as string[]).forEach((linha) => {
      ensure(6);
      if (opts.center) doc.text(linha, PAGE_W / 2, y, { align: "center" });
      else doc.text(linha, M.left, y);
      y += 5.2;
    });
    y += 1.2;
  };

  const campo = (rotulo: string, valor: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...SLATE);
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

  const lista = (rotulo: string, conteudo: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...BRAND);
    ensure(6);
    doc.text(rotulo, M.left, y);
    y += 5.4;
    (conteudo || "—")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((linha) => {
        const marcado = linha.startsWith("•") || linha.startsWith("-");
        texto(marcado ? linha : `• ${linha}`);
      });
    y += 1;
  };

  // Cabeçalho da primeira página
  if (logo) {
    const ratio = logo.width / logo.height;
    const h = 22;
    const w = Math.min(ratio * h, 70);
    try {
      doc.addImage(logo.dataUrl, (PAGE_W - w) / 2, y, w, h);
      y += h + 4;
    } catch {
      /* logo inválido ignorado */
    }
  }
  texto(EMPRESA.nome, { bold: true, size: 15, center: true });
  texto(EMPRESA.slogan, { size: 9.5, center: true });
  y += 2;
  texto(`PROPOSTA COMERCIAL — Nº ${prop.numero}`, { bold: true, size: 12.5, center: true });
  texto(`Data: ${formatarDataBR(prop.data_emissao)}`, { size: 10, center: true });
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
  texto(prop.escopo_objetivo ?? "");
  lista("Itens constantes", prop.escopo_itens_constantes ?? "");
  lista("Metodologia", prop.escopo_metodologia ?? "");
  lista("Entregáveis", prop.escopo_entregaveis ?? "");

  titulo("Valores e Condições");
  campo("Valor total", formatarMoeda(prop.valor_total));
  campo("Condições de pagamento", prop.condicoes_pagamento ?? "");
  campo("Validade da proposta", `${prop.validade_dias} dias`);
  campo("Prazo de execução", prop.prazo_execucao ?? "");

  titulo("Não Incluído");
  (prop.nao_incluido ?? "—")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((l) => texto(l));

  // Rodapé em todas as páginas
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(...BRAND);
    doc.line(M.left, PAGE_H - 20, PAGE_W - M.right, PAGE_H - 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...BRAND);
    doc.textWithLink(EMPRESA.site, M.left, PAGE_H - 15, { url: EMPRESA.siteUrl });
    doc.textWithLink(EMPRESA.email, PAGE_W / 2, PAGE_H - 15, {
      url: `mailto:${EMPRESA.email}`,
      align: "center",
    });
    doc.textWithLink(EMPRESA.whats, PAGE_W - M.right - 32, PAGE_H - 15, { url: EMPRESA.whatsUrl });
    doc.setTextColor(...SLATE);
    doc.text(`Proposta ${prop.numero} • Página ${i} de ${total}`, PAGE_W / 2, PAGE_H - 10, {
      align: "center",
    });
  }

  doc.save(`Proposta-${prop.numero}.pdf`);
}
