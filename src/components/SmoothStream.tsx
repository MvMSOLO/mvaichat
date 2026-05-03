// MV AI v6 — RAF-driven smooth streaming text.
// Buffers incoming text and reveals at ~60fps with ease-out cubic.
import { useEffect, useRef, useState } from "react";

interface Props {
  text: string;
  className?: string;
  /** chars per second when catching up. */
  speed?: number;
  done?: boolean;
}

export function SmoothStream({ text, className = "", speed = 90, done }: Props) {
  const [shown, setShown] = useState(0);
  const raf = useRef<number | null>(null);
  const last = useRef<number>(performance.now());

  useEffect(() => {
    const tick = (t: number) => {
      const dt = (t - last.current) / 1000;
      last.current = t;
      setShown((s) => {
        if (s >= text.length) return s;
        // Catch-up dynamics: speed up when far behind
        const gap = text.length - s;
        const rate = speed * (1 + Math.min(4, gap / 60));
        return Math.min(text.length, s + Math.max(1, rate * dt));
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [text, speed]);

  // When done streaming AND we've caught up, we just render full text.
  const visible = done && shown >= text.length ? text : text.slice(0, Math.floor(shown));
  const tail = done && shown >= text.length ? "" : text.slice(Math.floor(shown), Math.floor(shown) + 12);

  return (
    <span className={className}>
      <span>{visible}</span>
      {tail && (
        <span aria-hidden style={{ opacity: 0.35, filter: "blur(3px)" }}>{tail}</span>
      )}
    </span>
  );
}
