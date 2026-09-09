import { useState } from "react";
import { GripVertical, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COMODOS_PADRAO } from "@/lib/vistorias";

/**
 * Seleção de ambientes com cards clicáveis, ambiente personalizado e
 * reordenação por arrastar e soltar. A ordem definida aqui é a ordem do
 * checklist e do relatório.
 */
export function SelecaoAmbientes({
  selecionados,
  onChange,
}: {
  selecionados: string[];
  onChange: (lista: string[]) => void;
}) {
  const [outro, setOutro] = useState("");
  const [mostrarOutro, setMostrarOutro] = useState(false);
  const [arrastando, setArrastando] = useState<number | null>(null);

  const alternar = (nome: string) => {
    onChange(
      selecionados.includes(nome)
        ? selecionados.filter((n) => n !== nome)
        : [...selecionados, nome],
    );
  };

  const adicionarOutro = () => {
    const nome = outro.trim();
    if (!nome) return;
    if (!selecionados.includes(nome)) onChange([...selecionados, nome]);
    setOutro("");
    setMostrarOutro(false);
  };

  const soltar = (destino: number) => {
    if (arrastando === null || arrastando === destino) return;
    const lista = [...selecionados];
    const [movido] = lista.splice(arrastando, 1);
    if (movido) lista.splice(destino, 0, movido);
    onChange(lista);
    setArrastando(null);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Ambientes da vistoria</Label>
        <div className="flex flex-wrap gap-2">
          {COMODOS_PADRAO.map((c) => {
            const ativo = selecionados.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => alternar(c)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  ativo
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary"
                }`}
              >
                {c}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setMostrarOutro((v) => !v)}
            className="rounded-full border border-dashed border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:border-primary"
          >
            Outro...
          </button>
        </div>
        {mostrarOutro && (
          <div className="flex gap-2">
            <Input
              placeholder="Nome do ambiente"
              value={outro}
              onChange={(e) => setOutro(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  adicionarOutro();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={adicionarOutro}>
              <Plus className="mr-1.5 h-4 w-4" /> Incluir
            </Button>
          </div>
        )}
      </div>

      {selecionados.length > 0 && (
        <div className="space-y-2">
          <Label>Ordem dos ambientes (arraste para reordenar)</Label>
          <ul className="space-y-1.5">
            {selecionados.map((nome, idx) => (
              <li
                key={`${nome}-${idx}`}
                draggable
                onDragStart={() => setArrastando(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => soltar(idx)}
                className={`flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm ${
                  arrastando === idx ? "opacity-50" : ""
                }`}
              >
                <span className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
                  <span className="font-semibold text-muted-foreground">{idx + 1}.</span>
                  {nome}
                </span>
                <button
                  type="button"
                  aria-label={`Remover ${nome}`}
                  onClick={() => onChange(selecionados.filter((_, i) => i !== idx))}
                  className="rounded p-1 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
