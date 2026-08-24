import { useState } from "react";
import { ClipboardList, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ConfiguracoesDialog } from "@/components/ConfiguracoesDialog";
import { ErpShell } from "@/components/ErpShell";

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

function Rodape() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">TEMPLAR ENGENHARIA</p>
        <p>Vistorias • Inspeções • Laudos • Perícias</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          <a
            className="hover:text-primary"
            href="https://www.templarengenharia.com.br"
            target="_blank"
            rel="noopener noreferrer"
          >
            www.templarengenharia.com.br
          </a>
          <a className="hover:text-primary" href="mailto:templarengenharia@hotmail.com">
            templarengenharia@hotmail.com
          </a>
          <a
            className="hover:text-primary"
            href="https://wa.me/5521981808812"
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp (21) 98180-8812
          </a>
        </div>
      </div>
    </footer>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState(false);

  const acoes = (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Roteiro de inspeção">
            <ClipboardList className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[320px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Roteiro de Inspeção</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4 px-4 pb-8">
            {ROTEIRO.map((r) => (
              <div key={r.titulo} className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-sm font-bold text-foreground">{r.titulo}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{r.texto}</p>
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
    </>
  );

  return (
    <ErpShell actions={acoes} footer={<Rodape />}>
      {children}
    </ErpShell>
  );
}
