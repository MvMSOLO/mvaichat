// Generates a short title for a new conversation from the first user message.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { message } = await req.json();
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("LOVABLE_API_KEY missing");

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "Return a concise 3-6 word title for the user's message. No quotes, no punctuation at end." },
          { role: "user", content: String(message).slice(0, 500) },
        ],
      }),
    });
    if (!r.ok) return new Response(JSON.stringify({ title: "New chat" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const data = await r.json();
    const title = (data.choices?.[0]?.message?.content || "New chat").trim().replace(/^["']|["']$/g, "").slice(0, 60);
    return new Response(JSON.stringify({ title }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ title: "New chat" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
