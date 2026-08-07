import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";

/**
 * Dica de campo controlada por toque (mobile-first, sem dependência de hover).
 */
export function InfoTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex">
      <button
        type="button"
        aria-label="Informação sobre o campo"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="text-muted-foreground transition hover:text-primary"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-6 z-50 w-[250px] -translate-x-1/2 rounded-md bg-slate-brand px-3 py-2 text-xs font-normal normal-case leading-relaxed text-primary-foreground shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
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
