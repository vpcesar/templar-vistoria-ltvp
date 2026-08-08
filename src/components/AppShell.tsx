import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ClipboardList, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TemplarLogo } from "@/components/TemplarLogo";
import { ConfiguracoesDialog } from "@/components/ConfiguracoesDialog";
import { useAuth } from "@/context/AuthContext";

const ROTEIRO = [
  {
    titulo: "1. Preparação",
    texto:
      "Confirme dados do imóvel, documentação disponível e aplique a anamnese com o usuário. Verifique carga da bateria e espaço para fotos.",
  },
  {
    titulo: "2. Varredura setorial",
    texto:
      "Percorra na ordem: perímetro externo e fachadas, cobertura e telhado, ambientes internos e sistemas/instalações globais.",
  },
  {
    titulo: "3. Identificação de não conformidade",
    texto:
      "Ao encontrar uma manifestação, caracterize elemento, ambiente e posição antes de fotografar.",
  },
  {
    titulo: "4. Registro",
    texto:
      "Fotografe (geral e detalhe), selecione as manifestações por toque e use a IA para classificação, recomendação e GUT.",
  },
  {
    titulo: "5. Finalizar coleta",
    texto:
      "Revise a contagem de patologias e salve a coleta. A vistoria fica com status AGUARDANDO REVISÃO para o escritório.",
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { userEmail, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState(false);

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 border-b border-border bg-card shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="shrink-0">
            <TemplarLogo size="sm" />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {["Vistorias", "Inspeções", "Laudos", "Perícias"].map((item, i) => (
              <span
                key={item}
                className={`rounded-md px-3 py-2 text-sm font-semibold ${
                  i === 0 ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                }`}
              >
                {item}
              </span>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Roteiro de inspeção">
                  <ClipboardList className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Roteiro de Inspeção</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4 px-4 pb-8">
                  {ROTEIRO.map((r) => (
                    <div key={r.titulo} className="rounded-lg border border-border bg-muted/40 p-3">
                      <p className="text-sm font-bold text-foreground">{r.titulo}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {r.texto}
                      </p>
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Configurações"
              onClick={() => setConfig(true)}
            >
              <Settings className="h-5 w-5" />
            </Button>
            <ConfiguracoesDialog open={config} onOpenChange={setConfig} />

            <div className="hidden text-right sm:block">
              <p className="text-[10px] text-muted-foreground">Logado como</p>
              <p className="text-xs font-medium text-muted-foreground">{userEmail}</p>
            </div>

            <Button variant="outline" size="sm" onClick={logout} className="min-h-10">
              <LogOut className="mr-1.5 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 pb-20">{children}</main>
    </div>
  );
}
