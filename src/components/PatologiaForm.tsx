import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
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
import {
  gerarRecomendacao,
  otimizarObservacaoIA,
  sugerirClassificacao,
  sugerirGUT,
} from "@/lib/ai.functions";
import { comprimirDataUrl, uid } from "@/lib/storage";
import { gutTotal, riscoDe, type DadosImovel, type Patologia } from "@/lib/types";

const riskClass = { critico: "bg-risk-high", medio: "bg-risk-mid", baixo: "bg-risk-low" };

export function PatologiaForm({
  inicial,
  imovel,
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

  const classFn = useServerFn(sugerirClassificacao);
  const recFn = useServerFn(gerarRecomendacao);
  const gutFn = useServerFn(sugerirGUT);
  const obsFn = useServerFn(otimizarObservacaoIA);

  const set = <K extends keyof Patologia>(k: K, val: Patologia[K]) =>
    setPat((p) => ({ ...p, [k]: val }));

  const contexto = {
    elemento: pat.elemento,
    local: pat.local,
    posicao: pat.posicao,
    manifestacoes: pat.manifestacoes,
    classificacao: pat.classificacao,
    tipoEdificacao: imovel.tipoEdificacao,
    idadeAparente: imovel.idadeAparente,
  };

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

  const rodarClassificacao = async () => {
    setLoading("class");
    try {
      const r = await classFn({ data: contexto });
      setPat((p) => ({
        ...p,
        classificacao: r.classificacao,
        iaConfianca: r.confianca,
        iaJustificativa: r.justificativa,
      }));
    } catch {
      toast.error("Não foi possível consultar a IA. Selecione a classificação manualmente.");
    }
    setLoading(null);
  };

  const rodarRecomendacao = async () => {
    setLoading("rec");
    try {
      const r = await recFn({ data: contexto });
      set("recomendacao", r.acao_principal);
    } catch {
      toast.error("Não foi possível gerar a recomendação. Escreva manualmente.");
    }
    setLoading(null);
  };

  const otimizarObs = async () => {
    const texto = (pat.observacoes ?? "").trim();
    if (texto.length < 10) return;
    setLoading("obs");
    try {
      const r = await obsFn({ data: { texto } });
      set("observacoes", r.texto_otimizado);
    } catch {
      toast.error("Não foi possível otimizar. Edite manualmente.");
    }
    setLoading(null);
  };

  const rodarGut = async () => {
    setLoading("gut");
    try {
      const r = await gutFn({ data: contexto });
      const clamp = (n: number) => Math.min(5, Math.max(1, Math.round(n)));
      setPat((p) => ({
        ...p,
        gravidade: clamp(r.gravidade),
        urgencia: clamp(r.urgencia),
        tendencia: clamp(r.tendencia),
        gutAjustado: false,
        justificativaG: r.justificativa_g,
        justificativaU: r.justificativa_u,
        justificativaT: r.justificativa_t,
      }));
    } catch {
      toast.error("Não foi possível avaliar o risco. Ajuste os sliders manualmente.");
    }
    setLoading(null);
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
    onSalvar(pat);
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
        <Button variant="ghost" size="icon" onClick={onCancelar} aria-label="Cancelar">
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
          {podeIA && (
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
              {loading === "class" ? "Analisando..." : "Sugerir Classificação com IA"}
            </Button>
          )}
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
          {podeIA && (
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
              {loading === "rec" ? "Gerando recomendação..." : "Gerar Recomendação com IA"}
            </Button>
          )}
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
        {podeIA && !!pat.classificacao && (
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
            {loading === "gut" ? "Analisando risco..." : "Sugerir GUT com IA"}
          </Button>
        )}
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
          {(pat.observacoes ?? "").trim().length >= 10 && (
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
              {loading === "obs" ? "Otimizando..." : "Otimizar com IA"}
            </Button>
          )}
        </div>
      </Field>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={salvar} className="min-h-12 flex-1">
          <Save className="mr-2 h-4 w-4" />
          {modo === "editar" ? "Salvar Alterações" : "Salvar patologia"}
        </Button>
        <Button variant="outline" onClick={onCancelar} className="min-h-12">
          Cancelar
        </Button>
      </div>
    </div>
  );
}
