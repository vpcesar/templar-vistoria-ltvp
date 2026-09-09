import logoAsset from "@/assets/Logomarca-Templar.png.asset.json";
import proposalLogoAsset from "@/assets/logotipo_horizontal_TEMPLAR.jpg.asset.json";

export interface LogoLaudo {
  dataUrl: string;
  width: number;
  height: number;
  type: "png" | "jpg";
}

async function carregarImagem(url: string, type: "png" | "jpg"): Promise<LogoLaudo | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
    const dims = await new Promise<{ width: number; height: number }>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => resolve({ width: 600, height: 150 });
      img.src = dataUrl;
    });
    return { dataUrl, ...dims, type };
  } catch {
    return null;
  }
}

/** Carrega uma imagem remota (fotos de vistoria) como data URL. */
export function carregarImagemRemota(url: string): Promise<LogoLaudo | null> {
  return carregarImagem(url, "jpg");
}

/** Carrega o escudo institucional usado nos laudos técnicos. */
export function carregarLogo(): Promise<LogoLaudo | null> {
  return carregarImagem(logoAsset.url, "png");
}

/** Carrega a assinatura horizontal oficial usada nas propostas comerciais. */
export function carregarLogoProposta(): Promise<LogoLaudo | null> {
  return carregarImagem(proposalLogoAsset.url, "jpg");
}

export function dataUrlToBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
