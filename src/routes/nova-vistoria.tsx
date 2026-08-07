import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AppShell } from "@/components/AppShell";
import { Field } from "@/components/InfoTip";
import { PatologiaForm } from "@/components/PatologiaForm";
import { SearchSelect, TripleToggle } from "@/components/fields";
import { ANAMNESE_ITENS, PAVIMENTOS, TIPOS_EDIFICACAO, TOOLTIPS } from "@/lib/catalogos";
import {
  novaVistoria,
  obterVistoria,
  patologiaVazia,
  salvarVistoria,
  salvarVistoriaSegura,
} from "@/lib/storage";
import { gutTotal, riscoDe, type Patologia, type Vistoria } from "@/lib/types";

export const Route = createFileRoute("/nova-vistoria")({
  validateSearch: z.object({ id: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Coleta de Campo | TEMPLAR ENGENHARIA" },
      {
        name: "description",
        content:
          "Registro de campo de patologias construtivas com fotos, matriz GUT e sugestões técnicas por IA.",
      },
      { property: "og:title", content: "Coleta de Campo | TEMPLAR ENGENHARIA" },
      {
        property: "og:description",
        content: "Registre patologias, fotos e classificação de risco direto do celular.",
      },
    ],
  }),
  component: NovaVistoria,
});

const PASSOS = ["Imóvel", "Anamnese", "Patologias", "Finalizar"];

function NovaVistoria() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const [vistoria, setVistoria] = useState<Vistoria | null>(null);
  const [passo, setPasso] = useState(0);
  const [editando, setEditando] = useState<Patologia | null>(null);
  const [modo, setModo] = useState<"novo" | "editar">("novo");
  const [excluindo, setExcluindo] = useState<Patologia | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const existente = id ? obterVistoria(id) : undefined;
    const v = existente ?? novaVistoria();
    setVistoria(v);
    if (!existente) {
      try {
        salvarVistoria(v);
      } catch {
        /* rascunho fica apenas em memória se o armazenamento estiver cheio */
      }
    }
  }, [id]);

  if (!vistoria) return null;

  const persistir = (v: Vistoria) => {
    const atualizada = { ...v, atualizadoEm: new Date().toISOString() };
    setVistoria(atualizada);
    try {
      salvarVistoria(atualizada);
    } catch {
      /* rascunho segue em memória; a compactação acontece ao finalizar */
    }
    return atualizada;
  };

  const setImovel = <K extends keyof Vistoria["imovel"]>(k: K, val: Vistoria["imovel"][K]) =>
    persistir({ ...vistoria, imovel: { ...vistoria.imovel, [k]: val } });

  const salvarPatologia = (p: Patologia) => {
    const existe = vistoria.patologias.some((x) => x.id === p.id);
    persistir({
      ...vistoria,
      patologias: existe
        ? vistoria.patologias.map((x) => (x.id === p.id ? p : x))
        : [...vistoria.patologias, p],
    });
    setEditando(null);
    setModo("novo");
    setPasso(2);
    toast.success(existe ? "Patologia atualizada!" : "Patologia salva!", { duration: 3000 });
  };

  const confirmarExclusao = () => {
    if (!excluindo) return;
    persistir({
      ...vistoria,
      patologias: vistoria.patologias.filter((x) => x.id !== excluindo.id),
    });
    setExcluindo(null);
    toast.success("Patologia excluída.");
  };

  const finalizar = async () => {
    if (vistoria.patologias.length === 0) {
      toast.error("Registre ao menos uma patologia antes de finalizar.");
      return;
    }
    setSalvando(true);
    const res = await salvarVistoriaSegura({ ...vistoria, status: "AGUARDANDO REVISAO" });
    setSalvando(false);
    if (!res.ok) {
      toast.error(res.erro);
      return;
    }
    setVistoria(res.vistoria);
    setEditando(null);
    toast.success("Coleta finalizada! Revise as informações no escritório para gerar o laudo.");
    navigate({ to: "/" });
  };


  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Coleta de Campo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Etapa {passo + 1} de {PASSOS.length} — {PASSOS[passo]}
          </p>
          <div className="mt-3 flex gap-1.5">
            {PASSOS.map((p, i) => (
              <button
                key={p}
                type="button"
                onClick={() => setPasso(i)}
                className={`h-1.5 flex-1 rounded-full transition ${
                  i <= passo ? "bg-primary" : "bg-border"
                }`}
                aria-label={`Ir para etapa ${p}`}
              />
            ))}
          </div>
        </div>

        {passo === 0 && (
          <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-card sm:p-6">
            <Field label="Tipo de edificação" tip={TOOLTIPS.tipoEdificacao}>
              <SearchSelect
                value={vistoria.imovel.tipoEdificacao}
                onChange={(v) => setImovel("tipoEdificacao", v)}
                options={TIPOS_EDIFICACAO}
                campo="tiposEdificacao"
                allowAdd
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="CEP">
                <Input
                  value={vistoria.imovel.cep}
                  inputMode="numeric"
                  onChange={(e) => setImovel("cep", e.target.value)}
                />
              </Field>
              <Field label="Logradouro">
                <Input
                  value={vistoria.imovel.logradouro}
                  onChange={(e) => setImovel("logradouro", e.target.value)}
                />
              </Field>
              <Field label="Número">
                <Input
                  value={vistoria.imovel.numero}
                  onChange={(e) => setImovel("numero", e.target.value)}
                />
              </Field>
              <Field label="Bairro">
                <Input
                  value={vistoria.imovel.bairro}
                  onChange={(e) => setImovel("bairro", e.target.value)}
                />
              </Field>
              <Field label="Cidade">
                <Input
                  value={vistoria.imovel.cidade}
                  onChange={(e) => setImovel("cidade", e.target.value)}
                />
              </Field>
              <Field label="UF">
                <Input
                  value={vistoria.imovel.uf}
                  maxLength={2}
                  onChange={(e) => setImovel("uf", e.target.value.toUpperCase())}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Idade aparente (anos)" tip={TOOLTIPS.idadeAparente}>
                <Input
                  type="number"
                  min={0}
                  value={vistoria.imovel.idadeAparente}
                  onChange={(e) => setImovel("idadeAparente", Number(e.target.value))}
                />
              </Field>
              <Field label="Pavimentos">
                <SearchSelect
                  value={vistoria.imovel.pavimentos}
                  onChange={(v) => setImovel("pavimentos", v)}
                  options={PAVIMENTOS}
                />
              </Field>
              <Field label="Área construída (m²)">
                <Input
                  value={vistoria.imovel.areaConstruida}
                  inputMode="decimal"
                  onChange={(e) => setImovel("areaConstruida", e.target.value)}
                />
              </Field>
              <Field label="Data da vistoria">
                <Input
                  type="date"
                  value={vistoria.imovel.dataVistoria}
                  onChange={(e) => setImovel("dataVistoria", e.target.value)}
                />
              </Field>
              <Field label="Solicitante / proprietário">
                <Input
                  value={vistoria.imovel.proprietario}
                  onChange={(e) => setImovel("proprietario", e.target.value)}
                />
              </Field>
              <Field label="Responsável técnico">
                <Input
                  value={vistoria.imovel.inspetor}
                  onChange={(e) => setImovel("inspetor", e.target.value)}
                />
              </Field>
              <Field label="CREA">
                <Input
                  value={vistoria.imovel.crea}
                  onChange={(e) => setImovel("crea", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Observações gerais do imóvel">
              <Textarea
                rows={3}
                value={vistoria.imovel.observacoes ?? ""}
                onChange={(e) => setImovel("observacoes", e.target.value)}
              />
            </Field>
          </div>
        )}

        {passo === 1 && (
          <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-card sm:p-6">
            <p className="text-sm text-muted-foreground">
              Anamnese prévia com o usuário da edificação (histórico e uso), conforme NBR 16747.
            </p>
            {ANAMNESE_ITENS.map((item) => (
              <Field key={item.id} label={item.pergunta} tip={item.tip}>
                <TripleToggle
                  value={vistoria.anamnese.respostas[item.id]}
                  onChange={(val) =>
                    persistir({
                      ...vistoria,
                      anamnese: {
                        ...vistoria.anamnese,
                        respostas: { ...vistoria.anamnese.respostas, [item.id]: val },
                      },
                    })
                  }
                />
              </Field>
            ))}
            <Field label="Observações da anamnese">
              <Textarea
                rows={3}
                value={vistoria.anamnese.observacoes ?? ""}
                onChange={(e) =>
                  persistir({
                    ...vistoria,
                    anamnese: { ...vistoria.anamnese, observacoes: e.target.value },
                  })
                }
              />
            </Field>
          </div>
        )}

        {passo === 2 && (
          <div className="space-y-4">
            {editando ? (
              <PatologiaForm
                inicial={editando}
                imovel={vistoria.imovel}
                onSalvar={salvarPatologia}
                onCancelar={() => setEditando(null)}
              />
            ) : (
              <>
                <p className="text-sm font-semibold text-muted-foreground">
                  {vistoria.patologias.length}{" "}
                  {vistoria.patologias.length === 1
                    ? "patologia registrada"
                    : "patologias registradas"}
                </p>

                <Button
                  className="min-h-14 w-full text-base"
                  onClick={() => setEditando(patologiaVazia())}
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Adicionar nova patologia
                </Button>

                {vistoria.patologias.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                    Nenhuma patologia registrada nesta vistoria.
                  </div>
                )}

                {vistoria.patologias.map((p) => {
                  const risco = riscoDe(gutTotal(p));
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setEditando(p)}
                      className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left shadow-card transition hover:border-primary"
                    >
                      {p.fotos[0] ? (
                        <img
                          src={p.fotos[0].dataUrl}
                          alt={`Registro de ${p.elemento}`}
                          className="h-14 w-14 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-14 w-14 shrink-0 rounded-lg bg-muted" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-foreground">{p.elemento}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {p.local} • {p.manifestacoes.join(", ")}
                        </p>
                      </div>
                      <Badge
                        className={
                          risco.tone === "critico"
                            ? "bg-risk-high"
                            : risco.tone === "medio"
                              ? "bg-risk-mid"
                              : "bg-risk-low"
                        }
                      >
                        {gutTotal(p)}
                      </Badge>
                    </button>
                  );
                })}

                {vistoria.patologias.length > 0 && (
                  <Button variant="outline" className="min-h-12 w-full" onClick={finalizar}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Finalizar coleta
                  </Button>
                )}
              </>
            )}
          </div>
        )}

        {passo === 3 && (
          <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-card sm:p-6">
            <h2 className="text-base font-bold text-foreground">Resumo da coleta</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Solicitante: {vistoria.imovel.proprietario || "—"}</p>
              <p>Patologias registradas: {vistoria.patologias.length}</p>
              <p>
                Itens de anamnese respondidos: {Object.keys(vistoria.anamnese.respostas).length} de{" "}
                {ANAMNESE_ITENS.length}
              </p>
            </div>
            <Button className="min-h-12 w-full" onClick={finalizar}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Finalizar coleta e revisar
            </Button>
          </div>
        )}

        {!editando && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="min-h-12 flex-1"
              onClick={() => setPasso((p) => Math.max(0, p - 1))}
              disabled={passo === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button
              className="min-h-12 flex-1"
              onClick={() => setPasso((p) => Math.min(PASSOS.length - 1, p + 1))}
              disabled={passo === PASSOS.length - 1}
            >
              Avançar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
