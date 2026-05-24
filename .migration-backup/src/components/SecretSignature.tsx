import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function SecretSignature() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const opacity = useTransform(scrollYProgress, [0, 0.6, 1], [0, 0.3, 1]);
  const blur = useTransform(scrollYProgress, [0, 1], [10, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [40, 0]);

  return (
    <div ref={ref} className="relative w-full py-32 grid place-items-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-[radial-gradient(circle,hsl(268_92%_70%/0.08)_0%,transparent_60%)]" />
      </div>
      <motion.div
        style={{ opacity, filter: useTransform(blur, (b) => `blur(${b}px)`), y }}
        className="relative text-center select-none"
      >
        <div className="text-[10px] tracking-[0.4em] uppercase text-foreground/40 mb-3">— A whisper —</div>
        <div className="font-display text-2xl md:text-4xl tracking-tighter">
          <span className="text-foreground/50">Made by</span>{" "}
          <span className="relative inline-block">
            <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-violet-200 to-fuchsia-200 [background-size:200%_100%] animate-[shimmer_4s_linear_infinite]">
              Avazbek Mirzayev
            </span>
            <span className="absolute -inset-2 rounded-full bg-violet-500/10 blur-2xl -z-10" />
          </span>
        </div>
        <div className="mt-4 text-[10px] tracking-[0.3em] uppercase text-foreground/30">crafted with intention · 2026</div>
      </motion.div>
      <style>{`@keyframes shimmer { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }`}</style>
    </div>
  );
}
