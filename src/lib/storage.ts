import type { Anamnese, DadosImovel, Patologia, Vistoria } from "./types";

const KEY = "templar_vistorias";

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const imovelVazio = (): DadosImovel => ({
  tipoEdificacao: "",
  cep: "",
  logradouro: "",
  numero: "",
  bairro: "",
  cidade: "",
  uf: "",
  idadeAparente: 0,
  pavimentos: "",
  areaConstruida: "",
  proprietario: "",
  dataVistoria: new Date().toISOString().slice(0, 10),
  inspetor: "Vinicius Paulino Cesar",
  crea: "",
  observacoes: "",
  fotosEdificacao: [],
});

export const anamneseVazia = (): Anamnese => ({ respostas: {}, observacoes: "" });

export const patologiaVazia = (): Patologia => ({
  id: uid(),
  fotos: [],
  setor: "",
  elemento: "",
  local: "",
  posicao: "",
  manifestacoes: [],
  classificacao: "",
  recomendacao: "",
  gravidade: 3,
  urgencia: 3,
  tendencia: 3,
  observacoes: "",
});

export function listarVistorias(): Vistoria[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Vistoria[]) : [];
    return parsed.sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm));
  } catch {
    return [];
  }
}

export function salvarTodas(lista: Vistoria[]) {
  window.localStorage.setItem(KEY, JSON.stringify(lista));
}

/** Garante que nenhum campo obrigatório fique undefined antes de serializar. */
export function sanitizarVistoria(v: Vistoria): Vistoria {
  const i = v.imovel || imovelVazio();
  return {
    id: v.id || uid(),
    status: v.status || "EM ANDAMENTO",
    criadoEm: v.criadoEm || new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
    imovel: {
      ...imovelVazio(),
      ...i,
      fotosEdificacao: (i.fotosEdificacao || []).filter((f) => !!f?.dataUrl),
    },
    anamnese: {
      respostas: v.anamnese?.respostas || {},
      observacoes: v.anamnese?.observacoes || "",
    },
    patologias: (v.patologias || []).map((p) => ({
      ...patologiaVazia(),
      ...p,
      id: p.id || uid(),
      fotos: (p.fotos || []).filter((f) => !!f?.dataUrl),
      manifestacoes: p.manifestacoes || [],
      recomendacao: p.recomendacao || "",
      observacoes: p.observacoes || "",
    })),
  };
}

/** Recompacta uma imagem base64 reduzindo dimensão e qualidade. */
export function comprimirDataUrl(dataUrl: string, maxLado = 1000, quality = 0.6): Promise<string> {
  return new Promise((resolve) => {
    if (typeof document === "undefined" || !dataUrl.startsWith("data:image")) return resolve(dataUrl);
    const img = new Image();
    img.onload = () => {
      try {
        const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * escala));
        canvas.height = Math.max(1, Math.round(img.height * escala));
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(dataUrl);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

async function comprimirFotos(v: Vistoria, maxLado: number, quality: number): Promise<Vistoria> {
  const patologias = await Promise.all(
    v.patologias.map(async (p) => ({
      ...p,
      fotos: await Promise.all(
        p.fotos.map(async (f) => ({
          ...f,
          dataUrl: await comprimirDataUrl(f.dataUrl, maxLado, quality),
        })),
      ),
    })),
  );
  const fotosEdificacao = await Promise.all(
    (v.imovel.fotosEdificacao || []).map(async (f) => ({
      ...f,
      dataUrl: await comprimirDataUrl(f.dataUrl, maxLado, quality),
    })),
  );
  return { ...v, patologias, imovel: { ...v.imovel, fotosEdificacao } };
}

const isQuota = (e: unknown) =>
  e instanceof Error && /quota|exceed/i.test(`${e.name} ${e.message}`);

/**
 * Salva a vistoria com fallbacks e compactação progressiva das fotos
 * caso o localStorage estoure a cota.
 */
export async function salvarVistoriaSegura(
  entrada: Vistoria,
): Promise<{ ok: true; vistoria: Vistoria } | { ok: false; erro: string }> {
  let v = sanitizarVistoria(entrada);
  const tentativas: Array<[number, number] | null> = [null, [1000, 0.6], [720, 0.5], [480, 0.4]];

  for (const t of tentativas) {
    try {
      if (t) v = await comprimirFotos(v, t[0], t[1]);
      salvarVistoria(v);
      return { ok: true, vistoria: v };
    } catch (e) {
      if (!isQuota(e)) {
        return { ok: false, erro: "Erro ao salvar a vistoria. Tente novamente." };
      }
    }
  }

  return {
    ok: false,
    erro: "Não foi possível salvar. Reduza o número ou tamanho das fotos.",
  };
}

export function obterVistoria(id: string): Vistoria | undefined {
  return listarVistorias().find((v) => v.id === id);
}

export function salvarVistoria(v: Vistoria) {
  const lista = listarVistorias().filter((x) => x.id !== v.id);
  lista.push({ ...v, atualizadoEm: new Date().toISOString() });
  salvarTodas(lista);
}

export function excluirVistoria(id: string) {
  salvarTodas(listarVistorias().filter((v) => v.id !== id));
}

export function novaVistoria(): Vistoria {
  const agora = new Date().toISOString();
  return {
    id: uid(),
    status: "EM ANDAMENTO",
    criadoEm: agora,
    atualizadoEm: agora,
    imovel: imovelVazio(),
    anamnese: anamneseVazia(),
    patologias: [],
  };
}

/** Lista customizada de opções adicionadas pelo usuário (por campo). */
export function opcoesCustom(campo: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(`templar_opts_${campo}`) || "[]") as string[];
  } catch {
    return [];
  }
}

export function addOpcaoCustom(campo: string, valor: string) {
  const atuais = opcoesCustom(campo);
  if (!atuais.includes(valor)) {
    window.localStorage.setItem(`templar_opts_${campo}`, JSON.stringify([...atuais, valor]));
  }
}
