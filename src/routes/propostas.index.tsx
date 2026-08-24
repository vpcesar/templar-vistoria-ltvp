import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FileSignature, Plus, Search } from "lucide-react";
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
import {
  PROPOSTA_STATUS,
  PROPOSTA_STATUS_CLASSE,
  PROPOSTA_STATUS_LABEL,
  formatarDataBR,
  formatarMoeda,
  listarPropostas,
  type PropostaStatus,
} from "@/lib/propostas";

export const Route = createFileRoute("/propostas/")({
  head: () => ({
    meta: [
      { title: "Propostas Comerciais | TEMPLAR ENGENHARIA" },
      {
        name: "description",
        content:
          "Gere, acompanhe e exporte propostas comerciais de vistorias, laudos e perícias da TEMPLAR ENGENHARIA.",
      },
      { property: "og:title", content: "Propostas Comerciais | TEMPLAR ENGENHARIA" },
      {
        property: "og:description",
        content: "Propostas comerciais integradas ao CRM da TEMPLAR ENGENHARIA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { lead?: string } =>
    typeof search["lead"] === "string" ? { lead: search["lead"] } : {},
  component: PropostasPage,
});

const POR_PAGINA = 10;

function PropostasPage() {
  const navigate = useNavigate();
  const { lead: filtroLead } = Route.useSearch();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | PropostaStatus>("todos");
  const [pagina, setPagina] = useState(1);

  const propostasQuery = useQuery({ queryKey: ["propostas"], queryFn: listarPropostas });
  const propostas = propostasQuery.data ?? [];

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return propostas.filter((p) => {
      if (filtroLead && p.lead_id !== filtroLead) return false;
      if (filtroStatus !== "todos" && p.status !== filtroStatus) return false;
      if (!termo) return true;
      return p.numero.toLowerCase().includes(termo) || p.cliente_nome.toLowerCase().includes(termo);
    });
  }, [propostas, busca, filtroStatus, filtroLead]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = filtradas.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  return (
    <ErpShell>
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Comercial</p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">Propostas Comerciais</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Monte propostas técnicas com escopo normativo e exporte em PDF ou Word.
            </p>
          </div>
          <Button className="min-h-10" onClick={() => void navigate({ to: "/propostas/nova" })}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nova Proposta
          </Button>
        </div>

        {filtroLead && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-4 py-2 text-sm">
            <span className="text-muted-foreground">Filtrando propostas de um lead do CRM.</span>
            <Link to="/propostas" className="font-semibold text-primary">
              Limpar filtro
            </Link>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(1);
              }}
              placeholder="Buscar por número ou cliente"
              className="pl-9"
            />
          </div>
          <Select
            value={filtroStatus}
            onValueChange={(v) => {
              setFiltroStatus(v as "todos" | PropostaStatus);
              setPagina(1);
            }}
          >
            <SelectTrigger className="w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {PROPOSTA_STATUS.map((s) => (
                <SelectItem key={s} value={s}>
                  {PROPOSTA_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {propostasQuery.isLoading && (
          <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Carregando propostas...
          </p>
        )}

        {propostasQuery.isError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
            <p className="font-semibold text-destructive">
              Não foi possível carregar as propostas.
            </p>
            <p className="mt-1 text-muted-foreground">{(propostasQuery.error as Error).message}</p>
            <p className="mt-2 text-muted-foreground">
              Confirme se a tabela <code>propostas</code> já foi criada no Supabase (script em{" "}
              <code>supabase/propostas.sql</code>).
            </p>
          </div>
        )}

        {!propostasQuery.isLoading && !propostasQuery.isError && (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiveis.map((p) => (
                    <TableRow key={p.id} className="cursor-pointer">
                      <TableCell className="font-semibold">
                        <Link to="/propostas/$id" params={{ id: p.id }} className="block">
                          {p.numero}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link to="/propostas/$id" params={{ id: p.id }} className="block">
                          {p.cliente_nome}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate">{p.tipo_servico}</TableCell>
                      <TableCell>{formatarMoeda(Number(p.valor_total))}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${PROPOSTA_STATUS_CLASSE[p.status]}`}
                        >
                          {PROPOSTA_STATUS_LABEL[p.status]}
                        </span>
                      </TableCell>
                      <TableCell>{formatarDataBR(p.data_emissao)}</TableCell>
                    </TableRow>
                  ))}
                  {visiveis.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center">
                        <FileSignature className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          Nenhuma proposta encontrada.
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {filtradas.length > POR_PAGINA && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  Página {paginaAtual} de {totalPaginas} • {filtradas.length} propostas
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
      </div>
    </ErpShell>
  );
}
