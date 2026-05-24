import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface Props {
  Icon: LucideIcon;
  gradient: string;
  size?: number;
  active?: boolean;
}

/**
 * Premium animated icon — subtle continuous shine + bounce on hover.
 * Replaces flat icons for "topic chips".
 */
export function AnimatedTopicIcon({ Icon, gradient, size = 36, active = false }: Props) {
  return (
    <motion.div
      whileHover={{ scale: 1.08, rotate: -4 }}
      whileTap={{ scale: 0.94 }}
      animate={active ? { scale: [1, 1.04, 1] } : {}}
      transition={{ duration: active ? 2.4 : 0.3, repeat: active ? Infinity : 0, ease: "easeInOut" }}
      className={`relative shrink-0 rounded-2xl bg-gradient-to-br ${gradient} grid place-items-center text-white shadow-soft overflow-hidden shine`}
      style={{ width: size, height: size }}
    >
      <Icon className="relative z-10" style={{ width: size * 0.45, height: size * 0.45 }} />
      <motion.span
        className="absolute inset-0 bg-white/20"
        initial={{ y: "100%" }}
        animate={{ y: ["100%", "-100%"] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "linear" }}
      />
    </motion.div>
  );
}
