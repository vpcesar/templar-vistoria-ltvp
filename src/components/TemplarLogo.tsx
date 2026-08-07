export function TemplarShield({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 56" className={className} aria-hidden="true">
      <path
        d="M24 1 45 7v25c0 12-9.5 19.5-21 23C12.5 51.5 3 44 3 32V7L24 1Z"
        fill="var(--primary)"
      />
      <path
        d="M22 12h4v8h8v4h-8v18h-4V24h-8v-4h8v-8Z"
        fill="var(--primary-foreground)"
      />
    </svg>
  );
}

export function TemplarLogo({
  size = "md",
  stacked = false,
}: {
  size?: "sm" | "md" | "lg";
  stacked?: boolean;
}) {
  const shield = size === "lg" ? "h-16 w-16" : size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const title = size === "lg" ? "text-3xl" : size === "sm" ? "text-base" : "text-xl";
  const sub = size === "lg" ? "text-xs" : "text-[10px]";

  return (
    <div className={stacked ? "flex flex-col items-center gap-2" : "flex items-center gap-2.5"}>
      <TemplarShield className={shield} />
      <div className={stacked ? "text-center" : ""}>
        <div
          className={`font-serif font-bold leading-none tracking-tight text-slate-brand ${title}`}
        >
          TEMPLAR
        </div>
        <div className={`mt-1 font-semibold uppercase tracking-[0.28em] text-muted-foreground ${sub}`}>
          Engenharia
        </div>
      </div>
    </div>
  );
}
