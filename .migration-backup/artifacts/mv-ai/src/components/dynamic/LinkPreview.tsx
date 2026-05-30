import { ExternalLink, Globe } from "lucide-react";
import { motion } from "framer-motion";

interface Link {
  url: string;
  title?: string;
  description?: string;
  source?: string;
}

export function LinkPreviewList({ links }: { links: Link[] }) {
  return (
    <div className="space-y-2 my-3">
      {links.map((l, i) => {
        let host = l.source;
        try { host = host || new URL(l.url).hostname.replace("www.", ""); } catch {}
        return (
          <motion.a
            key={i}
            href={l.url}
            target="_blank"
            rel="noreferrer"
            initial={{ x: -8, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.04 }}
            className="group flex items-start gap-3 glass rounded-2xl p-4 hover:bg-foreground/5 transition"
          >
            <div className="size-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 grid place-items-center shrink-0">
              <Globe className="size-4 text-cyan-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-foreground/50">
                {host}
                <ExternalLink className="size-3 opacity-0 group-hover:opacity-100 transition" />
              </div>
              <div className="font-semibold text-sm truncate">{l.title || l.url}</div>
              {l.description && <div className="text-xs text-foreground/60 line-clamp-2 mt-0.5">{l.description}</div>}
            </div>
          </motion.a>
        );
      })}
    </div>
  );
}
