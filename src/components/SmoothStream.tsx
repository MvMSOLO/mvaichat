// MV AI v6.5 — RAF-driven smooth streaming. Renders immediately (no flicker)
// and gently reveals the trailing buffer with a soft blur fade.
import { useEffect, useRef, useState } from "react";

interface Props {
  text: string;
  className?: string;
  /** chars per second baseline; auto-catches-up. */
  speed?: number;
  done?: boolean;
}

export function SmoothStream({ text, className = "", speed = 140, done }: Props) {
  const [shown, setShown] = useState(0);
  const raf = useRef<number | null>(null);
  const last = useRef<number>(performance.now());

  // When text shrinks (new message), reset; never let "shown" exceed length.
  useEffect(() => {
    if (shown > text.length) setShown(text.length);
  }, [text, shown]);

  useEffect(() => {
    const tick = (t: number) => {
      const dt = (t - last.current) / 1000;
      last.current = t;
      setShown((s) => {
        if (s >= text.length) return s;
        const gap = text.length - s;
        const rate = speed * (1 + Math.min(6, gap / 40));
        return Math.min(text.length, s + Math.max(2, rate * dt));
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [text, speed]);

  // Show full text instantly when stream is done — no awkward catch-up wait.
  if (done) {
    return <span className={className} style={{ whiteSpace: "pre-wrap" }}>{text}</span>;
  }

  const cut = Math.floor(shown);
  const visible = text.slice(0, cut);
  const tail = text.slice(cut, cut + 14);

  return (
    <span className={className} style={{ whiteSpace: "pre-wrap" }}>
      <span>{visible}</span>
      {tail && <span aria-hidden style={{ opacity: 0.4, filter: "blur(2px)" }}>{tail}</span>}
      <span
        aria-hidden
        style={{
          display: "inline-block",
          width: "0.5ch",
          marginLeft: "1px",
          opacity: 0.6,
          animation: "mv-blink 1s steps(2) infinite",
        }}
      >▍</span>
      <style>{`@keyframes mv-blink { 50% { opacity: 0; } }`}</style>
    </span>
  );
}
