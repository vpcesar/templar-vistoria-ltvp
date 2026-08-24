import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
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
import { listarLeads, mascaraDocumento, mascaraTelefone, soDigitos } from "@/lib/crm";
import { TIPOS_SERVICO, escopoPorServico } from "@/lib/propostas-escopo";
import {
  RESPONSAVEL_PADRAO,
  hojeISO,
  parseValor,
  type Proposta,
  type PropostaInput,
  type PropostaStatus,
} from "@/lib/propostas";

interface Props {
  proposta?: Proposta;
  numero: string;
  leadInicial?: string | null;
  salvando?: boolean;
  onSalvar: (input: PropostaInput, status: PropostaStatus) => void | Promise<void>;
  onCancelar: () => void;
}

function Secao({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-sm font-bold uppercase tracking-wide text-primary">
        {n}. {titulo}
      </h2>
      <div className="mt-4 grid gap-4">{children}</div>
    </section>
  );
}

const AutoTag = () => (
  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
    <Sparkles className="h-3 w-3" /> auto-preenchido
  </span>
);

export function PropostaForm({
  proposta,
  numero,
  leadInicial,
  salvando,
  onSalvar,
  onCancelar,
}: Props) {
  const leadsQuery = useQuery({ queryKey: ["leads"], queryFn: listarLeads });
  const leads = leadsQuery.data ?? [];

  const [leadId, setLeadId] = useState<string>(proposta?.lead_id ?? leadInicial ?? "");
  const [buscaLead, setBuscaLead] = useState("");
  const [dataEmissao, setDataEmissao] = useState(proposta?.data_emissao?.slice(0, 10) ?? hojeISO());
  const [respNome, setRespNome] = useState(
    proposta?.responsavel_tecnico_nome ?? RESPONSAVEL_PADRAO.nome,
  );
  const [respCrea, setRespCrea] = useState(
    proposta?.responsavel_tecnico_crea ?? RESPONSAVEL_PADRAO.crea,
  );
  const [clienteNome, setClienteNome] = useState(proposta?.cliente_nome ?? "");
  const [clienteDoc, setClienteDoc] = useState(proposta?.cliente_cpf ?? "");
  const [clienteTel, setClienteTel] = useState(proposta?.cliente_telefone ?? "");
  const [clienteEnd, setClienteEnd] = useState(proposta?.cliente_endereco ?? "");
  const [imovelEnd, setImovelEnd] = useState(proposta?.imovel_endereco ?? "");
  const [imovelObs, setImovelObs] = useState(proposta?.imovel_observacoes ?? "");
  const [tipoServico, setTipoServico] = useState(proposta?.tipo_servico ?? "");
  const [objetivo, setObjetivo] = useState(proposta?.escopo_objetivo ?? "");
  const [itens, setItens] = useState(proposta?.escopo_itens_constantes ?? "");
  const [metodologia, setMetodologia] = useState(proposta?.escopo_metodologia ?? "");
  const [entregaveis, setEntregaveis] = useState(proposta?.escopo_entregaveis ?? "");
  const [valor, setValor] = useState(
    proposta ? String(proposta.valor_total).replace(".", ",") : "",
  );
  const [condicoes, setCondicoes] = useState(proposta?.condicoes_pagamento ?? "");
  const [validade, setValidade] = useState(String(proposta?.validade_dias ?? 15));
  const [prazo, setPrazo] = useState(proposta?.prazo_execucao ?? "");
  const [naoIncluido, setNaoIncluido] = useState(proposta?.nao_incluido ?? "");
  const [autoPreenchido, setAutoPreenchido] = useState(false);
  const [erro, setErro] = useState("");

  const leadSelecionado = useMemo(() => leads.find((l) => l.id === leadId), [leads, leadId]);

  // Ao abrir a partir de um lead do CRM, preenche os dados do cliente.
  useEffect(() => {
    if (!leadSelecionado || proposta) return;
    setClienteNome((v) => v || leadSelecionado.nome);
    setClienteTel((v) => v || (leadSelecionado.telefone ?? ""));
    setClienteDoc((v) => v || (leadSelecionado.documento ?? ""));
  }, [leadSelecionado, proposta]);

  const leadsFiltrados = useMemo(() => {
    const termo = buscaLead.trim().toLowerCase();
    const digitos = soDigitos(buscaLead);
    if (!termo) return leads.slice(0, 30);
    return leads
      .filter(
        (l) =>
          l.nome.toLowerCase().includes(termo) ||
          (digitos.length > 1 && soDigitos(l.telefone ?? "").includes(digitos)),
      )
      .slice(0, 30);
  }, [leads, buscaLead]);

  function aplicarEscopo(tipo: string) {
    setTipoServico(tipo);
    const escopo = escopoPorServico[tipo];
    if (!escopo) return;
    setObjetivo(escopo.objetivo);
    setItens(escopo.itensConstantes);
    setMetodologia(escopo.metodologia);
    setEntregaveis(escopo.entregaveis);
    setNaoIncluido(escopo.naoIncluido);
    setAutoPreenchido(true);
  }

  function montar(status: PropostaStatus): PropostaInput | null {
    if (!clienteNome.trim()) {
      setErro("Informe o nome do cliente.");
      return null;
    }
    if (!tipoServico) {
      setErro("Selecione o tipo de serviço.");
      return null;
    }
    const valorNum = parseValor(valor);
    if (valorNum <= 0) {
      setErro("Informe o valor total da proposta.");
      return null;
    }
    setErro("");
    return {
      numero: proposta?.numero ?? numero,
      lead_id: leadId || null,
      data_emissao: dataEmissao,
      responsavel_tecnico_nome: respNome.trim() || RESPONSAVEL_PADRAO.nome,
      responsavel_tecnico_crea: respCrea.trim() || RESPONSAVEL_PADRAO.crea,
      cliente_nome: clienteNome.trim(),
      cliente_cpf: clienteDoc.trim() || null,
      cliente_telefone: clienteTel.trim() || null,
      cliente_endereco: clienteEnd.trim() || null,
      imovel_endereco: imovelEnd.trim() || null,
      imovel_observacoes: imovelObs.trim() || null,
      tipo_servico: tipoServico,
      escopo_objetivo: objetivo.trim() || null,
      escopo_itens_constantes: itens.trim() || null,
      escopo_metodologia: metodologia.trim() || null,
      escopo_entregaveis: entregaveis.trim() || null,
      valor_total: valorNum,
      condicoes_pagamento: condicoes.trim() || null,
      validade_dias: Number(validade) || 15,
      prazo_execucao: prazo.trim() || null,
      nao_incluido: naoIncluido.trim() || null,
      status,
    };
  }

  function enviar(status: PropostaStatus) {
    const input = montar(status);
    if (input) void onSalvar(input, status);
  }

  const tipoPessoa: "PF" | "PJ" = soDigitos(clienteDoc).length > 11 ? "PJ" : "PF";

  return (
    <div className="space-y-4">
      <Secao n={1} titulo="Cabeçalho">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Número da proposta</Label>
            <Input value={proposta?.numero ?? numero} readOnly className="bg-muted/50" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="data-emissao">Data de emissão</Label>
            <Input
              id="data-emissao"
              type="date"
              value={dataEmissao}
              onChange={(e) => setDataEmissao(e.target.value)}
            />
          </div>
        </div>
      </Secao>

      <Secao n={2} titulo="Responsável Técnico">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="resp-nome">Nome</Label>
            <Input id="resp-nome" value={respNome} onChange={(e) => setRespNome(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="resp-crea">CREA</Label>
            <Input id="resp-crea" value={respCrea} onChange={(e) => setRespCrea(e.target.value)} />
          </div>
        </div>
      </Secao>

      <Secao n={3} titulo="Dados do Cliente">
        <div className="space-y-1.5">
          <Label htmlFor="busca-lead">Vincular lead do CRM</Label>
          <Input
            id="busca-lead"
            value={buscaLead}
            onChange={(e) => setBuscaLead(e.target.value)}
            placeholder="Buscar lead por nome ou telefone"
          />
          <Select
            value={leadId || "nenhum"}
            onValueChange={(v) => {
              const id = v === "nenhum" ? "" : v;
              setLeadId(id);
              const lead = leads.find((l) => l.id === id);
              if (lead) {
                setClienteNome(lead.nome);
                setClienteTel(lead.telefone ?? "");
                setClienteDoc(lead.documento ?? "");
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Nenhum lead vinculado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nenhum">Nenhum lead vinculado</SelectItem>
              {leadsFiltrados.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.nome}
                  {l.telefone ? ` — ${l.telefone}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="cli-nome">Nome *</Label>
            <Input
              id="cli-nome"
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cli-doc">CPF/CNPJ</Label>
            <Input
              id="cli-doc"
              inputMode="numeric"
              value={clienteDoc}
              onChange={(e) => setClienteDoc(mascaraDocumento(e.target.value, tipoPessoa))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cli-tel">Telefone</Label>
            <Input
              id="cli-tel"
              inputMode="numeric"
              value={clienteTel}
              onChange={(e) => setClienteTel(mascaraTelefone(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cli-end">Endereço</Label>
            <Input
              id="cli-end"
              value={clienteEnd}
              onChange={(e) => setClienteEnd(e.target.value)}
            />
          </div>
        </div>
      </Secao>

      <Secao n={4} titulo="Dados do Imóvel">
        <div className="space-y-1.5">
          <Label htmlFor="imovel-end">Endereço do imóvel</Label>
          <Input id="imovel-end" value={imovelEnd} onChange={(e) => setImovelEnd(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="imovel-obs">Observações</Label>
          <Textarea
            id="imovel-obs"
            rows={3}
            value={imovelObs}
            onChange={(e) => setImovelObs(e.target.value)}
          />
        </div>
      </Secao>

      <Secao n={5} titulo="Serviço Contratado">
        <div className="space-y-1.5">
          <Label>Tipo de serviço *</Label>
          <Select value={tipoServico} onValueChange={aplicarEscopo}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo de serviço" />
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
            Ao selecionar, o escopo técnico e o item “não incluído” são preenchidos automaticamente
            e permanecem editáveis.
          </p>
        </div>
      </Secao>

      <Secao n={6} titulo="Escopo dos Serviços">
        {(
          [
            ["Objetivo", objetivo, setObjetivo, 4],
            ["Itens constantes", itens, setItens, 7],
            ["Metodologia", metodologia, setMetodologia, 6],
            ["Entregáveis", entregaveis, setEntregaveis, 5],
          ] as [string, string, (v: string) => void, number][]
        ).map(([rotulo, valorCampo, set, rows]) => (
          <div key={rotulo} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label>{rotulo}</Label>
              {autoPreenchido && <AutoTag />}
            </div>
            <Textarea rows={rows} value={valorCampo} onChange={(e) => set(e.target.value)} />
          </div>
        ))}
      </Secao>

      <Secao n={7} titulo="Valores e Condições">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="valor">Valor total (R$) *</Label>
            <Input
              id="valor"
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="1.500,00"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="validade">Validade (dias)</Label>
            <Input
              id="validade"
              inputMode="numeric"
              value={validade}
              onChange={(e) => setValidade(soDigitos(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prazo">Prazo de execução</Label>
            <Input
              id="prazo"
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
              placeholder="Ex.: 5 dias úteis após a vistoria"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="condicoes">Condições de pagamento</Label>
            <Textarea
              id="condicoes"
              rows={3}
              value={condicoes}
              onChange={(e) => setCondicoes(e.target.value)}
              placeholder="Ex.: 50% na contratação e 50% na entrega do laudo (PIX ou transferência)."
            />
          </div>
        </div>
      </Secao>

      <Secao n={8} titulo="Não Incluído">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor="nao-incluido">Itens não incluídos</Label>
            {autoPreenchido && <AutoTag />}
          </div>
          <Textarea
            id="nao-incluido"
            rows={8}
            value={naoIncluido}
            onChange={(e) => setNaoIncluido(e.target.value)}
          />
        </div>
      </Secao>

      {erro && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm font-semibold text-destructive">
          {erro}
        </p>
      )}

      <div className="flex flex-wrap gap-2 pb-6">
        <Button disabled={salvando} onClick={() => enviar("rascunho")}>
          {salvando ? "Salvando..." : "Salvar Rascunho"}
        </Button>
        <Button variant="secondary" disabled={salvando} onClick={() => enviar("enviada")}>
          Salvar e Enviar
        </Button>
        <Button variant="outline" onClick={onCancelar} disabled={salvando}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
