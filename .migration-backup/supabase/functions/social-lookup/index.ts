// MV AI — Social platform link parser + AI summary
// Detects TikTok / Instagram / YouTube / X / Twitch URLs or @handles
// and returns: platform, handle, deep link, web link, AI-summary about the account.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Platform = "tiktok" | "instagram" | "youtube" | "twitter" | "twitch" | "telegram" | "github" | "linkedin";

interface SocialResult {
  platform: Platform;
  handle: string;
  webUrl: string;
  appUrl: string; // deep link (mobile app)
  iosUrl?: string;
  androidIntent?: string;
  display: string;
}

function detect(input: string): SocialResult | null {
  const s = input.trim();

  // Direct URL patterns
  const patterns: Array<{ re: RegExp; build: (h: string) => SocialResult }> = [
    {
      re: /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([A-Za-z0-9._]+)/i,
      build: (h) => ({
        platform: "tiktok",
        handle: h,
        webUrl: `https://www.tiktok.com/@${h}`,
        appUrl: `snssdk1233://user/profile/${h}`,
        iosUrl: `tiktok://user/@${h}`,
        display: `@${h} on TikTok`,
      }),
    },
    {
      re: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9._]+)/i,
      build: (h) => ({
        platform: "instagram",
        handle: h,
        webUrl: `https://instagram.com/${h}`,
        appUrl: `instagram://user?username=${h}`,
        display: `@${h} on Instagram`,
      }),
    },
    {
      re: /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:@|c\/|user\/|channel\/)?([A-Za-z0-9._-]+)/i,
      build: (h) => ({
        platform: "youtube",
        handle: h,
        webUrl: `https://youtube.com/@${h.replace(/^@/, "")}`,
        appUrl: `vnd.youtube://www.youtube.com/@${h.replace(/^@/, "")}`,
        display: `@${h.replace(/^@/, "")} on YouTube`,
      }),
    },
    {
      re: /(?:https?:\/\/)?(?:www\.)?(?:twitter|x)\.com\/([A-Za-z0-9_]+)/i,
      build: (h) => ({
        platform: "twitter",
        handle: h,
        webUrl: `https://x.com/${h}`,
        appUrl: `twitter://user?screen_name=${h}`,
        display: `@${h} on X`,
      }),
    },
    {
      re: /(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([A-Za-z0-9_]+)/i,
      build: (h) => ({
        platform: "twitch",
        handle: h,
        webUrl: `https://twitch.tv/${h}`,
        appUrl: `twitch://stream/${h}`,
        display: `${h} on Twitch`,
      }),
    },
    {
      re: /(?:https?:\/\/)?t\.me\/([A-Za-z0-9_]+)/i,
      build: (h) => ({
        platform: "telegram",
        handle: h,
        webUrl: `https://t.me/${h}`,
        appUrl: `tg://resolve?domain=${h}`,
        display: `@${h} on Telegram`,
      }),
    },
    {
      re: /(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9_-]+)/i,
      build: (h) => ({
        platform: "github",
        handle: h,
        webUrl: `https://github.com/${h}`,
        appUrl: `https://github.com/${h}`,
        display: `@${h} on GitHub`,
      }),
    },
    {
      re: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([A-Za-z0-9_-]+)/i,
      build: (h) => ({
        platform: "linkedin",
        handle: h,
        webUrl: `https://linkedin.com/in/${h}`,
        appUrl: `linkedin://in/${h}`,
        display: `${h} on LinkedIn`,
      }),
    },
  ];

  for (const p of patterns) {
    const m = s.match(p.re);
    if (m) return p.build(m[1]);
  }

  // Plain @handle: pick best-guess from explicit "open <platform> @handle"
  const platMatch = s.toLowerCase().match(/\b(tiktok|instagram|insta|youtube|yt|twitter|x|twitch|telegram|github)\b/);
  const handleMatch = s.match(/@([A-Za-z0-9._]+)/);
  if (platMatch && handleMatch) {
    const handle = handleMatch[1];
    const map: Record<string, Platform> = {
      tiktok: "tiktok",
      instagram: "instagram",
      insta: "instagram",
      youtube: "youtube",
      yt: "youtube",
      twitter: "twitter",
      x: "twitter",
      twitch: "twitch",
      telegram: "telegram",
      github: "github",
    };
    const fake = `https://${map[platMatch[1]]}.com/@${handle}`;
    return detect(fake);
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  try {
    const { input } = await req.json();
    if (typeof input !== "string" || !input.trim()) {
      return new Response(JSON.stringify({ error: "input required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const detected = detect(input);

    let aiSummary: string | null = null;
    if (apiKey && detected) {
      try {
        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content:
                  "You write a 2-sentence neutral, factual summary about a public social media handle if you have widely-known information. If unknown, say 'No widely-known information available.' No emojis. No filler.",
              },
              { role: "user", content: `Platform: ${detected.platform}\nHandle: @${detected.handle}` },
            ],
            stream: false,
          }),
        });
        if (resp.ok) {
          const j = await resp.json();
          aiSummary = j.choices?.[0]?.message?.content ?? null;
        }
      } catch (e) {
        console.warn("ai summary failed:", e);
      }
    }

    return new Response(
      JSON.stringify({ detected, summary: aiSummary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
