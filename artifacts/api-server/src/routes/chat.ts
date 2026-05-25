import { Router, type IRouter, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";
import { StreamChatBody, GenerateTitleBody, GenerateImageBody, GenerateLogoBody } from "@workspace/api-zod";

const router: IRouter = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  next();
};

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OR_BASE = "https://openrouter.ai/api/v1";
const OR_HEADERS = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${OPENROUTER_API_KEY}`,
  "HTTP-Referer": "https://mv-ai.replit.app",
  "X-Title": "MV AI",
};

const NEMOTRON = "nvidia/nemotron-3-super-120b-a12b:free";

const MODEL_MAP: Record<string, string> = {
  humanoid: NEMOTRON,
  ideal: NEMOTRON,
  code: "qwen/qwen-2.5-coder-32b-instruct:free",
  vision: NEMOTRON,
  search: "perplexity/llama-3.1-sonar-large-128k-online",
  voice: NEMOTRON,
  agents: NEMOTRON,
  social: NEMOTRON,
};

const TOOLS = [
  {
    type: "function",
    function: {
      name: "generate_image",
      description: "Generate an image from a text prompt. ALWAYS enhance the prompt first: add artistic style, lighting, composition, mood, camera angle, color palette, and rich detail before generating. Use when user asks for any image, photo, illustration, design, poster, or visual.",
      parameters: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "Enhanced, detailed image generation prompt in English. Include: subject, art style (photorealistic/digital art/anime/oil painting), lighting (golden hour/studio/dramatic), mood, composition, color palette, camera details." },
          style: { type: "string", description: "Style hint: realistic, anime, artistic, photographic, digital art, cinematic, watercolor, etc." },
        },
        required: ["prompt"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "youtube_action",
      description: "Perform a YouTube action. Opens the native YouTube app on mobile, or YouTube website with the action. IMPORTANT: For 'subscribe', open the channel with sub_confirmation=1 parameter.",
      parameters: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["subscribe", "unsubscribe", "open_video", "search", "open_channel"], description: "Action type. Use 'subscribe' when user wants to subscribe to a channel." },
          target: { type: "string", description: "Channel name (e.g. 'MrBeast' or '@MrBeast'), video URL, or search query" },
        },
        required: ["kind", "target"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "open_url",
      description: "Open any URL or web page.",
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
      description: "Open a native app like YouTube, Instagram, Telegram, Twitter, Spotify, TikTok, Maps. Tries to open the real native app first.",
      parameters: {
        type: "object",
        properties: {
          app: { type: "string", description: "App name: youtube, instagram, telegram, twitter, x, github, maps, spotify, tiktok" },
          query: { type: "string", description: "Optional: channel name, username, search query, or location" },
        },
        required: ["app"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "instagram_dm",
      description: "Open Instagram to DM a user. The message is copied to clipboard for easy paste.",
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
          text: { type: "string", description: "Message text for send_message (will be copied to clipboard)" },
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
        properties: {
          number: { type: "string", description: "Phone number to call" },
        },
        required: ["number"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_sms",
      description: "Send an SMS to a phone number. Only use when user explicitly asks to send a text/SMS.",
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
];

function buildSystemPrompt(settings: any, memories: any[]): string {
  let sys = `You are Ozing — MV AI's powerful AI assistant. You are witty, highly capable, and adapt to the user's style and language. You are NOT a basic chatbot. You are a living AI cockpit with real capabilities.

CORE BEHAVIOR:
- Respond in the same language the user writes in (Uzbek, Russian, English — auto-detect)
- Be concise but thorough — never pad responses with filler phrases
- Use rich markdown: headers (##), bullet points, **bold**, tables, code blocks with language tags
- Think step by step for complex questions; present structured, scannable answers

IMAGE GENERATION — CRITICAL RULES:
1. When user asks for any image, photo, illustration, design, poster, logo, artwork — ALWAYS call generate_image immediately
2. Before generating, ENHANCE the prompt yourself: add art style, lighting, composition, mood, camera angle, color palette, texture details
3. Example: user says "make a sunset photo" → enhance to "Golden hour coastal sunset, dramatic orange and purple sky reflecting on calm ocean water, silhouette of palm trees, wide-angle cinematic shot, photorealistic, Nikon D850, rich warm tones"
4. Never ask permission — just generate

CODE GENERATION — CRITICAL RULES:
1. Think through the architecture first (silently)
2. Output complete, runnable code — never truncate or use placeholder comments
3. Always use the correct language tag in code fences: \`\`\`jsx, \`\`\`python, etc.
4. For React components, include all imports, use modern hooks, export default

VISUAL BLOCKS (use these for data-rich responses):
When your response includes statistics, comparisons, data, or sources, use special blocks:
- Stats: \`\`\`mvai\n{"type":"stats","items":[{"label":"Revenue","value":"$2.4M","change":"+18%","trend":"up"}]}\n\`\`\`
- Chart: \`\`\`mvai\n{"type":"chart","chart":"bar","data":[{"x":"Jan","y":100},{"x":"Feb","y":140}],"xKey":"x","yKey":"y","title":"Monthly Users"}\n\`\`\`
- Sources: \`\`\`mvai\n{"type":"links","items":[{"title":"Page Title","url":"https://example.com","description":"Brief description"}]}\n\`\`\`
Use these for: analytics summaries, comparisons, research results, news digests

MCP TOOLS — you can open real apps:
- youtube_action: subscribe, search, open channel/video in native YouTube app
- open_app: open any app (youtube, instagram, telegram, twitter, spotify, tiktok, maps)
- instagram_dm: open Instagram DM with pre-filled message
- telegram_action: open Telegram chat/channel
- call_contact: make phone calls
- send_sms: send SMS messages
When user says "open YouTube and search X" — use youtube_action with kind=search
When user says "subscribe to MrBeast" — use youtube_action with kind=subscribe, target=MrBeast`;

  if (settings) {
    const s = settings as any;
    if (s.persona) {
      const personaMap: Record<string, string> = {
        friend: "Be casual, warm, and supportive like a close friend. Use informal language.",
        professional: "Be formal, precise, and professional. No slang.",
        funny: "Be humorous, use jokes and wit, keep the mood light and fun.",
        mentor: "Be wise, instructive, and encouraging like a great mentor.",
        poet: "Be poetic, use metaphors and beautiful language.",
      };
      sys += `\n\nPERSONA: ${personaMap[s.persona] || s.persona}`;
    }
    if (s.language && s.language !== "auto") {
      sys += `\n\nLANGUAGE: Always respond in ${s.language}, regardless of what language the user writes in.`;
    }
    if (s.responseLength) {
      const lenMap: Record<string, string> = {
        short: "Keep responses short and punchy — under 3 sentences unless code or lists are needed.",
        balanced: "Use balanced response length — enough to fully answer but no padding.",
        long: "Give comprehensive, detailed responses with examples and thorough explanations.",
      };
      sys += `\n\nLENGTH: ${lenMap[s.responseLength] || s.responseLength}`;
    }
    if (s.permissions) {
      const p = s.permissions as Record<string, boolean>;
      const enabled = Object.entries(p).filter(([, v]) => v).map(([k]) => k);
      if (enabled.length > 0) {
        sys += `\n\nACTIVE PERMISSIONS: ${enabled.join(", ")} — you have explicit permission to use tools for these services.`;
      }
    }
  }

  if (memories && memories.length > 0) {
    const memStr = memories.map((m: any) => `${m.key}: ${m.value}`).join("; ");
    sys += `\n\nUSER MEMORY: ${memStr}`;
  }

  return sys;
}

router.post("/chat", requireAuth, async (req: any, res: Response): Promise<void> => {
  const body = StreamChatBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const { messages, modelId, attachments, memories, settings } = body.data;

  if (!OPENROUTER_API_KEY) {
    res.status(500).json({ error: "OPENROUTER_API_KEY not configured" });
    return;
  }

  const model = MODEL_MAP[modelId as string] ?? NEMOTRON;
  const systemContent = buildSystemPrompt(settings, memories as any[]);

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

  try {
    const upstream = await fetch(`${OR_BASE}/chat/completions`, {
      method: "POST",
      headers: OR_HEADERS,
      body: JSON.stringify({
        model,
        messages: apiMessages,
        stream: true,
        max_tokens: 4096,
        tools: TOOLS,
        tool_choice: "auto",
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.text();
      if (upstream.status === 429) { res.status(429).json({ error: "Rate limit" }); return; }
      res.status(502).json({ error: `Upstream: ${err.slice(0, 300)}` });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    res.write(`event: provider\ndata: ${JSON.stringify({ id: "openrouter", label: "OpenRouter · Nemotron" })}\n\n`);

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
        } catch {
          res.write(line + "\n");
        }
      }
    }

    // After streaming, handle generate_image server-side and inject result
    const toolCalls = Object.values(toolAcc).filter((t) => t.name);
    for (const tc of toolCalls) {
      if (tc.name === "generate_image") {
        try {
          let args: any = {};
          try { args = JSON.parse(tc.args); } catch {}
          const prompt = args.prompt || "beautiful image";
          const style = args.style ? `, ${args.style} style` : "";
          const encodedPrompt = encodeURIComponent(`${prompt}${style}`);
          const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&nologo=true&enhance=true&seed=${Date.now()}`;
          const imageMarkdown = `\n\n![${prompt}](${imageUrl})\n`;
          res.write(`event: image_result\ndata: ${JSON.stringify({ markdown: imageMarkdown, url: imageUrl, prompt })}\n\n`);
        } catch {}
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (e: any) {
    if (!res.headersSent) res.status(500).json({ error: e.message });
    else res.end();
  }
});

router.post("/chat/title", requireAuth, async (req: any, res: Response): Promise<void> => {
  const body = GenerateTitleBody.safeParse(req.body);
  if (!body.success) { res.json({ title: "New chat" }); return; }
  if (!OPENROUTER_API_KEY) { res.json({ title: "New chat" }); return; }

  try {
    const r = await fetch(`${OR_BASE}/chat/completions`, {
      method: "POST",
      headers: OR_HEADERS,
      body: JSON.stringify({
        model: NEMOTRON,
        messages: [
          { role: "system", content: "Summarize the user message in 2-4 words as a short chat title. No quotes, no punctuation at end. Output only the title." },
          { role: "user", content: body.data.message.slice(0, 400) },
        ],
        max_tokens: 16,
      }),
    });
    const j = await r.json();
    const title = j?.choices?.[0]?.message?.content?.trim() || "New chat";
    res.json({ title: title.slice(0, 60) });
  } catch {
    res.json({ title: "New chat" });
  }
});

router.post("/chat/image", requireAuth, async (req: any, res: Response): Promise<void> => {
  const body = GenerateImageBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  try {
    const prompt = body.data.prompt;
    const encodedPrompt = encodeURIComponent(prompt);
    const seed = Math.floor(Math.random() * 999999);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&nologo=true&enhance=true&seed=${seed}`;

    const check = await fetch(url, { method: "HEAD" });
    if (!check.ok) {
      res.status(502).json({ error: "Image generation failed" });
      return;
    }
    res.json({ url, revisedPrompt: prompt });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/chat/logo", requireAuth, async (req: any, res: Response): Promise<void> => {
  const body = GenerateLogoBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  if (!OPENROUTER_API_KEY) { res.status(500).json({ error: "No API key" }); return; }

  const sysPrompt = `You are a professional SVG logo designer. Given a brand description, output ONLY a valid SVG element (starting with <svg and ending with </svg>) with no markdown, no explanation, no code fences. Use viewBox="0 0 200 200". Make it clean, minimal, and geometric.`;

  try {
    const r = await fetch(`${OR_BASE}/chat/completions`, {
      method: "POST",
      headers: OR_HEADERS,
      body: JSON.stringify({
        model: NEMOTRON,
        messages: [
          { role: "system", content: sysPrompt },
          { role: "user", content: body.data.prompt },
        ],
        max_tokens: 1024,
      }),
    });
    const j = await r.json();
    const raw = j?.choices?.[0]?.message?.content?.trim() ?? "";
    const svgMatch = raw.match(/<svg[\s\S]*<\/svg>/i);
    res.json({ svg: svgMatch ? svgMatch[0] : raw });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
