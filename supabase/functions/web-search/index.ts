// MV AI — Web search edge function (RAG-lite, no API keys)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Result { title: string; url: string; snippet: string; source: string; }

async function ddgSearch(q: string): Promise<Result[]> {
  try {
    const r = await fetch(`https://duckduckgo.com/html/?q=${encodeURIComponent(q)}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MVAIBot/1.0)" },
    });
    const html = await r.text();
    const results: Result[] = [];
    const re = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null && results.length < 6) {
      let url = m[1];
      const ddgRedirect = url.match(/uddg=([^&]+)/);
      if (ddgRedirect) url = decodeURIComponent(ddgRedirect[1]);
      const title = m[2].replace(/<[^>]+>/g, "").trim();
      const snippet = m[3].replace(/<[^>]+>/g, "").trim();
      let source = ""; try { source = new URL(url).hostname.replace("www.", ""); } catch {}
      if (title && url.startsWith("http")) results.push({ title, url, snippet, source });
    }
    return results;
  } catch (e) { console.error("ddg fail", e); return []; }
}

async function wikiSearch(q: string): Promise<Result[]> {
  try {
    const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q.replace(/\s+/g, "_"))}`);
    if (!r.ok) return [];
    const j = await r.json();
    if (!j.extract) return [];
    return [{
      title: j.title,
      url: j.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(q)}`,
      snippet: j.extract,
      source: "wikipedia.org",
    }];
  } catch { return []; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "query required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const [ddg, wiki] = await Promise.all([ddgSearch(query.slice(0, 200)), wikiSearch(query.slice(0, 100))]);
    const results = [...wiki, ...ddg].slice(0, 6);
    return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("web-search error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown", results: [] }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
