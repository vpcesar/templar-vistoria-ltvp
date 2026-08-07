import { useState } from "react";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function InfoTip({ text }: { text: string }) {
  // Controlado por toque: em campo o inspetor usa o celular, onde hover não existe.
  const [open, setOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Informação sobre o campo"
            onClick={() => setOpen((o) => !o)}
            className="text-muted-foreground transition hover:text-primary"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-[260px] text-xs leading-relaxed">{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}


export function Field({
  label,
  tip,
  children,
  className = "",
}: {
  label: string;
  tip?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="field-label">
        <span>{label}</span>
        {tip && <InfoTip text={tip} />}
      </div>
      {children}
    </div>
  );
}
