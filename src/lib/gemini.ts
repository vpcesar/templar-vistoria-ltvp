/**
 * Cliente da API do Google Gemini chamado diretamente do navegador.
 * A chave NUNCA é hardcoded: fica apenas no localStorage do usuário.
 */
export const GEMINI_KEY_STORAGE = "templar_gemini_key";
const MODELO = "gemini-2.0-flash";

export function obterChaveGemini(): string {
  if (typeof window === "undefined") return "";
  return (window.localStorage.getItem(GEMINI_KEY_STORAGE) ?? "").trim();
}

export function salvarChaveGemini(valor: string) {
  window.localStorage.setItem(GEMINI_KEY_STORAGE, valor.trim());
}

export function removerChaveGemini() {
  window.localStorage.removeItem(GEMINI_KEY_STORAGE);
}

export async function chamarGeminiAPI(prompt: string): Promise<string> {
  const apiKey = obterChaveGemini();
  if (!apiKey) throw new Error("API_KEY_MISSING");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    },
  );

  if (!response.ok) throw new Error(`API_ERROR_${response.status}`);

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!texto || !texto.trim()) throw new Error("EMPTY_RESPONSE");
  return texto.trim();
}

/** Faz uma chamada mínima só para validar a chave informada. */
export async function testarChaveGemini(): Promise<{ ok: true } | { ok: false; erro: string }> {
  try {
    await chamarGeminiAPI("Responda apenas: OK");
    return { ok: true };
  } catch (error) {
    return { ok: false, erro: mensagemErroIA(error) };
  }
}

export function mensagemErroIA(error: unknown): string {
  const codigo = error instanceof Error ? error.message : "";
  if (codigo === "API_KEY_MISSING")
    return "Configure a chave do Gemini nas Configurações (engrenagem).";
  if (codigo === "API_ERROR_400") return "Chave do Gemini inválida. Verifique nas Configurações.";
  if (codigo === "API_ERROR_403")
    return "Acesso negado. Verifique se a chave do Gemini está ativa.";
  if (codigo === "API_ERROR_429")
    return "Limite de requisições do Gemini excedido. Tente novamente em alguns segundos.";
  if (codigo === "EMPTY_RESPONSE") return "A IA não retornou resposta. Tente reformular os dados.";
  return "Erro ao gerar sugestão. Tente novamente.";
}
