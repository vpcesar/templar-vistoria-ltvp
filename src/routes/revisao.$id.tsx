import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, FileDown, FileText, Loader2, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AppShell } from "@/components/AppShell";
import { LaudoEditor } from "@/components/LaudoEditor";
import { obterVistoria, salvarVistoria } from "@/lib/storage";
import {
  enderecoCompleto,
  gutTotal,
  riscoDe,
  type ItemAdicional,
  type Vistoria,
} from "@/lib/types";
import { formatarData, grauRiscoGlobal, patologiasOrdenadas } from "@/lib/laudo";
import { resolverLaudo, type LaudoEditavel } from "@/lib/laudo-editavel";

export const Route = createFileRoute("/revisao/$id")({
  head: () => ({
    meta: [
      { title: "Revisão e Laudo LTVP | TEMPLAR ENGENHARIA" },
      {
        name: "description",
        content:
          "Revisão técnica da vistoria predial e geração do Laudo Técnico de Vistoria Predial em Word ou PDF.",
      },
      { property: "og:title", content: "Revisão e Laudo LTVP | TEMPLAR ENGENHARIA" },
      {
        property: "og:description",
        content: "Confira prioridades pela matriz GUT e emita o laudo técnico completo.",
      },
    ],
  }),
  component: Revisao,
});

function Revisao() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [vistoria, setVistoria] = useState<Vistoria | null>(null);
  const [laudo, setLaudo] = useState<LaudoEditavel | null>(null);
  const [gerando, setGerando] = useState<"docx" | "pdf" | null>(null);
  const [tituloItem, setTituloItem] = useState("");
  const [conteudoItem, setConteudoItem] = useState("");
  const [editandoItemId, setEditandoItemId] = useState<string | null>(null);
  const carregado = useRef(false);

  useEffect(() => {
    const v = obterVistoria(id) ?? null;
    setVistoria(v);
    setLaudo(v ? resolverLaudo(v) : null);
    carregado.current = false;
  }, [id]);

  // Persiste as edições do laudo na vistoria (localStorage).
  useEffect(() => {
    if (!vistoria || !laudo) return;
    if (!carregado.current) {
      carregado.current = true;
      return;
    }
    const atualizada: Vistoria = { ...vistoria, laudoEditavel: laudo };
    salvarVistoria(atualizada);
    setVistoria(atualizada);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [laudo]);

  if (!vistoria || !laudo) {
    return (
      <AppShell>
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm font-medium text-foreground">Vistoria não encontrada</p>
          <Button asChild variant="outline" className="mt-4 min-h-11">
            <Link to="/">Voltar ao início</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const ordenadas = patologiasOrdenadas(vistoria);
  const risco = grauRiscoGlobal(vistoria);
  const itensAdicionais = vistoria.itensAdicionais ?? [];

  const persistirItens = (itens: ItemAdicional[]) => {
    const atualizada: Vistoria = {
      ...vistoria,
      itensAdicionais: itens,
      laudoEditavel: laudo,
      atualizadoEm: new Date().toISOString(),
    };
    salvarVistoria(atualizada);
    setVistoria(atualizada);
  };

  const salvarItem = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const titulo = tituloItem.trim();
    const conteudo = conteudoItem.trim();
    if (!titulo || !conteudo) {
      toast.error("Preencha o título e o conteúdo.");
      return;
    }
    if (editandoItemId) {
      persistirItens(
        itensAdicionais.map((item) =>
          item.id === editandoItemId ? { ...item, titulo, conteudo } : item,
        ),
      );
      toast.success("Item atualizado.");
    } else {
      persistirItens([
        ...itensAdicionais,
        { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, titulo, conteudo },
      ]);
      toast.success("Item adicionado ao laudo.");
    }
    setTituloItem("");
    setConteudoItem("");
    setEditandoItemId(null);
  };

  const editarItem = (e: React.MouseEvent<HTMLButtonElement>, item: ItemAdicional) => {
    e.preventDefault();
    e.stopPropagation();
    setTituloItem(item.titulo);
    setConteudoItem(item.conteudo);
    setEditandoItemId(item.id);
  };

  const removerItem = (e: React.MouseEvent<HTMLButtonElement>, itemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    persistirItens(itensAdicionais.filter((i) => i.id !== itemId));
    if (editandoItemId === itemId) {
      setTituloItem("");
      setConteudoItem("");
      setEditandoItemId(null);
    }
    toast.success("Item removido do laudo.");
  };

  const paraLaudo = (): Vistoria => ({ ...vistoria, laudoEditavel: laudo });

  const concluir = () => {
    const atualizada: Vistoria = {
      ...paraLaudo(),
      status: "CONCLUIDA",
      atualizadoEm: new Date().toISOString(),
    };
    salvarVistoria(atualizada);
    setVistoria(atualizada);
  };

  const exportarDocx = async () => {
    setGerando("docx");
    try {
      const { gerarDocx } = await import("@/lib/report/docx");
      await gerarDocx(paraLaudo());

      concluir();
      toast.success("Laudo em Word gerado");
    } catch {
      toast.error("Não foi possível gerar o documento Word.");
    }
    setGerando(null);
  };

  const exportarPdf = async () => {
    setGerando("pdf");
    try {
      const { gerarPdf } = await import("@/lib/report/pdf");
      await gerarPdf(paraLaudo());
      concluir();
      toast.success("Laudo em PDF gerado");
    } catch {
      toast.error("Não foi possível gerar o PDF.");
    }
    setGerando(null);
  };

  const atualizarLaudo = (fn: (anterior: LaudoEditavel) => LaudoEditavel) =>
    setLaudo((prev) => (prev ? fn(prev) : prev));

  return (
    <AppShell>
      <div className="space-y-6">
        <Button
          variant="ghost"
          className="min-h-10 px-0 text-muted-foreground"
          onClick={() => navigate({ to: "/" })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Minhas vistorias
        </Button>

        <div className="rounded-xl border border-border bg-card p-4 shadow-card sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Revisão técnica
              </p>
              <h1 className="mt-1 text-xl font-bold text-foreground">
                {vistoria.imovel.proprietario || "Solicitante não informado"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {enderecoCompleto(vistoria.imovel) || "Endereço não informado"}
              </p>
            </div>
            <Badge variant="outline">
              {vistoria.status === "AGUARDANDO REVISAO" ? "AGUARDANDO REVISÃO" : vistoria.status}
            </Badge>
          </div>

          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            {[
              ["Data da vistoria", formatarData(vistoria.imovel.dataVistoria)],
              ["Responsável técnico", vistoria.imovel.inspetor || "—"],
              ["Nível de inspeção", "Nível 1"],
              ["Grau de risco global", risco.label],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-border bg-muted/40 p-3">
                <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</dt>
                <dd className="mt-0.5 font-medium text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <h2 className="text-base font-bold text-foreground">
            Lista de prioridades ({ordenadas.length})
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ordenada pela pontuação da matriz GUT (Gravidade × Urgência × Tendência).
          </p>

          <div className="mt-3 space-y-3">
            {ordenadas.map((p, i) => {
              const r = riscoDe(gutTotal(p));
              return (
                <div key={p.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground">
                        {i + 1}º — {p.elemento}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {p.local} • {p.posicao}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold text-primary-foreground ${
                        r.tone === "critico"
                          ? "bg-risk-high"
                          : r.tone === "medio"
                            ? "bg-risk-mid"
                            : "bg-risk-low"
                      }`}
                    >
                      GUT {gutTotal(p)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Manifestações: </span>
                    {p.manifestacoes.join("; ") || "—"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Classificação: </span>
                    {p.classificacao || "—"}
                  </p>
                  {p.fotos.length > 0 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto">
                      {p.fotos.map((f) => (
                        <img
                          key={f.id}
                          src={f.dataUrl}
                          alt={`Registro de ${p.elemento} em ${p.local}`}
                          className="h-16 w-24 shrink-0 rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  )}
                  <Button asChild variant="outline" size="sm" className="mt-3 min-h-10">
                    <Link to="/nova-vistoria" search={{ id: vistoria.id }}>
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Editar na coleta
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        <LaudoEditor
          laudo={laudo}
          setLaudo={atualizarLaudo}
          numeroItensAdicionais={
            itensAdicionais.filter((i) => i.titulo.trim() || i.conteudo.trim()).length
          }
          slotItensAdicionais={
            <div>
              <p className="text-sm text-muted-foreground">
                Incluídos como seções principais, antes do encerramento.
              </p>

              <div className="mt-4 space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="titulo-item-adicional">Título do item adicional</Label>
                  <Input
                    id="titulo-item-adicional"
                    type="text"
                    value={tituloItem}
                    onChange={(e) => setTituloItem(e.target.value)}
                    placeholder="Ex.: Ressalvas, Considerações Finais..."
                    className="min-h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="conteudo-item-adicional">Conteúdo do item</Label>
                  <Textarea
                    id="conteudo-item-adicional"
                    rows={5}
                    value={conteudoItem}
                    onChange={(e) => setConteudoItem(e.target.value)}
                    placeholder="Digite aqui o conteúdo que será incluído no laudo..."
                  />
                </div>
                <Button type="button" className="min-h-11 w-full sm:w-auto" onClick={salvarItem}>
                  {editandoItemId ? (
                    <Save className="mr-2 h-4 w-4" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {editandoItemId ? "Salvar edição" : "Adicionar item"}
                </Button>
              </div>

              {itensAdicionais.length > 0 && (
                <ul className="mt-4 space-y-3">
                  {itensAdicionais.map((item) => (
                    <li key={item.id} className="rounded-lg border border-border bg-muted/40 p-3">
                      <p className="text-sm font-bold text-foreground">{item.titulo}</p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                        {item.conteudo}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="min-h-10"
                          onClick={(e) => editarItem(e, item)}
                        >
                          <Pencil className="mr-1.5 h-3.5 w-3.5" />
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="min-h-10"
                          onClick={(e) => removerItem(e, item.id)}
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          Remover
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          }
        />

        <div className="sticky bottom-4 flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-card sm:flex-row">
          <Button className="min-h-12 flex-1" onClick={exportarDocx} disabled={gerando !== null}>
            {gerando === "docx" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            Gerar LTVP (Word)
          </Button>
          <Button
            variant="outline"
            className="min-h-12 flex-1"
            onClick={exportarPdf}
            disabled={gerando !== null}
          >
            {gerando === "pdf" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            Gerar LTVP (PDF)
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
