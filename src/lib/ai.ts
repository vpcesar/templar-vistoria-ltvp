/**
 * Serviço central de IA do ERP — Google Gemini.
 * A chave fica apenas no localStorage deste navegador (nunca no código).
 * Todas as telas (Vistorias, CRM, Propostas, Laudos) devem usar este módulo.
 */
import { obterChaveGemini } from "@/lib/gemini";
import { getConfig } from "@/lib/config";

const TIMEOUT_MS = 30000;

/** Mensagens em português para cada falha possível. */
export function mensagemErroIA(codigo: string): string {
  switch (codigo) {
    case "API_KEY_MISSING":
      return "Configure a chave da API Google em Configurações.";
    case "INVALID_KEY":
    case "ACCESS_DENIED":
      return "Chave da API inválida. Verifique em Configurações.";
    case "RATE_LIMIT":
      return "Limite de uso da API atingido. Tente novamente em alguns instantes.";
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

/** Chamada genérica ao Gemini com instrução de sistema. */
export async function gerarTextoIA(prompt: string, systemPrompt?: string): Promise<string> {
  const apiKey = obterChaveGemini();
  if (!apiKey) throw new Error("API_KEY_MISSING");

  const cfg = getConfig();
  const instrucao = systemPrompt ?? cfg.iaInstrucao;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${cfg.iaModelo}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: instrucao }] },
          generationConfig: { temperature: cfg.iaTemperatura, maxOutputTokens: 500 },
        }),
      },
    );
  } catch (erro) {
    clearTimeout(timer);
    if ((erro as Error).name === "AbortError") throw new Error("TIMEOUT");
    throw new Error("CONNECTION_ERROR");
  }
  clearTimeout(timer);

  if (!response.ok) {
    if (response.status === 400) throw new Error("INVALID_KEY");
    if (response.status === 403) throw new Error("ACCESS_DENIED");
    if (response.status === 429) throw new Error("RATE_LIMIT");
    throw new Error(`API_ERROR_${response.status}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const texto = (data.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("")
    .trim();
  if (!texto) throw new Error("EMPTY_RESPONSE");
  return texto;
}

/** Aprimora uma observação técnica. Usado por todo o ERP. */
export async function aprimorarTexto(texto: string): Promise<string> {
  const conteudo = texto.trim();
  if (!conteudo) throw new Error("EMPTY_INPUT");
  return gerarTextoIA(conteudo);
}
