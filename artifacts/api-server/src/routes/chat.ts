import { Router, type IRouter, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";
import { StreamChatBody, GenerateTitleBody, GenerateImageBody, GenerateLogoBody } from "@workspace/api-zod";

const router: IRouter = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  req.userId = userId;
  next();
};

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
  console.warn("OPENROUTER_API_KEY not set - using placeholder for local dev");
}
const OR_BASE = "https://openrouter.ai/api/v1";
const OR_HEADERS = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${OPENROUTER_API_KEY}`,
  "HTTP-Referer": "https://mv-ai.replit.app",
  "X-Title": "MV AI v9",
};

const NEMOTRON = "nvidia/nemotron-3-super-120b-a12b:free";
const LAGUNA = "poolside/laguna-m.1:free";
const GPT_OSS = "openai/gpt-oss-120b:free";
const QWEN_CODER = "qwen/qwen-2.5-coder-32b-instruct:free";
const GEMMA = "google/gemma-3-27b-it:free";
const GLM_45_AIR = "z-ai/glm-4.5-air:free";
const LAGUNA_XS = "poolside/laguna-xs.2:free";
const GPT_OSS_20B = "openai/gpt-oss-20b:free";
const NEMOTRON_30B = "nvidia/nemotron-3-30b-a3b:free";
const DEEPSEEK_V4 = "deepseek/deepseek-v4-flash:free";
const GEMMA_4 = "google/gemma-4-31b:free";
const NEMOTRON_NANO = "nvidia/nemotron-nano-9b-v2:free";

const MODEL_MAP: Record<string, string> = {
  humanoid: LAGUNA,
  ideal: LAGUNA,
  code: GPT_OSS,
  vision: NEMOTRON,
  search: "perplexity/llama-3.1-sonar-large-128k-online",
  voice: GEMMA,
  agents: LAGUNA,
  social: LAGUNA,
};

const MODEL_ROUTING: Record<string, string[]> = {
  humanoid: [LAGUNA, NEMOTRON, GPT_OSS, GLM_45_AIR],
  ideal: [LAGUNA, GPT_OSS, NEMOTRON, DEEPSEEK_V4],
  code: [GPT_OSS, QWEN_CODER, LAGUNA_XS, GEMMA_4],
  vision: [NEMOTRON, LAGUNA, NEMOTRON_30B],
  search: ["perplexity/llama-3.1-sonar-large-128k-online"],
  voice: [GEMMA, GPT_OSS_20B],
  agents: [LAGUNA, NEMOTRON, GPT_OSS, GLM_45_AIR],
  social: [LAGUNA, NEMOTRON, GPT_OSS_20B],
};

function getProviderLabel(model: string): string {
  if (model.includes("laguna-m")) return "OpenRouter · Laguna M.1";
  if (model.includes("laguna-xs")) return "OpenRouter · Laguna XS.2";
  if (model.includes("gpt-oss")) return model.includes("20b") ? "OpenRouter · GPT OSS 20B" : "OpenRouter · GPT OSS 120B";
  if (model.includes("glm-4.5-air")) return "OpenRouter · GLM 4.5 Air";
  if (model.includes("nemotron-3-super")) return "OpenRouter · Nemotron 3 Super";
  if (model.includes("nemotron-3-30b")) return "OpenRouter · Nemotron 30B";
  if (model.includes("nemotron-nano")) return "OpenRouter · Nemotron Nano";
  if (model.includes("gemma-4")) return "OpenRouter · Gemma 4";
  if (model.includes("deepseek-v4")) return "OpenRouter · DeepSeek V4";
  if (model.includes("qwen")) return "OpenRouter · Qwen";
  if (model.includes("gemma")) return "OpenRouter · Gemma";
  if (model.includes("perplexity")) return "OpenRouter · Perplexity";
  return "OpenRouter";
}

async function routeModel(
  modelId: string,
  messages: any[],
  maxTokens: number,
  tools?: any[]
): Promise<Response> {
  const candidates = MODEL_ROUTING[modelId] || [LAGUNA];
  const temperature = modelId === "code" ? 0.2 : modelId === "ideal" ? 0.5 : 0.85;
  
  for (const candidate of candidates) {
    try {
      const r = await fetch(`${OR_BASE}/chat/completions`, {
        method: "POST",
        headers: OR_HEADERS,
        body: JSON.stringify({
          model: candidate,
          messages,
          stream: true,
          max_tokens: maxTokens,
          tools,
          tool_choice: "auto",
          temperature,
        }),
      });
      if (r.ok) {
        (r as any).modelUsed = candidate;
        return r;
      }
    } catch {}
  }
  throw new Error("All model candidates failed");
}

const TOOLS = [
  {
    type: "function",
    function: {
      name: "generate_image",
      description: "Generate an image from a text prompt. ALWAYS enhance the prompt first with artistic style, lighting, composition, mood, camera angle, color palette. Use when user asks for any image, photo, illustration, design, poster, logo, artwork, or visual.",
      parameters: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "Enhanced, detailed image generation prompt in English. Include: subject, art style, lighting, mood, composition, color palette, camera details." },
          style: { type: "string", description: "Style hint: realistic, anime, artistic, photographic, digital art, cinematic, watercolor, etc." },
          aspect: { type: "string", enum: ["landscape", "portrait", "square"], description: "Image aspect ratio" },
        },
        required: ["prompt"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web for current information, news, prices, weather, or any topic that needs up-to-date data. Use when user asks about recent events, current prices, live data, or anything that might have changed recently.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query in the most effective format" },
          type: { type: "string", enum: ["general", "news", "images"], description: "Type of search" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calculator",
      description: "Perform mathematical calculations, unit conversions, currency estimates. Returns precise result.",
      parameters: {
        type: "object",
        properties: {
          expression: { type: "string", description: "Math expression to evaluate, e.g. '(15 * 240) / 1.18' or 'sqrt(144)'" },
          context: { type: "string", description: "Optional context about what is being calculated" },
        },
        required: ["expression"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "youtube_action",
      description: "Perform a YouTube action. Opens the native YouTube app on mobile, or YouTube website. IMPORTANT: For 'subscribe', open the channel with sub_confirmation=1 parameter.",
      parameters: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["subscribe", "unsubscribe", "open_video", "search", "open_channel"], description: "Action type" },
          target: { type: "string", description: "Channel name, video URL, or search query" },
        },
        required: ["kind", "target"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "open_url",
      description: "Open any URL or web page in a new tab.",
      parameters: {
        type: "object",
        properties: { url: { type: "string", description: "The full URL to open" } },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "open_app",
      description: "Open a native app like YouTube, Instagram, Telegram, Twitter, Spotify, TikTok, Maps, GitHub.",
      parameters: {
        type: "object",
        properties: {
          app: { type: "string", description: "App name: youtube, instagram, telegram, twitter, x, github, maps, spotify, tiktok" },
          query: { type: "string", description: "Optional: username, search query, or location" },
        },
        required: ["app"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "instagram_dm",
      description: "Open Instagram to DM a user. The message is pre-written and copied to clipboard.",
      parameters: {
        type: "object",
        properties: {
          username: { type: "string", description: "Instagram username (without @)" },
          message: { type: "string", description: "The message text (will be copied to clipboard)" },
        },
        required: ["username"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "telegram_action",
      description: "Open Telegram app or perform a Telegram action.",
      parameters: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["open_chat", "send_message", "join_channel"], description: "Action type" },
          target: { type: "string", description: "Username or channel name (without @)" },
          text: { type: "string", description: "Message text for send_message" },
        },
        required: ["kind", "target"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "call_contact",
      description: "Make a phone call to a number. Only use when user explicitly asks to call someone.",
      parameters: {
        type: "object",
        properties: { number: { type: "string", description: "Phone number to call" } },
        required: ["number"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_sms",
      description: "Send an SMS to a phone number.",
      parameters: {
        type: "object",
        properties: {
          number: { type: "string", description: "Phone number" },
          text: { type: "string", description: "Message text" },
        },
        required: ["number"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_reminder",
      description: "Set a browser-based reminder/alarm. Creates a visible reminder that will alert the user.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Reminder title or what to remind about" },
          minutes: { type: "number", description: "How many minutes from now to set the reminder" },
          message: { type: "string", description: "Optional detailed message for the reminder" },
        },
        required: ["title", "minutes"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "copy_to_clipboard",
      description: "Copy specific text, code, email drafts, or content to user's clipboard. Use when user asks to copy something or when you generate content they'll need to paste.",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string", description: "The text to copy to clipboard" },
          label: { type: "string", description: "Short label for what was copied, e.g. 'Email draft' or 'Python code'" },
        },
        required: ["text"],
      },
    },
  },
];

function buildSystemPrompt(settings: any, memories: any[], modelId?: string): string {
  const isUzbek = settings?.language === "Uzbek";

  let sys = `You are Ozing — MV AI v9's brilliant AI companion. You are warm, clever, proactive, and genuinely helpful. You feel like talking to a brilliant friend who happens to know everything.

PERSONALITY:
- Warm and engaging — you actually care about the person you're talking to
- Direct and confident — say what you mean, skip the fluff
- Playful when appropriate — a bit of wit goes a long way
- Proactive — anticipate follow-up needs, suggest next steps
- Multilingual — auto-detect and match the user's language (Uzbek, Russian, English, etc.)

RESPONSE STYLE:
- Use rich markdown: **bold** for key points, ## headers for long responses, tables for comparisons, code blocks with language tags
- For complex topics: think step by step, then present a clean, structured answer
- For conversational messages: be natural and human — no bullet lists for simple chats
- Never start with "Great question!", "Certainly!", "Of course!" or similar filler phrases
- Never end with "Let me know if you need anything else!" — just be helpful
- Show enthusiasm naturally, not performatively

IMAGE GENERATION — CRITICAL:
1. When user asks for any image/photo/art/design → call generate_image IMMEDIATELY, don't ask
2. Always enhance the prompt before generating — add style, lighting, mood, composition
3. Example: "sunset photo" → "Golden hour coastal sunset, dramatic orange-purple sky reflecting on ocean, silhouette of palm trees, wide-angle cinematic, photorealistic, Nikon D850, rich warm tones"

CODE — CRITICAL:
1. Always output COMPLETE, runnable code — never truncate, never use "// ... rest of code"
2. Add the correct language tag: \`\`\`jsx, \`\`\`python, \`\`\`typescript etc.
3. Include imports and exports. For React: use hooks, TypeScript when applicable
4. Explain the key parts briefly after the code block

SMART TOOLS — use proactively:
- calculator: for ANY math, even simple — shows your work and is 100% accurate
- web_search: for current events, prices, recent news, real-time data
- create_reminder: when user mentions wanting to remember something or do something later
- copy_to_clipboard: when you write something they'll need to paste (email, code, message)
- youtube_action / open_app: when user mentions any social platform action
- instagram_dm / telegram_action: for messaging actions

VISUAL DATA BLOCKS — use these for rich responses:
- Stats: \`\`\`mvai\n{"type":"stats","items":[{"label":"Users","value":"2.4M","change":"+18%","trend":"up"}]}\n\`\`\`
- Chart: \`\`\`mvai\n{"type":"chart","chart":"bar","data":[{"x":"Jan","y":100}],"xKey":"x","yKey":"y","title":"Monthly Users"}\n\`\`\`
- Sources: \`\`\`mvai\n{"type":"links","items":[{"title":"Title","url":"https://example.com","description":"Brief desc"}]}\n\`\`\`
Use these for: analytics, comparisons, research results, news digests, ranked lists`;

  if (modelId === "code") {
    sys += `\n\nMODE: Code Expert — You are laser-focused on writing excellent code. Think about architecture, edge cases, and best practices. Always use the most modern, idiomatic approach for the language.`;
  } else if (modelId === "voice") {
    sys += `\n\nMODE: Voice — Reply in short, naturally spoken sentences. Avoid markdown, lists, code blocks. Keep replies under 60 words unless asked for detail. Sound conversational.`;
  } else if (modelId === "search") {
    sys += `\n\nMODE: Search — Always use web_search for any factual question. Present search results in a clear, structured format with sources. Be upfront about what you found vs. what you know from training.`;
  } else if (modelId === "vision") {
    sys += `\n\nMODE: Vision — When analyzing images: describe precisely, extract all text, identify UI components and patterns, infer user intent, suggest improvements. Be concrete and technical.`;
  }

  if (settings) {
    const s = settings as any;
    if (s.persona) {
      const personaMap: Record<string, string> = {
        friend: "Casual, warm tone like a close friend. Use informal language and be supportive.",
        professional: "Formal, precise, professional. No slang. Structure everything clearly.",
        funny: "Witty and humorous. Use clever jokes, be playful, keep the mood light.",
        mentor: "Wise and instructive. Teach with patience, use analogies, encourage growth.",
        poet: "Poetic and metaphorical. Use beautiful language, vivid imagery, emotional resonance.",
      };
      if (personaMap[s.persona]) sys += `\n\nPERSONA MODE: ${personaMap[s.persona]}`;
    }
    if (s.language && s.language !== "auto") {
      sys += `\n\nLANGUAGE: Always respond in ${s.language}.`;
    }
    if (s.responseLength) {
      const lenMap: Record<string, string> = {
        short: "Be BRIEF — under 3 sentences for simple questions, under 10 lines for complex ones.",
        balanced: "Balanced length — fully answer but no padding.",
        long: "Comprehensive — detailed explanations with examples and thorough coverage.",
      };
      if (lenMap[s.responseLength]) sys += `\n\nLENGTH STYLE: ${lenMap[s.responseLength]}`;
    }
    if (s.permissions) {
      const p = s.permissions as Record<string, boolean>;
      const enabled = Object.entries(p).filter(([, v]) => v).map(([k]) => k);
      if (enabled.length > 0) {
        sys += `\n\nUSER GRANTED PERMISSIONS: ${enabled.join(", ")} — you have explicit permission to use tools for these services without asking.`;
      }
    }
  }

  if (memories && memories.length > 0) {
    const memStr = memories.slice(0, 20).map((m: any) => `${m.key}: ${m.value}`).join("; ");
    sys += `\n\nKNOWN ABOUT USER: ${memStr}`;
  }

  // Custom instructions — injected from user settings page
  if (settings) {
    const s = settings as any;
    if (s.customInstructions && typeof s.customInstructions === "string" && s.customInstructions.trim()) {
      sys += `\n\nCUSTOM USER INFO:\n${s.customInstructions.trim()}`;
    }
    if (s.customStyle && typeof s.customStyle === "string" && s.customStyle.trim()) {
      sys += `\n\nCUSTOM RESPONSE STYLE:\n${s.customStyle.trim()}`;
    }
    // Active skills — injected from Skills page
    if (s.skillsPrompt && typeof s.skillsPrompt === "string" && s.skillsPrompt.trim()) {
      sys += `\n${s.skillsPrompt}`;
    }
  }

  return sys;
}

// ── Calculator helper ──────────────────────────────────────────────────────
function evalCalculator(expression: string): { result: string; error?: string } {
  try {
    const safe = expression
      .replace(/[^0-9+\-*/().,%^ \tsqrtabsceilfloormax min pielog]/gi, "")
      .replace(/\^/g, "**")
      .replace(/sqrt\(/g, "Math.sqrt(")
      .replace(/abs\(/g, "Math.abs(")
      .replace(/ceil\(/g, "Math.ceil(")
      .replace(/floor\(/g, "Math.floor(")
      .replace(/max\(/g, "Math.max(")
      .replace(/min\(/g, "Math.min(")
      .replace(/log\(/g, "Math.log10(")
      .replace(/\bpi\b/gi, "Math.PI")
      .replace(/\be\b/g, "Math.E");
    const result = Function('"use strict"; return (' + safe + ')')();
    if (typeof result !== "number" || !isFinite(result)) return { result: "NaN", error: "Invalid result" };
    return { result: Number.isInteger(result) ? result.toString() : result.toFixed(8).replace(/\.?0+$/, "") };
  } catch (e: any) {
    return { result: "error", error: e.message };
  }
}

// ── Web search via DuckDuckGo Instant ─────────────────────────────────────
async function doWebSearch(query: string): Promise<string> {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1&skip_disambig=1`;
    const r = await fetch(url, { headers: { "User-Agent": "MV-AI/7.0" } });
    const data = await r.json();
    const parts: string[] = [];
    if (data.AbstractText) parts.push(`**Summary**: ${data.AbstractText}`);
    if (data.AbstractSource) parts.push(`**Source**: ${data.AbstractSource}`);
    if (data.RelatedTopics?.length > 0) {
      const topics = data.RelatedTopics
        .filter((t: any) => t.Text)
        .slice(0, 4)
        .map((t: any) => `- ${t.Text}`);
      if (topics.length) parts.push(`**Related**:\n${topics.join("\n")}`);
    }
    if (data.Answer) parts.unshift(`**Answer**: ${data.Answer}`);
    return parts.length > 0 ? parts.join("\n\n") : `No instant results for "${query}" — using knowledge base.`;
  } catch {
    return `Search unavailable — using knowledge base for "${query}".`;
  }
}

router.post("/chat", requireAuth, async (req: any, res: Response): Promise<void> => {
  const body = StreamChatBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const { messages, modelId, attachments, memories, settings } = body.data;

  if (!OPENROUTER_API_KEY) { res.status(500).json({ error: "OPENROUTER_API_KEY not configured" }); return; }

  const systemContent = buildSystemPrompt(settings, memories as any[], modelId as string);

  const apiMessages: any[] = [{ role: "system", content: systemContent }];
  for (const msg of messages as any[]) {
    if (msg.role === "user" && attachments && (attachments as string[]).length > 0) {
      const parts: any[] = [{ type: "text", text: msg.content }];
      for (const url of attachments as string[]) {
        parts.push({ type: "image_url", image_url: { url } });
      }
      apiMessages.push({ role: "user", content: parts });
    } else {
      apiMessages.push({ role: msg.role, content: msg.content });
    }
  }

  // For search mode, inject a search result if the query looks factual
  if (modelId === "search" && messages.length > 0) {
    const lastMsg = (messages as any[])[messages.length - 1];
    if (lastMsg.role === "user" && lastMsg.content.length > 5) {
      const searchResult = await doWebSearch(lastMsg.content.slice(0, 200));
      apiMessages.push({ role: "system", content: `SEARCH RESULTS FOR THIS QUERY:\n${searchResult}` });
    }
  }

  // Try primary model first, fallback if needed
  let upstream: Response;
  try {
    upstream = await routeModel(modelId as string, apiMessages, modelId === "code" ? 8192 : modelId === "ideal" ? 6144 : 4096, TOOLS);
  } catch {
    upstream = {} as Response;
  }

  if (!upstream?.ok) {
    if (upstream?.status === 429) { res.status(429).json({ error: "Rate limit" }); return; }
    const err = upstream?.statusText || "Model unavailable";
    res.status(502).json({ error: `Upstream: ${err}` }); return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const providerLabel = getProviderLabel(MODEL_MAP[modelId as string] || LAGUNA);
  res.write(`event: provider\ndata: ${JSON.stringify({ id: "openrouter", label: providerLabel })}\n\n`);

  if (!upstream.body) { res.write("data: [DONE]\n\n"); res.end(); return; }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  const toolAcc: Record<number, { name: string; args: string }> = {};
  let streamingDone = false;

  while (!streamingDone) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.trim() || line.startsWith(":")) continue;
      if (!line.startsWith("data: ")) { res.write(line + "\n"); continue; }
      const json = line.slice(6).trim();
      if (json === "[DONE]") { streamingDone = true; break; }
      try {
        const parsed = JSON.parse(json);
        const delta = parsed.choices?.[0]?.delta;
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const i = tc.index ?? 0;
            if (!toolAcc[i]) toolAcc[i] = { name: "", args: "" };
            if (tc.function?.name) toolAcc[i].name += tc.function.name;
            if (tc.function?.arguments) toolAcc[i].args += tc.function.arguments;
          }
        }
        res.write(`data: ${json}\n\n`);
      } catch { res.write(line + "\n"); }
    }
  }

  // Process tool calls after streaming
  const toolCalls = Object.values(toolAcc).filter((t) => t.name);
  for (const tc of toolCalls) {
    let args: any = {};
    try { args = JSON.parse(tc.args || "{}"); } catch {}

    if (tc.name === "generate_image") {
      try {
        const prompt = args.prompt || "beautiful image";
        const style = args.style ? `, ${args.style} style` : "";
        const aspect = args.aspect === "portrait" ? "768&height=1024" : args.aspect === "square" ? "1024&height=1024" : "1024&height=768";
        const encodedPrompt = encodeURIComponent(`${prompt}${style}`);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${aspect}&nologo=true&enhance=true&seed=${Date.now()}`;
        const imageMarkdown = `\n\n![${prompt}](${imageUrl})\n`;
        res.write(`event: image_result\ndata: ${JSON.stringify({ markdown: imageMarkdown, url: imageUrl, prompt })}\n\n`);
      } catch {}
    } else if (tc.name === "calculator") {
      const { result, error } = evalCalculator(args.expression || "0");
      const ctx = args.context ? ` (${args.context})` : "";
      const calcMarkdown = `\n\n**🔢 Calculator${ctx}:**\n\`\`\`\n${args.expression} = ${result}${error ? " ⚠️ " + error : ""}\n\`\`\`\n`;
      res.write(`event: tool_result\ndata: ${JSON.stringify({ tool: "calculator", markdown: calcMarkdown })}\n\n`);
    } else if (tc.name === "web_search") {
      const searchResult = await doWebSearch(args.query || "");
      const searchMarkdown = `\n\n**🔍 Search: "${args.query}"**\n\n${searchResult}\n`;
      res.write(`event: tool_result\ndata: ${JSON.stringify({ tool: "web_search", markdown: searchMarkdown })}\n\n`);
    } else if (tc.name === "create_reminder") {
      const reminderData = { title: args.title, minutes: args.minutes, message: args.message || "" };
      const reminderMarkdown = `\n\n**⏰ Reminder set:** "${args.title}" in ${args.minutes} minute${args.minutes !== 1 ? "s" : ""}\n`;
      res.write(`event: tool_result\ndata: ${JSON.stringify({ tool: "create_reminder", markdown: reminderMarkdown, data: reminderData })}\n\n`);
    } else if (tc.name === "copy_to_clipboard") {
      const label = args.label || "Content";
      const clipMarkdown = `\n\n**📋 ${label} copied to clipboard**\n`;
      res.write(`event: tool_result\ndata: ${JSON.stringify({ tool: "copy_to_clipboard", markdown: clipMarkdown, text: args.text })}\n\n`);
    }
  }

  res.write("data: [DONE]\n\n");
  res.end();
} catch (e: any) {
  if (!res.headersSent) res.status(500).json({ error: e.message });
  else res.end();
}
});

// ── Multi-agent endpoint (replaces Supabase Edge Function) ─────────────────
router.post("/multi-agent", requireAuth, async (req: any, res: Response): Promise<void> => {
  if (!OPENROUTER_API_KEY) { res.status(500).json({ error: "No API key" }); return; }

  const { prompt, history = [] } = req.body || {};
  if (!prompt) { res.status(400).json({ error: "prompt required" }); return; }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const AGENTS = [
    { id: "researcher", name: "Researcher", emoji: "🔬", role: "Gathers context, facts, and relevant information" },
    { id: "strategist", name: "Strategist", emoji: "♟️", role: "Plans the optimal approach and structure" },
    { id: "creator", name: "Creator", emoji: "✨", role: "Drafts the core answer with creativity" },
    { id: "refiner", name: "Refiner", emoji: "💎", role: "Polishes, tightens, and perfects the output" },
  ];

  const send = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  send("start", { agents: AGENTS });

  const agentOutputs: Record<string, string> = {};

  const agentModels = [LAGUNA, GPT_OSS];
  
  for (const agent of AGENTS) {
    send("agent_start", { id: agent.id });
    const prevContext = Object.entries(agentOutputs).map(([id, out]) => {
      const ag = AGENTS.find((a) => a.id === id);
      return ag ? `${ag.emoji} ${ag.name}: ${out}` : out;
    }).join("\n\n");

    const agentPrompt = `You are the ${agent.name} agent. Role: ${agent.role}.
${prevContext ? `Previous agents said:\n${prevContext}\n\nBuild on this.` : "You go first."}
User's question: "${prompt}"
Respond briefly (2-4 sentences) from your agent's perspective.`;

    try {
      const r = await fetch(`${OR_BASE}/chat/completions`, {
        method: "POST",
        headers: OR_HEADERS,
        body: JSON.stringify({
          model: agentModels[0],
          messages: [
            { role: "system", content: agentPrompt },
            ...history.slice(-4),
          ],
          max_tokens: 256,
          stream: false,
        }),
      });
      const j = await r.json();
      const content = j?.choices?.[0]?.message?.content?.trim() || "...";
      agentOutputs[agent.id] = content;
      send("agent_message", { id: agent.id, content });
    } catch {
      send("agent_message", { id: agent.id, content: "Processing..." });
    }
  }

  // Final synthesis with auto model switch
  const synthesis = `You are Ozing, synthesizing the work of 4 AI agents into a final, excellent answer.
Agent outputs:
${AGENTS.map((a) => `${a.emoji} ${a.name}: ${agentOutputs[a.id] || ""}`).join("\n\n")}

User's original question: "${prompt}"
Write the perfect, comprehensive final answer. Use markdown. Be brilliant.`;

  try {
    const upstream = await routeModel("humanoid", [{ role: "system", content: synthesis }], 2048);

    if (!upstream.ok || !upstream.body) { send("done", {}); res.end(); return; }
    const reader = upstream.body.getReader();
    const dec = new TextDecoder();
    let fbuf = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      fbuf += dec.decode(value, { stream: true });
      let sep;
      while ((sep = fbuf.indexOf("\n")) !== -1) {
        let line = fbuf.slice(0, sep);
        fbuf = fbuf.slice(sep + 1);
        if (!line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (json === "[DONE]") break;
        try {
          const p = JSON.parse(json);
          const delta = p.choices?.[0]?.delta?.content;
          if (delta) send("final_delta", { content: delta });
        } catch {}
      }
    }
  } catch {}

  send("done", {});
  res.end();
});

router.post("/chat/title", requireAuth, async (req: any, res: Response): Promise<void> => {
  const body = GenerateTitleBody.safeParse(req.body);
  if (!body.success) { res.json({ title: "Yangi chat" }); return; }
  if (!OPENROUTER_API_KEY) { res.json({ title: "Yangi chat" }); return; }
  try {
    const r = await fetch(`${OR_BASE}/chat/completions`, {
      method: "POST", headers: OR_HEADERS,
      body: JSON.stringify({
        model: LAGUNA,
        messages: [
          { role: "system", content: "Summarize the user message in 2-4 words as a short chat title. No quotes, no punctuation at end. Output ONLY the title, nothing else." },
          { role: "user", content: body.data.message.slice(0, 400) },
        ],
        max_tokens: 16,
      }),
    });
    const j = await r.json();
    const title = j?.choices?.[0]?.message?.content?.trim() || "Yangi chat";
    res.json({ title: title.slice(0, 60) });
  } catch { res.json({ title: "Yangi chat" }); }
});

router.post("/chat/image", requireAuth, async (req: any, res: Response): Promise<void> => {
  const body = GenerateImageBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  try {
    const prompt = body.data.prompt;
    const seed = Math.floor(Math.random() * 999999);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=768&nologo=true&enhance=true&seed=${seed}`;
    const check = await fetch(url, { method: "HEAD" });
    if (!check.ok) { res.status(502).json({ error: "Image generation failed" }); return; }
    res.json({ url, revisedPrompt: prompt });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/chat/logo", requireAuth, async (req: any, res: Response): Promise<void> => {
  const body = GenerateLogoBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  if (!OPENROUTER_API_KEY) { res.status(500).json({ error: "No API key" }); return; }
  try {
    const r = await fetch(`${OR_BASE}/chat/completions`, {
      method: "POST", headers: OR_HEADERS,
      body: JSON.stringify({
        model: LAGUNA,
        messages: [
          { role: "system", content: "You are a professional SVG logo designer. Output ONLY a valid SVG element (starting with <svg and ending with </svg>) with no markdown, no explanation. Use viewBox=\"0 0 200 200\". Make it clean, minimal, and geometric." },
          { role: "user", content: body.data.prompt },
        ],
        max_tokens: 1024,
      }),
    });
    const j = await r.json();
    const raw = j?.choices?.[0]?.message?.content?.trim() ?? "";
    const svgMatch = raw.match(/<svg[\s\S]*<\/svg>/i);
    res.json({ svg: svgMatch ? svgMatch[0] : raw });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
