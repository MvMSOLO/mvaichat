import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import idleImg from "@/assets/ozing/ozing-idle.png";
import blinkImg from "@/assets/ozing/ozing-blink.png";
import thinkImg from "@/assets/ozing/ozing-think.png";
import happyImg from "@/assets/ozing/ozing-happy.png";
import focusImg from "@/assets/ozing/ozing-focus.png";
import curiousImg from "@/assets/ozing/ozing-curious.png";

export type Ozing3DMood = "idle" | "blink" | "think" | "happy" | "focus" | "curious";

const FRAMES: Record<Ozing3DMood, string> = {
  idle: idleImg,
  blink: blinkImg,
  think: thinkImg,
  happy: happyImg,
  focus: focusImg,
  curious: curiousImg,
};

interface Props {
  mood?: Ozing3DMood;
  size?: number;
  followCursor?: boolean;
  glow?: boolean;
  autoBlink?: boolean;
  className?: string;
}

/**
 * Ozing3D — premium pre-rendered 3D mascot with crossfade between moods.
 * - Smooth blink loop (idle ↔ blink)
 * - Cursor follow parallax
 * - Floating breathing animation
 * - Reactive glow halo
 */
export function Ozing3D({
  mood = "idle",
  size = 280,
  followCursor = false,
  glow = true,
  autoBlink = true,
  className = "",
}: Props) {
  const [currentMood, setCurrentMood] = useState<Ozing3DMood>(mood);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);

  // Sync external mood changes
  useEffect(() => {
    setCurrentMood(mood);
  }, [mood]);

  // Auto-blink loop when idle
  useEffect(() => {
    if (!autoBlink || mood !== "idle") return;
    let cancel = false;
    const loop = async () => {
      while (!cancel) {
        await new Promise((r) => setTimeout(r, 2400 + Math.random() * 3200));
        if (cancel || mood !== "idle") break;
        setCurrentMood("blink");
        await new Promise((r) => setTimeout(r, 140));
        if (cancel) break;
        setCurrentMood("idle");
      }
    };
    loop();
    return () => {
      cancel = true;
    };
  }, [autoBlink, mood]);

  // Cursor parallax
  useEffect(() => {
    if (!followCursor) return;
    const onMove = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / window.innerWidth;
      const dy = (e.clientY - cy) / window.innerHeight;
      setParallax({ x: dx * 18, y: dy * 14 });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [followCursor]);

  return (
    <div
      ref={wrapRef}
      className={`relative inline-block select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Halo glow */}
      {glow && (
        <motion.div
          aria-hidden
          className="absolute inset-0 rounded-full blur-3xl pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, hsl(188 95% 56% / 0.4) 0%, hsl(268 92% 70% / 0.25) 35%, transparent 70%)",
          }}
          animate={{ opacity: [0.5, 0.9, 0.5], scale: [0.95, 1.08, 0.95] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Floating + parallax wrapper */}
      <motion.div
        className="relative w-full h-full"
        animate={{
          y: [0, -8, 0],
          x: parallax.x,
          rotateY: parallax.x * 0.6,
          rotateX: -parallax.y * 0.5,
        }}
        transition={{
          y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
          x: { type: "spring", stiffness: 60, damping: 14 },
          rotateY: { type: "spring", stiffness: 60, damping: 14 },
          rotateX: { type: "spring", stiffness: 60, damping: 14 },
        }}
        style={{ transformStyle: "preserve-3d", perspective: 800 }}
      >
        <AnimatePresence mode="popLayout">
          <motion.img
            key={currentMood}
            src={FRAMES[currentMood]}
            alt={`Ozing ${currentMood}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_20px_40px_rgba(120,80,255,0.4)]"
            draggable={false}
          />
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
