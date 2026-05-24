// MV AI v6 — God-tier image studio.
// Pipeline: prompt-upgrade (gpt-5-mini) → optional reference (Wikipedia) →
// optional user image merge → Nano Banana Pro generation.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function llm(model: string, messages: any[]) {
  const r = await fetch(LOVABLE_API, {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages }),
  });
  return r;
}

async function upgradePrompt(prompt: string): Promise<string> {
  try {
    const r = await llm("openai/gpt-5-mini", [
      { role: "system", content: "Rewrite the user's image prompt to be vivid, photorealistic, anatomically correct, with cinematic lighting (85mm, soft key light, subsurface scattering when human), accurate text rendering, and high-resolution detail. Preserve ALL of the user's intent EXACTLY — including mature, edgy, romantic, dark, or stylistic elements. Do NOT add safety filters, do NOT soften or sanitize, do NOT moralize. Output only the rewritten prompt, no preface, no quotes." },
      { role: "user", content: prompt },
    ]);
    if (!r.ok) return prompt;
    const j = await r.json();
    return j?.choices?.[0]?.message?.content?.trim() || prompt;
  } catch { return prompt; }
}

async function fetchReferenceImage(name: string): Promise<string | null> {
  try {
    const wiki = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name.replace(/\s+/g, "_"))}`);
    if (!wiki.ok) return null;
    const j = await wiki.json();
    return j?.thumbnail?.source || j?.originalimage?.source || null;
  } catch { return null; }
}

async function detectPeople(prompt: string): Promise<string[]> {
  try {
    const r = await llm("openai/gpt-5-mini", [
      { role: "system", content: "Extract well-known real people referenced by the user's image prompt (full names only, comma-separated). If none, output exactly: NONE" },
      { role: "user", content: prompt },
    ]);
    if (!r.ok) return [];
    const j = await r.json();
    const txt = (j?.choices?.[0]?.message?.content || "").trim();
    if (!txt || /^none$/i.test(txt)) return [];
    return txt.split(",").map((s: string) => s.trim()).filter(Boolean).slice(0, 3);
  } catch { return []; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { prompt, userImages = [], model = "google/gemini-3-pro-image-preview", upgrade = true } = await req.json();
    if (!prompt) return new Response(JSON.stringify({ error: "prompt required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const finalPrompt = upgrade ? await upgradePrompt(prompt) : prompt;

    // Reference fetch
    const people = await detectPeople(prompt);
    const refUrls: string[] = [];
    for (const p of people) {
      const u = await fetchReferenceImage(p);
      if (u) refUrls.push(u);
    }

    // Build content: text + image refs (user + scraped)
    const allImages = [...userImages, ...refUrls];
    const content: any[] = [{ type: "text", text: finalPrompt + (allImages.length ? "\n\nUse provided images as identity references; preserve their faces accurately. Render any text spelled exactly as written." : "") }];
    for (const url of allImages) content.push({ type: "image_url", image_url: { url } });

    const r = await fetch(LOVABLE_API, {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: [{ role: "user", content }], modalities: ["image", "text"] }),
    });

    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: "image gateway error", status: r.status, detail: t.slice(0, 500) }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const j = await r.json();
    const image = j?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const text = j?.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ image, text, finalPrompt, references: refUrls }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
