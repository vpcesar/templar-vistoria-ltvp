import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { LaudoEditavel } from "@/lib/laudo-editavel";
import { riscoDe } from "@/lib/types";

type Setter = (atualizar: (anterior: LaudoEditavel) => LaudoEditavel) => void;

interface Props {
  laudo: LaudoEditavel;
  setLaudo: Setter;
  numeroItensAdicionais: number;
  slotItensAdicionais: React.ReactNode;
}

function Secao({
  numero,
  titulo,
  aberta,
  onToggle,
  children,
}: {
  numero: string;
  titulo: string;
  aberta: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }}
        className="flex w-full items-center justify-between gap-3 bg-muted/50 p-3 text-left"
      >
        <span className="text-sm font-bold text-foreground">
          {numero}. {titulo}
        </span>
        {aberta ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {aberta && <div className="space-y-3 p-3 sm:p-4">{children}</div>}
    </div>
  );
}

function CampoTexto({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {rows ? (
        <Textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <Input type="text" className="min-h-11" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

const CHAVES = [
  "s1",
  "s2",
  "s3",
  "s4",
  "s5",
  "s6",
  "s7",
  "s9",
  "s10",
  "s11",
  "s12",
  "s13",
  "s14",
  "sIt",
  "sEnc",
  "sAss",
] as const;
type Chave = (typeof CHAVES)[number];

export function LaudoEditor({
  laudo,
  setLaudo,
  numeroItensAdicionais,
  slotItensAdicionais,
}: Props) {
  const [abertas, setAbertas] = useState<Record<Chave, boolean>>(
    () => Object.fromEntries(CHAVES.map((k) => [k, k === "s1"])) as Record<Chave, boolean>,
  );

  const toggle = (k: Chave) => setAbertas((prev) => ({ ...prev, [k]: !prev[k] }));
  const todas = (valor: boolean) =>
    setAbertas(Object.fromEntries(CHAVES.map((k) => [k, valor])) as Record<Chave, boolean>);

  const campo = <S extends keyof LaudoEditavel>(
    secao: S,
    chave: keyof LaudoEditavel[S],
    valor: LaudoEditavel[S][keyof LaudoEditavel[S]],
  ) =>
    setLaudo((prev) => ({ ...prev, [secao]: { ...prev[secao], [chave]: valor } }));

  const numEncerramento = 15 + numeroItensAdicionais;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4 shadow-card sm:p-6">
        <h2 className="text-base font-bold text-foreground">Revisão de conteúdo do laudo</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Revise e corrija todos os campos abaixo antes de gerar o laudo. Cada seção é editável e as
          alterações são salvas automaticamente.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              todas(true);
            }}
          >
            Expandir todas
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              todas(false);
            }}
          >
            Recolher todas
          </Button>
        </div>
      </div>

      <Secao numero="1" titulo="Identificação do Solicitante" aberta={abertas.s1} onToggle={() => toggle("s1")}>
        <CampoTexto
          label="Texto da seção"
          rows={7}
          value={laudo.secao1.texto}
          onChange={(t) => campo("secao1", "texto", t)}
        />
      </Secao>

      <Secao numero="2" titulo="Objetivo" aberta={abertas.s2} onToggle={() => toggle("s2")}>
        <CampoTexto
          label="Texto do objetivo"
          rows={6}
          value={laudo.secao2.texto}
          onChange={(t) => campo("secao2", "texto", t)}
        />
      </Secao>

      <Secao numero="3" titulo="Dados Iniciais" aberta={abertas.s3} onToggle={() => toggle("s3")}>
        <CampoTexto label="Tipo de edificação" value={laudo.secao3.tipoEdificacao} onChange={(t) => campo("secao3", "tipoEdificacao", t)} />
        <CampoTexto label="Endereço" value={laudo.secao3.endereco} onChange={(t) => campo("secao3", "endereco", t)} />
        <CampoTexto label="Área construída" value={laudo.secao3.areaConstruida} onChange={(t) => campo("secao3", "areaConstruida", t)} />
        <CampoTexto label="Solicitante" value={laudo.secao3.solicitante} onChange={(t) => campo("secao3", "solicitante", t)} />
        <CampoTexto label="Responsável técnico" value={laudo.secao3.responsavel} onChange={(t) => campo("secao3", "responsavel", t)} />
        <CampoTexto label="CREA" value={laudo.secao3.crea} onChange={(t) => campo("secao3", "crea", t)} />
        <CampoTexto label="ART" value={laudo.secao3.art} onChange={(t) => campo("secao3", "art", t)} />
        <CampoTexto label="Data da vistoria" value={laudo.secao3.data} onChange={(t) => campo("secao3", "data", t)} />
      </Secao>

      <Secao numero="4" titulo="Descrição do Imóvel e Anamnese" aberta={abertas.s4} onToggle={() => toggle("s4")}>
        <CampoTexto label="Texto descritivo" rows={6} value={laudo.secao4.texto} onChange={(t) => campo("secao4", "texto", t)} />
        <CampoTexto label="Observações gerais" rows={3} value={laudo.secao4.observacoes} onChange={(t) => campo("secao4", "observacoes", t)} />
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Anamnese
          </p>
          {laudo.secao4.anamnese.map((item, i) => (
            <div key={`anam-${i}`} className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium text-foreground">{item.pergunta}</p>
              <Input
                type="text"
                className="mt-2 min-h-11"
                value={item.resposta}
                onChange={(e) =>
                  setLaudo((prev) => ({
                    ...prev,
                    secao4: {
                      ...prev.secao4,
                      anamnese: prev.secao4.anamnese.map((a, j) =>
                        j === i ? { ...a, resposta: e.target.value } : a,
                      ),
                    },
                  }))
                }
              />
            </div>
          ))}
        </div>
        <CampoTexto
          label="Observações da anamnese"
          rows={3}
          value={laudo.secao4.observacoesAnamnese}
          onChange={(t) => campo("secao4", "observacoesAnamnese", t)}
        />
      </Secao>

      <Secao numero="5" titulo="Foto da Edificação" aberta={abertas.s5} onToggle={() => toggle("s5")}>
        {laudo.secao5.legendasFachada.length === 0 && laudo.secao5.legendasSatelite.length === 0 && (
          <CampoTexto
            label="Texto quando não há fotos"
            rows={2}
            value={laudo.secao5.textoSemFoto}
            onChange={(t) => campo("secao5", "textoSemFoto", t)}
          />
        )}
        {laudo.secao5.legendasFachada.map((leg, i) => (
          <CampoTexto
            key={`fach-${i}`}
            label={`Legenda da foto da fachada ${i + 1}`}
            value={leg}
            onChange={(t) =>
              setLaudo((prev) => ({
                ...prev,
                secao5: {
                  ...prev.secao5,
                  legendasFachada: prev.secao5.legendasFachada.map((l, j) => (j === i ? t : l)),
                },
              }))
            }
          />
        ))}
        {laudo.secao5.legendasSatelite.map((leg, i) => (
          <CampoTexto
            key={`sat-${i}`}
            label={`Legenda da foto de satélite ${i + 1}`}
            value={leg}
            onChange={(t) =>
              setLaudo((prev) => ({
                ...prev,
                secao5: {
                  ...prev.secao5,
                  legendasSatelite: prev.secao5.legendasSatelite.map((l, j) => (j === i ? t : l)),
                },
              }))
            }
          />
        ))}
      </Secao>

      <Secao numero="6" titulo="Classificação da Inspeção" aberta={abertas.s6} onToggle={() => toggle("s6")}>
        <CampoTexto
          label="Texto da classificação (Nível 1)"
          rows={10}
          value={laudo.secao6.texto}
          onChange={(t) => campo("secao6", "texto", t)}
        />
      </Secao>

      <Secao numero="7" titulo="Metodologia" aberta={abertas.s7} onToggle={() => toggle("s7")}>
        {laudo.secao7.itens.map((item, i) => (
          <div key={`met-${i}`} className="space-y-2 rounded-lg border border-border p-3">
            <Input
              type="text"
              className="min-h-11 font-semibold"
              value={item.titulo}
              onChange={(e) =>
                setLaudo((prev) => ({
                  ...prev,
                  secao7: {
                    ...prev.secao7,
                    itens: prev.secao7.itens.map((it, j) =>
                      j === i ? { ...it, titulo: e.target.value } : it,
                    ),
                  },
                }))
              }
            />
            <Textarea
              rows={5}
              value={item.texto}
              onChange={(e) =>
                setLaudo((prev) => ({
                  ...prev,
                  secao7: {
                    ...prev.secao7,
                    itens: prev.secao7.itens.map((it, j) =>
                      j === i ? { ...it, texto: e.target.value } : it,
                    ),
                  },
                }))
              }
            />
          </div>
        ))}
      </Secao>

      <Secao numero="9" titulo="Sistemas Construtivos Inspecionados" aberta={abertas.s9} onToggle={() => toggle("s9")}>
        {laudo.secao9.sistemas.map((s, i) => (
          <div key={`sis-${i}`} className="flex gap-2">
            <Input
              type="text"
              className="min-h-11 flex-1"
              value={s}
              onChange={(e) =>
                setLaudo((prev) => ({
                  ...prev,
                  secao9: {
                    ...prev.secao9,
                    sistemas: prev.secao9.sistemas.map((x, j) => (j === i ? e.target.value : x)),
                  },
                }))
              }
            />
            <Button
              type="button"
              variant="outline"
              className="min-h-11 shrink-0"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLaudo((prev) => ({
                  ...prev,
                  secao9: {
                    ...prev.secao9,
                    sistemas: prev.secao9.sistemas.filter((_, j) => j !== i),
                  },
                }));
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setLaudo((prev) => ({
              ...prev,
              secao9: { ...prev.secao9, sistemas: [...prev.secao9.sistemas, ""] },
            }));
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar sistema
        </Button>
      </Secao>

      <Secao numero="10" titulo="Lista de Verificação" aberta={abertas.s10} onToggle={() => toggle("s10")}>
        {laudo.secao10.itens.map((item, i) => (
          <div key={`ver-${i}`} className="space-y-2 rounded-lg border border-border p-3">
            <CampoTexto
              label={`Item ${i + 1} — descrição`}
              value={item.descricao}
              onChange={(t) =>
                setLaudo((prev) => ({
                  ...prev,
                  secao10: {
                    ...prev.secao10,
                    itens: prev.secao10.itens.map((x, j) =>
                      j === i ? { ...x, descricao: t } : x,
                    ),
                  },
                }))
              }
            />
            <CampoTexto
              label="Verificado (SIM/NÃO)"
              value={item.verificado}
              onChange={(t) =>
                setLaudo((prev) => ({
                  ...prev,
                  secao10: {
                    ...prev.secao10,
                    itens: prev.secao10.itens.map((x, j) =>
                      j === i ? { ...x, verificado: t } : x,
                    ),
                  },
                }))
              }
            />
            <CampoTexto
              label="Observação"
              rows={3}
              value={item.observacao}
              onChange={(t) =>
                setLaudo((prev) => ({
                  ...prev,
                  secao10: {
                    ...prev.secao10,
                    itens: prev.secao10.itens.map((x, j) =>
                      j === i ? { ...x, observacao: t } : x,
                    ),
                  },
                }))
              }
            />
          </div>
        ))}
      </Secao>

      <Secao numero="11" titulo="Manifestações Patológicas" aberta={abertas.s11} onToggle={() => toggle("s11")}>
        {laudo.secao11.patologias.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma patologia registrada.</p>
        )}
        {laudo.secao11.patologias.map((pat, i) => {
          const editarPat = (chave: string, valor: string | number) =>
            setLaudo((prev) => ({
              ...prev,
              secao11: {
                ...prev.secao11,
                patologias: prev.secao11.patologias.map((x, j) =>
                  j === i ? { ...x, [chave]: valor } : x,
                ),
              },
            }));
          const total = pat.gravidade * pat.urgencia * pat.tendencia;
          return (
            <div key={`pat-${i}`} className="space-y-2 rounded-lg border-l-4 border-primary bg-muted/30 p-3">
              <p className="text-sm font-bold text-foreground">11.{i + 1}</p>
              <CampoTexto label="Título do subitem" value={pat.titulo} onChange={(t) => editarPat("titulo", t)} />
              <CampoTexto label="Elemento" value={pat.elemento} onChange={(t) => editarPat("elemento", t)} />
              <CampoTexto label="Local" value={pat.local} onChange={(t) => editarPat("local", t)} />
              <CampoTexto label="Posição" value={pat.posicao} onChange={(t) => editarPat("posicao", t)} />
              <CampoTexto label="Manifestações" rows={3} value={pat.manifestacoes} onChange={(t) => editarPat("manifestacoes", t)} />
              <CampoTexto label="Classificação" value={pat.classificacao} onChange={(t) => editarPat("classificacao", t)} />
              <CampoTexto label="Recomendações técnicas" rows={4} value={pat.recomendacao} onChange={(t) => editarPat("recomendacao", t)} />
              <CampoTexto label="Observações" rows={3} value={pat.observacoes} onChange={(t) => editarPat("observacoes", t)} />
              {pat.legendas.map((leg, k) => (
                <CampoTexto
                  key={`leg-${i}-${k}`}
                  label={`Legenda da foto ${k + 1}`}
                  value={leg}
                  onChange={(t) =>
                    setLaudo((prev) => ({
                      ...prev,
                      secao11: {
                        ...prev.secao11,
                        patologias: prev.secao11.patologias.map((x, j) =>
                          j === i
                            ? { ...x, legendas: x.legendas.map((l, m) => (m === k ? t : l)) }
                            : x,
                        ),
                      },
                    }))
                  }
                />
              ))}
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["Gravidade", "gravidade", pat.gravidade],
                    ["Urgência", "urgencia", pat.urgencia],
                    ["Tendência", "tendencia", pat.tendencia],
                  ] as const
                ).map(([label, chave, valor]) => (
                  <div key={`${chave}-${i}`} className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{label} (1-5)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      className="min-h-11"
                      value={valor}
                      onChange={(e) =>
                        editarPat(chave, Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-muted px-3 py-1 font-semibold">
                  Pontuação GUT: {total}
                </span>
                <span className="rounded-full bg-muted px-3 py-1 font-semibold">
                  {riscoDe(total).label}
                </span>
              </div>
            </div>
          );
        })}
      </Secao>

      <Secao numero="12" titulo="Lista de Prioridades" aberta={abertas.s12} onToggle={() => toggle("s12")}>
        <CampoTexto
          label="Texto introdutório"
          rows={7}
          value={laudo.secao12.texto}
          onChange={(t) => campo("secao12", "texto", t)}
        />
        <p className="text-xs text-muted-foreground">
          As tabelas de prioridades são calculadas pelo sistema e não são editáveis.
        </p>
      </Secao>

      <Secao numero="13" titulo="Conclusões" aberta={abertas.s13} onToggle={() => toggle("s13")}>
        <CampoTexto
          label="Texto de conclusões e recomendações gerais"
          rows={10}
          value={laudo.secao13.texto}
          onChange={(t) => campo("secao13", "texto", t)}
        />
      </Secao>

      <Secao numero="14" titulo="Normas Técnicas Aplicáveis" aberta={abertas.s14} onToggle={() => toggle("s14")}>
        {laudo.secao14.normas.map((norma, i) => (
          <div key={`norma-${i}`} className="flex gap-2">
            <Input
              type="text"
              className="min-h-11 flex-1"
              value={norma}
              placeholder="Digite a norma..."
              onChange={(e) =>
                setLaudo((prev) => ({
                  ...prev,
                  secao14: {
                    ...prev.secao14,
                    normas: prev.secao14.normas.map((n, j) => (j === i ? e.target.value : n)),
                  },
                }))
              }
            />
            <Button
              type="button"
              variant="outline"
              className="min-h-11 shrink-0"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLaudo((prev) => ({
                  ...prev,
                  secao14: {
                    ...prev.secao14,
                    normas: prev.secao14.normas.filter((_, j) => j !== i),
                  },
                }));
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setLaudo((prev) => ({
              ...prev,
              secao14: { ...prev.secao14, normas: [...prev.secao14.normas, ""] },
            }));
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar norma
        </Button>
      </Secao>

      <Secao
        numero="15"
        titulo="Itens Adicionais"
        aberta={abertas.sIt}
        onToggle={() => toggle("sIt")}
      >
        {slotItensAdicionais}
      </Secao>

      <Secao
        numero={String(numEncerramento)}
        titulo="Encerramento"
        aberta={abertas.sEnc}
        onToggle={() => toggle("sEnc")}
      >
        <CampoTexto
          label="Texto do encerramento (use {{paginas}} para o total de páginas)"
          rows={5}
          value={laudo.encerramento.texto}
          onChange={(t) => campo("encerramento", "texto", t)}
        />
      </Secao>

      <Secao
        numero={String(numEncerramento + 1)}
        titulo="Assinatura"
        aberta={abertas.sAss}
        onToggle={() => toggle("sAss")}
      >
        <CampoTexto label="Cidade" value={laudo.assinatura.cidade} onChange={(t) => campo("assinatura", "cidade", t)} />
        <CampoTexto label="Data" value={laudo.assinatura.data} onChange={(t) => campo("assinatura", "data", t)} />
        <CampoTexto label="Nome do engenheiro" value={laudo.assinatura.nome} onChange={(t) => campo("assinatura", "nome", t)} />
        <CampoTexto label="CREA" value={laudo.assinatura.crea} onChange={(t) => campo("assinatura", "crea", t)} />
      </Secao>
    </div>
  );
}
