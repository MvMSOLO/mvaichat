import { motion } from "framer-motion";

interface Props {
  text: string;
  className?: string;
  speed?: number; // ms per character
  startDelay?: number;
}

/**
 * Smooth, no-cringe streaming text reveal.
 * Reveals characters in soft groups with subtle blur + opacity, no per-letter pop.
 */
export function StreamingText({ text, className = "", speed = 14, startDelay = 0 }: Props) {
  // Split into words; each word fades in with overlap so it feels typed but smooth
  const words = text.split(/(\s+)/);
  return (
    <span className={className}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, filter: "blur(6px)", y: 4 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{
            duration: 0.32,
            ease: [0.16, 1, 0.3, 1],
            delay: startDelay / 1000 + i * (speed / 1000) * 1.2,
          }}
          style={{ display: "inline-block", whiteSpace: "pre" }}
        >
          {w}
        </motion.span>
      ))}
    </span>
  );
}
