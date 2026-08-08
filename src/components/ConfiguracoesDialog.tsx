import { useEffect, useRef, useState } from "react";
import { Download, Info, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { carregarConfig, salvarConfig, exportarJSON, importarJSON } from "@/lib/config";

export function ConfiguracoesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [nome, setNome] = useState("Vinicius Paulino Cesar");
  const [crea, setCrea] = useState("RJ 2024100977");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const c = carregarConfig();
    setNome(c.nome);
    setCrea(c.crea);
  }, [open]);

  const salvar = () => {
    salvarConfig({ nome, crea });
    toast.success("Dados do engenheiro salvos!");
  };

  const importar = async (file?: File | null) => {
    if (!file) return;
    const res = await importarJSON(file);
    if (!res.ok) {
      toast.error(res.erro);
      return;
    }
    toast.success("Dados importados! Recarregando...");
    setTimeout(() => window.location.reload(), 800);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Configurações</DialogTitle>
          <DialogDescription>
            Preferências do inspetor e gestão dos dados deste dispositivo.
          </DialogDescription>
        </DialogHeader>

        <section className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
          <h3 className="text-sm font-bold text-foreground">Dados do Engenheiro</h3>
          <div className="space-y-2">
            <Label htmlFor="cfg-nome">Nome do engenheiro</Label>
            <Input id="cfg-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cfg-crea">CREA</Label>
            <Input id="cfg-crea" value={crea} onChange={(e) => setCrea(e.target.value)} />
          </div>
          <Button className="min-h-11 w-full" onClick={salvar}>
            Salvar
          </Button>
        </section>

        <section className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
          <h3 className="text-sm font-bold text-foreground">Chave da API do Google Gemini</h3>
          <div className="space-y-2">
            <Label htmlFor="cfg-gemini">Chave da API do Google Gemini</Label>
            <Input
              id="cfg-gemini"
              type="password"
              autoComplete="off"
              placeholder="Cole aqui sua API Key do Gemini (AIza...)"
              value={chave}
              onChange={(e) => setChave(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="min-h-11 flex-1" onClick={salvarChave}>
              Salvar chave
            </Button>
            <Button
              variant="outline"
              className="min-h-11 flex-1"
              onClick={testar}
              disabled={testando}
            >
              {testando ? "Testando..." : "Testar chave"}
            </Button>
          </div>
          <p className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              A chave fica salva apenas neste navegador e é usada para chamar diretamente a API do
              Google Gemini. Obtenha sua chave em:{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline"
              >
                https://aistudio.google.com/apikey
              </a>
            </span>
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
          <h3 className="text-sm font-bold text-foreground">Exportar/Importar Dados</h3>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="min-h-11 flex-1" onClick={exportarJSON}>
              <Download className="mr-2 h-4 w-4" />
              Exportar (JSON)
            </Button>
            <Button
              variant="outline"
              className="min-h-11 flex-1"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Importar (JSON)
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => importar(e.target.files?.[0])}
          />
        </section>

        <section className="space-y-1 rounded-xl border border-border bg-muted/30 p-4">
          <h3 className="text-sm font-bold text-foreground">Sobre</h3>
          <p className="text-xs text-muted-foreground">
            TEMPLAR ENGENHARIA — Sistema de Inspeção Predial v1.0
          </p>
          <p className="text-xs text-muted-foreground">Vistorias • Inspeções • Laudos • Perícias</p>
        </section>
      </DialogContent>
    </Dialog>
  );
}
