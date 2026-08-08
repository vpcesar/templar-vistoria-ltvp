import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

export const AUTHORIZED_EMAIL = "vinicius.vpc@gmail.com";

type GateSession = { email?: string };

function sessionConfig() {
  const password = process.env["SESSION_SECRET"];
  if (!password) throw new Error("Missing SESSION_SECRET");
  return {
    password,
    name: "templar-session",
    maxAge: 60 * 60 * 24 * 7,
    cookie: { httpOnly: true, secure: true, sameSite: "none" as const, path: "/" },
  };
}

export function gateSession() {
  // eslint-disable-next-line react-hooks/rules-of-hooks -- useSession is a server session helper, not a React hook
  return useSession<GateSession>(sessionConfig());
}

function matches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export async function autenticar(email: string, password: string) {
  const expected = process.env["SITE_PASSWORD"];
  if (!expected) return { success: false, message: "Servidor sem senha configurada." };
  const emailOk = email.trim().toLowerCase() === AUTHORIZED_EMAIL;
  const senhaOk = matches(password, expected);
  if (!emailOk || !senhaOk) return { success: false, message: "E-mail ou senha inválidos." };
  const session = await gateSession();
  await session.update({ email: AUTHORIZED_EMAIL });
  return { success: true, message: "Login realizado!", email: AUTHORIZED_EMAIL };
}

export async function sessaoAtual() {
  const session = await gateSession();
  return session.data.email === AUTHORIZED_EMAIL ? { email: AUTHORIZED_EMAIL } : { email: null };
}

export async function encerrarSessao() {
  const session = await gateSession();
  await session.clear();
  return { success: true };
}

/** Throws 401 unless the caller holds a valid server-side session cookie. */
export async function requireSessao() {
  const session = await gateSession();
  if (session.data.email !== AUTHORIZED_EMAIL) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return AUTHORIZED_EMAIL;
}
