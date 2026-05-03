// MV AI v6 — Server-side tool executor for autonomy actions.
// Currently performs server-side validations + returns intents that the
// frontend / native bridge will execute (open_url, tel, sms, app deep links).
// GitHub push & Figma create require user-linked tokens (user_secrets).
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ToolCall { name: string; args: Record<string, any>; }

const APP_SCHEMES: Record<string, (q: string) => { web: string; deep?: string }> = {
  youtube: (q) => ({ web: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, deep: `vnd.youtube://results?search_query=${encodeURIComponent(q)}` }),
  instagram: (q) => ({ web: `https://www.instagram.com/${q.replace(/^@/, "")}`, deep: `instagram://user?username=${q.replace(/^@/, "")}` }),
  telegram: (q) => ({ web: `https://t.me/${q.replace(/^@/, "")}`, deep: `tg://resolve?domain=${q.replace(/^@/, "")}` }),
  tiktok: (q) => ({ web: `https://www.tiktok.com/@${q.replace(/^@/, "")}` }),
  whatsapp: (q) => ({ web: `https://wa.me/${q.replace(/\D/g, "")}` }),
  twitter: (q) => ({ web: `https://twitter.com/${q.replace(/^@/, "")}` }),
  x: (q) => ({ web: `https://x.com/${q.replace(/^@/, "")}` }),
  spotify: (q) => ({ web: `https://open.spotify.com/search/${encodeURIComponent(q)}`, deep: `spotify:search:${encodeURIComponent(q)}` }),
  maps: (q) => ({ web: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` }),
  github: (q) => ({ web: `https://github.com/${q}` }),
};

function executeIntent(call: ToolCall) {
  const { name, args } = call;
  switch (name) {
    case "open_url": {
      const url = String(args.url || "").trim();
      if (!/^https?:\/\//i.test(url)) return { ok: false, error: "Invalid URL" };
      return { ok: true, action: "open_url", url, message: `Opening ${url}` };
    }
    case "open_app": {
      const app = String(args.app || "").toLowerCase();
      const query = String(args.query || "");
      const fn = APP_SCHEMES[app];
      if (!fn) return { ok: false, error: `Unknown app: ${app}` };
      const out = fn(query);
      return { ok: true, action: "open_app", app, ...out, message: `Opening ${app}${query ? `: ${query}` : ""}` };
    }
    case "call_contact": {
      const number = String(args.number || "").replace(/[^\d+]/g, "");
      if (!number) return { ok: false, error: "Phone number required" };
      return { ok: true, action: "call", url: `tel:${number}`, requiresConfirm: true, message: `Call ${number}?` };
    }
    case "send_sms": {
      const number = String(args.number || "").replace(/[^\d+]/g, "");
      const text = String(args.text || "");
      if (!number) return { ok: false, error: "Phone number required" };
      const url = `sms:${number}${text ? `?&body=${encodeURIComponent(text)}` : ""}`;
      return { ok: true, action: "sms", url, requiresConfirm: true, message: `Send SMS to ${number}?` };
    }
    case "send_email": {
      const to = String(args.to || "");
      const subject = String(args.subject || "");
      const body = String(args.body || "");
      const url = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      return { ok: true, action: "email", url, message: `Compose email to ${to}` };
    }
    case "github_push": {
      // Requires linked GitHub token — surfaced as needs_auth so frontend can prompt.
      return {
        ok: false,
        action: "needs_auth",
        provider: "github",
        message: "GitHub ulanmagan. Settings → Connectors orqali ulang.",
      };
    }
    case "figma_create": {
      return { ok: false, action: "needs_auth", provider: "figma", message: "Figma ulanmagan." };
    }
    default:
      return { ok: false, error: `Unknown tool: ${name}` };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { calls } = await req.json();
    if (!Array.isArray(calls)) return new Response(JSON.stringify({ error: "calls[] required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const results = calls.map((c: ToolCall) => ({ name: c.name, ...executeIntent(c) }));
    return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
