import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, FileDown, FileText, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErpShell } from "@/components/ErpShell";
import { EMPRESA } from "@/lib/laudo";
import { gerarPropostaPdf } from "@/lib/report/proposta-pdf";
import { gerarPropostaDocx } from "@/lib/report/proposta-docx";
import {
  PROPOSTA_STATUS,
  PROPOSTA_STATUS_CLASSE,
  PROPOSTA_STATUS_LABEL,
  atualizarProposta,
  formatarDataBR,
  formatarMoeda,
  obterProposta,
  type Proposta,
  type PropostaStatus,
} from "@/lib/propostas";

export const Route = createFileRoute("/propostas/$id")({
  head: () => ({
    meta: [
      { title: "Proposta Comercial | TEMPLAR ENGENHARIA" },
      {
        name: "description",
        content:
          "Visualize a proposta comercial formatada, mude o status e exporte em PDF ou Word na TEMPLAR ENGENHARIA.",
      },
      { property: "og:title", content: "Proposta Comercial | TEMPLAR ENGENHARIA" },
      {
        property: "og:description",
        content: "Proposta comercial formatada da TEMPLAR ENGENHARIA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PropostaDetalhe;
});

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="border-b-2 border-primary pb-1 text-sm font-bold uppercase tracking-wide text-primary">
        {titulo}
      </h2>
      <div className="mt-3 space-y-1.5 text-sm text-foreground">{children}</div>
    </section>
  );
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <p>
      <span className="font-semibold">{rotulo}:</span> {valor || "—"}
    </p>
  );
}

function Lista({ rotulo, conteudo }: { rotulo: string; conteudo: string | null }) {
  const linhas = (conteudo ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return (
    <div className="mt-3">
      <p className="text-sm font-bold text-primary">{rotulo}</p>
      {linhas.length === 0 ? (
        <p className="text-sm text-muted-foreground">—</p>
      ) : (
        <ul className="mt-1 space-y-1 text-sm">
          {linhas.map((l, i) => (
            <li key={i} className="flex gap-2">
              {!l.startsWith("•") && <span className="text-primary">•</span>}
              <span>{l.replace(/^•\s*/, "")}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PropostaDetalhe() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const propostaQuery = useQuery({ queryKey: ["proposta", id], queryFn: () => obterProposta(id) });

  const mudarStatus = useMutation({
    mutationFn: (status: PropostaStatus) => atualizarProposta(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposta", id] });
      queryClient.invalidateQueries({ queryKey: ["propostas"] });
      toast.success("Status atualizado.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const proposta = propostaQuery.data as Proposta | null | undefined;

  return (
    <ErpShell>
      <div className="space-y-4">
        <Link
          to="/propostas"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para propostas
        </Link>

        {propostaQuery.isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

        {propostaQuery.isError && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {(propostaQuery.error as Error).message}
          </p>
        )}

        {!propostaQuery.isLoading && !proposta && !propostaQuery.isError && (
          <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Proposta não encontrada.
          </p>
        )}

        {proposta && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  void navigate({ to: "/propostas/$id/editar", params: { id: proposta.id } })
                }
              >
                <Pencil className="mr-1.5 h-4 w-4" /> Editar
              </Button>
              <Button variant="outline" onClick={() => void gerarPropostaPdf(proposta)}>
                <FileDown className="mr-1.5 h-4 w-4" /> Exportar PDF
              </Button>
              <Button variant="outline" onClick={() => void gerarPropostaDocx(proposta)}>
                <FileText className="mr-1.5 h-4 w-4" /> Exportar Word
              </Button>
              <Select
                value={proposta.status}
                onValueChange={(v) => mudarStatus.mutate(v as PropostaStatus)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROPOSTA_STATUS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {PROPOSTA_STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${PROPOSTA_STATUS_CLASSE[proposta.status]}`}
              >
                {PROPOSTA_STATUS_LABEL[proposta.status]}
              </span>
            </div>

            <article className="mx-auto w-full max-w-3xl rounded-xl border border-border bg-card p-6 shadow-sm sm:p-10">
              <header className="text-center">
                <p className="text-xl font-bold text-primary">{EMPRESA.nome}</p>
                <p className="text-xs text-muted-foreground">{EMPRESA.slogan}</p>
                <p className="mt-4 text-base font-bold text-foreground">
                  PROPOSTA COMERCIAL — Nº {proposta.numero}
                </p>
                <p className="text-sm text-muted-foreground">
                  Data: {formatarDataBR(proposta.data_emissao)}
                </p>
              </header>

              <Bloco titulo="Responsável Técnico">
                <Campo rotulo="Nome" valor={proposta.responsavel_tecnico_nome} />
                <Campo rotulo="CREA" valor={proposta.responsavel_tecnico_crea} />
              </Bloco>

              <Bloco titulo="Dados do Cliente">
                <Campo rotulo="Nome" valor={proposta.cliente_nome} />
                <Campo rotulo="CPF/CNPJ" valor={proposta.cliente_cpf ?? ""} />
                <Campo rotulo="Telefone/WhatsApp" valor={proposta.cliente_telefone ?? ""} />
                <Campo rotulo="Endereço" valor={proposta.cliente_endereco ?? ""} />
              </Bloco>

              <Bloco titulo="Dados do Imóvel / Objeto">
                <Campo rotulo="Endereço" valor={proposta.imovel_endereco ?? ""} />
                <Campo rotulo="Observações" valor={proposta.imovel_observacoes ?? ""} />
              </Bloco>

              <Bloco titulo="Serviço Contratado">
                <p className="font-semibold">{proposta.tipo_servico}</p>
              </Bloco>

              <Bloco titulo="Escopo dos Serviços">
                <p className="text-justify">{proposta.escopo_objetivo || "—"}</p>
                <Lista rotulo="Itens constantes" conteudo={proposta.escopo_itens_constantes} />
                <Lista rotulo="Metodologia" conteudo={proposta.escopo_metodologia} />
                <Lista rotulo="Entregáveis" conteudo={proposta.escopo_entregaveis} />
              </Bloco>

              <Bloco titulo="Valores e Condições">
                <Campo rotulo="Valor total" valor={formatarMoeda(Number(proposta.valor_total))} />
                <Campo rotulo="Condições" valor={proposta.condicoes_pagamento ?? ""} />
                <Campo rotulo="Validade" valor={`${proposta.validade_dias} dias`} />
                <Campo rotulo="Prazo" valor={proposta.prazo_execucao ?? ""} />
              </Bloco>

              <Bloco titulo="Não Incluído">
                <p className="whitespace-pre-wrap">{proposta.nao_incluido || "—"}</p>
              </Bloco>

              <footer className="mt-8 border-t border-border pt-3 text-center text-xs text-muted-foreground">
                <p>
                  {EMPRESA.site} | {EMPRESA.email} | {EMPRESA.whats}
                </p>
                <p className="mt-1">Proposta {proposta.numero}</p>
              </footer>
            </article>
          </>
        )}
      </div>
    </ErpShell>
  );
}
