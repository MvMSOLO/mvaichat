import { motion } from "framer-motion";
import { ExternalLink, Smartphone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface SocialDetected {
  platform: "tiktok" | "instagram" | "youtube" | "twitter" | "twitch" | "telegram" | "github" | "linkedin";
  handle: string;
  webUrl: string;
  appUrl: string;
  iosUrl?: string;
  display: string;
}

const PLATFORM_META: Record<SocialDetected["platform"], { name: string; gradient: string; emoji: string }> = {
  tiktok: { name: "TikTok", gradient: "from-pink-500 via-rose-500 to-cyan-500", emoji: "🎵" },
  instagram: { name: "Instagram", gradient: "from-fuchsia-500 via-rose-500 to-amber-500", emoji: "📸" },
  youtube: { name: "YouTube", gradient: "from-red-600 to-rose-500", emoji: "▶️" },
  twitter: { name: "X", gradient: "from-zinc-900 to-zinc-700", emoji: "𝕏" },
  twitch: { name: "Twitch", gradient: "from-violet-600 to-purple-700", emoji: "🎮" },
  telegram: { name: "Telegram", gradient: "from-sky-500 to-blue-600", emoji: "✈️" },
  github: { name: "GitHub", gradient: "from-zinc-800 to-zinc-600", emoji: "🐙" },
  linkedin: { name: "LinkedIn", gradient: "from-blue-700 to-sky-600", emoji: "💼" },
};

export function SocialCard({
  detected,
  summary,
}: {
  detected: SocialDetected;
  summary?: string | null;
}) {
  const meta = PLATFORM_META[detected.platform];

  const openApp = () => {
    const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const target = isIos && detected.iosUrl ? detected.iosUrl : detected.appUrl;

    // Try app via hidden iframe first, fallback to web
    const start = Date.now();
    const fallback = setTimeout(() => {
      if (Date.now() - start < 1600) {
        window.open(detected.webUrl, "_blank", "noopener");
      }
    }, 1200);

    try {
      window.location.href = target;
    } catch {
      window.open(detected.webUrl, "_blank", "noopener");
    }

    window.addEventListener("blur", () => clearTimeout(fallback), { once: true });
  };

  const copy = () => {
    navigator.clipboard.writeText(detected.webUrl);
    toast.success("Link copied");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-2xl border border-border/50 glass-strong my-3 group"
    >
      <div
        className={`absolute -inset-x-12 -top-20 h-40 bg-gradient-to-br ${meta.gradient} blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-500`}
      />

      <div className="relative p-4">
        <div className="flex items-start gap-3">
          <motion.div
            whileHover={{ rotate: -6, scale: 1.05 }}
            className={`size-12 shrink-0 rounded-2xl bg-gradient-to-br ${meta.gradient} grid place-items-center text-white text-2xl shadow-lg shine`}
          >
            <span>{meta.emoji}</span>
          </motion.div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{meta.name}</span>
              <span className="chip">
                <Sparkles className="size-2.5" />
                AI Agent
              </span>
            </div>
            <div className="font-display text-lg font-bold tracking-tight">@{detected.handle}</div>
            {summary && (
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{summary}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <Button
            size="sm"
            onClick={openApp}
            className={`rounded-full bg-gradient-to-r ${meta.gradient} text-white shadow-soft hover:shadow-elev gap-1.5`}
          >
            <Smartphone className="size-3.5" />
            Open in app
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(detected.webUrl, "_blank", "noopener")}
            className="rounded-full gap-1.5"
          >
            <ExternalLink className="size-3.5" />
            Open web
          </Button>
          <Button size="sm" variant="ghost" onClick={copy} className="rounded-full">
            Copy link
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
