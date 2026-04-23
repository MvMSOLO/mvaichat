import { motion, useAnimationControls, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type OzingMood =
  | "idle" | "happy" | "curious" | "thinking" | "listening" | "speaking"
  | "loading" | "success" | "error" | "sleep" | "shy" | "peek"
  | "celebrate" | "confused" | "love" | "wink";

interface OzingProps {
  mood?: OzingMood;
  size?: number;
  gemColor?: string;
  className?: string;
  /** Eyes follow cursor when true (only for sizes >= 80) */
  followCursor?: boolean;
}

/**
 * Ozing v2 — MV AI's signature cat mascot.
 * A radically expressive SVG character with:
 *  - Detailed gradient fur with stripes
 *  - Anatomically correct ears with inner pink
 *  - Sparkling eyes with multiple highlights
 *  - Whiskers that animate
 *  - Curling tail with mood-driven motion
 *  - Glowing collar gem
 *  - Cursor-following eyes
 *  - 16+ mood states
 */
export function Ozing({
  mood = "idle",
  size = 160,
  gemColor = "hsl(var(--primary))",
  className,
  followCursor = false,
}: OzingProps) {
  const blink = useAnimationControls();
  const tail = useAnimationControls();
  const ears = useAnimationControls();
  const whiskerL = useAnimationControls();
  const whiskerR = useAnimationControls();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [pupil, setPupil] = useState({ x: 0, y: 0 });

  // Blink loop
  useEffect(() => {
    if (mood === "sleep" || mood === "shy") return;
    let cancel = false;
    const loop = async () => {
      while (!cancel) {
        await new Promise((r) => setTimeout(r, 1800 + Math.random() * 3200));
        if (cancel) break;
        await blink.start({ scaleY: 0.05, transition: { duration: 0.07 } });
        await blink.start({ scaleY: 1, transition: { duration: 0.13 } });
      }
    };
    loop();
    return () => { cancel = true; };
  }, [mood, blink]);

  // Tail
  useEffect(() => {
    const fast = mood === "happy" || mood === "celebrate" || mood === "love";
    tail.start({
      rotate: fast ? [18, -18, 18] : [8, -8, 8],
      transition: { duration: fast ? 0.5 : 2.6, repeat: Infinity, ease: "easeInOut" },
    });
  }, [mood, tail]);

  // Ear twitch
  useEffect(() => {
    if (mood === "listening" || mood === "curious") {
      ears.start({
        rotate: [0, -6, 0, 4, 0],
        transition: { duration: 1.4, repeat: Infinity, ease: "easeInOut" },
      });
    } else {
      ears.start({ rotate: 0 });
    }
  }, [mood, ears]);

  // Whisker twitch
  useEffect(() => {
    const interval = setInterval(() => {
      whiskerL.start({ rotate: [0, -3, 0], transition: { duration: 0.4 } });
      whiskerR.start({ rotate: [0, 3, 0], transition: { duration: 0.4 } });
    }, 4500);
    return () => clearInterval(interval);
  }, [whiskerL, whiskerR]);

  // Cursor following
  useEffect(() => {
    if (!followCursor || size < 80) return;
    const handler = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const max = 3;
      const len = Math.hypot(dx, dy);
      const nx = (dx / (len || 1)) * Math.min(max, len / 40);
      const ny = (dy / (len || 1)) * Math.min(max, len / 40);
      setPupil({ x: nx, y: ny });
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [followCursor, size]);

  const eyeShape = useMemo(() => {
    switch (mood) {
      case "happy":      return { ry: 5, cy: 92, smile: "big" as const };
      case "thinking":   return { ry: 11, cy: 90, smile: "neutral" as const };
      case "listening":  return { ry: 13, cy: 88, smile: "neutral" as const };
      case "speaking":   return { ry: 12, cy: 90, smile: "open" as const };
      case "loading":    return { ry: 11, cy: 90, smile: "neutral" as const };
      case "success":    return { ry: 4, cy: 92, smile: "big" as const };
      case "error":      return { ry: 12, cy: 94, smile: "sad" as const };
      case "sleep":      return { ry: 1, cy: 92, smile: "neutral" as const };
      case "shy":        return { ry: 0, cy: 92, smile: "small" as const };
      case "peek":       return { ry: 5, cy: 92, smile: "small" as const };
      case "celebrate":  return { ry: 4, cy: 90, smile: "big" as const };
      case "confused":   return { ry: 11, cy: 90, smile: "neutral" as const };
      case "curious":    return { ry: 16, cy: 88, smile: "small" as const };
      case "love":       return { ry: 14, cy: 90, smile: "big" as const };
      case "wink":       return { ry: 12, cy: 90, smile: "big" as const };
      default:           return { ry: 13, cy: 90, smile: "small" as const };
    }
  }, [mood]);

  const headTilt = mood === "confused" ? -12 : mood === "curious" ? 7 : mood === "shy" ? 4 : 0;
  const wobble = mood === "error" ? { x: [-3, 3, -2, 2, 0] } : {};

  return (
    <motion.div
      ref={wrapRef}
      className={cn("relative inline-block select-none", className)}
      style={{ width: size, height: size }}
      animate={{
        y: mood === "loading" ? [0, -4, 0] : mood === "celebrate" ? [0, -8, 0] : [0, -3, 0],
        ...wobble,
      }}
      transition={{ duration: mood === "loading" ? 0.8 : mood === "celebrate" ? 0.4 : 3.5, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Soft aura glow */}
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-50 animate-glow-pulse"
        style={{ background: `radial-gradient(circle, ${gemColor} 0%, transparent 65%)` }}
      />

      <motion.svg
        viewBox="0 0 220 220"
        className="relative w-full h-full"
        animate={{ rotate: headTilt }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
      >
        <defs>
          {/* Cream/peach fur gradient */}
          <radialGradient id="furGrad" cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor="hsl(36 80% 96%)" />
            <stop offset="60%" stopColor="hsl(28 60% 88%)" />
            <stop offset="100%" stopColor="hsl(20 50% 78%)" />
          </radialGradient>
          <radialGradient id="furDark" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="hsl(28 50% 80%)" />
            <stop offset="100%" stopColor="hsl(20 45% 70%)" />
          </radialGradient>
          {/* Inner ear pink */}
          <radialGradient id="earInner" cx="50%" cy="50%">
            <stop offset="0%" stopColor="hsl(350 90% 82%)" />
            <stop offset="100%" stopColor="hsl(350 70% 70%)" />
          </radialGradient>
          {/* Cheek blush */}
          <radialGradient id="blush">
            <stop offset="0%" stopColor="hsl(350 100% 75% / 0.8)" />
            <stop offset="100%" stopColor="hsl(350 100% 75% / 0)" />
          </radialGradient>
          {/* Gem */}
          <radialGradient id="gemGrad" cx="35%" cy="30%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="35%" stopColor={gemColor} stopOpacity="0.95" />
            <stop offset="100%" stopColor={gemColor} stopOpacity="0.5" />
          </radialGradient>
          {/* Eye shine */}
          <radialGradient id="eyeShine" cx="40%" cy="35%">
            <stop offset="0%" stopColor="hsl(250 60% 25%)" />
            <stop offset="100%" stopColor="hsl(250 70% 8%)" />
          </radialGradient>
          {/* Soft shadow under cat */}
          <radialGradient id="shadow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="hsl(250 50% 20% / 0.25)" />
            <stop offset="100%" stopColor="hsl(250 50% 20% / 0)" />
          </radialGradient>
        </defs>

        {/* Ground shadow */}
        <ellipse cx="110" cy="200" rx="60" ry="6" fill="url(#shadow)" />

        {/* Tail — curled, dynamic */}
        <motion.g animate={tail} style={{ originX: "40px", originY: "165px" }}>
          <path
            d="M 40 165 Q 8 145 12 105 Q 16 78 38 80 Q 50 82 50 95"
            fill="none"
            stroke="url(#furDark)"
            strokeWidth="16"
            strokeLinecap="round"
          />
          {/* Tail tip darker */}
          <circle cx="50" cy="95" r="9" fill="hsl(20 50% 72%)" />
        </motion.g>

        {/* Body — rounder, more babyish */}
        <ellipse cx="110" cy="155" rx="62" ry="42" fill="url(#furGrad)" />
        {/* Belly highlight */}
        <ellipse cx="110" cy="170" rx="38" ry="22" fill="hsl(36 90% 97%)" opacity="0.7" />

        {/* Front paws with toe beans */}
        <motion.g
          animate={{ y: mood === "celebrate" ? [-5, 0, -5] : 0 }}
          transition={{ duration: 0.4, repeat: mood === "celebrate" ? Infinity : 0 }}
        >
          <ellipse cx="84" cy="186" rx="16" ry="11" fill="url(#furGrad)" />
          <ellipse cx="84" cy="190" rx="6" ry="3" fill="hsl(350 70% 78%)" opacity="0.6" />
        </motion.g>
        <motion.g
          animate={{ y: mood === "celebrate" ? [0, -5, 0] : 0 }}
          transition={{ duration: 0.4, repeat: mood === "celebrate" ? Infinity : 0 }}
        >
          <ellipse cx="136" cy="186" rx="16" ry="11" fill="url(#furGrad)" />
          <ellipse cx="136" cy="190" rx="6" ry="3" fill="hsl(350 70% 78%)" opacity="0.6" />
        </motion.g>

        {/* Collar (ribbon-like) */}
        <path d="M 76 130 Q 110 142 144 130 L 144 134 Q 110 146 76 134 Z" fill="hsl(250 50% 18%)" />
        {/* Collar gem */}
        <motion.g
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          style={{ originX: "110px", originY: "138px" }}
        >
          <circle cx="110" cy="138" r="8" fill="url(#gemGrad)" />
          <circle cx="107" cy="135" r="2.4" fill="white" opacity="0.95" />
          <circle cx="113" cy="141" r="1" fill="white" opacity="0.6" />
        </motion.g>

        {/* HEAD GROUP */}
        <motion.g style={{ originX: "110px", originY: "85px" }}>
          {/* Ears — outer */}
          <motion.g animate={ears} style={{ originX: "70px", originY: "55px" }}>
            <path d="M 56 70 L 60 28 Q 65 22 78 38 L 85 58 Z" fill="url(#furGrad)" />
            <path d="M 62 64 L 64 38 L 78 50 Z" fill="url(#earInner)" />
            {/* Ear tuft */}
            <path d="M 60 30 Q 62 24 64 30" stroke="hsl(20 50% 75%)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </motion.g>
          <motion.g animate={ears} style={{ originX: "150px", originY: "55px" }}>
            <path d="M 164 70 L 160 28 Q 155 22 142 38 L 135 58 Z" fill="url(#furGrad)" />
            <path d="M 158 64 L 156 38 L 142 50 Z" fill="url(#earInner)" />
            <path d="M 160 30 Q 158 24 156 30" stroke="hsl(20 50% 75%)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </motion.g>

          {/* Face — plump cheeks */}
          <ellipse cx="110" cy="92" rx="48" ry="42" fill="url(#furGrad)" />

          {/* Forehead stripes (tabby pattern) */}
          <path d="M 100 56 Q 102 60 100 66" stroke="hsl(20 60% 68%)" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
          <path d="M 110 54 Q 112 58 110 64" stroke="hsl(20 60% 68%)" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
          <path d="M 120 56 Q 122 60 120 66" stroke="hsl(20 60% 68%)" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />

          {/* Cheek blush */}
          <ellipse cx="78" cy="104" rx="11" ry="7" fill="url(#blush)" />
          <ellipse cx="142" cy="104" rx="11" ry="7" fill="url(#blush)" />

          {/* EYES */}
          {mood === "shy" || mood === "peek" ? (
            <>
              {/* Paws over eyes */}
              <motion.g initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 250, damping: 18 }}>
                <ellipse cx="86" cy="92" rx="16" ry="12" fill="url(#furGrad)" />
                <ellipse cx="86" cy="95" rx="5" ry="2.5" fill="hsl(350 70% 78%)" opacity="0.6" />
              </motion.g>
              <motion.g initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 250, damping: 18, delay: 0.05 }}>
                <ellipse cx="134" cy="92" rx="16" ry="12" fill="url(#furGrad)" />
                <ellipse cx="134" cy="95" rx="5" ry="2.5" fill="hsl(350 70% 78%)" opacity="0.6" />
              </motion.g>
              {mood === "peek" && (
                <>
                  <circle cx="82" cy="90" r="2.5" fill="hsl(250 70% 8%)" />
                  <circle cx="138" cy="90" r="2.5" fill="hsl(250 70% 8%)" />
                </>
              )}
            </>
          ) : mood === "love" ? (
            <>
              {/* Heart eyes */}
              {[86, 134].map((cx, i) => (
                <motion.path
                  key={i}
                  d={`M ${cx} ${eyeShape.cy + 3} L ${cx - 8} ${eyeShape.cy - 4} A 4 4 0 0 1 ${cx} ${eyeShape.cy - 4} A 4 4 0 0 1 ${cx + 8} ${eyeShape.cy - 4} Z`}
                  fill="hsl(350 90% 60%)"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                  style={{ transformOrigin: `${cx}px ${eyeShape.cy}px` }}
                />
              ))}
            </>
          ) : (
            <>
              {/* Left eye */}
              <motion.ellipse animate={blink} style={{ originY: `${eyeShape.cy}px` }}
                cx="86" cy={eyeShape.cy} rx="8" ry={eyeShape.ry} fill="url(#eyeShine)" />
              {/* Right eye - winks */}
              {mood === "wink" ? (
                <path d={`M 126 ${eyeShape.cy} Q 134 ${eyeShape.cy - 4} 142 ${eyeShape.cy}`} stroke="hsl(250 70% 8%)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              ) : (
                <motion.ellipse animate={blink} style={{ originY: `${eyeShape.cy}px` }}
                  cx="134" cy={eyeShape.cy} rx="8" ry={eyeShape.ry} fill="url(#eyeShine)" />
              )}
              {/* Pupil follow */}
              {eyeShape.ry > 3 && (
                <>
                  <circle cx={86 + pupil.x} cy={eyeShape.cy + pupil.y} r="2.2" fill="hsl(250 80% 4%)" />
                  {mood !== "wink" && <circle cx={134 + pupil.x} cy={eyeShape.cy + pupil.y} r="2.2" fill="hsl(250 80% 4%)" />}
                </>
              )}
              {/* Highlights — multiple for sparkle */}
              {eyeShape.ry > 3 && (
                <>
                  <circle cx="89" cy={eyeShape.cy - 5} r="2.2" fill="white" opacity="1" />
                  <circle cx="84" cy={eyeShape.cy + 3} r="1.2" fill="white" opacity="0.8" />
                  {mood !== "wink" && <>
                    <circle cx="137" cy={eyeShape.cy - 5} r="2.2" fill="white" opacity="1" />
                    <circle cx="132" cy={eyeShape.cy + 3} r="1.2" fill="white" opacity="0.8" />
                  </>}
                </>
              )}
            </>
          )}

          {/* Nose — heart shape pink */}
          <path d="M 105 108 Q 110 116 115 108 Q 112 104 110 106 Q 108 104 105 108 Z" fill="hsl(350 80% 65%)" />

          {/* Mouth */}
          {eyeShape.smile === "open" ? (
            <motion.path
              d="M 102 116 Q 110 124 118 116 Q 114 122 110 122 Q 106 122 102 116 Z"
              fill="hsl(350 70% 50%)"
              animate={{ scaleY: [0.6, 1, 0.7, 1, 0.6] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              style={{ originY: "118px" }}
            />
          ) : eyeShape.smile === "big" ? (
            <path d="M 100 115 Q 110 124 120 115" fill="none" stroke="hsl(250 70% 8%)" strokeWidth="2.2" strokeLinecap="round" />
          ) : eyeShape.smile === "sad" ? (
            <path d="M 100 122 Q 110 116 120 122" fill="none" stroke="hsl(250 70% 8%)" strokeWidth="2" strokeLinecap="round" />
          ) : eyeShape.smile === "small" ? (
            <path d="M 105 117 Q 110 121 115 117" fill="none" stroke="hsl(250 70% 8%)" strokeWidth="1.8" strokeLinecap="round" />
          ) : (
            <path d="M 106 117 Q 110 119 114 117" fill="none" stroke="hsl(250 70% 8%)" strokeWidth="1.6" strokeLinecap="round" />
          )}

          {/* Whiskers */}
          <motion.g animate={whiskerL} style={{ originX: "78px", originY: "112px" }}
            stroke="hsl(20 30% 50%)" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" fill="none">
            <path d="M 78 110 Q 60 106 48 104" />
            <path d="M 78 114 Q 60 116 48 118" />
            <path d="M 78 117 Q 62 122 50 128" />
          </motion.g>
          <motion.g animate={whiskerR} style={{ originX: "142px", originY: "112px" }}
            stroke="hsl(20 30% 50%)" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" fill="none">
            <path d="M 142 110 Q 160 106 172 104" />
            <path d="M 142 114 Q 160 116 172 118" />
            <path d="M 142 117 Q 158 122 170 128" />
          </motion.g>
        </motion.g>

        {/* Sleep Z */}
        <AnimatePresence>
          {mood === "sleep" && [0, 0.6, 1.2].map((d) => (
            <motion.text key={d} x={155 + d * 8} y={48} fontSize={16 + d * 4} fontWeight="800" fill={gemColor}
              initial={{ opacity: 0, y: 70 }}
              animate={{ opacity: [0, 1, 0], y: [70, 30, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: d }}>z</motion.text>
          ))}
        </AnimatePresence>

        {/* Confused ? */}
        <AnimatePresence>
          {mood === "confused" && (
            <motion.text x="160" y="48" fontSize="26" fontWeight="900" fill={gemColor}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1, rotate: [0, 14, -14, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 0.4 }}>?</motion.text>
          )}
        </AnimatePresence>

        {/* Sparkles */}
        <AnimatePresence>
          {(mood === "celebrate" || mood === "success" || mood === "love") && (
            <>
              {[
                { x: 30, y: 50, d: 0, s: 6 },
                { x: 190, y: 40, d: 0.2, s: 8 },
                { x: 22, y: 130, d: 0.4, s: 5 },
                { x: 196, y: 130, d: 0.3, s: 7 },
                { x: 110, y: 18, d: 0.5, s: 6 },
              ].map((p, i) => (
                <motion.path
                  key={i}
                  d={`M ${p.x} ${p.y - p.s} L ${p.x + 1.5} ${p.y - 1.5} L ${p.x + p.s} ${p.y} L ${p.x + 1.5} ${p.y + 1.5} L ${p.x} ${p.y + p.s} L ${p.x - 1.5} ${p.y + 1.5} L ${p.x - p.s} ${p.y} L ${p.x - 1.5} ${p.y - 1.5} Z`}
                  fill={mood === "love" ? "hsl(350 90% 65%)" : gemColor}
                  initial={{ scale: 0, opacity: 0, rotate: 0 }}
                  animate={{ scale: [0, 1, 0], opacity: [0, 1, 0], rotate: 180 }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: p.d }}
                  style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Loading orbit */}
        <AnimatePresence>
          {mood === "loading" && (
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "110px 138px" }}
            >
              <circle cx="110" cy="120" r="3" fill={gemColor} />
              <circle cx="110" cy="156" r="3" fill={gemColor} opacity="0.5" />
            </motion.g>
          )}
        </AnimatePresence>

        {/* Thinking dot bubbles */}
        <AnimatePresence>
          {mood === "thinking" && (
            <g>
              {[0, 1, 2].map((i) => (
                <motion.circle
                  key={i}
                  cx={158 + i * 8} cy={42 - i * 4} r={2 + i * 0.8}
                  fill={gemColor}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 0], scale: [0, 1, 1.2] }}
                  transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </g>
          )}
        </AnimatePresence>

        {/* Listening sound waves */}
        <AnimatePresence>
          {mood === "listening" && (
            <>
              {[0, 1, 2].map((i) => (
                <motion.path
                  key={i}
                  d={`M ${190 + i * 4} 70 Q ${198 + i * 4} 80 ${190 + i * 4} 90`}
                  fill="none" stroke={gemColor} strokeWidth="2" strokeLinecap="round"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.svg>
    </motion.div>
  );
}
