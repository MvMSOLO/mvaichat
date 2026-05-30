import { ReactNode, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface Props {
  children: ReactNode;
  id?: string;
  className?: string;
  /** Soft parallax depth for inner content */
  depth?: number;
}

/**
 * CinematicSection — scroll-driven scene with subtle parallax depth.
 * Each section feels like a camera move, not a page jump.
 */
export function CinematicSection({ children, id, className = "", depth = 80 }: Props) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [depth, -depth]);
  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.3, 1, 1, 0.3]);

  return (
    <section ref={ref} id={id} className={`relative ${className}`}>
      <motion.div style={{ y, opacity }} className="will-change-transform">
        {children}
      </motion.div>
    </section>
  );
}
