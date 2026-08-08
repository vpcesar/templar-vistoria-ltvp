/**
 * Cliente da API do Google Gemini chamado diretamente do navegador.
 * A chave NUNCA é hardcoded: fica apenas no localStorage do usuário.
 */
export const GEMINI_KEY_STORAGE = "templar_gemini_key";
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
  const apiKeyRaw = window.localStorage.getItem(GEMINI_KEY_STORAGE);
  const apiKey = apiKeyRaw ? apiKeyRaw.trim() : "";
  if (!apiKey) throw new Error("API_KEY_MISSING");

  console.log("Chave sendo usada (primeiros 10 chars):", `${apiKey.substring(0, 10)}...`);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });

  if (!response.ok) {
    let errorMsg = "";
    try {
      const errorData = (await response.json()) as { error?: { message?: string } };
      errorMsg = errorData?.error?.message ?? "";
      console.error("Erro da API do Gemini:", response.status, errorMsg);
    } catch {
      console.error("Erro da API do Gemini:", response.status);
    }

    if (response.status === 400) throw new Error("INVALID_KEY");
    if (response.status === 403) throw new Error("ACCESS_DENIED");
    if (response.status === 429) throw new Error("RATE_LIMIT");
    throw new Error(`API_ERROR_${response.status}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!texto || !texto.trim()) throw new Error("EMPTY_RESPONSE");
  return texto.trim();
}

