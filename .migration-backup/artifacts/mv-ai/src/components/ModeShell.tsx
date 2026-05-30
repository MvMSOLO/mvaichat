// MV AI v6 — Per-mode skin around chat content.
// Wraps children with subtle visual rails/skins per mode.
import { motion, AnimatePresence } from "framer-motion";
import type { ModelId } from "@/lib/models";

export function ModeShell({ mode, children }: { mode: ModelId; children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={mode}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative h-full"
      >
        {/* per-mode ambient backdrop */}
        <div className={`pointer-events-none absolute inset-0 -z-10 ${skin(mode)}`} />
        {mode === "code" && (
          <div className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-cyan-400/60 via-violet-400/40 to-transparent" />
        )}
        {mode === "search" && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-300/70 to-transparent animate-pulse" />
        )}
        {mode === "voice" && (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(closest-side,rgba(16,185,129,0.08),transparent_70%)]" />
        )}
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function skin(mode: ModelId): string {
  switch (mode) {
    case "code": return "bg-[radial-gradient(ellipse_at_top_left,rgba(34,211,238,0.06),transparent_60%)]";
    case "search": return "bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.05),transparent_60%)]";
    case "voice": return "bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.05),transparent_70%)]";
    case "vision": return "bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.06),transparent_60%)]";
    case "ideal": return "bg-[radial-gradient(ellipse_at_top,rgba(244,114,182,0.05),transparent_65%)]";
    default: return "";
  }
}
