// MV AI v6.5 — Slash command menu.
import { motion } from "framer-motion";
import { FileText, Image as ImageIcon, Search, Globe2, Github, Figma, Phone, MessageSquare, Heart, Send, BookOpen } from "lucide-react";

export interface SlashCmd { id: string; label: string; hint: string; icon: any; insert: string; }

export const SLASH: SlashCmd[] = [
  { id: "image", label: "/image", hint: "Generate a hyperreal image", icon: ImageIcon, insert: "/image " },
  { id: "pdf", label: "/pdf", hint: "Generate a PDF document", icon: FileText, insert: "/pdf " },
  { id: "search", label: "/search", hint: "Live web search (2026)", icon: Search, insert: "/search " },
  { id: "open", label: "/open", hint: "Open URL or app (youtube, ig, tg…)", icon: Globe2, insert: "/open " },
  { id: "call", label: "/call", hint: "Call a phone number", icon: Phone, insert: "/call " },
  { id: "sms", label: "/sms", hint: "Compose an SMS", icon: MessageSquare, insert: "/sms " },
  { id: "dm", label: "/dm", hint: "DM on Instagram or Telegram", icon: Send, insert: "/dm " },
  { id: "follow", label: "/follow", hint: "Open profile to follow", icon: Heart, insert: "/follow " },
  { id: "story", label: "/story", hint: "Write a story (open / cinematic)", icon: BookOpen, insert: "/story " },
  { id: "github", label: "/github", hint: "Push code to GitHub", icon: Github, insert: "/github " },
  { id: "figma", label: "/figma", hint: "Create Figma file", icon: Figma, insert: "/figma " },
];

export function SlashMenu({ filter, onPick }: { filter: string; onPick: (c: SlashCmd) => void }) {
  const items = SLASH.filter((c) => c.label.toLowerCase().includes(filter.toLowerCase().replace(/^\//, "/")));
  if (!items.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="absolute bottom-full mb-2 left-0 right-0 max-w-md mx-auto glass-strong border border-border/50 rounded-2xl p-1.5 z-30 shadow-2xl max-h-72 overflow-y-auto"
    >
      {items.map((c) => (
        <button
          key={c.id}
          onMouseDown={(e) => { e.preventDefault(); onPick(c); }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-foreground/5 text-left"
        >
          <div className="size-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 grid place-items-center">
            <c.icon className="size-4 text-cyan-300" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-sm font-semibold">{c.label}</div>
            <div className="text-xs text-foreground/60 truncate">{c.hint}</div>
          </div>
        </button>
      ))}
    </motion.div>
  );
}
