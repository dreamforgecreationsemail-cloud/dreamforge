import { createFileRoute } from "@tanstack/react-router";
import { askCouncil } from "@/lib/council.functions";

// Endpoint for the DreamForge Founders Android app: POST /api/council  { text, files }  ->  { answer } or { error }
// Uses the same AI code as the website box. No key is read here; council.functions does that on the PC as before.
const ALLOWED = new Set(["https://localhost", "capacitor://localhost", "http://localhost"]);
function cors(request: Request): Record<string, string> {
  const o = request.headers.get("origin") ?? "";
  const h: Record<string, string> = { Vary: "Origin" };
  if (ALLOWED.has(o)) {
    h["Access-Control-Allow-Origin"] = o;
    h["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    h["Access-Control-Allow-Headers"] = "Content-Type";
    h["Access-Control-Max-Age"] = "600";
  }
  return h;
}
function json(request: Request, data: unknown, status = 200) {
  return Response.json(data, { status, headers: cors(request) });
}

export const Route = createFileRoute("/api/council")({
  server: {
    handlers: {
      OPTIONS: async ({ request }: { request: Request }) => new Response(null, { status: 204, headers: cors(request) }),
      POST: async ({ request }: { request: Request }) => {
        let body: { text?: unknown; files?: unknown } = {};
        try { body = await request.json(); } catch { return json(request, { answer: "", error: "Bad request" }, 400); }
        const text = String(body.text ?? "").slice(0, 16000);
        const files = (Array.isArray(body.files) ? body.files : []).slice(0, 20).map((f) => String(f).slice(0, 255));
        if (!text.trim()) return json(request, { answer: "", error: "Empty request" }, 400);
        const out = await askCouncil({ data: { text, files } });
        return json(request, out);
      },
    },
  },
});