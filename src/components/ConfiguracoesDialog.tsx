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
import { chamarGeminiAPI, GEMINI_KEY_STORAGE, salvarChaveGemini } from "@/lib/gemini";

export function ConfiguracoesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [nome, setNome] = useState("Vinicius Paulino Cesar");
  const [crea, setCrea] = useState("RJ 2024100977");
  const [chave, setChave] = useState("");
  const [testando, setTestando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const c = carregarConfig();
    setNome(c.nome);
    setCrea(c.crea);
    const savedKey = window.localStorage.getItem(GEMINI_KEY_STORAGE) || "";
    setChave(savedKey);
  }, [open]);

  const salvar = () => {
    salvarConfig({ nome, crea });
    toast.success("Dados do engenheiro salvos!");
  };

  const salvarChave = () => {
    const valor = chave.trim();
    if (!valor) {
      toast.error("Digite uma chave válida.", { duration: 5000 });
      return;
    }
    salvarChaveGemini(valor);
    setChave(valor);
    toast.success("Chave do Gemini salva com sucesso!", { duration: 5000 });
  };

  const testar = async () => {
    const key = window.localStorage.getItem(GEMINI_KEY_STORAGE)?.trim();
    if (!key) {
      toast.error("Nenhuma chave salva. Digite e salve primeiro.", { duration: 5000 });
      return;
    }
    setTestando(true);
    try {
      await chamarGeminiAPI("Responda apenas: OK");
      toast.success("Chave válida! Gemini está funcionando.", { duration: 5000 });
    } catch (error) {
      const codigo = error instanceof Error ? error.message : "";
      console.error("Erro capturado:", codigo);
      if (codigo === "INVALID_KEY") {
        toast.error("Chave inválida. Verifique se copiou corretamente do Google AI Studio.", {
          duration: 5000,
        });
      } else if (codigo === "ACCESS_DENIED") {
        toast.error("Acesso negado. Verifique se a chave está ativa.", { duration: 5000 });
      } else if (codigo === "RATE_LIMIT") {
        toast.error("Limite de requisições excedido. Aguarde alguns segundos.", {
          duration: 5000,
        });
      } else if (codigo === "MODEL_UNAVAILABLE") {
        toast.error("Nenhum modelo do Gemini disponível para esta chave.", { duration: 5000 });
      } else {
        toast.error("Erro de conexão. Verifique sua internet.", { duration: 5000 });
      }
    } finally {
      setTestando(false);
    }
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
            <Label htmlFor="gemini-key-input">Chave da API do Google Gemini</Label>
            <Input
              id="gemini-key-input"
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
          <h3 className="text-sm font-bold text-foreground">Chave da API Groq (aprimorar textos)</h3>
          <div className="space-y-2">
            <Label htmlFor="groq-key-input">Chave da API Groq</Label>
            <Input
              id="groq-key-input"
              type="password"
              autoComplete="off"
              placeholder="Cole aqui sua API Key da Groq (gsk_...)"
              value={chaveGroq}
              onChange={(e) => setChaveGroq(e.target.value)}
            />
          </div>
          <Button
            className="min-h-11 w-full"
            onClick={() => {
              const valor = chaveGroq.trim();
              if (!valor) {
                toast.error("Digite uma chave válida.");
                return;
              }
              salvarChaveGroq(valor);
              toast.success("Chave da Groq salva neste dispositivo.");
            }}
          >
            Salvar chave da Groq
          </Button>
          <p className="text-xs text-muted-foreground">
            Usada no botão “Aprimorar” das observações da vistoria. A chave fica salva apenas neste
            navegador.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
          <h3 className="text-sm font-bold text-foreground">Responsáveis técnicos</h3>
          <ul className="space-y-2">
            {responsaveis.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <span>
                  {r.nome} — {r.crea}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setResponsaveis(removerResponsavel(r.id))}
                >
                  Remover
                </Button>
              </li>
            ))}
          </ul>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              placeholder="Nome"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
            />
            <Input
              placeholder="CREA"
              value={novoCrea}
              onChange={(e) => setNovoCrea(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            className="min-h-11 w-full"
            onClick={() => {
              if (!novoNome.trim() || !novoCrea.trim()) {
                toast.error("Informe nome e CREA.");
                return;
              }
              setResponsaveis(adicionarResponsavel(novoNome, novoCrea));
              setNovoNome("");
              setNovoCrea("");
              toast.success("Responsável cadastrado.");
            }}
          >
            Adicionar responsável
          </Button>
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
