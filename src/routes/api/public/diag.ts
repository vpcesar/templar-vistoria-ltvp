import { createFileRoute } from "@tanstack/react-router";
import { classificar } from "@/lib/ai.server";

export const Route = createFileRoute("/api/public/diag")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const r = await classificar({
            elemento: "Alvenaria",
            local: "Sala",
            manifestacoes: ["Fissura diagonal"],
          });
          return new Response(JSON.stringify({ ok: true, r }));
        } catch (e) {
          return new Response(
            JSON.stringify({ ok: false, msg: String(e), stack: (e as Error)?.stack }),
          );
        }
      },
    },
  },
});
