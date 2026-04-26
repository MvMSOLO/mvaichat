// MV AI — Multi-agent orchestrator
// 4 agents collaborate: Researcher → Planner → Creator → Refiner
// Streams agent transcripts as SSE events, then final answer.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AGENTS = [
  {
    id: "researcher",
    name: "Researcher",
    emoji: "🔍",
    role: "Researcher",
    model: "google/gemini-2.5-flash-lite",
    system:
      "You are the Researcher agent. Given a user request, list 3-5 concise factual bullets, key sub-questions, and any context the team needs. Be terse. No fluff. Output max 90 words.",
  },
  {
    id: "planner",
    name: "Strategist",
    emoji: "🧠",
    role: "Strategist",
    model: "google/gemini-2.5-flash-lite",
    system:
      "You are the Strategist agent. Read the user request and the Researcher's notes. Produce a 3-5 step plan to deliver an excellent answer. Bullet points only. Max 80 words.",
  },
  {
    id: "creator",
    name: "Creator",
    emoji: "✨",
    role: "Creator",
    model: "google/gemini-3-flash-preview",
    system:
      "You are the Creator agent. Using the Strategist's plan, draft the actual answer for the user. Markdown. Be vivid, concrete, useful. This draft will be polished by Refiner so don't worry about perfection. Max 350 words.",
  },
  {
    id: "refiner",
    name: "Refiner",
    emoji: "💎",
    role: "Refiner",
    model: "google/gemini-3-flash-preview",
    system:
      "You are the Refiner agent. Polish the Creator's draft into the FINAL user-facing answer. Improve clarity, tighten prose, add structure (headings/bullets where helpful), keep it warm and confident. Output ONLY the final answer in markdown. No meta commentary.",
  },
];

function sse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

async function callAgent(model: string, system: string, userContent: string, apiKey: string): Promise<string> {
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
      stream: false,
    }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`agent ${model} failed: ${r.status} ${t.slice(0, 200)}`);
  }
  const j = await r.json();
  return j.choices?.[0]?.message?.content ?? "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userPrompt: string = String(body?.prompt ?? "").slice(0, 4000);
  if (!userPrompt.trim()) {
    return new Response(JSON.stringify({ error: "prompt required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const history: Array<{ role: string; content: string }> = Array.isArray(body?.history) ? body.history.slice(-6) : [];
  const historyText = history.length
    ? "\n\nRecent conversation:\n" + history.map((m) => `${m.role}: ${m.content}`).join("\n")
    : "";

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (event: string, data: unknown) => controller.enqueue(enc.encode(sse(event, data)));

      try {
        send("start", { agents: AGENTS.map((a) => ({ id: a.id, name: a.name, emoji: a.emoji, role: a.role })) });

        // Step 1: Researcher
        send("agent_start", { id: "researcher" });
        const research = await callAgent(
          AGENTS[0].model,
          AGENTS[0].system,
          `User request: """${userPrompt}"""${historyText}`,
          apiKey,
        );
        send("agent_message", { id: "researcher", content: research });

        // Step 2: Planner
        send("agent_start", { id: "planner" });
        const plan = await callAgent(
          AGENTS[1].model,
          AGENTS[1].system,
          `User request: """${userPrompt}"""\n\nResearcher notes:\n${research}`,
          apiKey,
        );
        send("agent_message", { id: "planner", content: plan });

        // Step 3: Creator
        send("agent_start", { id: "creator" });
        const draft = await callAgent(
          AGENTS[2].model,
          AGENTS[2].system,
          `User request: """${userPrompt}"""\n\nStrategist plan:\n${plan}\n\nResearcher notes:\n${research}`,
          apiKey,
        );
        send("agent_message", { id: "creator", content: draft });

        // Step 4: Refiner — stream tokens
        send("agent_start", { id: "refiner" });
        const refinerResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: AGENTS[3].model,
            messages: [
              { role: "system", content: AGENTS[3].system },
              {
                role: "user",
                content: `User request: """${userPrompt}"""\n\nCreator draft to polish:\n${draft}`,
              },
            ],
            stream: true,
          }),
        });

        if (!refinerResp.ok || !refinerResp.body) {
          throw new Error(`refiner stream failed: ${refinerResp.status}`);
        }

        let finalContent = "";
        const reader = refinerResp.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        let done = false;
        while (!done) {
          const { value, done: d } = await reader.read();
          if (d) break;
          buf += dec.decode(value, { stream: true });
          let idx;
          while ((idx = buf.indexOf("\n")) !== -1) {
            let line = buf.slice(0, idx);
            buf = buf.slice(idx + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (json === "[DONE]") {
              done = true;
              break;
            }
            try {
              const p = JSON.parse(json);
              const c = p.choices?.[0]?.delta?.content;
              if (c) {
                finalContent += c;
                send("final_delta", { content: c });
              }
            } catch {
              buf = line + "\n" + buf;
              break;
            }
          }
        }

        send("agent_message", { id: "refiner", content: finalContent || "(empty)" });
        send("done", { final: finalContent });
        controller.close();
      } catch (e) {
        console.error("multi-agent error:", e);
        send("error", { message: e instanceof Error ? e.message : "unknown" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
});
