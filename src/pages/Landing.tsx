import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Ozing3D, Ozing3DMood } from "@/components/Ozing3D";
import { MODEL_LIST, MODELS } from "@/lib/models";
import {
  ArrowRight, Sparkles, MoveUpRight, Star, Zap, Shield, Layers,
  Eye, Camera, Cpu, Lightbulb, Wand2, ScanFace, Network, Quote,
} from "lucide-react";
import { TiltCard } from "@/components/TiltCard";
import { Magnetic } from "@/components/MagneticCursor";
import { BrandMark } from "@/components/BrandMark";
import { Slogan } from "@/components/Slogan";
import { SecretSignature } from "@/components/SecretSignature";
import { useReducedMotion, useIsMobile } from "@/hooks/useMotionPrefs";
import heroOrb from "@/assets/hero-orb-premium.png";

// Lazy-load the heavy 3D scene
const HeroScene = lazy(() => import("@/components/three/HeroScene").then((m) => ({ default: m.HeroScene })));

const AGENTS = [
  { name: "Researcher", emoji: "🔬", color: "from-cyan-400 to-blue-500", role: "Gathers context and facts" },
  { name: "Strategist", emoji: "♟️", color: "from-violet-400 to-purple-600", role: "Plans the approach" },
  { name: "Creator", emoji: "✨", color: "from-pink-400 to-fuchsia-500", role: "Drafts the answer" },
  { name: "Refiner", emoji: "💎", color: "from-amber-400 to-orange-500", role: "Polishes for impact" },
];

const SOCIALS = [
  { name: "TikTok", color: "from-cyan-400 via-pink-500 to-rose-500", handle: "@mvai" },
  { name: "Instagram", color: "from-amber-400 via-pink-500 to-purple-600", handle: "@mvai" },
  { name: "YouTube", color: "from-red-500 to-rose-600", handle: "MV AI" },
  { name: "X / Twitter", color: "from-slate-500 to-slate-800", handle: "@mvai" },
];

export default function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const isMobile = useIsMobile();
  const [ozingMood, setOzingMood] = useState<Ozing3DMood>("idle");

  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(heroScroll, [0, 1], [0, 240]);
  const heroOpacity = useTransform(heroScroll, [0, 1], [1, 0]);
  const heroScale = useTransform(heroScroll, [0, 1], [1, 0.86]);

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-background text-foreground">
      {/* Cinematic atmosphere */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 mesh-bg" />
        <div className="absolute inset-0 aurora-bg opacity-50" />
        <div className="absolute inset-0 dot-grid-fade opacity-30" />
        <motion.div
          className="absolute -top-1/3 left-1/2 -translate-x-1/2 w-[80rem] h-[80rem] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(268 92% 70% / 0.18) 0%, transparent 60%)" }}
          animate={reduced ? {} : { scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* TOP NAV — floating glass dock */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,64rem)]"
      >
        <div className="glass-strong liquid rounded-full px-3 py-2 flex items-center justify-between border border-foreground/10">
          <Link to="/" className="flex items-center gap-2.5 pl-2 group">
            <BrandMark size={28} />
            <span className="font-display font-bold tracking-tight text-base">MV AI</span>
            <span className="hidden sm:inline ml-1 text-[10px] font-mono uppercase tracking-widest text-primary/80 px-1.5 py-0.5 rounded-full border border-primary/30">
              v4
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-foreground/80">
            <a href="#modes" className="hover:text-foreground transition">Modes</a>
            <a href="#agents" className="hover:text-foreground transition">Agents</a>
            <a href="#vision" className="hover:text-foreground transition">Vision</a>
            <Link to="/studio" className="hover:text-foreground transition">Studio</Link>
          </nav>
          <div className="flex items-center gap-1.5">
            <Link to="/auth" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" className="rounded-full text-foreground/80 hover:text-foreground">Sign in</Button>
            </Link>
            <Magnetic>
              <Link to="/auth?mode=signup">
                <Button size="sm" className="rounded-full bg-gradient-to-br from-primary via-tertiary to-secondary text-white hover:opacity-90 shine font-semibold gap-1">
                  Enter <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            </Magnetic>
          </div>
        </div>
      </motion.header>

      {/* ============ SCENE 1 — HERO ============ */}
      <section ref={heroRef} className="relative min-h-[100svh] flex items-center justify-center pt-32 pb-20">
        {/* 3D scene background — absolute, full bleed */}
        <div className="absolute inset-0 z-0">
          {!reduced && (
            <Suspense fallback={<div className="absolute inset-0 grid place-items-center"><img src={heroOrb} alt="" className="w-[60vmin] opacity-60 blur-2xl" /></div>}>
              <HeroScene className="absolute inset-0" intensity={isMobile ? "low" : "high"} />
            </Suspense>
          )}
          {/* Static fallback orb — also serves as LCP image */}
          <img
            src={heroOrb}
            alt="MV AI cinematic orb"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vmin] max-w-[800px] opacity-90 mix-blend-screen pointer-events-none"
            style={{ filter: "drop-shadow(0 0 80px rgba(168, 85, 247, 0.4))" }}
          />
          {/* Vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background pointer-events-none" />
        </div>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
          className="relative z-10 container text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex"
          >
            <span className="chip border-primary/30 bg-primary/10 text-foreground backdrop-blur-xl">
              <span className="relative flex size-2">
                <span className="absolute inset-0 rounded-full bg-primary animate-ping-slow opacity-75" />
                <span className="relative size-2 rounded-full bg-primary" />
              </span>
              MV AI v4 — meet your AI cockpit
              <Sparkles className="size-3 text-primary" />
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 font-display text-[3rem] sm:text-7xl md:text-[7.5rem] leading-[0.9] tracking-tighter font-semibold"
          >
            <span className="block text-foreground">Not a chatbot.</span>
            <span className="block">
              <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-violet-400 to-pink-400">
                A living
              </span>
            </span>
            <span className="block text-foreground">AI cockpit.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="mt-7 text-base md:text-xl text-foreground/70 max-w-2xl mx-auto leading-relaxed"
          >
            Six AI minds. Four cooperating agents. One cinematic interface — built around{" "}
            <strong className="text-foreground">Ozing</strong>, your premium AI companion.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.7 }}
            className="mt-6"
          >
            <Slogan />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.7 }}
            className="mt-10 flex items-center justify-center gap-3 flex-wrap"
          >
            <Magnetic strength={12}>
              <Link to="/auth?mode=signup">
                <Button size="lg" className="rounded-full h-14 px-8 bg-gradient-to-br from-primary via-tertiary to-secondary text-white hover:opacity-95 shine font-semibold text-base shadow-[0_0_60px_-10px_hsl(268_92%_70%_/_0.6)]">
                  Launch the cockpit <ArrowRight className="ml-1" />
                </Button>
              </Link>
            </Magnetic>
            <Magnetic strength={10}>
              <a href="#modes">
                <Button size="lg" variant="outline" className="rounded-full glass-strong h-14 px-7 font-semibold border-foreground/15 hover:border-foreground/30 backdrop-blur-xl">
                  Explore the system <MoveUpRight className="size-4 ml-1" />
                </Button>
              </a>
            </Magnetic>
          </motion.div>

          {/* Trust row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.6 }}
            className="mt-10 flex items-center justify-center gap-6 text-xs text-foreground/60"
          >
            <div className="flex items-center gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="size-3.5 fill-accent text-accent" />)}
              <span className="ml-1.5">4.9 · early access</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="size-1 rounded-full bg-foreground/30" />
              <span>6 minds · 4 agents · 1 cockpit</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 8, 0] }}
          transition={{ opacity: { delay: 1.4 }, y: { duration: 2, repeat: Infinity } }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-foreground/40 text-[10px] uppercase tracking-[0.3em] font-mono"
        >
          <span>scroll</span>
          <div className="h-8 w-px bg-gradient-to-b from-foreground/40 to-transparent" />
        </motion.div>
      </section>

      {/* ============ MARQUEE strip ============ */}
      <div className="relative z-10 py-4 border-y border-foreground/10 bg-foreground/[0.02] backdrop-blur-xl overflow-hidden">
        <div className="marquee whitespace-nowrap text-foreground/60">
          {[...Array(2)].map((_, k) => (
            <div key={k} className="flex gap-10 items-center font-display font-semibold text-xl shrink-0">
              <span className="text-cyan-400">◆</span><span>HUMANOID</span>
              <span className="text-violet-400">◆</span><span>IDEAL</span>
              <span className="text-emerald-400">◆</span><span>CODE</span>
              <span className="text-pink-400">◆</span><span>VISION</span>
              <span className="text-amber-400">◆</span><span>SEARCH</span>
              <span className="text-secondary">◆</span><span>VOICE</span>
              <span className="text-tertiary">◆</span><span>AGENTS</span>
              <span className="text-rose-400">◆</span><span>SOCIAL</span>
            </div>
          ))}
        </div>
      </div>

      {/* ============ SCENE 2 — MODES WORLD ============ */}
      <section id="modes" className="relative z-10 container py-32">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16 max-w-3xl mx-auto"
        >
          <span className="chip"><Layers className="size-3" /> Scene 02 — Modes World</span>
          <h2 className="mt-5 font-display text-5xl md:text-7xl tracking-tighter leading-[0.95]">
            Eight minds.<br />
            <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-violet-400 to-pink-400">
              One companion.
            </span>
          </h2>
          <p className="mt-5 text-foreground/60 leading-relaxed">
            Each mode is a different planet of intelligence. Switch instantly mid-conversation.
            Ozing adapts personality, voice, and capability with you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 [perspective:1400px]">
          {MODEL_LIST.map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="group"
              >
                <TiltCard className="relative h-full rounded-3xl glass-strong border border-foreground/10 overflow-hidden p-6 hover:border-foreground/25 transition-colors duration-500">
                  {/* Color glow */}
                  <div
                    className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl opacity-40 group-hover:opacity-70 transition-opacity duration-700"
                    style={{ background: `hsl(${m.gem} / 0.6)` }}
                  />
                  {/* Number */}
                  <div className="relative flex items-start justify-between mb-8">
                    <motion.div
                      whileHover={{ rotate: [0, -6, 6, 0], scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                      className={`size-14 rounded-2xl bg-gradient-to-br ${m.gradient} grid place-items-center text-white shadow-lg shadow-black/40`}
                    >
                      <Icon className="size-6" />
                    </motion.div>
                    <span className="text-[10px] font-mono opacity-40 uppercase tracking-[0.25em]">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="font-display text-2xl tracking-tight">{m.name}</h3>
                  <p className="text-xs font-serif italic text-foreground/60 mt-1">{m.tagline}</p>
                  <p className="text-sm text-foreground/55 mt-4 leading-relaxed">{m.description}</p>
                  {m.special && (
                    <span className="mt-4 inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-primary/80">
                      <Sparkles className="size-2.5" /> Special mode
                    </span>
                  )}
                </TiltCard>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ============ SCENE 3 — MULTI-AGENT ============ */}
      <section id="agents" className="relative z-10 py-32 overflow-hidden">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="chip"><Network className="size-3" /> Scene 03 — Multi-Agent</span>
            <h2 className="mt-5 font-display text-5xl md:text-7xl tracking-tighter leading-[0.95]">
              Four minds.<br />
              <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400">
                One conversation.
              </span>
            </h2>
            <p className="mt-5 text-foreground/60">
              Researcher → Strategist → Creator → Refiner. Watch them think together,
              criticize each other, and converge on the perfect answer.
            </p>
          </motion.div>

          <div className="relative max-w-5xl mx-auto">
            {/* Connecting lines (SVG) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 400" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(188 95% 56%)" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="hsl(268 92% 70%)" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="hsl(320 88% 66%)" stopOpacity="0.6" />
                </linearGradient>
              </defs>
              <motion.path
                d="M 100 200 Q 200 80 300 200 T 500 200"
                fill="none"
                stroke="url(#lineGrad)"
                strokeWidth="2"
                strokeDasharray="8 6"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
            </svg>

            <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4">
              {AGENTS.map((a, i) => (
                <motion.div
                  key={a.name}
                  initial={{ opacity: 0, y: 24, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="relative"
                >
                  <div className="glass-strong rounded-3xl p-6 border border-foreground/10 text-center group hover:border-foreground/25 transition-colors duration-500">
                    <div className={`mx-auto size-16 rounded-2xl bg-gradient-to-br ${a.color} grid place-items-center text-3xl shadow-lg shadow-black/40 mb-4 group-hover:scale-110 transition-transform`}>
                      {a.emoji}
                    </div>
                    <h3 className="font-display text-lg tracking-tight">{a.name}</h3>
                    <p className="text-xs text-foreground/60 mt-2 leading-relaxed">{a.role}</p>
                    <motion.div
                      className={`mt-3 mx-auto h-1 w-8 rounded-full bg-gradient-to-r ${a.color}`}
                      animate={{ scaleX: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Live transcript preview */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.7 }}
              className="mt-12 glass-strong rounded-3xl p-6 border border-foreground/10 max-w-3xl mx-auto"
            >
              <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/40 mb-3">
                ◉ LIVE — agent transcript
              </div>
              <div className="space-y-3">
                {[
                  { who: "🔬 Researcher", txt: "Found 3 patterns in the user's design data…" },
                  { who: "♟️ Strategist", txt: "Recommend a layered approach — start with Pattern A." },
                  { who: "✨ Creator", txt: "Drafting the first iteration with Pattern A as foundation." },
                  { who: "💎 Refiner", txt: "Tightening copy. Adjusting hierarchy. Ready." },
                ].map((row, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8 + i * 0.15 }}
                    className="flex items-start gap-3"
                  >
                    <span className="text-xs font-semibold shrink-0 w-32 text-foreground/80">{row.who}</span>
                    <span className="text-sm text-foreground/70">{row.txt}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ SCENE 4 — VISION / CAPTURE ============ */}
      <section id="vision" className="relative z-10 py-32">
        <div className="container grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <span className="chip"><ScanFace className="size-3" /> Scene 04 — Vision</span>
            <h2 className="mt-5 font-display text-5xl md:text-6xl tracking-tighter leading-[0.95]">
              Eyes that<br />
              <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400">
                truly see.
              </span>
            </h2>
            <p className="mt-5 text-foreground/60 leading-relaxed">
              Drop a screenshot, photo, or design. Ozing scans, reads UI text, recognizes brands,
              and explains intent — pixel by pixel.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {[
                { icon: Eye, label: "Screen analysis" },
                { icon: Camera, label: "Image to text" },
                { icon: ScanFace, label: "UI inspector" },
                { icon: Cpu, label: "Real-time OCR" },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -3 }}
                  className="flex items-center gap-2.5 glass rounded-2xl px-3.5 py-3 border border-foreground/10 hover:border-primary/30 transition-colors"
                >
                  <f.icon className="size-4 text-primary" />
                  <span className="text-sm font-medium">{f.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative aspect-square max-w-md mx-auto"
            onMouseEnter={() => setOzingMood("focus")}
            onMouseLeave={() => setOzingMood("idle")}
          >
            {/* Scanning frame */}
            <div className="absolute inset-0 rounded-[2.5rem] glass-strong border border-foreground/10 overflow-hidden">
              {/* Scan grid */}
              <div className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />
              {/* Scan line */}
              <motion.div
                className="absolute left-0 right-0 h-32 pointer-events-none"
                style={{ background: "linear-gradient(to bottom, transparent, hsl(188 95% 56% / 0.4), transparent)" }}
                animate={{ y: ["-30%", "130%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              {/* Corner brackets */}
              {[
                "top-3 left-3 border-t border-l",
                "top-3 right-3 border-t border-r",
                "bottom-3 left-3 border-b border-l",
                "bottom-3 right-3 border-b border-r",
              ].map((cls, i) => (
                <div key={i} className={`absolute size-6 border-primary ${cls}`} />
              ))}
              {/* Ozing inside */}
              <div className="absolute inset-0 grid place-items-center">
                <Ozing3D mood={ozingMood === "focus" ? "focus" : "curious"} size={240} followCursor glow />
              </div>
              {/* Tag pill */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest">
                <span className="size-1.5 rounded-full bg-secondary animate-pulse" />
                <span className="text-foreground/70">scanning…</span>
                <span className="ml-auto text-foreground/40">98% confidence</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ SCENE 5 — SOCIAL PORTALS ============ */}
      <section id="social" className="relative z-10 container py-32">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <span className="chip"><Wand2 className="size-3" /> Scene 05 — Social Portals</span>
          <h2 className="mt-5 font-display text-5xl md:text-7xl tracking-tighter leading-[0.95]">
            One tap.<br />
            <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-cyan-400">
              Any platform.
            </span>
          </h2>
          <p className="mt-5 text-foreground/60">
            Type "open TikTok" or "what's @username's last post?" — Ozing opens the app,
            fetches context, and brings the world to your cockpit.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {SOCIALS.map((s, i) => (
            <motion.a
              key={s.name}
              href="#"
              initial={{ opacity: 0, y: 30, rotateY: -20 }}
              whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -10, scale: 1.03 }}
              className="group relative aspect-[3/4] rounded-3xl overflow-hidden glass-strong border border-foreground/10 hover:border-foreground/30 transition-colors"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Portal gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-30 group-hover:opacity-50 transition-opacity duration-500`} />
              {/* Vortex layers */}
              <motion.div
                className={`absolute inset-12 rounded-full bg-gradient-to-br ${s.color} blur-2xl opacity-50 group-hover:opacity-80 transition-opacity`}
                animate={{ scale: [1, 1.15, 1], rotate: 360 }}
                transition={{ scale: { duration: 4, repeat: Infinity }, rotate: { duration: 20, repeat: Infinity, ease: "linear" } }}
              />
              <div className="relative h-full p-5 flex flex-col justify-between">
                <div className="text-[10px] font-mono uppercase tracking-widest text-white/70">portal {`/`} 0{i + 1}</div>
                <div>
                  <div className="font-display text-xl tracking-tight text-white">{s.name}</div>
                  <div className="text-xs text-white/70 mt-1 font-mono">{s.handle}</div>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs text-white/90 font-medium">
                    Open <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </section>

      {/* ============ SCENE 6 — WHY MV AI ============ */}
      <section className="relative z-10 container py-32">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <span className="chip"><Lightbulb className="size-3" /> Why MV AI</span>
          <h2 className="mt-5 font-display text-5xl md:text-6xl tracking-tighter leading-[0.95]">
            Built for the<br />
            <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-violet-400">
              next decade.
            </span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Zap, title: "Instant", desc: "Streams from the first token. No waiting screens, no spinners." , color: "from-amber-400 to-orange-500" },
            { icon: Cpu, title: "Multi-mind", desc: "Eight specialized AI minds in one fluid workspace." , color: "from-violet-400 to-fuchsia-500" },
            { icon: Shield, title: "Private", desc: "Your conversations stay yours. End-to-end secured." , color: "from-cyan-400 to-blue-500" },
          ].map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
            >
              <TiltCard className="h-full glass-strong rounded-3xl p-8 border border-foreground/10 hover:border-foreground/25 transition-colors">
                <div className={`size-12 rounded-2xl bg-gradient-to-br ${v.color} grid place-items-center text-white shadow-lg shadow-black/30 mb-5`}>
                  <v.icon className="size-5" />
                </div>
                <h3 className="font-display text-2xl tracking-tight">{v.title}</h3>
                <p className="text-sm text-foreground/60 mt-2 leading-relaxed">{v.desc}</p>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============ MANIFESTO ============ */}
      <section className="relative z-10 container py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto text-center"
        >
          <span className="chip"><Quote className="size-3" /> Manifesto</span>
          <p className="mt-6 font-serif text-3xl md:text-5xl leading-[1.1]">
            We believe AI should feel <em className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-violet-400">alive</em>.
            Not corporate. Not sterile. <em className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400">Cinematic.</em>
          </p>
          <p className="mt-6 font-serif text-2xl md:text-4xl leading-[1.15] text-foreground/60">
            That's why we built <em className="text-foreground">MV AI</em> around <em className="text-foreground">Ozing</em>.
          </p>
        </motion.div>
      </section>

      {/* ============ SCENE 7 — FINAL CTA ============ */}
      <section className="relative z-10 py-32 overflow-hidden">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative rounded-[2.5rem] glass-strong border border-foreground/10 p-10 md:p-16 text-center overflow-hidden"
          >
            {/* Halo */}
            <div className="absolute inset-0 opacity-50">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[60rem] rounded-full"
                style={{ background: "radial-gradient(circle, hsl(268 92% 70% / 0.3) 0%, transparent 50%)" }}
              />
            </div>

            {/* Final Ozing */}
            <div className="relative mx-auto mb-8 flex justify-center">
              <Ozing3D mood="happy" size={240} followCursor glow />
            </div>

            <h2 className="relative font-display text-5xl md:text-7xl tracking-tighter leading-[0.95]">
              Step into the<br />
              <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-violet-400 to-pink-400">
                cockpit.
              </span>
            </h2>
            <p className="relative mt-5 text-foreground/65 max-w-xl mx-auto">
              Free to start. No credit card. Ozing is waiting.
            </p>
            <div className="relative mt-9 flex items-center justify-center gap-3 flex-wrap">
              <Magnetic strength={14}>
                <Link to="/auth?mode=signup">
                  <Button size="lg" className="rounded-full h-14 px-9 bg-gradient-to-br from-primary via-tertiary to-secondary text-white hover:opacity-95 shine font-semibold text-base shadow-[0_0_60px_-10px_hsl(268_92%_70%_/_0.6)]">
                    Enter MV AI <ArrowRight className="ml-1" />
                  </Button>
                </Link>
              </Magnetic>
              <Link to="/auth">
                <Button size="lg" variant="ghost" className="rounded-full h-14 px-7 font-semibold hover:bg-foreground/5">
                  I already have an account
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="relative z-10 border-t border-foreground/10 py-10">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <BrandMark size={24} />
            <span className="font-display font-bold text-sm">MV AI</span>
            <span className="text-xs text-foreground/40">© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-foreground/50">
            <a href="#modes" className="hover:text-foreground transition">Modes</a>
            <a href="#agents" className="hover:text-foreground transition">Agents</a>
            <Link to="/auth" className="hover:text-foreground transition">Sign in</Link>
          </div>
        </div>
      </footer>

      {/* ============ SECRET SIGNATURE — only on landing, after footer ============ */}
      <SecretSignature />
    </div>
  );
}
