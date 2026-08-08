import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { autenticar, encerrarSessao, sessaoAtual } from "./gate.server";

export const loginServidor = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({ email: z.string().trim().email().max(255), password: z.string().min(1).max(200) })
      .parse(data),
  )
  .handler(({ data }) => autenticar(data.email, data.password));

export const sessaoServidor = createServerFn({ method: "GET" }).handler(() => sessaoAtual());

export const logoutServidor = createServerFn({ method: "POST" }).handler(() => encerrarSessao());
