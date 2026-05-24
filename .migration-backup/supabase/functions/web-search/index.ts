// MV AI v6 — Web search v2 (DuckDuckGo + Wikipedia + Brave HTML), parallel + dedup.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Result { title: string; url: string; snippet: string; source: string; }

async function ddg(q: string): Promise<Result[]> {
  try {
    const r = await fetch(`https://duckduckgo.com/html/?q=${encodeURIComponent(q)}`, { headers: { "User-Agent": "Mozilla/5.0 (compatible; MVAIBot/2.0)" } });
    const html = await r.text();
    const out: Result[] = [];
    const re = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    let m; while ((m = re.exec(html)) !== null && out.length < 8) {
      let url = m[1]; const ddgRedirect = url.match(/uddg=([^&]+)/); if (ddgRedirect) url = decodeURIComponent(ddgRedirect[1]);
      const title = m[2].replace(/<[^>]+>/g, "").trim();
      const snippet = m[3].replace(/<[^>]+>/g, "").trim();
      let source = ""; try { source = new URL(url).hostname.replace("www.", ""); } catch {}
      if (title && url.startsWith("http")) out.push({ title, url, snippet, source });
    }
    return out;
  } catch { return []; }
}

async function brave(q: string): Promise<Result[]> {
  try {
    const r = await fetch(`https://search.brave.com/search?q=${encodeURIComponent(q)}&source=web`, { headers: { "User-Agent": "Mozilla/5.0 (compatible; MVAIBot/2.0)", "Accept-Language": "en-US,en;q=0.9" } });
    const html = await r.text();
    const out: Result[] = [];
    const re = /<a[^>]+class="[^"]*result-header[^"]*"[^>]+href="([^"]+)"[\s\S]*?<span[^>]+class="snippet[^"]*"[^>]*>([\s\S]*?)<\/span>/g;
    let m; while ((m = re.exec(html)) !== null && out.length < 6) {
      const url = m[1];
      const snippet = m[2].replace(/<[^>]+>/g, "").trim();
      let source = ""; try { source = new URL(url).hostname.replace("www.", ""); } catch {}
      out.push({ title: source, url, snippet, source });
    }
    return out;
  } catch { return []; }
}

async function wiki(q: string): Promise<Result[]> {
  try {
    const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q.replace(/\s+/g, "_"))}`);
    if (!r.ok) return [];
    const j = await r.json(); if (!j.extract) return [];
    return [{ title: j.title, url: j.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(q)}`, snippet: j.extract, source: "wikipedia.org" }];
  } catch { return []; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") return new Response(JSON.stringify({ error: "query required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const [a, b, c] = await Promise.all([ddg(query.slice(0, 200)), brave(query.slice(0, 200)), wiki(query.slice(0, 100))]);
    const seen = new Set<string>();
    const merged = [...c, ...a, ...b].filter(r => { const k = r.url; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 8);
    return new Response(JSON.stringify({ results: merged }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown", results: [] }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
