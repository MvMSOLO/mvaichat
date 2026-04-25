import { motion } from "framer-motion";

/**
 * Brand mark — a kinetic "MV" wordmark / logo.
 * Concentric rings + center M, with optional spinning aura.
 */
export function BrandMark({ size = 36, animated = true, className }: { size?: number; animated?: boolean; className?: string }) {
  return (
    <motion.div
      className={`relative inline-block ${className ?? ""}`}
      style={{ width: size, height: size }}
      whileHover={animated ? { scale: 1.08, rotate: 6 } : undefined}
      transition={{ type: "spring", stiffness: 320, damping: 16 }}
    >
      <svg viewBox="0 0 48 48" className="w-full h-full">
        <defs>
          <linearGradient id="mv-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="hsl(var(--primary))" />
            <stop offset="0.5" stopColor="hsl(var(--accent))" />
            <stop offset="1" stopColor="hsl(var(--tertiary))" />
          </linearGradient>
          <linearGradient id="mv-ink" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="hsl(var(--ink))" />
            <stop offset="1" stopColor="hsl(var(--ink) / 0.8)" />
          </linearGradient>
        </defs>
        {/* Aura ring */}
        {animated && (
          <motion.circle
            cx="24" cy="24" r="22" fill="none" stroke="url(#mv-grad)" strokeWidth="1.5"
            strokeDasharray="6 4"
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "24px 24px" }}
          />
        )}
        {/* Squircle base */}
        <rect x="6" y="6" width="36" height="36" rx="11" fill="url(#mv-ink)" />
        {/* M wordmark */}
        <path
          d="M 14 32 L 14 16 L 19 16 L 24 24 L 29 16 L 34 16 L 34 32 L 30 32 L 30 22 L 25 30 L 23 30 L 18 22 L 18 32 Z"
          fill="url(#mv-grad)"
        />
        {/* Bottom dot */}
        <circle cx="24" cy="38" r="1.4" fill="hsl(var(--primary))" />
      </svg>
    </motion.div>
  );
}
