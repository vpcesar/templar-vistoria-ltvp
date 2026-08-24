import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ClipboardCheck, Plus, Search } from "lucide-react";
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
import { formatarDataBR } from "@/lib/propostas";
import {
  VISTORIA_STATUS,
  VISTORIA_STATUS_CLASSE,
  VISTORIA_STATUS_LABEL,
  listarVistorias,
  type VistoriaStatus,
} from "@/lib/vistorias";

export const Route = createFileRoute("/vistorias/")({
  head: () => ({
    meta: [
      { title: "Vistorias de Campo | TEMPLAR ENGENHARIA" },
      {
        name: "description",
        content:
          "Agende vistorias, execute o checklist fotográfico por categoria e registre não conformidades em campo.",
      },
      { property: "og:title", content: "Vistorias de Campo | TEMPLAR ENGENHARIA" },
      {
        property: "og:description",
        content: "Checklist fotográfico e execução de vistorias de campo da TEMPLAR ENGENHARIA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { lead?: string; proposta?: string } => ({
    ...(typeof search["lead"] === "string" ? { lead: search["lead"] } : {}),
    ...(typeof search["proposta"] === "string" ? { proposta: search["proposta"] } : {}),
  }),
  component: VistoriasPage,
});

const POR_PAGINA = 10;

function VistoriasPage() {
  const navigate = useNavigate();
  const { lead: filtroLead, proposta: filtroProposta } = Route.useSearch();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | VistoriaStatus>("todos");
  const [pagina, setPagina] = useState(1);

  const vistoriasQuery = useQuery({ queryKey: ["vistorias"], queryFn: listarVistorias });
  const vistorias = vistoriasQuery.data ?? [];

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return vistorias.filter((v) => {
      if (filtroLead && v.lead_id !== filtroLead) return false;
      if (filtroProposta && v.proposta_id !== filtroProposta) return false;
      if (filtroStatus !== "todos" && v.status !== filtroStatus) return false;
      if (!termo) return true;
      return (
        v.numero.toLowerCase().includes(termo) ||
        v.cliente_nome.toLowerCase().includes(termo) ||
        (v.imovel_endereco ?? "").toLowerCase().includes(termo)
      );
    });
  }, [vistorias, busca, filtroStatus, filtroLead, filtroProposta]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = filtradas.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  return (
    <ErpShell>
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Operação</p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">Vistorias de Campo</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Checklist técnico por tipo de serviço, registro fotográfico e não conformidades.
            </p>
          </div>
          <Button onClick={() => void navigate({ to: "/vistorias/nova", search: {} })}>
            <Plus className="mr-1.5 h-4 w-4" /> Nova vistoria
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por número, cliente ou endereço"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(1);
              }}
            />
          </div>
          <Select
            value={filtroStatus}
            onValueChange={(v) => {
              setFiltroStatus(v as "todos" | VistoriaStatus);
              setPagina(1);
            }}
          >
            <SelectTrigger className="w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {VISTORIA_STATUS.map((s) => (
                <SelectItem key={s} value={s}>
                  {VISTORIA_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {vistoriasQuery.isError && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {(vistoriasQuery.error as Error).message}
          </p>
        )}

        {vistoriasQuery.isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

        {!vistoriasQuery.isLoading && filtradas.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <ClipboardCheck className="h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              Nenhuma vistoria encontrada. Crie a primeira para gerar o checklist automaticamente.
            </p>
          </div>
        )}

        {visiveis.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Tipo de serviço</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visiveis.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-semibold">
                      <Link
                        to="/vistorias/$id"
                        params={{ id: v.id }}
                        className="text-primary hover:underline"
                      >
                        {v.numero}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {formatarDataBR(v.data_vistoria)}
                      {v.hora_vistoria ? ` às ${v.hora_vistoria}` : ""}
                    </TableCell>
                    <TableCell>{v.cliente_nome}</TableCell>
                    <TableCell className="hidden md:table-cell">{v.tipo_servico}</TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${VISTORIA_STATUS_CLASSE[v.status]}`}
                      >
                        {VISTORIA_STATUS_LABEL[v.status]}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPaginas > 1 && (
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={paginaAtual === 1}
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <span className="text-xs text-muted-foreground">
              Página {paginaAtual} de {totalPaginas}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={paginaAtual === totalPaginas}
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>
    </ErpShell>
  );
}
