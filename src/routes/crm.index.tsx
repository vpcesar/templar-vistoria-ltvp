import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { LayoutGrid, List, Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ErpShell } from "@/components/ErpShell";
import { LeadFormDialog } from "@/components/crm/LeadFormDialog";
import { LeadKanban } from "@/components/crm/LeadKanban";
import {
  LEAD_STATUS,
  ORIGEM_LABEL,
  STATUS_CLASSE,
  STATUS_LABEL,
  atualizarLead,
  criarLead,
  formatarDataCurta,
  listarLeads,
  soDigitos,
  type Lead,
  type LeadInput,
  type LeadStatus,
} from "@/lib/crm";
import { listarPropostas } from "@/lib/propostas";

export const Route = createFileRoute("/crm/")({
  head: () => ({
    meta: [
      { title: "CRM — Gestão de Leads | TEMPLAR ENGENHARIA" },
      {
        name: "description",
        content:
          "CRM da TEMPLAR ENGENHARIA: cadastre leads, acompanhe interações e mova oportunidades no funil comercial.",
      },
      { property: "og:title", content: "CRM — Gestão de Leads | TEMPLAR ENGENHARIA" },
      {
        property: "og:description",
        content: "Gestão de leads e funil comercial da TEMPLAR ENGENHARIA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CrmPage,
});

const POR_PAGINA = 10;

function CrmPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [visao, setVisao] = useState<"lista" | "kanban">("lista");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | LeadStatus>("todos");
  const [pagina, setPagina] = useState(1);
  const [formAberto, setFormAberto] = useState(false);

  const leadsQuery = useQuery({ queryKey: ["leads"], queryFn: listarLeads });
  const leads = leadsQuery.data ?? [];

  const propostasQuery = useQuery({
    queryKey: ["propostas"],
    queryFn: listarPropostas,
    retry: false,
  });
  const propostasPorLead = useMemo(() => {
    const mapa = new Map<string, number>();
    (propostasQuery.data ?? []).forEach((p) => {
      if (p.lead_id) mapa.set(p.lead_id, (mapa.get(p.lead_id) ?? 0) + 1);
    });
    return mapa;
  }, [propostasQuery.data]);

  const criar = useMutation({
    mutationFn: (input: LeadInput) => criarLead(input),
    onSuccess: (lead) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setFormAberto(false);
      toast.success("Lead cadastrado.");
      void navigate({ to: "/crm/$id", params: { id: lead.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mover = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      atualizarLead(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const digitos = soDigitos(busca);
    return leads.filter((l) => {
      const porStatus = filtroStatus === "todos" || l.status === filtroStatus;
      if (!porStatus) return false;
      if (!termo) return true;
      const nomeOk = l.nome.toLowerCase().includes(termo);
      const telOk = digitos.length > 0 && soDigitos(l.telefone ?? "").includes(digitos);
      return nomeOk || telOk;
    });
  }, [leads, busca, filtroStatus]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = filtrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  return (
    <ErpShell>
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">CRM</p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">Gestão de Leads</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Acompanhe oportunidades comerciais da captação ao fechamento.
            </p>
          </div>
          <Button onClick={() => setFormAberto(true)} className="min-h-10">
            <Plus className="mr-1.5 h-4 w-4" />
            Novo Lead
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(1);
              }}
              placeholder="Buscar por nome ou telefone"
              className="pl-9"
            />
          </div>

          <Select
            value={filtroStatus}
            onValueChange={(v) => {
              setFiltroStatus(v as "todos" | LeadStatus);
              setPagina(1);
            }}
          >
            <SelectTrigger className="w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {LEAD_STATUS.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex overflow-hidden rounded-md border border-border">
            <button
              type="button"
              onClick={() => setVisao("lista")}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold ${
                visao === "lista" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
              }`}
            >
              <List className="h-4 w-4" /> Lista
            </button>
            <button
              type="button"
              onClick={() => setVisao("kanban")}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold ${
                visao === "kanban" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
              }`}
            >
              <LayoutGrid className="h-4 w-4" /> Kanban
            </button>
          </div>
        </div>

        {leadsQuery.isLoading && (
          <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Carregando leads...
          </p>
        )}

        {leadsQuery.isError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
            <p className="font-semibold text-destructive">Não foi possível carregar os leads.</p>
            <p className="mt-1 text-muted-foreground">{(leadsQuery.error as Error).message}</p>
            <p className="mt-2 text-muted-foreground">
              Confirme se as tabelas <code>leads</code> e <code>interacoes_lead</code> já foram
              criadas no Supabase (script em <code>supabase/crm.sql</code>).
            </p>
          </div>
        )}

        {!leadsQuery.isLoading && !leadsQuery.isError && visao === "lista" && (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Propostas</TableHead>
                    <TableHead>Criado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiveis.map((lead: Lead) => (
                    <TableRow key={lead.id} className="cursor-pointer">
                      <TableCell className="font-semibold">
                        <Link to="/crm/$id" params={{ id: lead.id }} className="block">
                          {lead.nome}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link to="/crm/$id" params={{ id: lead.id }} className="block">
                          {lead.telefone || "—"}
                        </Link>
                      </TableCell>
                      <TableCell>{lead.tipo_pessoa}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_CLASSE[lead.status]}`}
                        >
                          {STATUS_LABEL[lead.status]}
                        </span>
                      </TableCell>
                      <TableCell>{ORIGEM_LABEL[lead.origem] ?? lead.origem}</TableCell>
                      <TableCell>
                        <Link
                          to="/propostas"
                          search={{ lead: lead.id }}
                          className="inline-block rounded-full border border-border px-2 py-0.5 text-xs font-semibold text-primary"
                        >
                          {propostasPorLead.get(lead.id) ?? 0}
                        </Link>
                      </TableCell>
                      <TableCell>{formatarDataCurta(lead.created_at)}</TableCell>
                    </TableRow>
                  ))}
                  {visiveis.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center">
                        <Users className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          Nenhum lead encontrado.
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {filtrados.length > POR_PAGINA && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  Página {paginaAtual} de {totalPaginas} • {filtrados.length} leads
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={paginaAtual <= 1}
                    onClick={() => setPagina(paginaAtual - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={paginaAtual >= totalPaginas}
                    onClick={() => setPagina(paginaAtual + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {!leadsQuery.isLoading && !leadsQuery.isError && visao === "kanban" && (
          <LeadKanban
            leads={filtrados}
            onMover={(lead, status) => mover.mutate({ id: lead.id, status })}
          />
        )}
      </div>

      <LeadFormDialog
        open={formAberto}
        onOpenChange={setFormAberto}
        onSubmit={async (input) => {
          await criar.mutateAsync(input);
        }}
        salvando={criar.isPending}
      />
    </ErpShell>
  );
}
