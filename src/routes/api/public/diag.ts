import { createFileRoute } from "@tanstack/react-router";
import { sessaoAtual } from "@/lib/gate.server";

export const Route = createFileRoute("/api/public/diag")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const s = await sessaoAtual();
          return new Response(JSON.stringify({ ok: true, s }));
        } catch (e) {
          return new Response(
            JSON.stringify({ ok: false, msg: String(e), stack: (e as Error)?.stack }),
          );
        }
      },
    },
  },
});
