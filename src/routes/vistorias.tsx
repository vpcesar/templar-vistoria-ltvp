import { createFileRoute } from "@tanstack/react-router";
import { ClipboardCheck } from "lucide-react";
import { ErpShell } from "@/components/ErpShell";

export const Route = createFileRoute("/vistorias")({
  head: () => ({
    meta: [
      { title: "Vistorias de Campo | TEMPLAR ENGENHARIA" },
      {
        name: "description",
        content:
          "Módulo de agendamento e execução de vistorias de campo do ERP da TEMPLAR ENGENHARIA.",
      },
      { property: "og:title", content: "Vistorias de Campo | TEMPLAR ENGENHARIA" },
      {
        property: "og:description",
        content: "Módulo de vistorias de campo do ERP da TEMPLAR ENGENHARIA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VistoriasPage,
});

function VistoriasPage() {
  return (
    <ErpShell>
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <ClipboardCheck className="h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-bold text-foreground">Vistorias</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Módulo em desenvolvimento. Enquanto isso, as vistorias com laudo LTVP continuam no módulo
          Laudos.
        </p>
      </div>
    </ErpShell>
  );
}
