import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Loader2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { aprimorarTexto, mensagemErroIA } from "@/lib/ai";
import { tituloItem } from "@/lib/vistorias-ambientes";
import {
  ITEM_STATUS_CLASSE,
  ITEM_STATUS_LABEL_AMBIENTE,
  atualizarItem,
  type FotoVistoria,
  type ItemVistoria,
} from "@/lib/vistorias";
import { FotosItem } from "./FotosItem";

export function ItemAmbiente({
  item,
  vistoriaId,
  fotos,
  bloqueado,
  onRecarregar,
  onRecarregarFotos,
  onExcluir,
  arrastavel,
  dragProps,
}: {
  item: ItemVistoria;
  vistoriaId: string;
  fotos: FotoVistoria[];
  bloqueado: boolean;
  onRecarregar: () => void;
  onRecarregarFotos: () => void;
  onExcluir?: () => void;
  arrastavel?: boolean;
  dragProps?: React.HTMLAttributes<HTMLDivElement>;
}) {
  const [aberto, setAberto] = useState(false);
  const [obs, setObs] = useState(item.observacoes ?? "");
  const [aprimorado, setAprimorado] = useState(item.observacao_aprimorada ?? "");
  const [carregandoIA, setCarregandoIA] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const temOrientacoes = Boolean(item.orientacoes || item.teste || item.atencao);

  const salvar = async (
    campos: Partial<
      Pick<
        ItemVistoria,
        "status" | "existe_sistema" | "observacoes" | "observacao_aprimorada" | "titulo"
      >
    >,
  ) => {
    setSalvando(true);
    try {
      await atualizarItem(item.id, campos);
      onRecarregar();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSalvando(false);
    }
  };

  const aprimorar = async () => {
    const base = obs.trim();
    if (!base) {
      toast.error("Escreva a observação antes de aprimorar.");
      return;
    }
    setCarregandoIA(true);
    try {
      const resultado = await aprimorarTexto(base);
      setAprimorado(resultado);
    } catch (e) {
      toast.error(mensagemErroIA((e as Error).message));
    } finally {
      setCarregandoIA(false);
    }
  };

  const existe = item.existe_sistema;
  const naoSeAplica = existe === false;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          {arrastavel && (
            <span
              {...dragProps}
              className="mt-0.5 cursor-grab text-muted-foreground"
              aria-label="Arraste para reordenar"
            >
              <GripVertical className="h-4 w-4" />
            </span>
          )}
          <div>
            <p className="text-sm font-semibold text-foreground">{tituloItem(item)}</p>
            {item.personalizado && (
              <span className="text-[11px] font-semibold uppercase text-muted-foreground">
                Item personalizado
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${ITEM_STATUS_CLASSE[item.status]}`}
          >
            {ITEM_STATUS_LABEL_AMBIENTE[item.status]}
          </span>
          {onExcluir && (
            <button
              type="button"
              aria-label="Excluir item"
              onClick={onExcluir}
              className="rounded p-1 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {temOrientacoes && (
        <div>
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
          >
            {aberto ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            Orientações, teste e atenção
          </button>
          {aberto && (
            <div className="mt-2 space-y-1.5 rounded-lg bg-muted/50 p-3 text-xs leading-relaxed">
              {item.orientacoes && (
                <p>
                  <strong>Orientações:</strong> {item.orientacoes}
                </p>
              )}
              {item.teste && (
                <p>
                  <strong>Teste:</strong> {item.teste}
                </p>
              )}
              {item.atencao && (
                <p className="text-amber-700">
                  <strong>Atenção:</strong> {item.atencao}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {!bloqueado && (
        <>
          <div className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Existe o sistema?
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={existe === true ? "default" : "outline"}
                disabled={salvando}
                onClick={() => void salvar({ existe_sistema: true, status: "pendente" })}
              >
                Sim
              </Button>
              <Button
                size="sm"
                variant={naoSeAplica ? "default" : "outline"}
                disabled={salvando}
                onClick={() => void salvar({ existe_sistema: false, status: "nao_aplicavel" })}
              >
                Não
              </Button>
            </div>
          </div>

          {existe === true && (
            <>
              <div className="space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Status
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className={
                      item.status === "conforme"
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : ""
                    }
                    variant={item.status === "conforme" ? "default" : "outline"}
                    disabled={salvando}
                    onClick={() => void salvar({ status: "conforme" })}
                  >
                    Aprovado
                  </Button>
                  <Button
                    size="sm"
                    className={
                      item.status === "nao_conforme" ? "bg-red-600 text-white hover:bg-red-700" : ""
                    }
                    variant={item.status === "nao_conforme" ? "default" : "outline"}
                    disabled={salvando}
                    onClick={() => void salvar({ status: "nao_conforme" })}
                  >
                    Reprovado
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Textarea
                  rows={3}
                  placeholder="Observação técnica do item"
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  onBlur={() => {
                    if ((item.observacoes ?? "") !== obs) void salvar({ observacoes: obs });
                  }}
                />
                <Button size="sm" variant="outline" disabled={carregandoIA} onClick={aprimorar}>
                  {carregandoIA ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-1.5 h-4 w-4" />
                  )}
                  {carregandoIA ? "Aprimorando..." : "Aprimorar"}
                </Button>

                {aprimorado && (
                  <div className="space-y-2 rounded-lg border border-primary/40 bg-primary/5 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-primary">
                      Texto aprimorado
                    </p>
                    <Textarea
                      rows={3}
                      value={aprimorado}
                      onChange={(e) => setAprimorado(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        disabled={salvando}
                        onClick={() => {
                          void salvar({ observacao_aprimorada: aprimorado });
                          toast.success("Texto aprimorado aplicado ao relatório.");
                        }}
                      >
                        Usar aprimorado
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAprimorado("");
                          void salvar({ observacao_aprimorada: null as unknown as string });
                        }}
                      >
                        Manter original
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {item.status === "nao_conforme" && (
                <FotosItem
                  vistoriaId={vistoriaId}
                  itemId={item.id}
                  fotos={fotos}
                  onMudou={onRecarregarFotos}
                  comLegenda
                />
              )}
            </>
          )}
        </>
      )}

      {bloqueado && (item.observacao_aprimorada || item.observacoes) && (
        <p className="text-sm text-muted-foreground">
          {item.observacao_aprimorada || item.observacoes}
        </p>
      )}
    </div>
  );
}
