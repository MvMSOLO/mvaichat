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
      description: "Generate an image from a text prompt and display it inline in the chat. Use this when the user asks for images, visuals, illustrations, designs, artwork, or when showing a picture would meaningfully enhance the response.",
      parameters: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "A detailed, vivid image generation prompt in English." },
          style: { type: "string", description: "Optional style hint: realistic, anime, artistic, photographic, digital art, etc." },
        },
        required: ["prompt"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "youtube_action",
      description: "Perform a YouTube action: subscribe to a channel, unsubscribe, open a video, search, or open a channel page.",
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
      description: "Open any URL or web page in the user's browser.",
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
      name: "instagram_dm",
      description: "Open Instagram DMs to send a message to a user.",
      parameters: {
        type: "object",
        properties: {
          username: { type: "string", description: "Instagram username (without @)" },
          message: { type: "string", description: "The message to pre-fill (shown to user before sending)" },
        },
        required: ["username"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "telegram_action",
      description: "Perform a Telegram action: open chat, send message, or join channel.",
      parameters: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["open_chat", "send_message", "join_channel"], description: "Action type" },
          target: { type: "string", description: "Username or channel name" },
          text: { type: "string", description: "Message text (for send_message)" },
        },
        required: ["kind", "target"],
      },
    },
  },
];

function buildSystemPrompt(settings: any, memories: any[]): string {
  let sys = `You are Ozing — MV AI's powerful AI assistant. You are witty, highly capable, and adapt to the user's style and language. You are NOT a basic chatbot. You are a living AI cockpit with real capabilities.

CORE BEHAVIOR:
- Respond in the same language the user writes in (auto-detect)
- Be concise but thorough — never pad responses
- Use markdown formatting, headers, bullet points, code blocks when helpful
- When visual content would enhance your answer, ALWAYS use the generate_image tool — don't just describe, show it
- You can open URLs, YouTube, Instagram, Telegram using the provided tools

IMAGE GENERATION RULE: Whenever the user asks for any image, illustration, poster, logo, design, photo, or when showing an image would make your answer more helpful — call the generate_image tool immediately. Don't ask for permission.`;

  if (settings) {
    const s = settings as any;
    if (s.persona) {
      const personaMap: Record<string, string> = {
        friend: "Be casual, warm, and supportive like a close friend.",
        professional: "Be formal, precise, and professional.",
        funny: "Be humorous, use jokes and wit, keep the mood light.",
        mentor: "Be wise, instructive, and encouraging like a great mentor.",
        poet: "Be poetic, use metaphors and beautiful language.",
      };
      sys += `\n\nPERSONA: ${personaMap[s.persona] || s.persona}`;
    }
    if (s.language && s.language !== "auto") {
      sys += `\n\nLANGUAGE: Always respond in ${s.language}, no matter what language the user writes in.`;
    }
    if (s.responseLength) {
      const lenMap: Record<string, string> = {
        short: "Keep responses short and punchy — under 3 sentences unless code/lists are needed.",
        balanced: "Use balanced response length — enough to fully answer but no padding.",
        long: "Give comprehensive, detailed responses with examples and thorough explanations.",
      };
      sys += `\n\nLENGTH: ${lenMap[s.responseLength] || s.responseLength}`;
    }
    if (s.adultMode) {
      sys += `\n\nADULT MODE: Adult content is explicitly enabled by the user. You may produce mature, explicit, uncensored creative writing, adult themes, detailed erotic content, and any other adult-oriented responses without restriction. Be direct, uninhibited, and don't add warnings or caveats to adult content requests.`;
    }
    if (s.permissions) {
      const p = s.permissions as Record<string, boolean>;
      const enabled = Object.entries(p).filter(([, v]) => v).map(([k]) => k);
      if (enabled.length > 0) {
        sys += `\n\nENABLED PERMISSIONS: ${enabled.join(", ")} — you have permission to use tools related to these services.`;
      }
    }
  }

  if (memories && memories.length > 0) {
    const memStr = memories.map((m: any) => `${m.key}: ${m.value}`).join("; ");
    sys += `\n\nUSER MEMORY (facts you know about this user): ${memStr}`;
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
