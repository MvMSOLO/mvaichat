import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Sparkles, ChevronDown, Search, Lightbulb, Wand2, Gem } from "lucide-react";
import type { AgentInfo, AgentTurn } from "@/hooks/useMultiAgent";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  researcher: Search,
  planner: Lightbulb,
  creator: Wand2,
  refiner: Gem,
};

const AGENT_COLOR: Record<string, string> = {
  researcher: "from-cyan-500 to-blue-500",
  planner: "from-amber-500 to-orange-500",
  creator: "from-fuchsia-500 to-violet-500",
  refiner: "from-emerald-500 to-teal-500",
};

interface Props {
  agents: AgentInfo[];
  turns: AgentTurn[];
  running: boolean;
  defaultOpen?: boolean;
}

export function AgentTranscript({ agents, turns, running, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  if (agents.length === 0 && turns.length === 0) return null;

  const activeId = running ? turns.find((t) => t.status === "thinking")?.id : null;

  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="group inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full glass border border-border/50 hover:border-primary/40 transition-all"
      >
        <span className="relative flex size-2">
          {running ? (
            <>
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping-slow" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </>
          ) : (
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          )}
        </span>
        <Sparkles className="size-3 text-primary" />
        <span className="font-medium">
          {running ? "Agentlar ishlamoqda…" : `Suhbatlar (${turns.length})`}
        </span>
        <ChevronDown className={`size-3 transition-transform ${open ? "rotate-180" : ""}`} />
        <div className="flex -space-x-1 ml-1">
          {agents.map((a) => {
            const Icon = ICONS[a.id] ?? Sparkles;
            const isActive = activeId === a.id;
            const done = turns.find((t) => t.id === a.id)?.status === "done";
            return (
              <div
                key={a.id}
                className={`size-5 rounded-full bg-gradient-to-br ${AGENT_COLOR[a.id]} border-2 border-background grid place-items-center text-white ${isActive ? "animate-pulse-glow" : ""} ${done ? "opacity-100" : "opacity-60"}`}
                title={a.name}
              >
                <Icon className="size-2.5" />
              </div>
            );
          })}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-primary/20">
              {turns.map((t, i) => {
                const a = agents.find((x) => x.id === t.id);
                if (!a) return null;
                const Icon = ICONS[t.id] ?? Sparkles;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-2 text-xs items-start py-1"
                  >
                    <div className={`size-6 rounded-lg bg-gradient-to-br ${AGENT_COLOR[t.id]} grid place-items-center text-white shrink-0 mt-0.5`}>
                      <Icon className="size-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground">{a.name}</span>
                        {t.status === "thinking" ? (
                          <span className="text-muted-foreground italic flex items-center gap-1">
                            <span className="size-1 rounded-full bg-primary animate-bounce" />
                            <span className="size-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: "120ms" }} />
                            <span className="size-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: "240ms" }} />
                          </span>
                        ) : null}
                      </div>
                      {t.content && (
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{t.content}</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
