import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sessaoAtual } from "./gate.server";
import {
  avaliarGut,
  classificar,
  otimizarObservacao,
  recomendar,
  type ContextoPatologia,
} from "./ai.server";

const contexto = z.object({
  elemento: z.string().min(1),
  local: z.string().min(1),
  posicao: z.string().optional(),
  manifestacoes: z.array(z.string()).min(1),
  classificacao: z.string().optional(),
  tipoEdificacao: z.string().optional(),
  idadeAparente: z.number().optional(),
});

/**
 * Executa a chamada de IA sem nunca lançar: qualquer falha (sessão ausente,
 * gateway indisponível, resposta vazia) volta como { erro } para o cliente
 * exibir um toast, evitando a tela "Esta página não carregou".
 */
async function executar<T extends object>(
  tarefa: () => Promise<T>,
): Promise<(T & { erro?: never }) | { erro: string }> {
  try {
    const { email } = await sessaoAtual();
    if (!email) return { erro: "Sessão expirada. Faça login novamente para usar a IA." };
    const resultado = await tarefa();
    if (!resultado || Object.keys(resultado).length === 0) {
      return { erro: "A IA não retornou resposta. Tente novamente." };
    }
    return resultado as T & { erro?: never };
  } catch (error) {
    console.error("Erro ao chamar a IA:", error);
    return { erro: "Não foi possível consultar a IA agora. Tente novamente em instantes." };
  }
}

export const sugerirClassificacao = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => contexto.parse(data))
  .handler(({ data }) => executar(() => classificar(data as ContextoPatologia)));

export const gerarRecomendacao = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => contexto.parse(data))
  .handler(({ data }) => executar(() => recomendar(data as ContextoPatologia)));

export const sugerirGUT = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => contexto.parse(data))
  .handler(({ data }) => executar(() => avaliarGut(data as ContextoPatologia)));

export const otimizarObservacaoIA = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ texto: z.string().min(10).max(5000) }).parse(data))
  .handler(({ data }) => executar(() => otimizarObservacao(data.texto)));
