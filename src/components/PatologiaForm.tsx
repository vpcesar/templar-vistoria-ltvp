import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Save, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Field, InfoTip } from "@/components/InfoTip";
import { ChipMulti, SearchSelect, SegmentedOptions, SelectOrText } from "@/components/fields";
import {
  CLASSIFICACOES,
  ELEMENTOS,
  LOCAIS,
  MANIFESTACOES,
  POSICOES,
  SETORES,
  TOOLTIPS,
} from "@/lib/catalogos";
import { chamarGeminiAPI, obterChaveGemini } from "@/lib/gemini";
import { comprimirDataUrl, uid } from "@/lib/storage";
import { gutTotal, riscoDe, type DadosImovel, type Patologia } from "@/lib/types";

const riskClass = { critico: "bg-risk-high", medio: "bg-risk-mid", baixo: "bg-risk-low" };

const RASCUNHO_KEY = "templar_patologia_rascunho";

/** Guarda a ficha em andamento para que nada seja perdido se a aba recarregar no celular. */
function gravarRascunho(pat: Patologia) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RASCUNHO_KEY, JSON.stringify(pat));
  } catch {
    try {
      window.localStorage.setItem(RASCUNHO_KEY, JSON.stringify({ ...pat, fotos: [] }));
    } catch {
      /* sem espaço: mantém apenas na memória */
    }
  }
}

function lerRascunho(id: string): Patologia | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(RASCUNHO_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Patologia;
    return p && p.id === id ? p : null;
  } catch {
    return null;
  }
}

function limparRascunho() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(RASCUNHO_KEY);
  } catch {
    /* ignora */
  }
}

export function PatologiaForm({
  inicial,

  modo = "novo",
  onSalvar,
  onCancelar,
}: {
  inicial: Patologia;
  imovel: DadosImovel;
  modo?: "novo" | "editar";
  onSalvar: (p: Patologia) => void;
  onCancelar: () => void;
}) {
  const [pat, setPat] = useState<Patologia>(inicial);
  const [loading, setLoading] = useState<"class" | "rec" | "gut" | "obs" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const patRef = useRef(pat);
  patRef.current = pat;

  // Restaura o rascunho da mesma patologia após recarregamento da aba.
  useEffect(() => {
    const rascunho = lerRascunho(inicial.id);
    if (rascunho) {
      setPat((atual) => ({ ...rascunho, fotos: rascunho.fotos?.length ? rascunho.fotos : atual.fotos }));
      toast.info("Rascunho recuperado automaticamente.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inicial.id]);

  // Autossalvamento com pequeno atraso para não travar a digitação.
  useEffect(() => {
    const t = window.setTimeout(() => gravarRascunho(pat), 500);
    return () => window.clearTimeout(t);
  }, [pat]);

  // Salva imediatamente quando o app vai para segundo plano no celular.
  useEffect(() => {
    const salvarAgora = () => gravarRascunho(patRef.current);
    window.addEventListener("pagehide", salvarAgora);
    document.addEventListener("visibilitychange", salvarAgora);
    return () => {
      window.removeEventListener("pagehide", salvarAgora);
      document.removeEventListener("visibilitychange", salvarAgora);
    };
  }, []);

  const set = <K extends keyof Patologia>(k: K, val: Patologia[K]) =>
    setPat((p) => ({ ...p, [k]: val }));

  const podeIA = !!pat.elemento && !!pat.local && pat.manifestacoes.length > 0;
  const total = gutTotal(pat);
  const risco = riscoDe(total);


  const addFotos = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const comprimida = await comprimirDataUrl(String(reader.result), 1200, 0.7);
        setPat((p) => ({ ...p, fotos: [...p.fotos, { id: uid(), dataUrl: comprimida }] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const faltaContexto = () => {
    if (podeIA) return false;
    toast.error(
      "Para usar a IA, preencha o elemento, o local e selecione ao menos uma manifestação.",
    );
    return true;
  };

  const executarIA = async (
    tipo: "class" | "rec" | "gut" | "obs",
    prompt: string,
    aplicar: (texto: string) => void,
  ) => {
    // Garante o rascunho salvo antes de qualquer chamada externa.
    gravarRascunho(patRef.current);
    if (!obterChaveGemini()) {
      toast.error("Configure a chave do Gemini nas Configurações (engrenagem).", {
        duration: 5000,
      });
      return;

    }
    setLoading(tipo);
    try {
      const texto = await chamarGeminiAPI(prompt);
      aplicar(texto);
      toast.success("Sugestão gerada com sucesso!");
    } catch (error) {
      const codigo = error instanceof Error ? error.message : "";
      console.error("Erro capturado:", codigo);
      if (codigo === "API_KEY_MISSING") {
        toast.error("Configure a chave do Gemini nas Configurações (engrenagem).", {
          duration: 5000,
        });
      } else if (codigo === "INVALID_KEY") {
        toast.error("Chave do Gemini inválida. Vá nas Configurações e clique em 'Testar chave'.", {
          duration: 5000,
        });
      } else if (codigo === "ACCESS_DENIED") {
        toast.error("Acesso negado. Verifique se a chave está ativa no Google AI Studio.", {
          duration: 5000,
        });
      } else if (codigo === "RATE_LIMIT") {
        toast.error("Limite de requisições excedido. Aguarde 30 segundos e tente novamente.", {
          duration: 5000,
        });
      } else if (codigo === "EMPTY_RESPONSE") {
        toast.error("A IA não retornou resposta. Tente novamente.", { duration: 5000 });
      } else if (codigo === "MODEL_UNAVAILABLE") {
        toast.error("Nenhum modelo do Gemini disponível para esta chave.", { duration: 5000 });
      } else if (codigo === "CONNECTION_ERROR") {
        toast.error("Não foi possível conectar ao Gemini. Verifique sua internet.", {
          duration: 5000,
        });
      } else {
        toast.error("Erro ao gerar sugestão. Tente novamente.", { duration: 5000 });
      }
    } finally {
      setLoading(null);
    }
  };

  const rodarClassificacao = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (faltaContexto()) return;
    await executarIA(
      "class",
      `Como engenheiro civil perito com especialização em Patologia das construções, analise as seguintes manifestações patológicas: ${pat.manifestacoes.join(", ")}. O elemento construtivo é: ${pat.elemento || "não informado"}. Local: ${pat.local || "não informado"}. Sugira a classificação técnica entre: Anomalia Endógena, Anomalia Exógena, Anomalia Natural ou Anomalia Funcional. Primeiro responda apenas com o nome da classificação. Em seguida, em uma nova linha, dê uma breve explicação do porquê da decisão.`,
      (texto) => {
        const limpo = texto.replace(/[*#`]/g, "").trim();
        const [primeira, ...resto] = limpo.split("\n");
        const classificacao = primeira?.trim() ?? limpo;
        const explicacao = resto.map((l) => l.trim()).filter(Boolean).join(" ") ?? "";
        const match = CLASSIFICACOES.find(
          (c) =>
            c.toLowerCase() === classificacao.toLowerCase() ||
            classificacao.toLowerCase().includes(c.toLowerCase()),
        );
        setPat((p) => ({
          ...p,
          classificacao: match ?? classificacao,
          iaConfianca: "",
          iaJustificativa: explicacao,
        }));
      },
    );
  };

  const rodarRecomendacao = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (faltaContexto()) return;
    await executarIA(
      "rec",
      `Como engenheiro civil perito com especialização em Patologia das construções, redija uma recomendação técnica profissional para a manifestação: ${pat.manifestacoes.join(", ")} no elemento: ${pat.elemento || "não informado"}, local: ${pat.local || "não informado"}. A recomendação deve seguir as normas ABNT aplicáveis, mas a informação precisa ser clara para entendimento de todos — nem muito técnica, nem popular demais (meio termo). Recomende também, de acordo com o caso, testes mais aprofundados e acompanhamentos, se necessário. Você é o técnico responsável e analisará o fato. Máximo 3 linhas. Responda apenas com o texto da recomendação.`,
      (texto) => set("recomendacao", texto.replace(/[*#`]/g, "").trim()),
    );
  };

  const otimizarObs = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const texto = (pat.observacoes ?? "").trim();
    if (texto.length < 10 && faltaContexto()) return;
    const prompt =
      texto.length >= 10
        ? `Como engenheiro civil perito, reescreva o texto abaixo de forma curta, objetiva e tecnicamente adequada para um laudo de inspeção predial. A informação deve ser clara para entendimento de todos — nem muito técnica, nem popular demais (meio termo). Não adicione informações novas. Máximo 2 linhas. Responda apenas com o texto, em português do Brasil.\n\nTexto original: ${texto}`
        : `Como engenheiro civil perito com especialização em Patologia das construções, redija uma observação técnica complementar para a manifestação patológica: ${pat.manifestacoes.join(", ")} em ${pat.elemento || "não informado"} / ${pat.local || "não informado"}. A informação deve ser clara para entendimento de todos — nem muito técnica, nem popular demais (meio termo). Inclua considerações sobre causas prováveis e urgência de intervenção. Máximo 2 linhas. Responda apenas com o texto da observação.`;
    await executarIA("obs", prompt, (r) => set("observacoes", r.replace(/[*#`]/g, "").trim()));
  };

  const rodarGut = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (faltaContexto()) return;
    await executarIA(
      "gut",
      `Como engenheiro civil perito com especialização em Patologia das construções, avalie a matriz GUT — gravidade (impacto do problema sobre pessoas e edificação) (1 a 5), urgência (prazo necessário para intervenção) (1 a 5) e tendência (velocidade de agravamento se nada for feito) (1 a 5) para a manifestação, de acordo com a tabela abaixo:\n\n${pat.manifestacoes.join(", ")} no elemento: ${pat.elemento || "não informado"}.\n\nConsidere o risco estrutural, a velocidade de propagação e a consequência de não intervir.\n\nTABELA DE PESOS:\n\nPeso 5: Gravidade extremamente grave | Urgência imediata | Agrava-se rapidamente\nPeso 4: Gravidade muito grave | Urgência com alguma urgência | Agrava-se em curto prazo\nPeso 3: Gravidade grave | Urgência o mais cedo possível | Agrava-se em médio prazo\nPeso 2: Gravidade pouco grave | Urgência pode aguardar | Agrava-se em longo prazo\nPeso 1: Gravidade sem gravidade | Urgência sem pressa | Não se agrava\n\nResponda no formato exato: G=X, U=X, T=X (onde X é um número de 1 a 5). Sem explicações adicionais.`,
      (texto) => {
        const g = texto.match(/G\s*=\s*(\d)/i);
        const u = texto.match(/U\s*=\s*(\d)/i);
        const t = texto.match(/T\s*=\s*(\d)/i);
        if (!g && !u && !t) {
          toast.error("A IA não retornou notas válidas. Ajuste os sliders manualmente.");
          return;
        }
        const clamp = (n: number) => Math.min(5, Math.max(1, n));
        setPat((p) => ({
          ...p,
          gravidade: g ? clamp(Number(g[1])) : p.gravidade,
          urgencia: u ? clamp(Number(u[1])) : p.urgencia,
          tendencia: t ? clamp(Number(t[1])) : p.tendencia,
          gutAjustado: false,
          justificativaG: "",
          justificativaU: "",
          justificativaT: "",
        }));
      },
    );
  };

  const salvar = () => {
    if (
      pat.fotos.length === 0 ||
      !pat.elemento ||
      !pat.local ||
      pat.manifestacoes.length === 0 ||
      !pat.classificacao
    ) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    limparRascunho();
    onSalvar(pat);
  };

  const cancelar = () => {
    limparRascunho();
    onCancelar();
  };


  const sliderGut = (
    key: "gravidade" | "urgencia" | "tendencia",
    label: string,
    tip: string,
    just?: string,
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="field-label">
          <span>{label}</span>
          <InfoTip text={tip} />
        </div>
        <span className="text-sm font-bold text-primary">{pat[key]}</span>
      </div>
      <Slider
        min={1}
        max={5}
        step={1}
        value={[pat[key]]}
        onValueChange={([val]) => setPat((p) => ({ ...p, [key]: val ?? 1, gutAjustado: true }))}
      />
      {just && <p className="text-xs text-muted-foreground">{just}</p>}
    </div>
  );

  return (
    <div className="space-y-6 rounded-xl border border-border bg-card p-4 shadow-card sm:p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground">
          {modo === "editar" ? "Editar Patologia" : "Ficha de Patologia"}
        </h3>
        <Button variant="ghost" size="icon" onClick={cancelar} aria-label="Cancelar">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Field label="Fotos" tip={TOOLTIPS.fotos}>
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex min-h-24 w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-muted/40 p-4 text-sm font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
          >
            <Camera className="h-6 w-6" />
            Tirar foto ou enviar imagem
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            hidden
            onChange={(e) => addFotos(e.target.files)}
          />
          {pat.fotos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {pat.fotos.map((f) => (
                <div
                  key={f.id}
                  className="relative overflow-hidden rounded-lg border border-border"
                >
                  <img
                    src={f.dataUrl}
                    alt="Registro da patologia"
                    className="h-20 w-full object-cover"
                  />
                  <button
                    type="button"
                    aria-label="Remover foto"
                    onClick={() =>
                      set(
                        "fotos",
                        pat.fotos.filter((x) => x.id !== f.id),
                      )
                    }
                    className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Field>

      <Field label="Setor vistoriado" tip={TOOLTIPS.setor}>
        <SearchSelect value={pat.setor} onChange={(v) => set("setor", v)} options={SETORES} />
      </Field>

      <Field label="Elemento inspecionado" tip={TOOLTIPS.elemento}>
        <SelectOrText
          value={pat.elemento}
          onChange={(v) => set("elemento", v)}
          options={ELEMENTOS}
          campo="elementos"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Local (ambiente)" tip={TOOLTIPS.local}>
          <SelectOrText
            value={pat.local}
            onChange={(v) => set("local", v)}
            options={LOCAIS}
            campo="locais"
          />
        </Field>
        <Field label="Posição no ambiente" tip={TOOLTIPS.posicao}>
          <SelectOrText
            value={pat.posicao}
            onChange={(v) => set("posicao", v)}
            options={POSICOES}
            campo="posicoes"
          />
        </Field>
      </div>

      <Field label="Manifestações patológicas" tip={TOOLTIPS.manifestacoes}>
        <ChipMulti
          values={pat.manifestacoes}
          onChange={(v) => set("manifestacoes", v)}
          options={MANIFESTACOES}
          campo="manifestacoes"
        />
      </Field>

      <Field label="Classificação (origem)" tip={TOOLTIPS.classificacao}>
        <div className="space-y-3">
          <SegmentedOptions
            value={pat.classificacao}
            onChange={(v) => set("classificacao", v)}
            options={CLASSIFICACOES}
          />
          {
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full"
              onClick={rodarClassificacao}
              disabled={loading === "class"}
            >
              {loading === "class" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {loading === "class" ? "Gerando..." : "Sugerir classificação com IA"}
            </Button>
          }
          {pat.iaJustificativa && (
            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <Badge variant="secondary" className="mb-2">
                Confiança: {pat.iaConfianca}
              </Badge>
              <p className="text-xs leading-relaxed text-muted-foreground">{pat.iaJustificativa}</p>
            </div>
          )}
        </div>
      </Field>

      <Field label="Recomendações técnicas" tip={TOOLTIPS.recomendacao}>
        <div className="space-y-3">
          <Textarea
            rows={7}
            value={pat.recomendacao}
            onChange={(e) => set("recomendacao", e.target.value)}
            placeholder="Gere com IA e valide, ou escreva a recomendação técnica."
          />
          {
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full"
              onClick={rodarRecomendacao}
              disabled={loading === "rec"}
            >
              {loading === "rec" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {loading === "rec" ? "Gerando..." : "Sugerir recomendação com IA"}
            </Button>
          }
        </div>
      </Field>

      <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-foreground">Matriz GUT</h4>
          <div className="flex items-center gap-2">
            {pat.gutAjustado && <Badge variant="outline">Ajustado pelo inspetor</Badge>}
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold text-primary-foreground ${riskClass[risco.tone]}`}
            >
              {total} — {risco.label}
            </span>
          </div>
        </div>
        {sliderGut("gravidade", "Gravidade (G)", TOOLTIPS.gravidade, pat.justificativaG)}
        {sliderGut("urgencia", "Urgência (U)", TOOLTIPS.urgencia, pat.justificativaU)}
        {sliderGut("tendencia", "Tendência (T)", TOOLTIPS.tendencia, pat.justificativaT)}
        {
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full"
            onClick={rodarGut}
            disabled={loading === "gut"}
          >
            {loading === "gut" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {loading === "gut" ? "Gerando..." : "Sugerir GUT com IA"}
          </Button>
        }
      </div>

      <Field
        label="Observações da patologia"
        tip="Informações complementares sobre a manifestação."
      >
        <div className="space-y-3">
          <Textarea
            rows={3}
            value={pat.observacoes ?? ""}
            onChange={(e) => set("observacoes", e.target.value)}
          />
          {
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full border-primary text-primary hover:bg-accent"
              onClick={otimizarObs}
              disabled={loading === "obs"}
            >
              {loading === "obs" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {loading === "obs" ? "Gerando..." : "Sugerir observação com IA"}
            </Button>
          }
        </div>
      </Field>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={salvar} className="min-h-12 flex-1">
          <Save className="mr-2 h-4 w-4" />
          {modo === "editar" ? "Salvar Alterações" : "Salvar patologia"}
        </Button>
        <Button variant="outline" onClick={cancelar} className="min-h-12">
          Cancelar
        </Button>
      </div>
    </div>
  );
}
