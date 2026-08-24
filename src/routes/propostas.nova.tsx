import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { ErpShell } from "@/components/ErpShell";
import { PropostaForm } from "@/components/propostas/PropostaForm";
import { criarProposta, proximoNumero, type PropostaInput } from "@/lib/propostas";

export const Route = createFileRoute("/propostas/nova")({
  head: () => ({
    meta: [
      { title: "Nova Proposta Comercial | TEMPLAR ENGENHARIA" },
      {
        name: "description",
        content:
          "Monte uma nova proposta comercial com escopo técnico automático por tipo de serviço na TEMPLAR ENGENHARIA.",
      },
      { property: "og:title", content: "Nova Proposta Comercial | TEMPLAR ENGENHARIA" },
      {
        property: "og:description",
        content: "Formulário de proposta comercial com escopo normativo automático.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { lead?: string } =>
    typeof search["lead"] === "string" ? { lead: search["lead"] } : {},
  component: NovaProposta,
});

function NovaProposta() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { lead } = Route.useSearch();

  const numeroQuery = useQuery({ queryKey: ["proposta-numero"], queryFn: proximoNumero });

  const criar = useMutation({
    mutationFn: (input: PropostaInput) => criarProposta(input),
    onSuccess: (proposta) => {
      queryClient.invalidateQueries({ queryKey: ["propostas"] });
      toast.success(`Proposta ${proposta.numero} salva.`);
      void navigate({ to: "/propostas/$id", params: { id: proposta.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <ErpShell>
      <div className="space-y-4">
        <Link
          to="/propostas"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para propostas
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-foreground">Nova Proposta</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Preencha as seções abaixo. O escopo técnico é preenchido automaticamente pelo tipo de
            serviço.
          </p>
        </div>

        {numeroQuery.isError && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {(numeroQuery.error as Error).message} — verifique se a tabela <code>propostas</code>{" "}
            foi criada no Supabase.
          </p>
        )}

        <PropostaForm
          numero={numeroQuery.data ?? "PROP-0001"}
          leadInicial={lead ?? null}
          salvando={criar.isPending}
          onSalvar={(input) => criar.mutate(input)}
          onCancelar={() => void navigate({ to: "/propostas" })}
        />
      </div>
    </ErpShell>
  );
}
