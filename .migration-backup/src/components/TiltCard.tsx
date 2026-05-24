import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * 3D tilt card with depth glow follow.
 * Tracks mouse position and tilts in perspective.
 */
export function TiltCard({
  children,
  className,
  intensity = 12,
}: {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [intensity, -intensity]), { stiffness: 300, damping: 22 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-intensity, intensity]), { stiffness: 300, damping: 22 });
  const glowX = useTransform(mx, [-0.5, 0.5], ["0%", "100%"]);
  const glowY = useTransform(my, [-0.5, 0.5], ["0%", "100%"]);

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const handleLeave = () => { mx.set(0); my.set(0); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
      className={`relative ${className ?? ""}`}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: useTransform(
            [glowX, glowY] as never,
            ([x, y]: any) => `radial-gradient(400px circle at ${x} ${y}, hsl(var(--primary) / 0.18), transparent 50%)`
          ),
        }}
      />
      <div style={{ transform: "translateZ(40px)", transformStyle: "preserve-3d" }} className="relative h-full">
        {children}
      </div>
    </motion.div>
  );
}
