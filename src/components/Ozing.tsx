import { motion, useAnimationControls, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";

export type OzingMood =
  | "idle"
  | "happy"
  | "curious"
  | "thinking"
  | "listening"
  | "speaking"
  | "loading"
  | "success"
  | "error"
  | "sleep"
  | "shy"        // covers eyes
  | "peek"       // peeks through paws
  | "celebrate"
  | "confused";

interface OzingProps {
  mood?: OzingMood;
  size?: number;
  gemColor?: string; // CSS color (hsl())
  className?: string;
}

/**
 * Ozing — MV AI's signature cat mascot.
 * A fully custom SVG with morphing parts driven by Framer Motion.
 */
export function Ozing({ mood = "idle", size = 160, gemColor = "hsl(var(--primary))", className }: OzingProps) {
  const blink = useAnimationControls();
  const tail = useAnimationControls();

  // Idle blink loop
  useEffect(() => {
    if (mood === "sleep" || mood === "shy") return;
    let cancelled = false;
    const loop = async () => {
      while (!cancelled) {
        await new Promise((r) => setTimeout(r, 2500 + Math.random() * 2500));
        if (cancelled) break;
        await blink.start({ scaleY: 0.05, transition: { duration: 0.08 } });
        await blink.start({ scaleY: 1, transition: { duration: 0.12 } });
      }
    };
    loop();
    return () => { cancelled = true; };
  }, [mood, blink]);

  useEffect(() => {
    tail.start({
      rotate: mood === "happy" || mood === "celebrate" ? [12, -12, 12] : [6, -6, 6],
      transition: { duration: mood === "celebrate" ? 0.6 : 2.4, repeat: Infinity, ease: "easeInOut" },
    });
  }, [mood, tail]);

  const eyeShape = useMemo(() => {
    switch (mood) {
      case "happy": return { ry: 6, cy: 86, smile: true };
      case "thinking": return { ry: 14, cy: 84, smile: false };
      case "listening": return { ry: 16, cy: 82, smile: false };
      case "speaking": return { ry: 14, cy: 84, smile: true };
      case "loading": return { ry: 12, cy: 84, smile: false };
      case "success": return { ry: 4, cy: 86, smile: true };
      case "error": return { ry: 14, cy: 88, smile: false };
      case "sleep": return { ry: 1, cy: 86, smile: false };
      case "shy": return { ry: 0, cy: 86, smile: false };
      case "peek": return { ry: 6, cy: 86, smile: false };
      case "celebrate": return { ry: 4, cy: 84, smile: true };
      case "confused": return { ry: 12, cy: 84, smile: false };
      case "curious": return { ry: 18, cy: 82, smile: false };
      default: return { ry: 14, cy: 84, smile: false };
    }
  }, [mood]);

  const headTilt = mood === "confused" ? -10 : mood === "curious" ? 6 : 0;
  const wobble = mood === "error" ? { x: [-3, 3, -2, 2, 0] } : {};

  return (
    <motion.div
      className={cn("relative inline-block select-none pointer-events-none", className)}
      style={{ width: size, height: size }}
      animate={{
        y: mood === "loading" ? [0, -4, 0] : [0, -3, 0],
        ...wobble,
      }}
      transition={{ duration: mood === "loading" ? 0.8 : 3.5, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Soft glow */}
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-40"
        style={{ background: `radial-gradient(circle, ${gemColor} 0%, transparent 60%)` }}
      />

      <motion.svg
        viewBox="0 0 200 200"
        className="relative w-full h-full"
        animate={{ rotate: headTilt }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
      >
        <defs>
          <radialGradient id="bodyGrad" cx="50%" cy="40%">
            <stop offset="0%" stopColor="hsl(var(--card))" />
            <stop offset="100%" stopColor="hsl(var(--muted))" />
          </radialGradient>
          <radialGradient id="cheekGrad">
            <stop offset="0%" stopColor="hsl(var(--accent) / 0.55)" />
            <stop offset="100%" stopColor="hsl(var(--accent) / 0)" />
          </radialGradient>
          <radialGradient id="gemGrad" cx="40%" cy="35%">
            <stop offset="0%" stopColor="white" stopOpacity="0.95" />
            <stop offset="40%" stopColor={gemColor} />
            <stop offset="100%" stopColor={gemColor} stopOpacity="0.6" />
          </radialGradient>
        </defs>

        {/* Tail */}
        <motion.g animate={tail} style={{ originX: "30px", originY: "150px" }}>
          <path
            d="M 30 150 Q 5 130 15 95 Q 22 80 35 90"
            fill="none"
            stroke="url(#bodyGrad)"
            strokeWidth="14"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Body */}
        <ellipse cx="100" cy="140" rx="56" ry="42" fill="url(#bodyGrad)" stroke="hsl(var(--border))" strokeWidth="1.5" />

        {/* Front paws */}
        <motion.ellipse
          cx="78" cy="170" rx="14" ry="9" fill="url(#bodyGrad)" stroke="hsl(var(--border))" strokeWidth="1.2"
          animate={{ y: mood === "celebrate" ? [-4, 0, -4] : 0 }}
          transition={{ duration: 0.4, repeat: mood === "celebrate" ? Infinity : 0 }}
        />
        <motion.ellipse
          cx="122" cy="170" rx="14" ry="9" fill="url(#bodyGrad)" stroke="hsl(var(--border))" strokeWidth="1.2"
          animate={{ y: mood === "celebrate" ? [0, -4, 0] : 0 }}
          transition={{ duration: 0.4, repeat: mood === "celebrate" ? Infinity : 0 }}
        />

        {/* Collar gem */}
        <motion.g
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          style={{ originX: "100px", originY: "118px" }}
        >
          <ellipse cx="100" cy="118" rx="22" ry="4" fill="hsl(var(--foreground) / 0.15)" />
          <circle cx="100" cy="120" r="6" fill="url(#gemGrad)" />
          <circle cx="98" cy="118" r="1.6" fill="white" opacity="0.9" />
        </motion.g>

        {/* Head */}
        <motion.g style={{ originX: "100px", originY: "85px" }}>
          {/* Ears */}
          <motion.path
            d="M 58 60 L 66 28 L 82 50 Z" fill="url(#bodyGrad)" stroke="hsl(var(--border))" strokeWidth="1.5"
            animate={{ rotate: mood === "listening" ? [0, -8, 0] : 0 }}
            transition={{ duration: 0.5, repeat: mood === "listening" ? Infinity : 0 }}
            style={{ originX: "70px", originY: "55px" }}
          />
          <motion.path
            d="M 142 60 L 134 28 L 118 50 Z" fill="url(#bodyGrad)" stroke="hsl(var(--border))" strokeWidth="1.5"
            animate={{ rotate: mood === "listening" ? [0, 8, 0] : 0 }}
            transition={{ duration: 0.5, repeat: mood === "listening" ? Infinity : 0, delay: 0.15 }}
            style={{ originX: "130px", originY: "55px" }}
          />
          <path d="M 64 50 L 70 36 L 78 48 Z" fill={gemColor} opacity="0.5" />
          <path d="M 136 50 L 130 36 L 122 48 Z" fill={gemColor} opacity="0.5" />

          {/* Face */}
          <ellipse cx="100" cy="85" rx="42" ry="38" fill="url(#bodyGrad)" stroke="hsl(var(--border))" strokeWidth="1.5" />

          {/* Cheeks */}
          <ellipse cx="72" cy="95" rx="10" ry="6" fill="url(#cheekGrad)" />
          <ellipse cx="128" cy="95" rx="10" ry="6" fill="url(#cheekGrad)" />

          {/* Eyes */}
          {mood === "shy" || mood === "peek" ? (
            <>
              {/* Paws over eyes */}
              <motion.ellipse cx="82" cy="86" rx="14" ry="10" fill="url(#bodyGrad)" stroke="hsl(var(--border))" strokeWidth="1.2"
                initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 250, damping: 18 }} />
              <motion.ellipse cx="118" cy="86" rx="14" ry="10" fill="url(#bodyGrad)" stroke="hsl(var(--border))" strokeWidth="1.2"
                initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 250, damping: 18, delay: 0.05 }} />
              {mood === "peek" && (
                <>
                  <circle cx="78" cy="84" r="2" fill="hsl(var(--foreground))" />
                  <circle cx="122" cy="84" r="2" fill="hsl(var(--foreground))" />
                </>
              )}
            </>
          ) : (
            <>
              <motion.ellipse animate={blink} style={{ originY: `${eyeShape.cy}px` }}
                cx="82" cy={eyeShape.cy} rx="6" ry={eyeShape.ry} fill="hsl(var(--foreground))" />
              <motion.ellipse animate={blink} style={{ originY: `${eyeShape.cy}px` }}
                cx="118" cy={eyeShape.cy} rx="6" ry={eyeShape.ry} fill="hsl(var(--foreground))" />
              {/* Highlights */}
              <circle cx="84" cy={eyeShape.cy - 4} r="1.6" fill="white" opacity="0.95" />
              <circle cx="120" cy={eyeShape.cy - 4} r="1.6" fill="white" opacity="0.95" />
            </>
          )}

          {/* Nose */}
          <path d="M 98 100 Q 100 104 102 100 Q 100 98 98 100 Z" fill={gemColor} opacity="0.85" />

          {/* Mouth */}
          {mood === "speaking" ? (
            <motion.ellipse cx="100" cy="110" rx="6" ry="4" fill="hsl(var(--foreground))"
              animate={{ ry: [2, 5, 3, 5, 2] }} transition={{ duration: 0.4, repeat: Infinity }} />
          ) : eyeShape.smile ? (
            <path d="M 92 108 Q 100 116 108 108" fill="none" stroke="hsl(var(--foreground))" strokeWidth="1.8" strokeLinecap="round" />
          ) : mood === "sleep" ? (
            <path d="M 95 110 Q 100 112 105 110" fill="none" stroke="hsl(var(--foreground))" strokeWidth="1.5" strokeLinecap="round" />
          ) : (
            <path d="M 96 110 Q 100 112 104 110" fill="none" stroke="hsl(var(--foreground))" strokeWidth="1.6" strokeLinecap="round" />
          )}

          {/* Whiskers */}
          <g stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeLinecap="round" opacity="0.6">
            <line x1="64" y1="100" x2="50" y2="98" />
            <line x1="64" y1="104" x2="50" y2="106" />
            <line x1="136" y1="100" x2="150" y2="98" />
            <line x1="136" y1="104" x2="150" y2="106" />
          </g>
        </motion.g>

        {/* Sleep Z's */}
        <AnimatePresence>
          {mood === "sleep" && (
            <motion.text
              x="150" y="50" fontSize="20" fontWeight="700" fill={gemColor}
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: [0, 1, 0], y: [60, 30, 0] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >Z</motion.text>
          )}
        </AnimatePresence>

        {/* Question mark when confused */}
        <AnimatePresence>
          {mood === "confused" && (
            <motion.text x="150" y="50" fontSize="22" fontWeight="800" fill={gemColor}
              initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1, rotate: [0, 12, -12, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.4 }}>?</motion.text>
          )}
        </AnimatePresence>

        {/* Sparkles for celebrate/success */}
        <AnimatePresence>
          {(mood === "celebrate" || mood === "success") && (
            <>
              {[
                { x: 40, y: 40, d: 0 },
                { x: 160, y: 50, d: 0.2 },
                { x: 30, y: 110, d: 0.4 },
                { x: 170, y: 120, d: 0.3 },
              ].map((s, i) => (
                <motion.path
                  key={i}
                  d={`M ${s.x} ${s.y - 6} L ${s.x + 2} ${s.y - 2} L ${s.x + 6} ${s.y} L ${s.x + 2} ${s.y + 2} L ${s.x} ${s.y + 6} L ${s.x - 2} ${s.y + 2} L ${s.x - 6} ${s.y} L ${s.x - 2} ${s.y - 2} Z`}
                  fill={gemColor}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: s.d }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Loading spinner around gem */}
        <AnimatePresence>
          {mood === "loading" && (
            <motion.circle
              cx="100" cy="120" r="11"
              fill="none" stroke={gemColor} strokeWidth="2" strokeDasharray="20 50"
              animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ originX: "100px", originY: "120px" }}
            />
          )}
        </AnimatePresence>
      </motion.svg>
    </motion.div>
  );
}
