import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  atualizarLegenda,
  enviarFoto,
  excluirFoto,
  type FotoVistoria,
} from "@/lib/vistorias";

export function FotosItem({
  vistoriaId,
  itemId,
  fotos,
  onMudou,
  comLegenda = false,
}: {
  vistoriaId: string;
  itemId: string;
  fotos: FotoVistoria[];
  onMudou: () => void;
  comLegenda?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setEnviando(true);
    try {
      for (const file of Array.from(files)) {
        await enviarFoto(vistoriaId, file, itemId);
      }
      toast.success("Foto(s) enviada(s).");
      onMudou();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setEnviando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remover = async (foto: FotoVistoria) => {
    try {
      await excluirFoto(foto);
      onMudou();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => void enviar(e.target.files)}
      />
      <Button
        size="sm"
        variant="outline"
        disabled={enviando}
        onClick={() => inputRef.current?.click()}
      >
        {enviando ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
        ) : (
          <Camera className="mr-1.5 h-4 w-4" />
        )}
        {enviando ? "Enviando..." : "Adicionar foto"}
      </Button>
      {fotos.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {fotos.map((f) => (
            <div key={f.id} className="space-y-1">
              <div className="group relative overflow-hidden rounded-lg border">
                <img
                  src={f.url}
                  alt={f.legenda ?? "Foto da vistoria"}
                  className="h-24 w-full object-cover"
                />
                <button
                  type="button"
                  aria-label="Excluir foto"
                  onClick={() => void remover(f)}
                  className="absolute right-1 top-1 rounded bg-destructive/90 p-1 text-destructive-foreground"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              {comLegenda && (
                <Input
                  className="h-8 text-xs"
                  placeholder="Legenda"
                  defaultValue={f.legenda ?? ""}
                  onBlur={(e) => {
                    if ((f.legenda ?? "") === e.target.value) return;
                    void atualizarLegenda(f.id, e.target.value).then(onMudou);
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
