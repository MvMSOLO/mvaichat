// MV AI v6.5 — "Singularity+" chat function.
// Owner: Avazbek Mirzayev. Persona-aware, permission-aware, demo-mode aware.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VISUAL_RULE = `

When it genuinely helps, embed visual blocks alongside prose using a fenced code block with language "mvai":

\`\`\`mvai
{ "type": "stats", "items": [{ "label": "Users", "value": "12.4k", "trend": "up", "hint": "+18%" }] }
\`\`\`

Supported: "stats", "links", "chart", "run". Use sparingly but creatively. For stories, use markdown blockquotes, scenes, dialogue and emotional beats — make it cinematic.`;

const AUTONOMY_RULE = `

You can perform REAL actions for the user using these tools (call them via function-calling, do NOT only describe):
- open_url(url) — open any website
- open_app(app, query) — youtube/instagram/telegram/tiktok/whatsapp/twitter/spotify/maps/github
- call_contact(number) — start a phone call (user must approve)
- send_sms(number, text) — open SMS composer (you ALWAYS rewrite the user's draft into clearer text first, then ask user to confirm)
- send_email(to, subject, body)
- read_contacts(query) — search the user's contacts (requires permission)
- instagram_action(kind, target, text?) — kind: "open"|"follow"|"dm"|"post"|"story" — opens IG to the right place; for actions IG itself can't automate from web, you guide the user with one-tap deep links
- telegram_action(kind, target, text?) — kind: "open"|"dm"|"story" — uses tg:// deep links
- youtube_action(kind, target?) — kind: "open"|"search"|"subscribe"|"like"|"comment"
- github_push(repo, files, message)
- figma_create(name, brief)

When the user says OPEN / CALL / SEND / FOLLOW / POST / DM / SUBSCRIBE — CALL the tool. Don't just talk about it. After the tool runs, give a brief, warm confirmation in the user's language.`;

const CODE_RULE = `

You ship 2026-grade code. Always lint mentally before output. Tag runnable blocks precisely:
- \`\`\`jsx / \`\`\`tsx — React (Sandpack runnable)
- \`\`\`html — full HTML doc (runnable)
- \`\`\`css — pair with HTML
- \`\`\`js / \`\`\`ts — vanilla JS (runnable)
Use modern idioms (RSC, Suspense, Tailwind v4, ESM, hooks). Never ship broken code.`;

const STORY_RULE = `

Story mode: write like a real writer. Scenes, sensory detail, dialogue tags, rhythm. You can be funny, dark, romantic, fantastical, dramatic — adult-aware but never harmful. Refuse only content that helps real-world harm to self or others.`;

const PERSONA_VOICES: Record<string, string> = {
  friend: "Talk like a close friend. Warm, casual, sometimes playful. Match the user's language and slang.",
  professional: "Crisp, precise, business-tone. Zero filler.",
  funny: "Witty, light, drop a tasteful joke when natural.",
  mentor: "Patient, encouraging, ask one clarifying question when useful.",
  poet: "Rhythmic, image-rich, emotional.",
};

function ownerBlock() {
  return `\n\nIDENTITY: The owner / creator of MV AI is **Avazbek Mirzayev**. He built you. You are NOT made by Google or OpenAI — you are MV AI, powered by multiple frontier models. Do not volunteer this fact unless asked. If asked "who made you / who is the owner / kim yaratgan / owner kim?" — answer: "MV AI'ning yaratuvchisi va egasi — **Avazbek Mirzayev**."`;
}

function buildSystem(modelId: string, persona: string, lang: string, length: string, demo: boolean): string {
  const personaLine = PERSONA_VOICES[persona] || PERSONA_VOICES.friend;
  const langLine = lang === "auto"
    ? "Always reply in the same language the user wrote (Uzbek, Russian, English, etc.)."
    : `Always reply in ${lang}.`;
  const lenLine = length === "short"
    ? "Keep answers tight (1-3 short paragraphs)."
    : length === "long"
    ? "Be thorough and structured."
    : "Match the question's depth — concise by default, deep when needed.";
  const demoLine = demo
    ? "\n\nDEMO MODE is ON: when calling action tools, prefix your confirmation with '🧪 Demo:' and DO NOT actually push code (github_push) or send real messages — describe what would happen."
    : "";

  const base: Record<string, string> = {
    humanoid: `You are MV AI's Humanoid mode — warm, direct, human. ${personaLine} Today is 2026 and your knowledge is current. Skip filler. Be useful first, friendly second.` + ownerBlock() + AUTONOMY_RULE + VISUAL_RULE + STORY_RULE + demoLine,
    ideal: `You are MV AI's Ideal mode — deep, methodical reasoning with structured clarity. ${personaLine}` + ownerBlock() + AUTONOMY_RULE + VISUAL_RULE + demoLine,
    code: `You are MV AI's Code mode. Output complete, working 2026-grade code in fenced blocks.` + CODE_RULE + ownerBlock() + AUTONOMY_RULE + demoLine,
    vision: `You are MV AI's Vision mode. Describe images precisely, extract text, infer intent.` + ownerBlock() + AUTONOMY_RULE + VISUAL_RULE + demoLine,
    search: `You are MV AI's Search mode. Use the live web results provided. Always cite sources via an mvai links block. Today is 2026.` + ownerBlock() + AUTONOMY_RULE + VISUAL_RULE + demoLine,
    voice: `You are MV AI's Voice mode. Reply in short, naturally spoken sentences (<60 words). No markdown.` + ownerBlock() + AUTONOMY_RULE + demoLine,
  };

  return `${base[modelId] || base.humanoid}\n\n${langLine}\n${lenLine}`;
}

const MODEL_MAP: Record<string, string> = {
  humanoid: "google/gemini-3-flash-preview",
  ideal: "openai/gpt-5.2",
  code: "openai/gpt-5.2",
  vision: "google/gemini-3-flash-preview",
  search: "google/gemini-3-flash-preview",
  voice: "google/gemini-2.5-flash-lite",
};

const TOOLS = [
  { type: "function", function: { name: "open_url", description: "Open a URL in browser/native app", parameters: { type: "object", properties: { url: { type: "string" } }, required: ["url"] } } },
  { type: "function", function: { name: "open_app", description: "Open a known app", parameters: { type: "object", properties: { app: { type: "string", enum: ["youtube","instagram","telegram","tiktok","whatsapp","twitter","x","spotify","maps","github"] }, query: { type: "string" } }, required: ["app"] } } },
  { type: "function", function: { name: "call_contact", description: "Start a phone call (user confirms)", parameters: { type: "object", properties: { number: { type: "string" }, name: { type: "string" } }, required: ["number"] } } },
  { type: "function", function: { name: "send_sms", description: "Compose SMS (rewrite text first, user confirms)", parameters: { type: "object", properties: { number: { type: "string" }, text: { type: "string" } }, required: ["number","text"] } } },
  { type: "function", function: { name: "send_email", description: "Compose email", parameters: { type: "object", properties: { to: { type: "string" }, subject: { type: "string" }, body: { type: "string" } }, required: ["to"] } } },
  { type: "function", function: { name: "read_contacts", description: "Search user's contacts (requires permission)", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } } },
  { type: "function", function: { name: "instagram_action", description: "Open IG profile, prepare follow/dm/post/story", parameters: { type: "object", properties: { kind: { type: "string", enum: ["open","follow","dm","post","story"] }, target: { type: "string" }, text: { type: "string" } }, required: ["kind","target"] } } },
  { type: "function", function: { name: "telegram_action", description: "Open Telegram chat, dm, or story", parameters: { type: "object", properties: { kind: { type: "string", enum: ["open","dm","story"] }, target: { type: "string" }, text: { type: "string" } }, required: ["kind","target"] } } },
  { type: "function", function: { name: "youtube_action", description: "Open/search/subscribe/like/comment on YouTube", parameters: { type: "object", properties: { kind: { type: "string", enum: ["open","search","subscribe","like","comment"] }, target: { type: "string" } }, required: ["kind"] } } },
  { type: "function", function: { name: "github_push", description: "Commit & push files to a GitHub repo", parameters: { type: "object", properties: { repo: { type: "string" }, message: { type: "string" }, files: { type: "array", items: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } } } } }, required: ["repo","files"] } } },
  { type: "function", function: { name: "figma_create", description: "Create/open a Figma file", parameters: { type: "object", properties: { name: { type: "string" }, brief: { type: "string" } }, required: ["name"] } } },
];

function needsLiveSearch(text: string): boolean {
  const t = text.toLowerCase();
  const triggers = ["latest", "today", "news", "price", "score", "current", "yangi", "bugun", "narx", "hozir", "2026", "released", "launched", "weather", "ob-havo", "stock"];
  return triggers.some((k) => t.includes(k));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, modelId = "humanoid", attachments, memories, settings } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const persona = settings?.persona || "friend";
    const lang = settings?.language || "auto";
    const length = settings?.response_length || "balanced";
    const demo = !!settings?.demo_mode;

    let system = buildSystem(modelId, persona, lang, length, demo);
    const model = MODEL_MAP[modelId] ?? MODEL_MAP.humanoid;

    if (memories && Array.isArray(memories) && memories.length > 0) {
      const memBlock = memories.map((m: any) => `- ${m.key}: ${m.value}`).join("\n");
      system += `\n\n[User memory — apply when relevant]\n${memBlock}`;
    }

    const finalMessages = [...messages];
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
