import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  FileArchive,
  FileDown,
  FileText,
  Loader2,
  Pencil,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { formatarDataBR } from "@/lib/propostas";
import { listarResponsaveis } from "@/lib/responsaveis";
import { gerarLaudoDaVistoria, laudoDaVistoria } from "@/lib/laudo-de-vistoria";
import { gerarVistoriaPdf } from "@/lib/report/vistoria-pdf";
import { gerarVistoriaDocx } from "@/lib/report/vistoria-docx";
import {
  adicionarItemPersonalizado,
  criarAmbientesComItens,
  listarAmbientes,
} from "@/lib/vistorias-ambientes";
import {
  TIPOS_IMOVEL,
  VISTORIA_STATUS_CLASSE,
  VISTORIA_STATUS_LABEL,
  atualizarVistoria,
  excluirItem,
  listarFotos,
  listarItens,
  progresso,
  type VistoriaCampo,
} from "@/lib/vistorias";
import { ItemAmbiente } from "./ItemAmbiente";
import { SelecaoAmbientes } from "./SelecaoAmbientes";

export function ChecklistAmbientes({ vistoria }: { vistoria: VistoriaCampo }) {
  const id = vistoria.id;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editando, setEditando] = useState(false);
  const [exportando, setExportando] = useState<"pdf" | "docx" | null>(null);
  const [novoItem, setNovoItem] = useState<Record<string, string>>({});

  const ambientesQuery = useQuery({
    queryKey: ["ambientes-vistoria", id],
    queryFn: () => listarAmbientes(id),
  });
  const itensQuery = useQuery({ queryKey: ["itens-vistoria", id], queryFn: () => listarItens(id) });
  const fotosQuery = useQuery({ queryKey: ["fotos-vistoria", id], queryFn: () => listarFotos(id) });

  const ambientes = ambientesQuery.data ?? [];
  const itens = itensQuery.data ?? [];
  const fotos = fotosQuery.data ?? [];
  const concluida = vistoria.status === "concluida";
  const prog = progresso(itens);
  const laudoExistente = laudoDaVistoria(id);

  const recarregarItens = () => {
    void queryClient.invalidateQueries({ queryKey: ["itens-vistoria", id] });
  };
  const recarregarFotos = () => {
    void queryClient.invalidateQueries({ queryKey: ["fotos-vistoria", id] });
  };

  const itensPorAmbiente = useMemo(() => {
    const mapa = new Map<string, typeof itens>();
    ambientes.forEach((a) => {
      mapa.set(
        a.id,
        itens.filter((i) => i.ambiente_id === a.id).sort((x, y) => x.ordem - y.ordem),
      );
    });
    return mapa;
  }, [ambientes, itens]);

  const concluir = useMutation({
    mutationFn: () => atualizarVistoria(id, { status: "concluida", concluida: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["vistoria", id] });
      void queryClient.invalidateQueries({ queryKey: ["vistorias"] });
      toast.success("Vistoria concluída.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reabrir = useMutation({
    mutationFn: () => atualizarVistoria(id, { status: "em_andamento", concluida: false }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["vistoria", id] });
      void queryClient.invalidateQueries({ queryKey: ["vistorias"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const gerarLaudo = useMutation({
    mutationFn: () => gerarLaudoDaVistoria(vistoria, itens, fotos),
    onSuccess: (laudo) => {
      toast.success(`Laudo em rascunho criado a partir de ${vistoria.numero}.`);
      void navigate({ to: "/revisao/$id", params: { id: laudo.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const criarItem = useMutation({
    mutationFn: async (ambienteId: string) => {
      const ambiente = ambientes.find((a) => a.id === ambienteId);
      if (!ambiente) throw new Error("Ambiente não encontrado.");
      const titulo = (novoItem[ambienteId] ?? "").trim();
      if (!titulo) throw new Error("Informe o título do item.");
      const lista = itensPorAmbiente.get(ambienteId) ?? [];
      const ultimo = lista[lista.length - 1];
      const ordem = (ultimo?.ordem ?? ambiente.ordem * 1000) + 1;
      return adicionarItemPersonalizado(id, ambiente, titulo, ordem);
    },
    onSuccess: (_, ambienteId) => {
      setNovoItem((prev) => ({ ...prev, [ambienteId]: "" }));
      recarregarItens();
      toast.success("Item incluído no ambiente.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removerItem = useMutation({
    mutationFn: (itemId: string) => excluirItem(itemId),
    onSuccess: () => {
      recarregarItens();
      toast.success("Item removido.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const exportar = async (formato: "pdf" | "docx") => {
    setExportando(formato);
    try {
      const dados = { vistoria, ambientes, itens, fotos };
      if (formato === "pdf") await gerarVistoriaPdf(dados);
      else await gerarVistoriaDocx(dados);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExportando(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              {vistoria.numero} • Checklist por ambientes
            </p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">{vistoria.cliente_nome}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{vistoria.tipo_servico}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${VISTORIA_STATUS_CLASSE[vistoria.status]}`}
            >
              {VISTORIA_STATUS_LABEL[vistoria.status]}
            </span>
            <Button variant="outline" onClick={() => setEditando(true)}>
              <Pencil className="mr-1.5 h-4 w-4" /> Editar cabeçalho
            </Button>
          </div>
        </div>

        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <p>
            Data: {formatarDataBR(vistoria.data_vistoria)}
            {vistoria.hora_vistoria ? ` às ${vistoria.hora_vistoria}` : ""}
          </p>
          <p>Telefone: {vistoria.cliente_telefone || "—"}</p>
          <p className="sm:col-span-2">Localização: {vistoria.imovel_endereco || "—"}</p>
          <p>Unidade: {vistoria.unidade || "—"}</p>
          <p>Tipo de imóvel: {vistoria.tipo_imovel || "—"}</p>
          <p>
            Responsável: {vistoria.responsavel_tecnico_nome} — {vistoria.responsavel_tecnico_crea}
          </p>
          <p>Responsável da construtora: {vistoria.responsavel_construtora || "—"}</p>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>
              {prog.avaliados} de {prog.total} itens preenchidos
            </span>
            <span>{prog.percentual}%</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${prog.percentual}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checklist por ambiente */}
      {ambientes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
          Nenhum ambiente cadastrado. Use “Editar cabeçalho” para incluir os ambientes da vistoria.
        </p>
      ) : (
        <Tabs defaultValue={ambientes[0]?.id ?? ""} className="space-y-3">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
            {ambientes.map((a) => {
              const lista = itensPorAmbiente.get(a.id) ?? [];
              const feitos = lista.filter((i) => i.status !== "pendente").length;
              return (
                <TabsTrigger key={a.id} value={a.id} className="text-xs">
                  {a.nome}
                  <span className="ml-1.5 text-[10px] text-muted-foreground">
                    {feitos}/{lista.length}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {ambientes.map((a) => {
            const lista = itensPorAmbiente.get(a.id) ?? [];
            return (
              <TabsContent key={a.id} value={a.id} className="space-y-3">
                {lista.map((item) => (
                  <ItemAmbiente
                    key={item.id}
                    item={item}
                    vistoriaId={id}
                    fotos={fotos.filter((f) => f.item_vistoria_id === item.id)}
                    bloqueado={concluida}
                    onRecarregar={recarregarItens}
                    onRecarregarFotos={recarregarFotos}
                    {...(item.personalizado && !concluida
                      ? { onExcluir: () => removerItem.mutate(item.id) }
                      : {})}
                  />
                ))}

                {!concluida && (
                  <div className="flex flex-wrap gap-2 rounded-lg border border-dashed border-border p-3">
                    <Input
                      className="flex-1"
                      placeholder="Título do item personalizado"
                      value={novoItem[a.id] ?? ""}
                      onChange={(e) =>
                        setNovoItem((prev) => ({ ...prev, [a.id]: e.target.value }))
                      }
                    />
                    <Button
                      variant="outline"
                      disabled={criarItem.isPending}
                      onClick={() => criarItem.mutate(a.id)}
                    >
                      <Plus className="mr-1.5 h-4 w-4" /> Incluir item
                    </Button>
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      )}

      {/* Revisão final */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-bold text-foreground">Revisão final</h2>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          {ambientes.map((a) => {
            const lista = itensPorAmbiente.get(a.id) ?? [];
            const p = progresso(lista);
            return (
              <p key={a.id} className="text-muted-foreground">
                <strong className="text-foreground">{a.nome}:</strong> {p.conformes} aprovados,{" "}
                {p.naoConformes} reprovados, {p.naoAplicaveis} não se aplica,{" "}
                {p.total - p.avaliados} pendentes
              </p>
            );
          })}
        </div>
        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-4">
          <p>Total de itens: {prog.total}</p>
          <p>Aprovados: {prog.conformes}</p>
          <p>Reprovados: {prog.naoConformes}</p>
          <p>Não se aplica: {prog.naoAplicaveis}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {!concluida ? (
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={concluir.isPending}
              onClick={() => concluir.mutate()}
            >
              {concluir.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
              )}
              Concluir Vistoria
            </Button>
          ) : (
            <>
              <Button
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={gerarLaudo.isPending}
                onClick={() => gerarLaudo.mutate()}
              >
                {gerarLaudo.isPending ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <FileArchive className="mr-1.5 h-4 w-4" />
                )}
                {laudoExistente ? "Abrir laudo" : "Gerar Laudo"}
              </Button>
              <Button
                variant="outline"
                disabled={exportando !== null}
                onClick={() => void exportar("pdf")}
              >
                <FileDown className="mr-1.5 h-4 w-4" />
                {exportando === "pdf" ? "Gerando PDF..." : "Exportar Relatório (PDF)"}
              </Button>
              <Button
                variant="outline"
                disabled={exportando !== null}
                onClick={() => void exportar("docx")}
              >
                <FileText className="mr-1.5 h-4 w-4" />
                {exportando === "docx" ? "Gerando Word..." : "Exportar Relatório (Word)"}
              </Button>
              <Button variant="ghost" onClick={() => reabrir.mutate()}>
                Reabrir vistoria
              </Button>
            </>
          )}
        </div>
      </div>

      <EditarCabecalhoDialog
        vistoria={vistoria}
        open={editando}
        onOpenChange={setEditando}
        ambientesExistentes={ambientes.map((a) => a.nome)}
        concluida={concluida}
        onSalvo={() => {
          void queryClient.invalidateQueries({ queryKey: ["vistoria", id] });
          void queryClient.invalidateQueries({ queryKey: ["ambientes-vistoria", id] });
          recarregarItens();
        }}
      />
    </div>
  );
}

function EditarCabecalhoDialog({
  vistoria,
  open,
  onOpenChange,
  ambientesExistentes,
  concluida,
  onSalvo,
}: {
  vistoria: VistoriaCampo;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ambientesExistentes: string[];
  concluida: boolean;
  onSalvo: () => void;
}) {
  const responsaveis = listarResponsaveis();
  const [cliente, setCliente] = useState(vistoria.cliente_nome);
  const [telefone, setTelefone] = useState(vistoria.cliente_telefone ?? "");
  const [data, setData] = useState(vistoria.data_vistoria);
  const [hora, setHora] = useState(vistoria.hora_vistoria ?? "");
  const [local, setLocal] = useState(vistoria.imovel_endereco ?? "");
  const [unidade, setUnidade] = useState(vistoria.unidade ?? "");
  const [tipoImovel, setTipoImovel] = useState(vistoria.tipo_imovel ?? "");
  const [construtora, setConstrutora] = useState(vistoria.responsavel_construtora ?? "");
  const [responsavel, setResponsavel] = useState(vistoria.responsavel_tecnico_nome);
  const [observacoes, setObservacoes] = useState(vistoria.observacoes ?? "");
  const [novosAmbientes, setNovosAmbientes] = useState<string[]>([]);
  const [confirmando, setConfirmando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    setSalvando(true);
    try {
      const resp = responsaveis.find((r) => r.nome === responsavel);
      await atualizarVistoria(vistoria.id, {
        cliente_nome: cliente.trim(),
        cliente_telefone: telefone || null,
        data_vistoria: data,
        hora_vistoria: hora || null,
        imovel_endereco: local || null,
        unidade: unidade || null,
        tipo_imovel: tipoImovel || null,
        responsavel_construtora: construtora || null,
        responsavel_tecnico_nome: resp?.nome ?? responsavel,
        ...(resp ? { responsavel_tecnico_crea: resp.crea } : {}),
        observacoes: observacoes || null,
      });
      const inéditos = novosAmbientes.filter((n) => !ambientesExistentes.includes(n));
      if (inéditos.length > 0) await criarAmbientesComItens(vistoria.id, inéditos);
      toast.success("Cabeçalho atualizado.");
      onSalvo();
      onOpenChange(false);
      setNovosAmbientes([]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSalvando(false);
      setConfirmando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar cabeçalho da vistoria</DialogTitle>
          <DialogDescription>
            Ambientes incluídos agora entram no checklist como não preenchidos.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <Input value={cliente} onChange={(e) => setCliente(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Telefone / WhatsApp</Label>
            <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Data da vistoria</Label>
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Hora da vistoria</Label>
            <Input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Localização</Label>
            <Input value={local} onChange={(e) => setLocal(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Unidade</Label>
            <Input
              placeholder="Ex.: Apto 302 - Bloco B"
              value={unidade}
              onChange={(e) => setUnidade(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo de imóvel</Label>
            <Select value={tipoImovel} onValueChange={setTipoImovel}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_IMOVEL.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Responsável da vistoria</Label>
            <Select value={responsavel} onValueChange={setResponsavel}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {responsaveis.map((r) => (
                  <SelectItem key={r.id} value={r.nome}>
                    {r.nome} — {r.crea}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Responsável da construtora</Label>
            <Input value={construtora} onChange={(e) => setConstrutora(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Observações</Label>
            <Textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border p-4">
          <p className="mb-2 text-xs text-muted-foreground">
            Ambientes já cadastrados: {ambientesExistentes.join(", ") || "nenhum"}
          </p>
          <SelecaoAmbientes selecionados={novosAmbientes} onChange={setNovosAmbientes} />
        </div>

        {confirmando ? (
          <div className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
            <p className="text-sm text-amber-900">
              Ao editar o cabeçalho, você precisará gerar o relatório novamente. Deseja continuar?
            </p>
            <div className="flex gap-2">
              <Button disabled={salvando} onClick={() => void salvar()}>
                {salvando ? "Salvando..." : "Sim, continuar"}
              </Button>
              <Button variant="outline" onClick={() => setConfirmando(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <DialogFooter>
            <Button
              disabled={salvando}
              onClick={() => {
                if (concluida) setConfirmando(true);
                else void salvar();
              }}
            >
              Salvar alterações
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
