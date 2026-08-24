import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { ErpShell } from "@/components/ErpShell";
import { PropostaForm } from "@/components/propostas/PropostaForm";
import { atualizarProposta, obterProposta, type PropostaInput } from "@/lib/propostas";

export const Route = createFileRoute("/propostas/$id/editar")({
  head: () => ({
    meta: [
      { title: "Editar Proposta | TEMPLAR ENGENHARIA" },
      {
        name: "description",
        content: "Edite os dados, escopo e valores de uma proposta comercial da TEMPLAR ENGENHARIA.",
      },
      { property: "og:title", content: "Editar Proposta | TEMPLAR ENGENHARIA" },
      {
        property: "og:description",
        content: "Edição de proposta comercial da TEMPLAR ENGENHARIA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditarProposta,
});

function EditarProposta() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const propostaQuery = useQuery({ queryKey: ["proposta", id], queryFn: () => obterProposta(id) });

  const salvar = useMutation({
    mutationFn: (input: PropostaInput) => atualizarProposta(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposta", id] });
      queryClient.invalidateQueries({ queryKey: ["propostas"] });
      toast.success("Proposta atualizada.");
      void navigate({ to: "/propostas/$id", params: { id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const proposta = propostaQuery.data;

  return (
    <ErpShell>
      <div className="space-y-4">
        <Link
          to="/propostas/$id"
          params={{ id }}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para a proposta
        </Link>

        {propostaQuery.isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

        {!propostaQuery.isLoading && !proposta && (
          <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Proposta não encontrada.
          </p>
        )}

        {proposta && (
          <>
            <h1 className="text-2xl font-bold text-foreground">Editar {proposta.numero}</h1>
            <PropostaForm
              proposta={proposta}
              numero={proposta.numero}
              salvando={salvar.isPending}
              onSalvar={(input) => salvar.mutate(input)}
              onCancelar={() => void navigate({ to: "/propostas/$id", params: { id } })}
            />
          </>
        )}
      </div>
    </ErpShell>
  );
}
