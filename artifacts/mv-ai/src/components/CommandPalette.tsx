import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MODEL_LIST, ModelId } from "@/lib/models";
import {
  Search, Plus, Settings, Download, MessageSquare,
  Code2, Sparkles, Globe, Mic, Users, Share2, Eye, Brain,
  Keyboard, ChevronRight, Zap, BookOpen, Github,
} from "lucide-react";

interface Action {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  icon: React.ElementType;
  category: string;
  action: () => void;
  keywords?: string[];
}

interface Conversation { id: string; title: string; modelId: ModelId; }

interface Props {
  open: boolean;
  onClose: () => void;
  conversations?: Conversation[];
  onSelectConversation?: (id: string) => void;
  onNewChat?: () => void;
  onModelSwitch?: (id: ModelId) => void;
  onExport?: () => void;
}

const MODEL_ICONS: Record<string, React.ElementType> = {
  humanoid: Brain, ideal: Sparkles, code: Code2, vision: Eye,
  search: Globe, voice: Mic, agents: Users, social: Share2,
};

export function CommandPalette({ open, onClose, conversations = [], onSelectConversation, onNewChat, onModelSwitch, onExport }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const BASE_ACTIONS: Action[] = [
    { id: "new-chat", label: "Yangi chat", description: "Bo'sh chat ochish", icon: Plus, category: "Chat", action: () => { onNewChat?.(); onClose(); }, shortcut: "N", keywords: ["new", "yangi", "chat"] },
    { id: "settings", label: "Sozlamalar", description: "Profil va sozlamalar", icon: Settings, category: "Navigate", action: () => { navigate("/settings"); onClose(); }, shortcut: "S", keywords: ["settings", "sozlama"] },
    { id: "skills", label: "Skills sahifasi", description: "AI ko'nikmalarini boshqarish", icon: BookOpen, category: "Navigate", action: () => { navigate("/skills"); onClose(); }, keywords: ["skills", "konikma"] },
    { id: "github", label: "GitHub Panel", description: "Repolarni ko'rish va commit", icon: Github, category: "Navigate", action: () => { navigate("/github"); onClose(); }, keywords: ["github", "git", "repo"] },
    { id: "export", label: "Chatni eksport qilish", description: ".txt formatda yuklab olish", icon: Download, category: "Chat", action: () => { onExport?.(); onClose(); }, keywords: ["export", "download", "save"] },
    { id: "shortcuts", label: "Keyboard shortcuts", description: "Barcha klaviatura tugmalari", icon: Keyboard, category: "Help", action: () => { onClose(); }, shortcut: "?", keywords: ["keyboard", "shortcuts"] },
    ...MODEL_LIST.map((m) => ({
      id: `model-${m.id}`,
      label: `${m.name} modiga o'tish`,
      description: m.tagline,
      icon: MODEL_ICONS[m.id],
      category: "Model",
      action: () => { onModelSwitch?.(m.id); onClose(); },
      keywords: [m.id, m.name.toLowerCase()],
    })),
  ];

  const matchedConvs = conversations.filter((c) =>
    !query || c.title.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const convActions: Action[] = matchedConvs.map((c) => ({
    id: `conv-${c.id}`,
    label: c.title,
    description: `${MODEL_LIST.find((m) => m.id === c.modelId)?.name || c.modelId} · Chat`,
    icon: MessageSquare,
    category: "Recent",
    action: () => { onSelectConversation?.(c.id); onClose(); },
    keywords: [c.title.toLowerCase()],
  }));

  const filtered = [...convActions, ...BASE_ACTIONS.filter((a) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      a.label.toLowerCase().includes(q) ||
      (a.description || "").toLowerCase().includes(q) ||
      (a.keywords || []).some((k) => k.includes(q)) ||
      a.category.toLowerCase().includes(q)
    );
  })];

  const groups: Record<string, Action[]> = {};
  for (const a of filtered) {
    if (!groups[a.category]) groups[a.category] = [];
    groups[a.category].push(a);
  }
  const allItems = Object.values(groups).flat();

  useEffect(() => {
    if (open) { setQuery(""); setSelected(0); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  useEffect(() => { setSelected(0); }, [query]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, allItems.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === "Enter") { e.preventDefault(); allItems[selected]?.action(); }
    if (e.key === "Escape") onClose();
  }, [open, allItems, selected, onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  let itemIdx = 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-[301] flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-xl glass-strong rounded-2xl border border-border/50 shadow-elev overflow-hidden pointer-events-auto"
              style={{ boxShadow: "0 32px 80px -10px rgba(0,0,0,0.5), 0 0 0 1px hsl(var(--border))" }}
            >
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/50">
                <Search className="size-4 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buyruq qidirish, model o'zgartirish, chat ochish…"
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/60"
                />
                <kbd className="px-2 py-0.5 text-[10px] rounded-md bg-muted text-muted-foreground font-mono">ESC</kbd>
              </div>

              <div className="max-h-[380px] overflow-y-auto py-2">
                {allItems.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">Hech narsa topilmadi</div>
                )}
                {Object.entries(groups).map(([cat, items]) => (
                  <div key={cat} className="px-2 mb-1">
                    <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">{cat}</div>
                    {items.map((item) => {
                      const myIdx = itemIdx++;
                      const isSelected = myIdx === selected;
                      const Icon = item.icon as React.FC<{ className?: string }>;
                      return (
                        <motion.button
                          key={item.id}
                          onClick={item.action}
                          onMouseEnter={() => setSelected(myIdx)}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${isSelected ? "bg-primary/15 text-foreground" : "text-foreground/80 hover:bg-muted/60"}`}
                        >
                          <div className={`size-8 rounded-xl grid place-items-center shrink-0 ${isSelected ? "bg-primary/20" : "bg-muted/50"}`}>
                            <Icon className={`size-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{item.label}</div>
                            {item.description && <div className="text-xs text-muted-foreground/70 truncate">{item.description}</div>}
                          </div>
                          {item.shortcut && (
                            <kbd className="px-2 py-0.5 text-[10px] rounded-md bg-muted text-muted-foreground font-mono shrink-0">{item.shortcut}</kbd>
                          )}
                          {isSelected && <ChevronRight className="size-3.5 text-primary shrink-0" />}
                        </motion.button>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="px-4 py-2.5 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground/50 font-mono">
                <div className="flex items-center gap-3">
                  <span>↑↓ navigatsiya</span><span>↵ tanlash</span><span>ESC yopish</span>
                </div>
                <div className="flex items-center gap-1"><Zap className="size-3" /> MV AI · Cmd+K</div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
