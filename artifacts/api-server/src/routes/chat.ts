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
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const MODEL_MAP: Record<string, string> = {
  humanoid: "anthropic/claude-3.5-sonnet",
  ideal: "openai/gpt-4o",
  code: "anthropic/claude-3.5-sonnet",
  vision: "openai/gpt-4o",
  search: "perplexity/llama-3.1-sonar-large-128k-online",
  voice: "openai/gpt-4o-mini",
  agents: "anthropic/claude-3.5-sonnet",
  social: "openai/gpt-4o-mini",
};

// Chat streaming
router.post("/chat", requireAuth, async (req: any, res: Response): Promise<void> => {
  const body = StreamChatBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const { messages, modelId, attachments, memories, settings } = body.data;
  const model = MODEL_MAP[modelId as string] ?? "openai/gpt-4o-mini";

  let systemContent = "You are Ozing, MV AI's helpful AI assistant. You are friendly, clever, and adapt to the user's style.";
  if (settings) {
    const s = settings as any;
    if (s.persona) systemContent += ` Persona: ${s.persona}.`;
    if (s.language && s.language !== "auto") systemContent += ` Always respond in ${s.language}.`;
    if (s.response_style) systemContent += ` Style: ${s.response_style}.`;
    if (s.response_length) systemContent += ` Length: ${s.response_length}.`;
  }
  if (memories && (memories as any[]).length > 0) {
    const memStr = (memories as any[]).map((m: any) => `${m.key}: ${m.value}`).join("; ");
    systemContent += ` Known facts about user: ${memStr}.`;
  }

  const apiMessages: any[] = [{ role: "system", content: systemContent }];
  for (const msg of messages as any[]) {
    if (attachments && msg.role === "user") {
      const parts: any[] = [{ type: "text", text: msg.content }];
      if (attachments && (attachments as string[]).length > 0) {
        for (const url of attachments as string[]) {
          parts.push({ type: "image_url", image_url: { url } });
        }
      }
      apiMessages.push({ role: "user", content: parts });
    } else {
      apiMessages.push({ role: msg.role, content: msg.content });
    }
  }

  try {
    const apiKey = OPENROUTER_API_KEY || OPENAI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "No AI API key configured" });
      return;
    }

    const baseUrl = OPENROUTER_API_KEY
      ? "https://openrouter.ai/api/v1"
      : "https://api.openai.com/v1";
    const apiModel = OPENROUTER_API_KEY ? model : "gpt-4o-mini";

    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(OPENROUTER_API_KEY ? { "HTTP-Referer": "https://mv-ai.replit.app", "X-Title": "MV AI" } : {}),
      },
      body: JSON.stringify({ model: apiModel, messages: apiMessages, stream: true, max_tokens: 2048 }),
    });

    if (!upstream.ok) {
      const err = await upstream.text();
      if (upstream.status === 429) { res.status(429).json({ error: "Rate limit" }); return; }
      res.status(502).json({ error: `Upstream error: ${err.slice(0, 200)}` });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Send provider info
    res.write(`event: provider\ndata: ${JSON.stringify({ id: OPENROUTER_API_KEY ? "openrouter" : "openai", label: OPENROUTER_API_KEY ? "OpenRouter" : "OpenAI" })}\n\n`);

    if (!upstream.body) { res.write("data: [DONE]\n\n"); res.end(); return; }

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        res.write(chunk);
      }
    } finally {
      res.write("data: [DONE]\n\n");
      res.end();
    }
  } catch (e: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: e.message });
    } else {
      res.end();
    }
  }
});

// Generate title
router.post("/chat/title", requireAuth, async (req: any, res: Response): Promise<void> => {
  const body = GenerateTitleBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const apiKey = OPENROUTER_API_KEY || OPENAI_API_KEY;
  if (!apiKey) { res.json({ title: "New chat" }); return; }

  const baseUrl = OPENROUTER_API_KEY ? "https://openrouter.ai/api/v1" : "https://api.openai.com/v1";
  const apiModel = OPENROUTER_API_KEY ? "openai/gpt-4o-mini" : "gpt-4o-mini";

  try {
    const r = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(OPENROUTER_API_KEY ? { "HTTP-Referer": "https://mv-ai.replit.app", "X-Title": "MV AI" } : {}),
      },
      body: JSON.stringify({
        model: apiModel,
        messages: [
          { role: "system", content: "Summarize the user message in 3-5 words as a chat title. No quotes, no punctuation at end." },
          { role: "user", content: body.data.message.slice(0, 400) },
        ],
        max_tokens: 20,
      }),
    });
    const j = await r.json();
    const title = j?.choices?.[0]?.message?.content?.trim() || "New chat";
    res.json({ title });
  } catch {
    res.json({ title: "New chat" });
  }
});

// Generate image
router.post("/chat/image", requireAuth, async (req: any, res: Response): Promise<void> => {
  const body = GenerateImageBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const apiKey = OPENAI_API_KEY;
  if (!apiKey) { res.status(500).json({ error: "OpenAI API key not configured" }); return; }

  try {
    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "dall-e-3", prompt: body.data.prompt, n: 1, size: "1024x1024" }),
    });
    const j = await r.json();
    const url = j?.data?.[0]?.url;
    if (!url) { res.status(502).json({ error: "No image returned" }); return; }
    res.json({ url, revisedPrompt: j?.data?.[0]?.revised_prompt ?? body.data.prompt });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Generate logo
router.post("/chat/logo", requireAuth, async (req: any, res: Response): Promise<void> => {
  const body = GenerateLogoBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const apiKey = OPENROUTER_API_KEY || OPENAI_API_KEY;
  if (!apiKey) { res.status(500).json({ error: "No API key configured" }); return; }

  const baseUrl = OPENROUTER_API_KEY ? "https://openrouter.ai/api/v1" : "https://api.openai.com/v1";
  const apiModel = OPENROUTER_API_KEY ? "anthropic/claude-3.5-sonnet" : "gpt-4o";

  const sysPrompt = `You are a professional SVG logo designer. Given a brand description, output ONLY a valid SVG element (starting with <svg and ending with </svg>) with no markdown, no explanation, no code fences. Use viewBox="0 0 200 200". Make it clean, minimal, and geometric. Use golden ratio proportions.`;

  try {
    const r = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(OPENROUTER_API_KEY ? { "HTTP-Referer": "https://mv-ai.replit.app", "X-Title": "MV AI" } : {}),
      },
      body: JSON.stringify({
        model: apiModel,
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
    const svg = svgMatch ? svgMatch[0] : raw;
    res.json({ svg });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
