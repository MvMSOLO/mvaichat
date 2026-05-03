// MV AI v6 — PDF generation from AI text.
// Uses pdf-lib (Deno-friendly) to produce a clean, paginated A4 doc and
// returns a base64 data URL the chat can render as a download link.
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function generateContent(topic: string): Promise<{ title: string; body: string }> {
  const r = await fetch(LOVABLE_API, {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: "Write a clean, well-structured document. Output JSON: {\"title\":\"...\",\"body\":\"...\"} where body is plain text with double-newline paragraphs. No markdown." },
        { role: "user", content: topic },
      ],
    }),
  });
  const j = await r.json();
  let txt = j?.choices?.[0]?.message?.content || "";
  txt = txt.replace(/```json|```/g, "").trim();
  try { return JSON.parse(txt); } catch { return { title: topic.slice(0, 80), body: txt }; }
}

function wrap(text: string, font: any, size: number, maxW: number): string[] {
  const out: string[] = [];
  for (const para of text.split(/\n\n+/)) {
    const words = para.split(/\s+/);
    let line = "";
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (font.widthOfTextAtSize(test, size) > maxW) { if (line) out.push(line); line = w; } else line = test;
    }
    if (line) out.push(line);
    out.push("");
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { topic, content } = await req.json();
    const { title, body } = content ? { title: topic || "Document", body: content } : await generateContent(topic);

    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const W = 595, H = 842, M = 56;

    let page = pdf.addPage([W, H]);
    page.drawText(title, { x: M, y: H - M - 24, size: 22, font: bold, color: rgb(0.05, 0.05, 0.1) });
    let y = H - M - 60;
    const lines = wrap(body, font, 11, W - M * 2);
    for (const ln of lines) {
      if (y < M) { page = pdf.addPage([W, H]); y = H - M; }
      if (ln) page.drawText(ln, { x: M, y, size: 11, font, color: rgb(0.1, 0.1, 0.15) });
      y -= 16;
    }

    const bytes = await pdf.save();
    // base64 encode
    let bin = ""; for (const b of bytes) bin += String.fromCharCode(b);
    const b64 = btoa(bin);
    return new Response(JSON.stringify({ title, dataUrl: `data:application/pdf;base64,${b64}` }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
