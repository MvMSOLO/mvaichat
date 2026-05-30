import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useTheme, THEMES } from "@/hooks/useTheme";
import { Palette, Check } from "lucide-react";

interface Props {
  compact?: boolean;
}

export function ThemeSwitcher({ compact = false }: Props) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const current = THEMES.find((t) => t.id === theme) || THEMES[0];

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl glass border border-border/40 text-sm hover:bg-muted/60 transition-colors"
        >
          <span className="text-base">{current.emoji}</span>
          <span className="font-medium">{current.name}</span>
          <div className="flex gap-0.5 ml-1">
            {current.preview.map((c, i) => (
              <span key={i} className="size-2 rounded-full" style={{ background: c }} />
            ))}
          </div>
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-full left-0 mt-1 z-50 glass-strong rounded-2xl border border-border/50 p-2 min-w-[240px] shadow-elev"
            >
              <ThemeGrid onSelect={(id) => { setTheme(id); setOpen(false); }} current={theme} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        <Palette className="size-4" /> Tema
      </div>
      <ThemeGrid onSelect={setTheme} current={theme} />
    </div>
  );
}

function ThemeGrid({ onSelect, current }: { onSelect: (id: any) => void; current: string }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {THEMES.map((t) => (
        <motion.button
          key={t.id}
          onClick={() => onSelect(t.id)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className={`relative p-3 rounded-xl text-left transition-all border ${current === t.id ? "border-primary/60 bg-primary/10" : "border-border/40 hover:border-border/80 hover:bg-muted/40"}`}
        >
          {current === t.id && (
            <motion.div
              layoutId="theme-check"
              className="absolute top-2 right-2 size-5 rounded-full bg-primary grid place-items-center"
              initial={false}
            >
              <Check className="size-3 text-primary-foreground" />
            </motion.div>
          )}
          <div className="flex gap-1 mb-2">
            {t.preview.map((c, i) => (
              <span
                key={i}
                className="h-3 flex-1 rounded-sm"
                style={{ background: c }}
              />
            ))}
          </div>
          <div className="font-semibold text-xs">{t.emoji} {t.name}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{t.desc}</div>
        </motion.button>
      ))}
    </div>
  );
}
