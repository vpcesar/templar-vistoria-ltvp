import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardList, FileText, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/AppShell";
import { excluirVistoria, listarVistorias } from "@/lib/storage";
import { enderecoCompleto, gutTotal, riscoDe, type Vistoria } from "@/lib/types";
import { formatarData } from "@/lib/laudo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vistorias Prediais | TEMPLAR ENGENHARIA" },
      {
        name: "description",
        content:
          "Plataforma de vistorias de campo da TEMPLAR ENGENHARIA: coleta em campo, matriz GUT e laudos LTVP conforme ABNT e IBAPE.",
      },
      { property: "og:title", content: "Vistorias Prediais | TEMPLAR ENGENHARIA" },
      {
        property: "og:description",
        content: "Coleta de campo, análise de risco e geração de laudos técnicos LTVP.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [vistorias, setVistorias] = useState<Vistoria[]>([]);

  useEffect(() => setVistorias(listarVistorias()), []);

  const remover = (id: string) => {
    excluirVistoria(id);
    setVistorias(listarVistorias());
  };

  const criticas = vistorias.filter((v) =>
    v.patologias.some((p) => gutTotal(p) >= 81),
  ).length;
  const revisao = vistorias.filter((v) => v.status === "AGUARDANDO REVISAO").length;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Laudo Técnico de Vistoria Predial
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">Minhas Vistorias</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Colete em campo, revise no escritório e gere o LTVP em Word ou PDF.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Vistorias", valor: vistorias.length, icon: ClipboardList },
            { label: "Em revisão", valor: revisao, icon: FileText },
            { label: "Com risco crítico", valor: criticas, icon: AlertTriangle },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-3 shadow-card">
              <s.icon className="h-4 w-4 text-primary" />
              <p className="mt-2 text-xl font-bold text-foreground">{s.valor}</p>
              <p className="text-[11px] leading-tight text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <Button asChild className="min-h-14 w-full text-base">
          <Link to="/nova-vistoria">
            <Plus className="mr-2 h-5 w-5" />
            Nova Vistoria
          </Link>
        </Button>

        <div className="space-y-3">
          {vistorias.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
              <ClipboardList className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium text-foreground">Nenhuma vistoria registrada</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Inicie uma nova vistoria para começar a coleta de campo.
              </p>
            </div>
          )}

          {vistorias.map((v) => {
            const maior = Math.max(0, ...v.patologias.map(gutTotal));
            const risco = riscoDe(maior);
            return (
              <div key={v.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">
                      {v.imovel.proprietario || "Solicitante não informado"}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {enderecoCompleto(v.imovel) || "Endereço não informado"}
                    </p>
                  </div>
                  <Badge variant={v.status === "CONCLUIDA" ? "secondary" : "outline"}>
                    {v.status}
                  </Badge>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatarData(v.imovel.dataVistoria)}</span>
                  <span>•</span>
                  <span>{v.patologias.length} patologia(s)</span>
                  {v.patologias.length > 0 && (
                    <span
                      className={`rounded-full px-2 py-0.5 font-semibold text-primary-foreground ${
                        risco.tone === "critico"
                          ? "bg-risk-high"
                          : risco.tone === "medio"
                            ? "bg-risk-mid"
                            : "bg-risk-low"
                      }`}
                    >
                      {risco.label}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline" className="min-h-10">
                    <Link to="/nova-vistoria" search={{ id: v.id }}>
                      Continuar coleta
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="min-h-10">
                    <Link to="/revisao/$id" params={{ id: v.id }}>
                      <CheckCircle2 className="mr-1.5 h-4 w-4" />
                      Revisar e gerar laudo
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="min-h-10 text-destructive"
                    onClick={() => remover(v.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
