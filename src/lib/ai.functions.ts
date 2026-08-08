import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSessao } from "./gate.server";
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

export const sugerirClassificacao = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => contexto.parse(data))
  .handler(async ({ data }) => {
    await requireSessao();
    return classificar(data as ContextoPatologia);
  });

export const gerarRecomendacao = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => contexto.parse(data))
  .handler(async ({ data }) => {
    await requireSessao();
    return recomendar(data as ContextoPatologia);
  });

export const sugerirGUT = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => contexto.parse(data))
  .handler(async ({ data }) => {
    await requireSessao();
    return avaliarGut(data as ContextoPatologia);
  });

export const otimizarObservacaoIA = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ texto: z.string().min(10).max(5000) }).parse(data))
  .handler(async ({ data }) => {
    await requireSessao();
    return otimizarObservacao(data.texto);
  });
