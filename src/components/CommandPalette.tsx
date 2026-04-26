import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MODEL_LIST, ModelId } from "@/lib/models";
import { Sparkles, Settings as SettingsIcon, Plus, Search, MessageSquare, Home } from "lucide-react";

interface Props {
  onPickModel?: (id: ModelId) => void;
  onNewChat?: () => void;
}

export function CommandPalette({ onPickModel, onNewChat }: Props) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] grid place-items-start pt-[14vh] px-4 bg-foreground/30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl glass-strong rounded-3xl border border-border/60 shadow-elev overflow-hidden"
          >
            <Command className="bg-transparent">
              <div className="flex items-center px-4 border-b border-border/50">
                <Search className="size-4 text-muted-foreground mr-2" />
                <Command.Input
                  placeholder="Type a command or search…"
                  className="flex-1 h-12 bg-transparent outline-none text-sm placeholder:text-muted-foreground/60"
                />
                <span className="chip text-[10px]">⌘K</span>
              </div>
              <Command.List className="max-h-[60vh] overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-sm text-muted-foreground">No results.</Command.Empty>
                <Command.Group heading="Actions" className="text-[11px] uppercase tracking-wider text-muted-foreground px-2 py-1">
                  <Command.Item
                    onSelect={() => { onNewChat?.(); setOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer aria-selected:bg-primary/10 text-sm"
                  >
                    <Plus className="size-4" /> New chat
                  </Command.Item>
                  <Command.Item
                    onSelect={() => { navigate("/"); setOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer aria-selected:bg-primary/10 text-sm"
                  >
                    <Home className="size-4" /> Home
                  </Command.Item>
                  <Command.Item
                    onSelect={() => { navigate("/settings"); setOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer aria-selected:bg-primary/10 text-sm"
                  >
                    <SettingsIcon className="size-4" /> Settings
                  </Command.Item>
                </Command.Group>
                <Command.Group heading="Switch model" className="text-[11px] uppercase tracking-wider text-muted-foreground px-2 py-1 mt-2">
                  {MODEL_LIST.map((m) => (
                    <Command.Item
                      key={m.id}
                      onSelect={() => { onPickModel?.(m.id); setOpen(false); }}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer aria-selected:bg-primary/10 text-sm"
                    >
                      <span className={`size-7 rounded-lg bg-gradient-to-br ${m.gradient} grid place-items-center text-white`}>
                        <m.icon className="size-3.5" />
                      </span>
                      <span className="font-medium">{m.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto truncate">{m.tagline}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
                <Command.Group heading="Tip" className="text-[11px] uppercase tracking-wider text-muted-foreground px-2 py-1 mt-2">
                  <div className="px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
                    <Sparkles className="size-3 text-primary" /> Drop a TikTok / IG / YT link in Social mode to open the app.
                  </div>
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
