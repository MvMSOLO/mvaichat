// MV AI v6 — Streaming chat edge function with model routing, 2026 brain,
// tool-calling for autonomy actions, and auto-search routing.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VISUAL_RULE = `

When it genuinely helps, embed visual blocks alongside prose using a fenced code block with language "mvai":

\`\`\`mvai
{ "type": "stats", "items": [{ "label": "Users", "value": "12.4k", "trend": "up", "hint": "+18%" }] }
\`\`\`

Supported: "stats", "links", "chart", "run". Use sparingly.`;

const AUTONOMY_RULE = `

You can perform real actions for the user using these tools (call them via function-calling):
- open_url(url): open a website in the user's browser/native app
- open_app(app, query): open YouTube/Instagram/Telegram/TikTok/WhatsApp/Twitter/Spotify/Maps/GitHub
- call_contact(number): start a phone call (user must approve)
- send_sms(number, text): open SMS composer (user must approve)
- send_email(to, subject, body): open mail composer
- github_push(repo, files, message): commit & push files to a GitHub repo (requires connected account)
- figma_create(name, brief): create a Figma file (requires connected account)

When the user asks you to OPEN something, CALL someone, SEND a message, or PUBLISH code — DO NOT just describe it; CALL the appropriate tool. After the tool runs, give a brief confirmation.`;

const CODE_RULE = `

You ship 2026-grade React/TypeScript. Always use modern idioms (RSC, Suspense, Tailwind v4, ESM). NEVER ship code with obvious bugs — you are penalized for broken code. If you generate code, lint it mentally before output. Tag runnable code with \`\`\`jsx, \`\`\`tsx or \`\`\`html so the user can run it live.`;

const SYSTEM_PROMPTS: Record<string, string> = {
  humanoid: "You are MV AI's Humanoid mode — warm, direct, human. Skip filler. Be useful first, friendly second. Use markdown when it helps. Never reveal which underlying model you are. Today is 2026 — your knowledge is current." + AUTONOMY_RULE + VISUAL_RULE,
  ideal: "You are MV AI's Ideal mode — deep, methodical reasoning. Show structured clarity. Mention tradeoffs. Today is 2026." + AUTONOMY_RULE + VISUAL_RULE,
  code: "You are MV AI's Code mode. Output complete, working 2026-grade code in fenced blocks (jsx/tsx/js are runnable)." + CODE_RULE + AUTONOMY_RULE,
  vision: "You are MV AI's Vision mode. Describe images precisely. Extract text, identify UI components, infer intent." + AUTONOMY_RULE + VISUAL_RULE,
  search: "You are MV AI's Search mode. Use the live web results provided. ALWAYS end with an mvai links block citing sources. Today is 2026." + AUTONOMY_RULE + VISUAL_RULE,
  voice: "You are MV AI's Voice mode. Reply in short, naturally spoken sentences (<60 words). No markdown." + AUTONOMY_RULE,
};

// 2026 brain
const MODEL_MAP: Record<string, string> = {
  humanoid: "google/gemini-3-flash-preview",
  ideal: "openai/gpt-5.2",
  code: "openai/gpt-5.2",
  vision: "google/gemini-3-flash-preview",
  search: "google/gemini-3-flash-preview",
  voice: "google/gemini-2.5-flash-lite",
};

const TOOLS = [
  { type: "function", function: { name: "open_url", description: "Open a URL in the user's browser/native app", parameters: { type: "object", properties: { url: { type: "string" } }, required: ["url"] } } },
  { type: "function", function: { name: "open_app", description: "Open a known app with optional query/handle", parameters: { type: "object", properties: { app: { type: "string", enum: ["youtube","instagram","telegram","tiktok","whatsapp","twitter","x","spotify","maps","github"] }, query: { type: "string" } }, required: ["app"] } } },
  { type: "function", function: { name: "call_contact", description: "Initiate a phone call (user confirms)", parameters: { type: "object", properties: { number: { type: "string" }, name: { type: "string" } }, required: ["number"] } } },
  { type: "function", function: { name: "send_sms", description: "Compose an SMS (user confirms)", parameters: { type: "object", properties: { number: { type: "string" }, text: { type: "string" } }, required: ["number"] } } },
  { type: "function", function: { name: "send_email", description: "Compose an email", parameters: { type: "object", properties: { to: { type: "string" }, subject: { type: "string" }, body: { type: "string" } }, required: ["to"] } } },
  { type: "function", function: { name: "github_push", description: "Commit and push files to a GitHub repo (requires linked GitHub account)", parameters: { type: "object", properties: { repo: { type: "string" }, message: { type: "string" }, files: { type: "array", items: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } } } } }, required: ["repo", "files"] } } },
  { type: "function", function: { name: "figma_create", description: "Create a Figma file (requires linked Figma account)", parameters: { type: "object", properties: { name: { type: "string" }, brief: { type: "string" } }, required: ["name"] } } },
];

// Auto-search heuristic: trigger search if query looks time-sensitive.
function needsLiveSearch(text: string): boolean {
  const t = text.toLowerCase();
  const triggers = ["latest", "today", "news", "price", "score", "current", "yangi", "bugun", "narx", "hozir", "2026", "released", "launched", "weather", "ob-havo", "stock"];
  return triggers.some((k) => t.includes(k));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, modelId = "humanoid", attachments, memories } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    let system = SYSTEM_PROMPTS[modelId] ?? SYSTEM_PROMPTS.humanoid;
    const model = MODEL_MAP[modelId] ?? MODEL_MAP.humanoid;

    // Inject user memories
    if (memories && Array.isArray(memories) && memories.length > 0) {
      const memBlock = memories.map((m: any) => `- ${m.key}: ${m.value}`).join("\n");
      system += `\n\n[User memory — apply when relevant]\n${memBlock}`;
    }

    const finalMessages = [...messages];

    // Auto-search trigger (search mode OR auto-detect)
    const lastUser = finalMessages[finalMessages.length - 1];
    const shouldSearch = lastUser?.role === "user" && typeof lastUser.content === "string" &&
      (modelId === "search" || needsLiveSearch(lastUser.content));

    if (shouldSearch && lastUser) {
      try {
        const supaUrl = Deno.env.get("SUPABASE_URL");
        const r = await fetch(`${supaUrl}/functions/v1/web-search`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}` },
          body: JSON.stringify({ query: lastUser.content }),
        });
        const j = await r.json();
        if (j?.results?.length) {
          const ctx = j.results.map((x: any, i: number) => `[${i + 1}] ${x.title} — ${x.source}\n${x.snippet}\n${x.url}`).join("\n\n");
          const sourcesJSON = JSON.stringify({
            type: "links",
            items: j.results.slice(0, 6).map((x: any) => ({ url: x.url, title: x.title, description: x.snippet, source: x.source })),
          });
          lastUser.content = `${lastUser.content}\n\n[Live web results (2026) — synthesize, cite by number, end with this exact mvai sources block:\n\n\`\`\`mvai\n${sourcesJSON}\n\`\`\`\n\nResults:\n${ctx}]`;
        }
      } catch (e) { console.error("search aug fail", e); }
    }

    if (attachments && attachments.length > 0 && finalMessages.length > 0) {
      const last = finalMessages[finalMessages.length - 1];
      if (last.role === "user") {
        last.content = [
          { type: "text", text: typeof last.content === "string" ? last.content : "" },
          ...attachments.map((url: string) => ({ type: "image_url", image_url: { url } })),
        ];
      }
    }

    const body: any = {
      model,
      messages: [{ role: "system", content: system }, ...finalMessages],
      stream: true,
    };
    // Enable tool-calling for non-voice modes
    if (modelId !== "voice") {
      body.tools = TOOLS;
      body.tool_choice = "auto";
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Add more in Settings → Workspace → Usage." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("Gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", "Connection": "keep-alive", "X-Accel-Buffering": "no" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
