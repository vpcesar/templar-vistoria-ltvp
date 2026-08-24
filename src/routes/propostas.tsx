import { createFileRoute } from "@tanstack/react-router";
import { FileSignature } from "lucide-react";
import { ErpShell } from "@/components/ErpShell";

export const Route = createFileRoute("/propostas")({
  head: () => ({
    meta: [
      { title: "Propostas Comerciais | TEMPLAR ENGENHARIA" },
      {
        name: "description",
        content:
          "Módulo de propostas comerciais do ERP da TEMPLAR ENGENHARIA, integrado ao CRM e às vistorias.",
      },
      { property: "og:title", content: "Propostas Comerciais | TEMPLAR ENGENHARIA" },
      {
        property: "og:description",
        content: "Módulo de propostas comerciais do ERP da TEMPLAR ENGENHARIA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PropostasPage,
});

function PropostasPage() {
  return (
    <ErpShell>
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <FileSignature className="h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-bold text-foreground">Propostas</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Módulo em desenvolvimento. Em breve você poderá gerar propostas comerciais a partir dos
          leads do CRM.
        </p>
      </div>
    </ErpShell>
  );
}
