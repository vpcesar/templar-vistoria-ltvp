import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarClock,
  FileSignature,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Users,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErpShell } from "@/components/ErpShell";
import { LeadFormDialog } from "@/components/crm/LeadFormDialog";
import {
  INTERACAO_TIPOS,
  LEAD_STATUS,
  ORIGEM_LABEL,
  STATUS_CLASSE,
  STATUS_LABEL,
  TIPO_INTERACAO_LABEL,
  atualizarLead,
  criarInteracao,
  formatarDataHora,
  listarInteracoes,
  obterLead,
  type InteracaoTipo,
  type LeadInput,
  type LeadStatus,
} from "@/lib/crm";

export const Route = createFileRoute("/crm/$id")({
  head: () => ({
    meta: [
      { title: "Detalhe do Lead | CRM TEMPLAR ENGENHARIA" },
      {
        name: "description",
        content:
          "Dados do lead, timeline de interações e próximas ações comerciais no CRM da TEMPLAR ENGENHARIA.",
      },
      { property: "og:title", content: "Detalhe do Lead | CRM TEMPLAR ENGENHARIA" },
      {
        property: "og:description",
        content: "Dados, interações e ações comerciais do lead.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeadDetalhe,
});

const ICONE_TIPO: Record<InteracaoTipo, typeof Phone> = {
  whatsapp: MessageCircle,
  email: Mail,
  telefone: Phone,
  visita: Users,
  reuniao: Video,
};

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function LeadDetalhe() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const [editar, setEditar] = useState(false);
  const [interacaoAberta, setInteracaoAberta] = useState(false);
  const [tipo, setTipo] = useState<InteracaoTipo>("whatsapp");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState(hojeISO());

  const leadQuery = useQuery({ queryKey: ["lead", id], queryFn: () => obterLead(id) });
  const interacoesQuery = useQuery({
    queryKey: ["interacoes", id],
    queryFn: () => listarInteracoes(id),
  });

  const salvar = useMutation({
    mutationFn: (input: Partial<LeadInput>) => atualizarLead(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", id] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setEditar(false);
      toast.success("Lead atualizado.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const registrar = useMutation({
    mutationFn: () =>
      criarInteracao({
        lead_id: id,
        tipo,
        descricao: descricao.trim(),
        data_interacao: new Date(`${data}T12:00:00`).toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interacoes", id] });
      setInteracaoAberta(false);
      setDescricao("");
      setData(hojeISO());
      toast.success("Interação registrada.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const lead = leadQuery.data;

  return (
    <ErpShell>
      <div className="space-y-5">
        <Link
          to="/crm"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para leads
        </Link>

        {leadQuery.isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

        {leadQuery.isError && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {(leadQuery.error as Error).message}
          </p>
        )}

        {!leadQuery.isLoading && !lead && !leadQuery.isError && (
          <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Lead não encontrado.
          </p>
        )}

        {lead && (
          <>
            <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{lead.nome}</h1>
                  <span
                    className={`mt-2 inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_CLASSE[lead.status]}`}
                  >
                    {STATUS_LABEL[lead.status]}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={lead.status}
                    onValueChange={(v) => salvar.mutate({ status: v as LeadStatus })}
                  >
                    <SelectTrigger className="w-[190px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_STATUS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => setEditar(true)}>
                    Editar
                  </Button>
                </div>
              </div>

              <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  ["Telefone", lead.telefone || "—"],
                  ["E-mail", lead.email || "—"],
                  ["Tipo de pessoa", lead.tipo_pessoa],
                  ["Documento", lead.documento || "—"],
                  ["Origem", ORIGEM_LABEL[lead.origem] ?? lead.origem],
                  ["Criado em", formatarDataHora(lead.created_at)],
                ].map(([rotulo, valor]) => (
                  <div key={rotulo}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {rotulo}
                    </dt>
                    <dd className="mt-0.5 text-sm text-foreground">{valor}</dd>
                  </div>
                ))}
              </dl>

              {lead.observacoes && (
                <div className="mt-4 rounded-lg bg-muted/50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Observações
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                    {lead.observacoes}
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-foreground">Timeline de Interações</h2>
                <Button onClick={() => setInteracaoAberta(true)}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Registrar Interação
                </Button>
              </div>

              <div className="mt-4 space-y-3">
                {interacoesQuery.isLoading && (
                  <p className="text-sm text-muted-foreground">Carregando interações...</p>
                )}
                {(interacoesQuery.data ?? []).map((i) => {
                  const Icone = ICONE_TIPO[i.tipo] ?? MessageCircle;
                  return (
                    <div
                      key={i.id}
                      className="flex gap-3 rounded-lg border border-border bg-muted/30 p-3"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icone className="h-4.5 w-4.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {TIPO_INTERACAO_LABEL[i.tipo] ?? i.tipo}
                        </p>
                        <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted-foreground">
                          {i.descricao}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatarDataHora(i.data_interacao)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {!interacoesQuery.isLoading && (interacoesQuery.data ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma interação registrada ainda.
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-bold text-foreground">Ações</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    void navigate({ to: "/propostas/nova", search: { lead: lead.id } })
                  }
                >
                  <FileSignature className="mr-1.5 h-4 w-4" />
                  Gerar Proposta
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void navigate({ to: "/propostas", search: { lead: lead.id } })}
                >
                  <FileSignature className="mr-1.5 h-4 w-4" />
                  Ver Propostas
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toast.info("Módulo de Vistorias em desenvolvimento.")}
                >
                  <CalendarClock className="mr-1.5 h-4 w-4" />
                  Agendar Vistoria
                </Button>
              </div>
            </section>

            <LeadFormDialog
              open={editar}
              onOpenChange={setEditar}
              lead={lead}
              salvando={salvar.isPending}
              onSubmit={async (input) => {
                await salvar.mutateAsync(input);
              }}
            />

            <Dialog open={interacaoAberta} onOpenChange={setInteracaoAberta}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Registrar interação</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Tipo</Label>
                    <Select value={tipo} onValueChange={(v) => setTipo(v as InteracaoTipo)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INTERACAO_TIPOS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {TIPO_INTERACAO_LABEL[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="int-desc">Descrição</Label>
                    <Textarea
                      id="int-desc"
                      rows={4}
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      placeholder="O que foi tratado nesse contato?"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="int-data">Data</Label>
                    <Input
                      id="int-data"
                      type="date"
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setInteracaoAberta(false)}>
                    Cancelar
                  </Button>
                  <Button
                    disabled={registrar.isPending}
                    onClick={() => {
                      if (!descricao.trim()) {
                        toast.error("Descreva a interação.");
                        return;
                      }
                      registrar.mutate();
                    }}
                  >
                    {registrar.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </ErpShell>
  );
}
