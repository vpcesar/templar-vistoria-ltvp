import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, Output } from "ai";
import { z } from "zod";

const MODEL = "openai/gpt-5.6-sol";

const BASE_CONTEXT =
  "Baseie-se nas normas ABNT NBR 16747, ABNT NBR 5674 e na Norma de Inspeção Predial do IBAPE. Responda em português técnico do Brasil.";

function gateway() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return createOpenAICompatible({
    name: "lovable-ai-gateway",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": key },
    includeUsage: true,
    supportsStructuredOutputs: true,
  });
}

export interface ContextoPatologia {
  elemento: string;
  local: string;
  posicao?: string;
  manifestacoes: string[];
  classificacao?: string;
  tipoEdificacao?: string;
  idadeAparente?: number;
}

const resumo = (c: ContextoPatologia) =>
  [
    `Elemento construtivo: ${c.elemento}`,
    `Local/ambiente: ${c.local}`,
    c.posicao ? `Posição: ${c.posicao}` : "",
    `Manifestações patológicas observadas: ${c.manifestacoes.join(", ")}`,
    c.classificacao ? `Classificação de origem: ${c.classificacao}` : "",
    c.tipoEdificacao ? `Tipologia: ${c.tipoEdificacao}` : "",
    typeof c.idadeAparente === "number" ? `Idade aparente: ${c.idadeAparente} anos` : "",
  ]
    .filter(Boolean)
    .join("\n");

const classificacaoSchema = z.object({
  classificacao: z.string(),
  confianca: z.string(),
  justificativa: z.string(),
});

const recomendacaoSchema = z.object({
  acao_principal: z.string(),
  etapas: z.array(z.string()),
  norma_referencia: z.string(),
  observacao_complementar: z.string(),
});

const gutSchema = z.object({
  gravidade: z.number(),
  urgencia: z.number(),
  tendencia: z.number(),
  justificativa_g: z.string(),
  justificativa_u: z.string(),
  justificativa_t: z.string(),
});

async function run<T>(schema: z.ZodType<T>, system: string, prompt: string): Promise<T> {
  const { output } = await generateText({
    model: gateway()(MODEL),
    output: Output.object({ schema }),
    system,
    prompt,
  });
  return output as T;
}

export function classificar(c: ContextoPatologia) {
  return run(
    classificacaoSchema,
    `Você é engenheiro civil perito em inspeção predial. Classifique a origem do problema em exatamente uma destas opções: Anomalia Endógena, Anomalia Exógena, Anomalia Natural, Anomalia Funcional, Falha de Manutenção, Falha de Execução de Reparos, Falha Operacional/Uso, Falha Gerencial. O campo "confianca" deve ser Alta, Média ou Baixa. A justificativa deve ter no máximo 3 linhas. ${BASE_CONTEXT}`,
    resumo(c),
  );
}

export function recomendar(c: ContextoPatologia) {
  return run(
    recomendacaoSchema,
    `Você é engenheiro civil perito. Elabore uma recomendação técnica corretiva contendo ação corretiva principal, etapas de execução em sequência, norma técnica ABNT de referência e observação complementar quando relevante. Limite total de 200 palavras. ${BASE_CONTEXT}`,
    resumo(c),
  );
}

export function avaliarGut(c: ContextoPatologia) {
  return run(
    gutSchema,
    `Você é engenheiro civil perito. Avalie o Grau de Risco pela Matriz GUT com notas inteiras de 1 a 5: G (risco a pessoas e à edificação), U (prazo de intervenção), T (velocidade de agravamento). Cada justificativa deve ter no máximo uma linha. ${BASE_CONTEXT}`,
    resumo(c),
  );
}
