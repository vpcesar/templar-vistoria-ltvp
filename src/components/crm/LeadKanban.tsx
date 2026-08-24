import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  LEAD_STATUS,
  ORIGEM_LABEL,
  STATUS_LABEL,
  type Lead,
  type LeadStatus,
} from "@/lib/crm";

export function LeadKanban({
  leads,
  onMover,
}: {
  leads: Lead[];
  onMover: (lead: Lead, status: LeadStatus) => void;
}) {
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [alvo, setAlvo] = useState<LeadStatus | null>(null);

  return (
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
      {LEAD_STATUS.map((status) => {
        const coluna = leads.filter((l) => l.status === status);
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setAlvo(status);
            }}
            onDragLeave={() => setAlvo((a) => (a === status ? null : a))}
            onDrop={(e) => {
              e.preventDefault();
              setAlvo(null);
              const id = arrastando ?? e.dataTransfer.getData("text/plain");
              const lead = leads.find((l) => l.id === id);
              setArrastando(null);
              if (lead && lead.status !== status) onMover(lead, status);
            }}
            className={`flex min-h-40 flex-col rounded-xl border bg-muted/40 p-2 transition-colors ${
              alvo === status ? "border-erp-gold bg-erp-gold/10" : "border-border"
            }`}
          >
            <div className="flex items-center justify-between px-1 pb-2">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {STATUS_LABEL[status]}
              </p>
              <span className="rounded-full bg-card px-2 text-xs font-semibold text-muted-foreground">
                {coluna.length}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {coluna.map((lead) => (
                <Link
                  key={lead.id}
                  to="/crm/$id"
                  params={{ id: lead.id }}
                  draggable
                  onDragStart={(e) => {
                    setArrastando(lead.id);
                    e.dataTransfer.setData("text/plain", lead.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => setArrastando(null)}
                  className={`cursor-grab rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md ${
                    arrastando === lead.id ? "opacity-50" : ""
                  }`}
                >
                  <p className="text-sm font-semibold text-foreground">{lead.nome}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{lead.telefone || "—"}</p>
                  <span className="mt-2 inline-block rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {ORIGEM_LABEL[lead.origem] ?? lead.origem}
                  </span>
                </Link>
              ))}
              {coluna.length === 0 && (
                <p className="px-1 py-3 text-xs text-muted-foreground">Nenhum lead.</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
