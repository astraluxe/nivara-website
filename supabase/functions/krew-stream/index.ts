import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// RETIRED 2 Oct 2026. adris.tech is free: there is no hosted adris.tech AI plan and nothing to buy.
// The app runs only on the AI the user connects (their NVIDIA / Groq / Gemini / OpenAI / Anthropic
// key, their own Claude Code or Codex, OmniRoute, or a local model). This function keeps its name so
// installed copies of older app builds get a clear answer instead of a 404 — and it never touches
// any API key or payment provider. The pre-retirement source is in git history (and, for functions
// that were never in this repo, in nivara-desktop/docs/retired-edge-functions/).

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve((req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  return new Response(JSON.stringify({ error: "adris.tech AI has been retired. adris.tech is now free and runs on the AI you connect: update the app, then pick a free NVIDIA or Groq key, your Claude Code or Codex, your own key, or a local model from the AI menu at the top of the window.", message: "adris.tech AI has been retired. adris.tech is now free and runs on the AI you connect: update the app, then pick a free NVIDIA or Groq key, your Claude Code or Codex, your own key, or a local model from the AI menu at the top of the window.", retired: true }), {
    status: 410,
    headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
});
