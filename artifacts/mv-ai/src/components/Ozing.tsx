import { motion, useAnimationControls, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type OzingMood =
  | "idle" | "happy" | "curious" | "thinking" | "listening" | "speaking"
  | "loading" | "success" | "error" | "sleep" | "shy" | "peek"
  | "celebrate" | "confused" | "love" | "wink"
  | "magic" | "awe" | "mischief";

interface OzingProps {
  mood?: OzingMood;
  size?: number;
  gemColor?: string;
  className?: string;
  followCursor?: boolean;
}

/**
 * Ozing v3 — refined "Eclipse" mascot.
 * - Sleeker silhouette, sharper ear tips, chibi proportions.
 * - Heterochromic glowing eyes with refraction highlights.
 * - Multi-segment tail with smoother physics.
 * - Floating sparkle orbits + gem with chromatic ring.
 * - 19 mood states, layered AnimatePresence overlays.
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

  // Blink loop (skip when sleeping/shy)
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

  // Tail movement
  useEffect(() => {
    const fast = mood === "happy" || mood === "celebrate" || mood === "love" || mood === "mischief";
    tail.start({
      rotate: fast ? [22, -22, 22] : [10, -10, 10],
      transition: { duration: fast ? 0.45 : 2.6, repeat: Infinity, ease: "easeInOut" },
    });
  }, [mood, tail]);

  // Ear twitch
  useEffect(() => {
    if (mood === "listening" || mood === "curious" || mood === "awe") {
      ears.start({
        rotate: [0, -7, 0, 5, 0],
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

  // Cursor follow
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
      const max = 3.5;
      const len = Math.hypot(dx, dy);
      const nx = (dx / (len || 1)) * Math.min(max, len / 40);
      const ny = (dy / (len || 1)) * Math.min(max, len / 40);
      setPupil({ x: nx, y: ny });
    };
    window.addEventListener("mousemove", handler, { passive: true });
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
      case "magic":      return { ry: 13, cy: 90, smile: "big" as const };
      case "awe":        return { ry: 16, cy: 88, smile: "open" as const };
      case "mischief":   return { ry: 7, cy: 92, smile: "smirk" as const };
      default:           return { ry: 13, cy: 90, smile: "small" as const };
    }
  }, [mood]);

  const headTilt = mood === "confused" ? -12 : mood === "curious" ? 7 : mood === "shy" ? 4 : mood === "mischief" ? -5 : 0;
  const wobble = mood === "error" ? { x: [-3, 3, -2, 2, 0] } : {};

  return (
    <motion.div
      ref={wrapRef}
      className={cn("relative inline-block select-none will-animate", className)}
      style={{ width: size, height: size }}
      animate={{
        y: mood === "loading" ? [0, -4, 0] : mood === "celebrate" ? [0, -10, 0] : [0, -3, 0],
        ...wobble,
      }}
      transition={{ duration: mood === "loading" ? 0.8 : mood === "celebrate" ? 0.45 : 3.6, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Aura — chromatic glow that breathes */}
      <motion.div
        className="absolute inset-0 rounded-full blur-2xl"
        style={{ background: `radial-gradient(circle, ${gemColor} 0%, transparent 65%)` }}
        animate={{ opacity: [0.35, 0.6, 0.35], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Orbiting sparkle (only on magic/celebrate/love) */}
      <AnimatePresence>
        {(mood === "magic" || mood === "celebrate" || mood === "love") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, rotate: 360 }}
            exit={{ opacity: 0 }}
            transition={{ rotate: { duration: 6, repeat: Infinity, ease: "linear" }, opacity: { duration: 0.4 } }}
            className="absolute inset-0 pointer-events-none"
          >
            {[0, 120, 240].map((deg) => (
              <div
                key={deg}
                className="absolute top-1/2 left-1/2 size-1.5 rounded-full"
                style={{
                  background: gemColor,
                  boxShadow: `0 0 12px ${gemColor}`,
                  transform: `rotate(${deg}deg) translateX(${size * 0.42}px)`,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.svg
        viewBox="0 0 220 220"
        className="relative w-full h-full"
        animate={{ rotate: headTilt }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
      >
        <defs>
          <radialGradient id="furGrad" cx="50%" cy="35%" r="68%">
            <stop offset="0%" stopColor="hsl(36 90% 97%)" />
            <stop offset="55%" stopColor="hsl(28 65% 90%)" />
            <stop offset="100%" stopColor="hsl(20 55% 78%)" />
          </radialGradient>
          <radialGradient id="furDark" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="hsl(28 50% 80%)" />
            <stop offset="100%" stopColor="hsl(20 45% 68%)" />
          </radialGradient>
          <radialGradient id="earInner" cx="50%" cy="50%">
            <stop offset="0%" stopColor="hsl(350 95% 84%)" />
            <stop offset="100%" stopColor="hsl(350 70% 68%)" />
          </radialGradient>
          <radialGradient id="blush">
            <stop offset="0%" stopColor="hsl(350 100% 75% / 0.85)" />
            <stop offset="100%" stopColor="hsl(350 100% 75% / 0)" />
          </radialGradient>
          <radialGradient id="gemGrad" cx="35%" cy="30%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="35%" stopColor={gemColor} stopOpacity="0.95" />
            <stop offset="100%" stopColor={gemColor} stopOpacity="0.5" />
          </radialGradient>
          {/* New: heterochromic eye iris */}
          <radialGradient id="iris" cx="40%" cy="35%">
            <stop offset="0%" stopColor={gemColor} stopOpacity="0.95" />
            <stop offset="60%" stopColor="hsl(240 70% 14%)" />
            <stop offset="100%" stopColor="hsl(240 80% 5%)" />
          </radialGradient>
          <radialGradient id="shadow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="hsl(240 50% 16% / 0.28)" />
            <stop offset="100%" stopColor="hsl(240 50% 16% / 0)" />
          </radialGradient>
          <linearGradient id="collarGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="hsl(240 18% 12%)" />
            <stop offset="0.5" stopColor="hsl(240 22% 18%)" />
            <stop offset="1" stopColor="hsl(240 18% 12%)" />
          </linearGradient>
        </defs>

        <ellipse cx="110" cy="200" rx="62" ry="6" fill="url(#shadow)" />

        {/* Tail — segmented for smoother motion */}
        <motion.g animate={tail} style={{ originX: "40px", originY: "165px" }}>
          <path
            d="M 40 165 Q 6 150 10 108 Q 14 76 38 78 Q 52 80 50 96"
            fill="none"
            stroke="url(#furDark)"
            strokeWidth="17"
            strokeLinecap="round"
          />
          <circle cx="50" cy="96" r="9.5" fill="hsl(20 50% 70%)" />
          <circle cx="48" cy="92" r="2.5" fill="hsl(36 80% 92%)" opacity="0.6" />
        </motion.g>

        {/* Body */}
        <ellipse cx="110" cy="155" rx="63" ry="42" fill="url(#furGrad)" />
        <ellipse cx="110" cy="170" rx="38" ry="22" fill="hsl(36 90% 97%)" opacity="0.75" />

        {/* Paws with toe beans */}
        <motion.g
          animate={{ y: mood === "celebrate" ? [-6, 0, -6] : 0 }}
          transition={{ duration: 0.4, repeat: mood === "celebrate" ? Infinity : 0 }}
        >
          <ellipse cx="84" cy="186" rx="16" ry="11" fill="url(#furGrad)" />
          <ellipse cx="84" cy="190" rx="6" ry="3" fill="hsl(350 70% 78%)" opacity="0.7" />
        </motion.g>
        <motion.g
          animate={{ y: mood === "celebrate" ? [0, -6, 0] : 0 }}
          transition={{ duration: 0.4, repeat: mood === "celebrate" ? Infinity : 0 }}
        >
          <ellipse cx="136" cy="186" rx="16" ry="11" fill="url(#furGrad)" />
          <ellipse cx="136" cy="190" rx="6" ry="3" fill="hsl(350 70% 78%)" opacity="0.7" />
        </motion.g>

        {/* Collar with refined gradient */}
        <path d="M 76 130 Q 110 144 144 130 L 144 134 Q 110 148 76 134 Z" fill="url(#collarGrad)" />
        <motion.g
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          style={{ originX: "110px", originY: "138px" }}
        >
          {/* Chromatic ring around gem */}
          <circle cx="110" cy="138" r="11" fill="none" stroke={gemColor} strokeWidth="0.6" opacity="0.5" />
          <circle cx="110" cy="138" r="8" fill="url(#gemGrad)" />
          <circle cx="107" cy="135" r="2.4" fill="white" opacity="0.95" />
          <circle cx="113" cy="141" r="1" fill="white" opacity="0.6" />
        </motion.g>

        {/* HEAD */}
        <motion.g style={{ originX: "110px", originY: "85px" }}>
          {/* Ears — sharper tips */}
          <motion.g animate={ears} style={{ originX: "70px", originY: "55px" }}>
            <path d="M 56 70 L 58 24 Q 64 18 80 38 L 86 60 Z" fill="url(#furGrad)" />
            <path d="M 62 64 L 63 36 L 80 50 Z" fill="url(#earInner)" />
            <path d="M 58 26 Q 60 20 62 26" stroke="hsl(20 50% 75%)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </motion.g>
          <motion.g animate={ears} style={{ originX: "150px", originY: "55px" }}>
            <path d="M 164 70 L 162 24 Q 156 18 140 38 L 134 60 Z" fill="url(#furGrad)" />
            <path d="M 158 64 L 157 36 L 140 50 Z" fill="url(#earInner)" />
            <path d="M 162 26 Q 160 20 158 26" stroke="hsl(20 50% 75%)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </motion.g>

          {/* Face */}
          <ellipse cx="110" cy="92" rx="49" ry="43" fill="url(#furGrad)" />

          {/* Tabby stripes */}
          <path d="M 100 56 Q 102 60 100 66" stroke="hsl(20 60% 68%)" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
          <path d="M 110 54 Q 112 58 110 64" stroke="hsl(20 60% 68%)" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
          <path d="M 120 56 Q 122 60 120 66" stroke="hsl(20 60% 68%)" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />

          {/* Cheek blush */}
          <ellipse cx="78" cy="104" rx="11" ry="7" fill="url(#blush)" />
          <ellipse cx="142" cy="104" rx="11" ry="7" fill="url(#blush)" />

          {/* EYES */}
          {mood === "shy" || mood === "peek" ? (
            <>
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
                  <circle cx="82" cy="90" r="2.5" fill="hsl(240 70% 8%)" />
                  <circle cx="138" cy="90" r="2.5" fill="hsl(240 70% 8%)" />
                </>
              )}
            </>
          ) : mood === "love" ? (
            <>
              {[86, 134].map((cx, i) => (
                <motion.path
                  key={i}
                  d={`M ${cx} ${eyeShape.cy + 3} L ${cx - 8} ${eyeShape.cy - 4} A 4 4 0 0 1 ${cx} ${eyeShape.cy - 4} A 4 4 0 0 1 ${cx + 8} ${eyeShape.cy - 4} Z`}
                  fill="hsl(350 90% 60%)"
                  animate={{ scale: [1, 1.18, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                  style={{ transformOrigin: `${cx}px ${eyeShape.cy}px` }}
                />
              ))}
            </>
          ) : mood === "magic" ? (
            <>
              {/* Star eyes */}
              {[86, 134].map((cx) => (
                <g key={cx}>
                  <circle cx={cx} cy={eyeShape.cy} r="9" fill="url(#iris)" />
                  <path
                    d={`M ${cx} ${eyeShape.cy - 5} L ${cx + 1.5} ${eyeShape.cy - 1} L ${cx + 5} ${eyeShape.cy} L ${cx + 1.5} ${eyeShape.cy + 1} L ${cx} ${eyeShape.cy + 5} L ${cx - 1.5} ${eyeShape.cy + 1} L ${cx - 5} ${eyeShape.cy} L ${cx - 1.5} ${eyeShape.cy - 1} Z`}
                    fill={gemColor}
                  />
                </g>
              ))}
            </>
          ) : (
            <>
              {/* Left eye iris */}
              <motion.ellipse animate={blink} style={{ originY: `${eyeShape.cy}px` }}
                cx="86" cy={eyeShape.cy} rx="8.5" ry={eyeShape.ry} fill="url(#iris)" />
              {/* Right eye - winks */}
              {mood === "wink" ? (
                <path d={`M 126 ${eyeShape.cy} Q 134 ${eyeShape.cy - 4} 142 ${eyeShape.cy}`} stroke="hsl(240 70% 8%)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              ) : (
                <motion.ellipse animate={blink} style={{ originY: `${eyeShape.cy}px` }}
                  cx="134" cy={eyeShape.cy} rx="8.5" ry={eyeShape.ry} fill="url(#iris)" />
              )}
              {/* Pupils — track cursor */}
              {eyeShape.ry > 3 && (
                <>
                  <circle cx={86 + pupil.x} cy={eyeShape.cy + pupil.y} r="2.4" fill="hsl(240 80% 4%)" />
                  {mood !== "wink" && <circle cx={134 + pupil.x} cy={eyeShape.cy + pupil.y} r="2.4" fill="hsl(240 80% 4%)" />}
                </>
              )}
              {/* Sparkle highlights */}
              {eyeShape.ry > 3 && (
                <>
                  <circle cx="89" cy={eyeShape.cy - 5} r="2.4" fill="white" opacity="1" />
                  <circle cx="84" cy={eyeShape.cy + 3} r="1.2" fill="white" opacity="0.85" />
                  {mood !== "wink" && <>
                    <circle cx="137" cy={eyeShape.cy - 5} r="2.4" fill="white" opacity="1" />
                    <circle cx="132" cy={eyeShape.cy + 3} r="1.2" fill="white" opacity="0.85" />
                  </>}
                </>
              )}
            </>
          )}

          {/* Nose — heart shape */}
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
            <path d="M 100 115 Q 110 124 120 115" fill="none" stroke="hsl(240 70% 8%)" strokeWidth="2.2" strokeLinecap="round" />
          ) : eyeShape.smile === "sad" ? (
            <path d="M 100 122 Q 110 116 120 122" fill="none" stroke="hsl(240 70% 8%)" strokeWidth="2" strokeLinecap="round" />
          ) : eyeShape.smile === "small" ? (
            <path d="M 105 117 Q 110 121 115 117" fill="none" stroke="hsl(240 70% 8%)" strokeWidth="1.8" strokeLinecap="round" />
          ) : eyeShape.smile === "smirk" ? (
            <path d="M 104 118 Q 112 122 120 116" fill="none" stroke="hsl(240 70% 8%)" strokeWidth="2" strokeLinecap="round" />
          ) : (
            <path d="M 106 117 Q 110 119 114 117" fill="none" stroke="hsl(240 70% 8%)" strokeWidth="1.6" strokeLinecap="round" />
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

        {/* Sleep Z's */}
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

        {/* Awe overlay — exclamation */}
        <AnimatePresence>
          {mood === "awe" && (
            <motion.text x="166" y="48" fontSize="28" fontWeight="900" fill={gemColor}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: [1, 1.3, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}>!</motion.text>
          )}
        </AnimatePresence>

        {/* Loading orbit */}
        <AnimatePresence>
          {mood === "loading" && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.circle cx="110" cy="110" r="76" fill="none" stroke={gemColor} strokeWidth="1.4" strokeDasharray="6 8" opacity="0.5"
                animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "110px 110px" }} />
            </motion.g>
          )}
        </AnimatePresence>

        {/* Thinking dots */}
        <AnimatePresence>
          {mood === "thinking" && (
            <g>
              {[0, 1, 2].map((i) => (
                <motion.circle key={i} cx={150 + i * 8} cy="48" r="2.6" fill={gemColor}
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18 }} />
              ))}
            </g>
          )}
        </AnimatePresence>

        {/* Listening sound waves */}
        <AnimatePresence>
          {mood === "listening" && [0, 1, 2].map((i) => (
            <motion.circle key={i} cx="40" cy="60" r={6 + i * 8} fill="none" stroke={gemColor} strokeWidth="1.4"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.8, 0], scale: [0.6, 1.1, 1.4] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.25 }}
              style={{ transformOrigin: "40px 60px" }} />
          ))}
        </AnimatePresence>

        {/* Celebration sparkles */}
        <AnimatePresence>
          {mood === "celebrate" && (
            <g>
              {[
                { x: 40, y: 30 }, { x: 180, y: 40 }, { x: 30, y: 110 },
                { x: 195, y: 120 }, { x: 60, y: 190 }, { x: 165, y: 195 },
              ].map((p, i) => (
                <motion.path
                  key={i}
                  d={`M ${p.x} ${p.y - 4} L ${p.x + 1.5} ${p.y - 1} L ${p.x + 4} ${p.y} L ${p.x + 1.5} ${p.y + 1} L ${p.x} ${p.y + 4} L ${p.x - 1.5} ${p.y + 1} L ${p.x - 4} ${p.y} L ${p.x - 1.5} ${p.y - 1} Z`}
                  fill={i % 2 ? "hsl(50 100% 60%)" : gemColor}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 0], scale: [0, 1.3, 0], rotate: 180 }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.12 }}
                  style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                />
              ))}
            </g>
          )}
        </AnimatePresence>

        {/* Mischief — tiny grin shadow */}
        <AnimatePresence>
          {mood === "mischief" && (
            <motion.text x="166" y="50" fontSize="18" fontWeight="900" fill={gemColor}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: [1, 1.15, 1], rotate: [-6, 6, -6] }}
              transition={{ duration: 1.5, repeat: Infinity }}>★</motion.text>
          )}
        </AnimatePresence>
      </motion.svg>
    </motion.div>
  );
}
