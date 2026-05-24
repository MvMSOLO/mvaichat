import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Stat {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "flat";
  hint?: string;
}

export function StatCardGrid({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 my-3">
      {stats.map((s, i) => (
        <motion.div
          key={i}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          className="glass rounded-2xl p-4 relative overflow-hidden"
        >
          <div className="text-[10px] uppercase tracking-wider text-foreground/50">{s.label}</div>
          <div className="font-display text-2xl font-bold mt-1 tracking-tight">{s.value}</div>
          {s.hint && <div className="text-xs text-foreground/60 mt-1">{s.hint}</div>}
          {s.trend && (
            <div className={`absolute top-3 right-3 size-7 rounded-full grid place-items-center ${
              s.trend === "up" ? "bg-emerald-500/15 text-emerald-400" :
              s.trend === "down" ? "bg-rose-500/15 text-rose-400" : "bg-foreground/10 text-foreground/60"
            }`}>
              {s.trend === "up" ? <TrendingUp className="size-3.5" /> : s.trend === "down" ? <TrendingDown className="size-3.5" /> : <Minus className="size-3.5" />}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
