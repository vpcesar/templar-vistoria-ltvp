/**
 * Cliente da API Groq usado para aprimorar observações técnicas.
 * A chave fica apenas no localStorage deste navegador (nunca no código).
 */
export const GROQ_KEY_STORAGE = "templar_groq_key";

const MODELO = "llama-3.3-70b-versatile";
const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const TIMEOUT_MS = 30000;

const SYSTEM_PROMPT =
  "Assistente técnico de engenharia civil. Reescreva o texto de forma técnica, objetiva e concisa. " +
  "Complexidade média. NUNCA invente dados que não estão no texto original. " +
  "Mantenha o sentido original, apenas melhore a linguagem.";

export function obterChaveGroq(): string {
  if (typeof window === "undefined") return "";
  return (window.localStorage.getItem(GROQ_KEY_STORAGE) ?? "").trim();
}

export function salvarChaveGroq(valor: string) {
  window.localStorage.setItem(GROQ_KEY_STORAGE, valor.trim());
}

export function removerChaveGroq() {
  window.localStorage.removeItem(GROQ_KEY_STORAGE);
}

/** Mensagens em português para cada falha possível. */
export function mensagemErroGroq(codigo: string): string {
  switch (codigo) {
    case "API_KEY_MISSING":
      return "Configure a chave da IA em Configurações para usar o Aprimorar.";
    case "INVALID_KEY":
      return "Chave da IA inválida. Verifique a chave em Configurações.";
    case "RATE_LIMIT":
      return "Limite de uso da IA atingido. Aguarde alguns segundos e tente novamente.";
    case "TIMEOUT":
      return "A IA demorou para responder. Edite o texto manualmente ou tente novamente.";
    case "CONNECTION_ERROR":
      return "Sem conexão com a IA. Edite o texto manualmente.";
    case "EMPTY_RESPONSE":
      return "A IA não retornou texto. Edite o texto manualmente.";
    default:
      return "Não foi possível aprimorar o texto agora. Edite manualmente.";
  }
}

export async function aprimorarTextoGroq(texto: string): Promise<string> {
  const apiKey = obterChaveGroq();
  if (!apiKey) throw new Error("API_KEY_MISSING");
  const conteudo = texto.trim();
  if (!conteudo) throw new Error("EMPTY_INPUT");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: MODELO,
        temperature: 0.3,
        max_tokens: 500,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: conteudo },
        ],
      }),
    });
  } catch (erro) {
    clearTimeout(timer);
    if ((erro as Error).name === "AbortError") throw new Error("TIMEOUT");
    throw new Error("CONNECTION_ERROR");
  }
  clearTimeout(timer);

  if (!response.ok) {
    if (response.status === 401) throw new Error("INVALID_KEY");
    if (response.status === 429) throw new Error("RATE_LIMIT");
    throw new Error(`API_ERROR_${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const resultado = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!resultado) throw new Error("EMPTY_RESPONSE");
  return resultado;
}
