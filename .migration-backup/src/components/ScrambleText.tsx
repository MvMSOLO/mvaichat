import { useEffect, useRef, useState } from "react";

/**
 * ScrambleText — hacker-style letter scramble reveal on view.
 * Used for headline reveals.
 */
export function ScrambleText({
  text,
  duration = 1200,
  className,
  trigger = "view",
}: {
  text: string;
  duration?: number;
  className?: string;
  trigger?: "view" | "mount";
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [out, setOut] = useState(text);
  const startedRef = useRef(false);

  const scramble = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    const chars = "█▓▒░⌬⌭⌮⌯◼◻◇◆▲▼◀▶";
    const start = performance.now();
    const tick = () => {
      const t = (performance.now() - start) / duration;
      if (t >= 1) { setOut(text); return; }
      const reveal = Math.floor(text.length * t);
      const next = text
        .split("")
        .map((c, i) => (i < reveal || c === " ") ? c : chars[Math.floor(Math.random() * chars.length)])
        .join("");
      setOut(next);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (trigger === "mount") { scramble(); return; }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && scramble()),
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return <span ref={ref} className={className}>{out}</span>;
}
