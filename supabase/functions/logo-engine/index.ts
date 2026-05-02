// MV AI — SVG Logo engine via tool calling
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are an elite vector logo designer. Generate a clean, minimal, modern SVG logo following these rules:
- viewBox="0 0 256 256"
- Use 1-3 simple shapes (circle, path, polygon). Math-precise, golden-ratio aware.
- Use linearGradient with 2 stops from a cohesive palette (not generic blue/purple unless requested).
- No text inside the SVG (logomark only).
- No external dependencies, no scripts.
- Output ONLY the SVG via the tool.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { prompt } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");
    if (!prompt) return new Response(JSON.stringify({ error: "prompt required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Brand brief: ${prompt}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "emit_logo",
            description: "Return the final SVG logo string.",
            parameters: {
              type: "object",
              properties: {
                svg: { type: "string", description: "Complete <svg>...</svg> markup, viewBox 0 0 256 256" },
                concept: { type: "string", description: "One-sentence concept rationale" },
              },
              required: ["svg"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "emit_logo" } },
      }),
    });
    if (!r.ok) {
      const t = await r.text();
      console.error("logo gw err", r.status, t);
      return new Response(JSON.stringify({ error: "gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const j = await r.json();
    const tc = j.choices?.[0]?.message?.tool_calls?.[0];
    const args = tc ? JSON.parse(tc.function.arguments) : {};
    let svg: string = args.svg || "";
    // sanitize: strip <script>
    svg = svg.replace(/<script[\s\S]*?<\/script>/gi, "");
    if (!svg.includes("<svg")) throw new Error("model returned no svg");
    return new Response(JSON.stringify({ svg, concept: args.concept || "" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("logo-engine err", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
