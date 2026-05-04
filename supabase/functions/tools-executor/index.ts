// MV AI v6 — Server-side tool executor for autonomy actions.
// Real GitHub push + Figma create via personal tokens.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ToolCall { name: string; args: Record<string, any>; }

const APP_SCHEMES: Record<string, (q: string) => { web: string; deep?: string }> = {
  youtube: (q) => ({ web: q ? `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` : "https://www.youtube.com", deep: q ? `vnd.youtube://results?search_query=${encodeURIComponent(q)}` : "vnd.youtube://" }),
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

async function githubPush(args: any) {
  const token = Deno.env.get("GITHUB_PERSONAL_TOKEN");
  if (!token) return { ok: false, action: "needs_auth", provider: "github", message: "GitHub token not configured" };
  const repo = String(args.repo || ""); // "owner/repo"
  const message = String(args.message || "MV AI: update");
  const branch = String(args.branch || "main");
  const files: Array<{ path: string; content: string }> = Array.isArray(args.files) ? args.files : [];
  if (!repo.includes("/") || !files.length) return { ok: false, error: "repo and files required" };

  const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" };
  const base = `https://api.github.com/repos/${repo}`;

  try {
    const results: any[] = [];
    for (const f of files) {
      // Get existing sha if file exists
      let sha: string | undefined;
      try {
        const cur = await fetch(`${base}/contents/${encodeURIComponent(f.path)}?ref=${branch}`, { headers });
        if (cur.ok) { const j = await cur.json(); sha = j.sha; }
      } catch {}
      const body: any = {
        message,
        branch,
        content: btoa(unescape(encodeURIComponent(f.content))),
      };
      if (sha) body.sha = sha;
      const r = await fetch(`${base}/contents/${encodeURIComponent(f.path)}`, { method: "PUT", headers, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok) return { ok: false, error: `GitHub ${f.path}: ${j.message || r.status}` };
      results.push({ path: f.path, url: j.content?.html_url });
    }
    return { ok: true, action: "github_pushed", repo, branch, files: results, message: `Pushed ${results.length} file(s) to ${repo}@${branch}`, url: `https://github.com/${repo}/tree/${branch}` };
  } catch (e: any) {
    return { ok: false, error: e?.message || "github push failed" };
  }
}

async function figmaCreate(args: any) {
  const token = Deno.env.get("FIGMA_PERSONAL_TOKEN");
  if (!token) return { ok: false, action: "needs_auth", provider: "figma", message: "Figma token not configured" };
  // Figma REST API does NOT support creating files programmatically (read-only public API).
  // We instead validate the token + return a Figma "new file" deeplink so user can paste brief.
  try {
    const me = await fetch("https://api.figma.com/v1/me", { headers: { "X-Figma-Token": token } });
    if (!me.ok) return { ok: false, error: "Figma token invalid" };
    return {
      ok: true,
      action: "open_url",
      url: "https://www.figma.com/file/new",
      message: `Figma ready. Brief: ${String(args.brief || args.name || "").slice(0, 120)}`,
    };
  } catch (e: any) {
    return { ok: false, error: e?.message || "figma error" };
  }
}

async function executeIntent(call: ToolCall): Promise<any> {
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
    case "github_push": return await githubPush(args);
    case "figma_create": return await figmaCreate(args);
    default: return { ok: false, error: `Unknown tool: ${name}` };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { calls } = await req.json();
    if (!Array.isArray(calls)) return new Response(JSON.stringify({ error: "calls[] required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const results = await Promise.all(calls.map(async (c: ToolCall) => ({ name: c.name, ...(await executeIntent(c)) })));
    return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
