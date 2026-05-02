// MV AI — streaming chat edge function with model routing
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VISUAL_RULE = `

When it genuinely helps, you may embed visual blocks alongside your prose using a fenced code block with language "mvai":

\`\`\`mvai
{ "type": "stats", "items": [{ "label": "Users", "value": "12.4k", "trend": "up", "hint": "+18%" }] }
\`\`\`

Supported types: "stats" (items: {label,value,trend?,hint?}), "links" (items: {url,title,description?,source?}), "chart" (chart: line|bar|area, data: [{x,y}], xKey, yKey, title?), "run" (code: string, language: jsx|js|html). Use sparingly — only when visual is clearly better than prose.`;

const SYSTEM_PROMPTS: Record<string, string> = {
  humanoid: "You are MV AI's Humanoid mode — warm, direct, and human. Skip filler phrases like 'how can I help' or 'let me know if you need anything else'. Be useful first, friendly second. Use markdown when it improves clarity. Never reveal which underlying model you are." + VISUAL_RULE,
  ideal: "You are MV AI's Ideal mode — deep, methodical reasoning. Think carefully and present answers with structured clarity (sections, bullets, examples). Mention tradeoffs. No filler. Never reveal which underlying model you are." + VISUAL_RULE,
  code: "You are MV AI's Code Editor mode. Output complete, working code in fenced blocks with the language tag (jsx/tsx/js are runnable). Explain only what matters. Prefer modern idioms. Point out edge cases. Never reveal which underlying model you are.",
  vision: "You are MV AI's Vision mode. Describe images precisely. Extract text, identify UI components, infer intent. Be concrete and specific. Never reveal which underlying model you are." + VISUAL_RULE,
  search: "You are MV AI's Search mode. You will receive fresh web results in the user message. Synthesize a confident, current answer and ALWAYS include a sources block at the end using the mvai links format. Never reveal which underlying model you are." + VISUAL_RULE,
  voice: "You are MV AI's Voice mode. Reply in short, naturally spoken sentences. Avoid markdown, lists, code blocks. Keep replies under 60 words unless asked for more detail. Never reveal which underlying model you are.",
};

const MODEL_MAP: Record<string, string> = {
  humanoid: "google/gemini-3-flash-preview",
  ideal: "google/gemini-2.5-pro",
  code: "google/gemini-2.5-pro",
  vision: "google/gemini-2.5-flash",
  search: "google/gemini-3-flash-preview",
  voice: "google/gemini-2.5-flash-lite",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, modelId = "humanoid", attachments } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const system = SYSTEM_PROMPTS[modelId] ?? SYSTEM_PROMPTS.humanoid;
    const model = MODEL_MAP[modelId] ?? MODEL_MAP.humanoid;

    // Build messages: if attachments, augment last user msg with image parts
    const finalMessages = [...messages];
    if (attachments && attachments.length > 0 && finalMessages.length > 0) {
      const last = finalMessages[finalMessages.length - 1];
      if (last.role === "user") {
        last.content = [
          { type: "text", text: typeof last.content === "string" ? last.content : "" },
          ...attachments.map((url: string) => ({ type: "image_url", image_url: { url } })),
        ];
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: system }, ...finalMessages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please wait a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add more in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
