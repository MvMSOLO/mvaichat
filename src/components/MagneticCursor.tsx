import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * Magnetic floating cursor — premium, smooth, no lag.
 * Two layers: a soft halo and a tight dot, with delayed easing.
 */
export function MagneticCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 36, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 500, damping: 36, mass: 0.4 });
  const haloX = useSpring(x, { stiffness: 120, damping: 18, mass: 0.6 });
  const haloY = useSpring(y, { stiffness: 120, damping: 18, mass: 0.6 });
  const [hover, setHover] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine) return;
    setVisible(true);
    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const target = e.target as HTMLElement | null;
      const isInteractive = !!target?.closest("a, button, [role='button'], input, textarea, [data-magnetic]");
      setHover(isInteractive);
    };
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);
    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
  }, [x, y]);

  if (!visible) return null;
  return (
    <>
      <motion.div
        aria-hidden
        style={{ x: haloX, y: haloY, translateX: "-50%", translateY: "-50%" }}
        animate={{ scale: hover ? 1.6 : 1, opacity: hover ? 0.35 : 0.18 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        className="fixed top-0 left-0 z-[9998] pointer-events-none size-12 rounded-full bg-primary blur-xl mix-blend-screen"
      />
      <motion.div
        aria-hidden
        style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%" }}
        animate={{ scale: hover ? 1.8 : 1, borderColor: hover ? "hsl(var(--primary))" : "hsl(var(--foreground) / 0.7)" }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="fixed top-0 left-0 z-[9999] pointer-events-none size-3 rounded-full border-2 mix-blend-difference"
      />
    </>
  );
}

/**
 * Magnetic wrap — applies subtle pull to children when hovered.
 */
export function Magnetic({ children, strength = 18, className }: { children: React.ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 350, damping: 22 });
  const sy = useSpring(y, { stiffness: 350, damping: 22 });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    x.set((e.clientX - cx) / (r.width / 2) * strength);
    y.set((e.clientY - cy) / (r.height / 2) * strength);
  };
  const onLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{ x: sx, y: sy }} className={className} data-magnetic>
      {children}
    </motion.div>
  );
}
