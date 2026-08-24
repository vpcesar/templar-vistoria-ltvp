import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErpShell } from "@/components/ErpShell";
import { obterLead } from "@/lib/crm";
import { RESPONSAVEL_PADRAO, hojeISO, obterProposta } from "@/lib/propostas";
import { TIPOS_SERVICO } from "@/lib/propostas-escopo";
import { checklistDoServico } from "@/lib/vistorias-checklist";
import { criarVistoria, proximoNumeroVistoria } from "@/lib/vistorias";

export const Route = createFileRoute("/vistorias/nova")({
  head: () => ({
    meta: [
      { title: "Nova Vistoria de Campo | TEMPLAR ENGENHARIA" },
      {
        name: "description",
        content:
          "Agende uma vistoria de campo e gere automaticamente o checklist técnico do tipo de serviço.",
      },
      { property: "og:title", content: "Nova Vistoria de Campo | TEMPLAR ENGENHARIA" },
      {
        property: "og:description",
        content: "Agendamento de vistoria com checklist automático por tipo de serviço.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { lead?: string; proposta?: string } => ({
    ...(typeof search["lead"] === "string" ? { lead: search["lead"] } : {}),
    ...(typeof search["proposta"] === "string" ? { proposta: search["proposta"] } : {}),
  }),
  component: NovaVistoriaCampo,
});

function NovaVistoriaCampo() {
  const { lead: leadId, proposta: propostaId } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [dataVistoria, setDataVistoria] = useState(hojeISO());
  const [hora, setHora] = useState("09:00");
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [tipoServico, setTipoServico] = useState(TIPOS_SERVICO[0] ?? "");
  const [observacoes, setObservacoes] = useState("");

  const propostaQuery = useQuery({
    queryKey: ["proposta", propostaId],
    queryFn: () => obterProposta(propostaId as string),
    enabled: !!propostaId,
  });

  const leadQuery = useQuery({
    queryKey: ["lead", leadId],
    queryFn: () => obterLead(leadId as string),
    enabled: !!leadId && !propostaId,
  });

  useEffect(() => {
    const p = propostaQuery.data;
    if (!p) return;
    setClienteNome(p.cliente_nome);
    setClienteTelefone(p.cliente_telefone ?? "");
    setEndereco(p.imovel_endereco ?? p.cliente_endereco ?? "");
    setTipoServico(p.tipo_servico);
  }, [propostaQuery.data]);

  useEffect(() => {
    const l = leadQuery.data as { nome?: string; telefone?: string | null } | null | undefined;
    if (!l) return;
    setClienteNome(l.nome ?? "");
    setClienteTelefone(l.telefone ?? "");
  }, [leadQuery.data]);

  const totalItens = checklistDoServico(tipoServico).length;

  const salvar = useMutation({
    mutationFn: async () => {
      if (!clienteNome.trim()) throw new Error("Informe o nome do cliente.");
      if (!tipoServico) throw new Error("Selecione o tipo de serviço.");
      const numero = await proximoNumeroVistoria();
      return criarVistoria({
        numero,
        proposta_id: propostaId ?? null,
        lead_id: leadId ?? (propostaQuery.data?.lead_id ?? null),
        data_vistoria: dataVistoria,
        hora_vistoria: hora || null,
        cliente_nome: clienteNome.trim(),
        cliente_telefone: clienteTelefone || null,
        imovel_endereco: endereco || null,
        tipo_servico: tipoServico,
        responsavel_tecnico_nome: RESPONSAVEL_PADRAO.nome,
        responsavel_tecnico_crea: RESPONSAVEL_PADRAO.crea,
        observacoes: observacoes || null,
        status: "agendada",
      });
    },
    onSuccess: (v) => {
      queryClient.invalidateQueries({ queryKey: ["vistorias"] });
      toast.success(`Vistoria ${v.numero} criada com ${totalItens} itens de checklist.`);
      void navigate({ to: "/vistorias/$id", params: { id: v.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <ErpShell>
      <div className="mx-auto max-w-3xl space-y-5">
        <Link
          to="/vistorias"
          search={{}}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para vistorias
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-foreground">Nova Vistoria</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            O checklist técnico é gerado automaticamente conforme o tipo de serviço selecionado.
          </p>
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Data da vistoria</Label>
              <Input
                type="date"
                value={dataVistoria}
                onChange={(e) => setDataVistoria(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Hora</Label>
              <Input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <Input value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone / WhatsApp</Label>
              <Input value={clienteTelefone} onChange={(e) => setClienteTelefone(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Endereço do imóvel</Label>
            <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Tipo de serviço</Label>
            <Select value={tipoServico} onValueChange={setTipoServico}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_SERVICO.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {totalItens > 0
                ? `${totalItens} itens de checklist serão criados automaticamente.`
                : "Nenhum checklist padrão cadastrado para este serviço — você poderá adicionar itens manualmente."}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>

          <Button
            className="w-full"
            disabled={salvar.isPending}
            onClick={() => salvar.mutate()}
          >
            <Save className="mr-1.5 h-4 w-4" />
            {salvar.isPending ? "Criando vistoria..." : "Criar vistoria e gerar checklist"}
          </Button>
        </div>
      </div>
    </ErpShell>
  );
}
