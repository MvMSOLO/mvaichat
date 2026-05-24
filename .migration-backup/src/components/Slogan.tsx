import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SLOGANS = [
  { lang: "EN", text: "Where intelligence becomes intuition." },
  { lang: "UZ", text: "Aql intuitsiyaga aylanadigan joy." },
  { lang: "RU", text: "Где интеллект становится интуицией." },
];

export function Slogan({ className = "" }: { className?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % SLOGANS.length), 3000);
    return () => clearInterval(t);
  }, []);
  const cur = SLOGANS[i];
  return (
    <div className={`relative h-7 overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={cur.lang}
          initial={{ y: 16, opacity: 0, filter: "blur(8px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: -16, opacity: 0, filter: "blur(8px)" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex items-center justify-center gap-2 text-sm md:text-base font-medium tracking-tight"
        >
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm border border-foreground/15 text-foreground/50">{cur.lang}</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300">
            {cur.text}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
