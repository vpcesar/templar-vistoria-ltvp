import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Camera, FileArchive, Loader2, Plus, Trash2 } from "lucide-react";
import { gerarLaudoDaVistoria, laudoDaVistoria } from "@/lib/laudo-de-vistoria";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ErpShell } from "@/components/ErpShell";
import { formatarDataBR } from "@/lib/propostas";
import {
  COMODOS_PADRAO,
  ITEM_STATUS,
  ITEM_STATUS_CLASSE,
  ITEM_STATUS_LABEL,
  VISTORIA_STATUS,
  VISTORIA_STATUS_CLASSE,
  VISTORIA_STATUS_LABEL,
  adicionarItem,
  atualizarItem,
  atualizarVistoria,
  enviarFoto,
  excluirFoto,
  listarFotos,
  listarItens,
  obterVistoriaCampo,
  progresso,
  type FotoVistoria,
  type ItemStatus,
  type ItemVistoria,
  type VistoriaStatus,
} from "@/lib/vistorias";

export const Route = createFileRoute("/vistorias/$id")({
  head: () => ({
    meta: [
      { title: "Execução da Vistoria | TEMPLAR ENGENHARIA" },
      {
        name: "description",
        content:
          "Execute o checklist da vistoria por categoria, classifique conformidades e anexe fotos de campo.",
      },
      { property: "og:title", content: "Execução da Vistoria | TEMPLAR ENGENHARIA" },
      {
        property: "og:description",
        content: "Checklist fotográfico de campo da TEMPLAR ENGENHARIA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VistoriaDetalhe,
});

function FotosDoItem({
  vistoriaId,
  itemId,
  fotos,
  onMudou,
}: {
  vistoriaId: string;
  itemId: string;
  fotos: FotoVistoria[];
  onMudou: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setEnviando(true);
    try {
      for (const file of Array.from(files)) {
        await enviarFoto(vistoriaId, file, itemId);
      }
      toast.success("Foto(s) enviada(s).");
      onMudou();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setEnviando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remover = async (foto: FotoVistoria) => {
    try {
      await excluirFoto(foto);
      onMudou();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => void enviar(e.target.files)}
      />
      <Button
        size="sm"
        variant="outline"
        disabled={enviando}
        onClick={() => inputRef.current?.click()}
      >
        {enviando ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
        ) : (
          <Camera className="mr-1.5 h-4 w-4" />
        )}
        {enviando ? "Enviando..." : "Adicionar foto"}
      </Button>
      {fotos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {fotos.map((f) => (
            <div key={f.id} className="group relative overflow-hidden rounded-lg border">
              <img src={f.url} alt={f.legenda ?? "Foto da vistoria"} className="h-20 w-full object-cover" />
              <button
                type="button"
                aria-label="Excluir foto"
                onClick={() => void remover(f)}
                className="absolute right-1 top-1 rounded bg-destructive/90 p-1 text-destructive-foreground"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const OUTRO = "__outro__";

function ComodoField({
  item,
  onSalvar,
}: {
  item: ItemVistoria;
  onSalvar: (comodo: string) => void;
}) {
  const salvo = item.comodo ?? "";
  const ehPadrao = (COMODOS_PADRAO as readonly string[]).includes(salvo);
  const [modo, setModo] = useState<string>(salvo === "" ? "" : ehPadrao ? salvo : OUTRO);
  const [livre, setLivre] = useState(ehPadrao ? "" : salvo);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Label className="text-xs text-muted-foreground">Cômodo</Label>
      <Select
        value={modo}
        onValueChange={(v) => {
          setModo(v);
          if (v === OUTRO) return;
          onSalvar(v);
        }}
      >
        <SelectTrigger className="h-9 w-[180px]">
          <SelectValue placeholder="Selecione o cômodo" />
        </SelectTrigger>
        <SelectContent>
          {COMODOS_PADRAO.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
          <SelectItem value={OUTRO}>Outro...</SelectItem>
        </SelectContent>
      </Select>
      {modo === OUTRO && (
        <Input
          className="h-9 w-[200px]"
          placeholder="Nome do cômodo"
          value={livre}
          onChange={(e) => setLivre(e.target.value)}
          onBlur={() => {
            const v = livre.trim();
            if (v && v !== salvo) onSalvar(v);
          }}
        />
      )}
    </div>
  );
}

function VistoriaDetalhe() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const [novoItem, setNovoItem] = useState("");
  const [novaCategoria, setNovaCategoria] = useState("");

  const vistoriaQuery = useQuery({
    queryKey: ["vistoria", id],
    queryFn: () => obterVistoriaCampo(id),
  });
  const itensQuery = useQuery({ queryKey: ["itens-vistoria", id], queryFn: () => listarItens(id) });
  const fotosQuery = useQuery({ queryKey: ["fotos-vistoria", id], queryFn: () => listarFotos(id) });

  const itens = itensQuery.data ?? [];
  const fotos = fotosQuery.data ?? [];
  const vistoria = vistoriaQuery.data;
  const prog = progresso(itens);

  const categorias = useMemo(() => {
    const mapa = new Map<string, ItemVistoria[]>();
    itens.forEach((i) => {
      const lista = mapa.get(i.categoria) ?? [];
      lista.push(i);
      mapa.set(i.categoria, lista);
    });
    return Array.from(mapa.entries());
  }, [itens]);

  const recarregarItens = () =>
    queryClient.invalidateQueries({ queryKey: ["itens-vistoria", id] });
  const recarregarFotos = () => queryClient.invalidateQueries({ queryKey: ["fotos-vistoria", id] });

  const mudarStatusItem = useMutation({
    mutationFn: (v: { itemId: string; status: ItemStatus }) =>
      atualizarItem(v.itemId, { status: v.status }),
    onSuccess: () => void recarregarItens(),
    onError: (e: Error) => toast.error(e.message),
  });

  const salvarComodo = useMutation({
    mutationFn: (v: { itemId: string; comodo: string }) =>
      atualizarItem(v.itemId, { comodo: v.comodo }),
    onSuccess: () => void recarregarItens(),
    onError: (e: Error) => toast.error(e.message),
  });

  const salvarObservacao = useMutation({
    mutationFn: (v: { itemId: string; observacao: string }) =>
      atualizarItem(v.itemId, { observacoes: v.observacao }),
    onError: (e: Error) => toast.error(e.message),
  });

  const mudarStatusVistoria = useMutation({
    mutationFn: (status: VistoriaStatus) => atualizarVistoria(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vistoria", id] });
      queryClient.invalidateQueries({ queryKey: ["vistorias"] });
      toast.success("Status da vistoria atualizado.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const navigate = useNavigate();
  const laudoExistente = vistoria ? laudoDaVistoria(vistoria.id) : undefined;

  const gerarLaudo = useMutation({
    mutationFn: async () => {
      if (!vistoria) throw new Error("Vistoria não carregada.");
      return gerarLaudoDaVistoria(vistoria, itens, fotos);
    },
    onSuccess: (laudo) => {
      toast.success(`Laudo em rascunho criado a partir de ${vistoria?.numero}.`);
      void navigate({ to: "/revisao/$id", params: { id: laudo.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });



  const criarItem = useMutation({
    mutationFn: () => {
      if (!novaCategoria.trim() || !novoItem.trim())
        throw new Error("Informe a categoria e o item.");
      return adicionarItem(id, novaCategoria.trim(), novoItem.trim(), itens.length + 1);
    },
    onSuccess: () => {
      setNovoItem("");
      void recarregarItens();
      toast.success("Item adicionado ao checklist.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <ErpShell>
      <div className="space-y-5">
        <Link
          to="/vistorias"
          search={{}}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para vistorias
        </Link>

        {vistoriaQuery.isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

        {!vistoriaQuery.isLoading && !vistoria && (
          <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Vistoria não encontrada.
          </p>
        )}

        {vistoria && ehFluxoAmbientes(vistoria) && <ChecklistAmbientes vistoria={vistoria} />}

        {vistoria && !ehFluxoAmbientes(vistoria) && (
          <>
            <div className="space-y-3 rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {vistoria.numero}
                  </p>
                  <h1 className="mt-1 text-2xl font-bold text-foreground">
                    {vistoria.cliente_nome}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">{vistoria.tipo_servico}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={vistoria.status}
                    onValueChange={(v) => mudarStatusVistoria.mutate(v as VistoriaStatus)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VISTORIA_STATUS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {VISTORIA_STATUS_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                    disabled={vistoria.status !== "concluida" || gerarLaudo.isPending}
                    title={
                      vistoria.status === "concluida"
                        ? "Gerar laudo com os dados desta vistoria"
                        : "Finalize a vistoria para gerar o laudo"
                    }
                    onClick={() => gerarLaudo.mutate()}
                  >
                    {gerarLaudo.isPending ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <FileArchive className="mr-1.5 h-4 w-4" />
                    )}
                    {laudoExistente ? "Abrir laudo" : "Gerar Laudo"}
                  </Button>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${VISTORIA_STATUS_CLASSE[vistoria.status]}`}
                  >
                    {VISTORIA_STATUS_LABEL[vistoria.status]}
                  </span>
                </div>
              </div>

              <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <p>
                  Data: {formatarDataBR(vistoria.data_vistoria)}
                  {vistoria.hora_vistoria ? ` às ${vistoria.hora_vistoria}` : ""}
                </p>
                <p>Telefone: {vistoria.cliente_telefone || "—"}</p>
                <p className="sm:col-span-2">Endereço: {vistoria.imovel_endereco || "—"}</p>
                <p>
                  Responsável: {vistoria.responsavel_tecnico_nome} —{" "}
                  {vistoria.responsavel_tecnico_crea}
                </p>
                <p>Fotos anexadas: {fotos.length}</p>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>
                    Progresso do checklist: {prog.avaliados} de {prog.total} itens
                  </span>
                  <span>{prog.percentual}%</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${prog.percentual}%` }}
                  />
                </div>
                {prog.naoConformes > 0 && (
                  <p className="mt-2 text-xs font-semibold text-destructive">
                    {prog.naoConformes} não conformidade(s) registrada(s).
                  </p>
                )}
              </div>
            </div>

            {itens.length === 0 && !itensQuery.isLoading && (
              <p className="rounded-xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
                Nenhum item de checklist. Adicione itens manualmente abaixo.
              </p>
            )}

            <Accordion type="multiple" className="space-y-2">
              {categorias.map(([categoria, lista]) => {
                const avaliados = lista.filter((i) => i.status !== "pendente").length;
                return (
                  <AccordionItem
                    key={categoria}
                    value={categoria}
                    className="rounded-xl border border-border bg-card px-4"
                  >
                    <AccordionTrigger className="text-left">
                      <span className="flex flex-1 items-center justify-between gap-3 pr-2">
                        <span className="font-semibold">{categoria}</span>
                        <span className="text-xs text-muted-foreground">
                          {avaliados}/{lista.length}
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pb-4">
                      {lista.map((item) => (
                        <div key={item.id} className="space-y-2 rounded-lg border border-border p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground">{item.item}</p>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${ITEM_STATUS_CLASSE[item.status]}`}
                            >
                              {ITEM_STATUS_LABEL[item.status]}
                            </span>
                          </div>
                          <ComodoField
                            item={item}
                            onSalvar={(comodo) => salvarComodo.mutate({ itemId: item.id, comodo })}
                          />
                          <div className="flex flex-wrap gap-1.5">
                            {ITEM_STATUS.map((s) => (
                              <Button
                                key={s}
                                size="sm"
                                variant={item.status === s ? "default" : "outline"}
                                onClick={() =>
                                  mudarStatusItem.mutate({ itemId: item.id, status: s })
                                }
                              >
                                {ITEM_STATUS_LABEL[s]}
                              </Button>
                            ))}
                          </div>
                          <Textarea
                            rows={2}
                            placeholder="Observação técnica do item"
                            defaultValue={item.observacoes ?? ""}
                            onBlur={(e) => {
                              if ((item.observacoes ?? "") === e.target.value) return;
                              salvarObservacao.mutate({
                                itemId: item.id,
                                observacao: e.target.value,
                              });
                            }}
                          />
                          <FotosDoItem
                            vistoriaId={id}
                            itemId={item.id}
                            fotos={fotos.filter((f) => f.item_vistoria_id === item.id)}
                            onMudou={recarregarFotos}
                          />
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>

            <div className="space-y-3 rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-bold text-foreground">Adicionar item ao checklist</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Categoria</Label>
                  <Input
                    value={novaCategoria}
                    placeholder="Ex.: Paredes"
                    onChange={(e) => setNovaCategoria(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Item</Label>
                  <Input
                    value={novoItem}
                    placeholder="Ex.: Fissuras na alvenaria"
                    onChange={(e) => setNovoItem(e.target.value)}
                  />
                </div>
              </div>
              <Button
                variant="outline"
                disabled={criarItem.isPending}
                onClick={() => criarItem.mutate()}
              >
                <Plus className="mr-1.5 h-4 w-4" /> Adicionar item
              </Button>
            </div>
          </>
        )}
      </div>
    </ErpShell>
  );
}
