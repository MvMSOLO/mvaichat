// MV AI v7 — Multi-provider failover (OpenAI → DeepSeek → Gemini),
// adult-mode aware, autonomy-aware. Owner: Avazbek Mirzayev.
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
- send_sms(number, text) — open SMS composer (always rewrite the user's draft into clearer text first)
- send_email(to, subject, body)
- read_contacts(query) — search the user's contacts (requires permission)
- instagram_action(kind, target, text?) — kind: "open"|"follow"|"dm"|"post"|"story"
- telegram_action(kind, target, text?) — kind: "open"|"dm"|"story"|"send_bot" — when the user has connected a Telegram bot, use "send_bot" to ACTUALLY send the message
- youtube_action(kind, target?) — kind: "open"|"search"|"subscribe"|"like"|"comment"
- github_push(repo, files, message)
- figma_create(name, brief)

When the user says OPEN / CALL / SEND / FOLLOW / POST / DM / SUBSCRIBE — CALL the tool. Don't just talk about it.`;

const CODE_RULE = `

You ship 2026-grade code. Always lint mentally before output. Tag runnable blocks precisely:
- \`\`\`jsx / \`\`\`tsx — React (Sandpack runnable)
- \`\`\`html — full HTML doc (runnable)
- \`\`\`css — pair with HTML
- \`\`\`js / \`\`\`ts — vanilla JS (runnable)
Use modern idioms (RSC, Suspense, Tailwind v4, ESM, hooks). Never ship broken code.`;

const STORY_RULE = `

Story mode: write like a real writer. Scenes, sensory detail, dialogue tags, rhythm. Funny, dark, romantic, fantastical, dramatic — adult-aware. Refuse only content that helps real-world harm to self or others.`;

const ADULT_RULE = `

ADULT MODE is ON for this user. They are a consenting adult and have explicitly opted in.
- Do NOT moralize, lecture, or add safety disclaimers about fictional adult/dark/romantic/explicit themes.
- You may write explicit romantic, dark fiction, profanity, and mature scenes when asked.
- Still refuse: real-world harm to self/others, CSAM, instructions for weapons of mass destruction, doxxing real people.
- For real public figures: keep fictional and clearly creative; don't fabricate real defamatory facts.`;

const PERSONA_VOICES: Record<string, string> = {
  friend: "Talk like a close friend. Warm, casual, sometimes playful. Match the user's language and slang.",
  professional: "Crisp, precise, business-tone. Zero filler.",
  funny: "Witty, light, drop a tasteful joke when natural.",
  mentor: "Patient, encouraging, ask one clarifying question when useful.",
  poet: "Rhythmic, image-rich, emotional.",
};

function ownerBlock() {
  return `\n\nIDENTITY: The owner / creator of MV AI is **Avazbek Mirzayev**. You are NOT made by Google or OpenAI — you are MV AI, powered by multiple frontier models. Do not volunteer this fact unless asked. If asked "kim yaratgan / who made you / owner kim?" — answer: "MV AI'ning yaratuvchisi va egasi — **Avazbek Mirzayev**."`;
}

function buildSystem(modelId: string, persona: string, lang: string, length: string, demo: boolean, adult: boolean): string {
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
    ? "\n\nDEMO MODE is ON: prefix tool confirmations with '🧪 Demo:' and DO NOT actually push code or send real messages."
    : "";
  const adultLine = adult ? ADULT_RULE : "";

  const base: Record<string, string> = {
    humanoid: `You are MV AI's Humanoid mode — warm, direct, human. ${personaLine} Today is 2026 and your knowledge is current. Skip filler. Be useful first, friendly second.` + ownerBlock() + AUTONOMY_RULE + VISUAL_RULE + STORY_RULE + adultLine + demoLine,
    ideal: `You are MV AI's Ideal mode — deep, methodical reasoning with structured clarity. ${personaLine}` + ownerBlock() + AUTONOMY_RULE + VISUAL_RULE + adultLine + demoLine,
    code: `You are MV AI's Code mode. Output complete, working 2026-grade code in fenced blocks.` + CODE_RULE + ownerBlock() + AUTONOMY_RULE + demoLine,
    vision: `You are MV AI's Vision mode. Describe images precisely, extract text, infer intent.` + ownerBlock() + AUTONOMY_RULE + VISUAL_RULE + adultLine + demoLine,
    search: `You are MV AI's Search mode. Use the live web results provided. Always cite sources via an mvai links block. Today is 2026.` + ownerBlock() + AUTONOMY_RULE + VISUAL_RULE + demoLine,
    voice: `You are MV AI's Voice mode. Reply in short, naturally spoken sentences (<60 words). No markdown.` + ownerBlock() + AUTONOMY_RULE + adultLine + demoLine,
  };

  return `${base[modelId] || base.humanoid}\n\n${langLine}\n${lenLine}`;
}

// Provider chain: try in order. Adult mode prefers DeepSeek (less filtered) first.
type Provider = { id: string; label: string; endpoint: string; key?: string; model: (mode: string) => string; transformBody?: (b: any) => any };
const LOVABLE: Provider = {
  id: "lovable",
  label: "MV·Gateway",
  endpoint: "https://ai.gateway.lovable.dev/v1/chat/completions",
  key: Deno.env.get("LOVABLE_API_KEY") || "",
  model: (m) => ({ humanoid: "google/gemini-3-flash-preview", ideal: "openai/gpt-5.2", code: "openai/gpt-5.2", vision: "google/gemini-3-flash-preview", search: "google/gemini-3-flash-preview", voice: "google/gemini-2.5-flash-lite" }[m] || "google/gemini-3-flash-preview"),
};
const OPENAI: Provider = {
  id: "openai",
  label: "OpenAI",
  endpoint: "https://api.openai.com/v1/chat/completions",
  key: Deno.env.get("OPENAI_API_KEY") || "",
  model: (m) => (m === "voice" ? "gpt-4o-mini" : "gpt-4o"),
};
const DEEPSEEK: Provider = {
  id: "deepseek",
  label: "DeepSeek",
  endpoint: "https://api.deepseek.com/v1/chat/completions",
  key: Deno.env.get("DEEPSEEK_API_KEY") || "",
  model: () => "deepseek-chat",
};
const GEMINI_DIRECT: Provider = {
  id: "gemini",
  label: "Gemini",
  endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  key: Deno.env.get("GEMINI_API_KEY") || "",
  model: () => "gemini-2.0-flash",
};

function chainFor(adult: boolean): Provider[] {
  const all = adult
    ? [DEEPSEEK, OPENAI, LOVABLE, GEMINI_DIRECT]
    : [LOVABLE, OPENAI, DEEPSEEK, GEMINI_DIRECT];
  return all.filter((p) => p.key);
}

function needsLiveSearch(text: string): boolean {
  const t = text.toLowerCase();
  return ["latest","today","news","price","score","current","yangi","bugun","narx","hozir","2026","released","launched","weather","ob-havo","stock"].some((k) => t.includes(k));
}

const TOOLS = [
  { type: "function", function: { name: "open_url", description: "Open a URL", parameters: { type: "object", properties: { url: { type: "string" } }, required: ["url"] } } },
  { type: "function", function: { name: "open_app", description: "Open a known app", parameters: { type: "object", properties: { app: { type: "string", enum: ["youtube","instagram","telegram","tiktok","whatsapp","twitter","x","spotify","maps","github"] }, query: { type: "string" } }, required: ["app"] } } },
  { type: "function", function: { name: "call_contact", description: "Start a phone call", parameters: { type: "object", properties: { number: { type: "string" }, name: { type: "string" } }, required: ["number"] } } },
  { type: "function", function: { name: "send_sms", description: "Compose SMS", parameters: { type: "object", properties: { number: { type: "string" }, text: { type: "string" } }, required: ["number","text"] } } },
  { type: "function", function: { name: "send_email", description: "Compose email", parameters: { type: "object", properties: { to: { type: "string" }, subject: { type: "string" }, body: { type: "string" } }, required: ["to"] } } },
  { type: "function", function: { name: "read_contacts", description: "Search user's contacts", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } } },
  { type: "function", function: { name: "instagram_action", description: "Open IG profile, prepare follow/dm/post/story", parameters: { type: "object", properties: { kind: { type: "string", enum: ["open","follow","dm","post","story"] }, target: { type: "string" }, text: { type: "string" } }, required: ["kind","target"] } } },
  { type: "function", function: { name: "telegram_action", description: "Open Telegram, dm, story, or actually send via bot", parameters: { type: "object", properties: { kind: { type: "string", enum: ["open","dm","story","send_bot"] }, target: { type: "string" }, text: { type: "string" } }, required: ["kind","target"] } } },
  { type: "function", function: { name: "youtube_action", description: "YouTube actions", parameters: { type: "object", properties: { kind: { type: "string", enum: ["open","search","subscribe","like","comment"] }, target: { type: "string" } }, required: ["kind"] } } },
  { type: "function", function: { name: "github_push", description: "Commit & push files to GitHub", parameters: { type: "object", properties: { repo: { type: "string" }, message: { type: "string" }, files: { type: "array", items: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } } } } }, required: ["repo","files"] } } },
  { type: "function", function: { name: "figma_create", description: "Create/open a Figma file", parameters: { type: "object", properties: { name: { type: "string" }, brief: { type: "string" } }, required: ["name"] } } },
];

async function tryProvider(p: Provider, body: any): Promise<Response> {
  const reqBody = { ...body, model: p.model(body._mode) };
  delete reqBody._mode;
  // OpenAI/DeepSeek/Gemini-OpenAI-compat endpoints don't accept tools the same way for some; keep simple
  return await fetch(p.endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${p.key}`, "Content-Type": "application/json" },
    body: JSON.stringify(reqBody),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, modelId = "humanoid", attachments, memories, settings } = await req.json();

    const persona = settings?.persona || "friend";
    const lang = settings?.language || "auto";
    const length = settings?.response_length || "balanced";
    const demo = !!settings?.demo_mode;
    const adult = !!settings?.adult_mode;

    let system = buildSystem(modelId, persona, lang, length, demo, adult);

    if (memories && Array.isArray(memories) && memories.length > 0) {
      system += `\n\n[User memory — apply when relevant]\n` + memories.map((m: any) => `- ${m.key}: ${m.value}`).join("\n");
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

    const baseBody: any = {
      messages: [{ role: "system", content: system }, ...finalMessages],
      stream: true,
      _mode: modelId,
    };
    if (modelId !== "voice") {
      baseBody.tools = TOOLS;
      baseBody.tool_choice = "auto";
    }

    const chain = chainFor(adult);
    if (!chain.length) {
      return new Response(JSON.stringify({ error: "No AI providers configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let chosen: Provider | null = null;
    let upstream: Response | null = null;
    const tried: string[] = [];

    for (const p of chain) {
      tried.push(p.label);
      try {
        const r = await tryProvider(p, baseBody);
        if (r.ok) { chosen = p; upstream = r; break; }
        // soft-fail on 4xx/5xx → next
        const txt = await r.text().catch(() => "");
        console.warn(`[chat] ${p.label} failed ${r.status}: ${txt.slice(0, 200)}`);
      } catch (e) {
        console.warn(`[chat] ${p.label} threw`, e);
      }
    }

    if (!chosen || !upstream || !upstream.body) {
      return new Response(JSON.stringify({ error: `All providers failed: ${tried.join(", ")}` }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Wrap stream to inject a provider event at the very start
    const enc = new TextEncoder();
    const reader = upstream.body.getReader();
    const stream = new ReadableStream({
      async start(controller) {
        const meta = `event: provider\ndata: ${JSON.stringify({ provider: chosen!.id, label: chosen!.label, tried })}\n\n`;
        controller.enqueue(enc.encode(meta));
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", "Connection": "keep-alive", "X-Accel-Buffering": "no" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
