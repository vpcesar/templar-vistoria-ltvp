/**
 * Cliente da API do Google Gemini chamado diretamente do navegador.
 * A chave NUNCA é hardcoded: fica apenas no localStorage do usuário.
 * A API do Google envia cabeçalhos CORS, então não é necessário proxy
 * (usar proxy externo exporia a chave do usuário a terceiros).
 */
export const GEMINI_KEY_STORAGE = "templar_gemini_key";

/** Modelos vigentes, em ordem de preferência (com fallback automático). */
const MODELOS = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-2.5-flash-lite"];

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

  console.log("Chave sendo usada (primeiros 10 chars):", `${apiKey.substring(0, 10)}...`);

  const body = JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] });
  let ultimoErro: Error = new Error("CONNECTION_ERROR");

  for (const modelo of MODELOS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
    } catch (erroRede) {
      console.error("Falha de rede ao chamar o Gemini:", erroRede);
      ultimoErro = new Error("CONNECTION_ERROR");
      continue;
    }

    if (!response.ok) {
      let errorMsg = "";
      try {
        const errorData = (await response.json()) as { error?: { message?: string } };
        errorMsg = errorData?.error?.message ?? "";
      } catch {
        errorMsg = "";
      }
      console.error(`Erro da API do Gemini (${modelo}):`, response.status, errorMsg);

      // 404 = modelo indisponível: tenta o próximo modelo da lista.
      if (response.status === 404) {
        ultimoErro = new Error("MODEL_UNAVAILABLE");
        continue;
      }
      if (response.status === 400) throw new Error("INVALID_KEY");
      if (response.status === 403) throw new Error("ACCESS_DENIED");
      if (response.status === 429) throw new Error("RATE_LIMIT");
      if (response.status >= 500) {
        ultimoErro = new Error(`API_ERROR_${response.status}`);
        continue;
      }
      throw new Error(`API_ERROR_${response.status}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const texto = data?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim();
    if (!texto) throw new Error("EMPTY_RESPONSE");
    return texto;
  }

  throw ultimoErro;
}
