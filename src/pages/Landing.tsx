import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Ozing } from "@/components/Ozing";
import { MODEL_LIST } from "@/lib/models";
import { ArrowRight, Sparkles, Zap, Globe, Shield, Mic, Eye, Code2 } from "lucide-react";

export default function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Background — fixed nebula */}
      <div className="fixed inset-0 nebula-bg pointer-events-none" />
      <div className="fixed inset-0 mesh-bg opacity-40 pointer-events-none" />
      <motion.div
        className="fixed -top-32 -right-32 w-[42rem] h-[42rem] rounded-full bg-primary/20 blur-3xl pointer-events-none"
        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="fixed -bottom-32 -left-32 w-[42rem] h-[42rem] rounded-full bg-tertiary/20 blur-3xl pointer-events-none"
        animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Header */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-20 sticky top-0 backdrop-blur-xl bg-background/40 border-b border-border/40"
      >
        <div className="container flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <motion.div
              className="size-9 rounded-2xl bg-ink grid place-items-center shadow-lg"
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
            >
              <span className="font-display font-black text-ink-foreground text-sm">M</span>
            </motion.div>
            <span className="font-display font-black text-lg tracking-tight">MV AI</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#models" className="hover:text-primary transition-colors">Models</a>
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#manifesto" className="hover:text-primary transition-colors">Manifesto</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link to="/auth?mode=signup">
              <Button size="sm" className="rounded-full bg-ink text-ink-foreground hover:bg-ink/90 shine">
                Get started <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.header>

      {/* HERO */}
      <section ref={heroRef} className="relative z-10 pt-16 md:pt-24 pb-32">
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="container text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex"
          >
            <span className="chip">
              <span className="size-1.5 rounded-full bg-primary animate-ping-slow" />
              Now in early access — meet Ozing
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 font-display font-black text-[2.75rem] sm:text-6xl md:text-8xl leading-[0.95] tracking-tighter"
          >
            AI that <span className="font-serif italic text-primary">feels</span><br />
            <span className="text-gradient">alive.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-6 text-base md:text-xl text-muted-foreground max-w-xl mx-auto"
          >
            MV AI is a multi-model workspace built around <strong className="text-foreground">Ozing</strong>, a custom mascot that reacts, breathes, and helps. Six minds. One companion.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-8 flex items-center justify-center gap-3 flex-wrap"
          >
            <Link to="/auth?mode=signup">
              <Button size="lg" className="rounded-full bg-ink text-ink-foreground hover:bg-ink/90 h-12 px-7 shadow-elev shine font-semibold">
                Start chatting free <ArrowRight className="ml-1" />
              </Button>
            </Link>
            <a href="#models">
              <Button size="lg" variant="outline" className="rounded-full glass h-12 px-7 font-semibold">
                Explore models
              </Button>
            </a>
          </motion.div>

          {/* Hero Ozing */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-16 relative mx-auto"
            style={{ width: 320, height: 320 }}
          >
            {/* Orbiting elements */}
            <div className="absolute inset-0 animate-spin-slow">
              {MODEL_LIST.slice(0, 6).map((m, i) => {
                const angle = (i / 6) * Math.PI * 2;
                const r = 150;
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;
                const Icon = m.icon;
                return (
                  <motion.div
                    key={m.id}
                    className="absolute top-1/2 left-1/2 size-12 -ml-6 -mt-6 rounded-2xl glass-strong grid place-items-center shadow-soft"
                    style={{ x, y }}
                    whileHover={{ scale: 1.2 }}
                  >
                    <Icon className="size-5" style={{ color: `hsl(${m.gem})` }} />
                  </motion.div>
                );
              })}
            </div>
            {/* Ozing center */}
            <div className="absolute inset-0 grid place-items-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/30 via-tertiary/30 to-secondary/30 blur-3xl scale-125" />
                <Ozing mood="happy" size={200} followCursor />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Marquee strip */}
      <div className="relative z-10 py-6 border-y border-border/40 bg-ink text-ink-foreground overflow-hidden">
        <div className="marquee whitespace-nowrap">
          {[...Array(2)].map((_, k) => (
            <div key={k} className="flex gap-12 items-center font-display font-bold text-2xl shrink-0">
              <span>HUMANOID</span><span className="text-primary">✦</span>
              <span>IDEAL</span><span className="text-tertiary">✦</span>
              <span>CODE</span><span className="text-secondary">✦</span>
              <span>VISION</span><span className="text-accent">✦</span>
              <span>SEARCH</span><span className="text-primary">✦</span>
              <span>VOICE</span><span className="text-secondary">✦</span>
            </div>
          ))}
        </div>
      </div>

      {/* MODELS — Bento grid */}
      <section id="models" className="relative z-10 container py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="chip">Six minds</span>
          <h2 className="mt-4 font-display text-4xl md:text-6xl font-black tracking-tighter">
            One Ozing, <span className="font-serif italic text-tertiary">many</span> minds.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Each mode has its own personality, gem color, and superpower. Switch instantly mid-conversation.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MODEL_LIST.map((m, i) => {
            const Icon = m.icon;
            const isLarge = i === 0 || i === 4;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -6 }}
                className={`bento group ${isLarge ? "md:col-span-2 md:row-span-1" : ""}`}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 30% 20%, hsl(${m.gem} / 0.15), transparent 60%)` }}
                />
                <div className="relative flex items-start justify-between mb-6">
                  <motion.div
                    whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className={`size-14 rounded-2xl bg-gradient-to-br ${m.gradient} grid place-items-center text-white shadow-lg`}
                  >
                    <Icon className="size-6" />
                  </motion.div>
                  <span className="text-xs font-mono opacity-50 uppercase tracking-widest">0{i + 1}</span>
                </div>
                <h3 className="font-display font-black text-2xl tracking-tight">{m.name}</h3>
                <p className="text-sm font-serif italic text-muted-foreground mt-1">{m.tagline}</p>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{m.description}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative z-10 container py-24">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <span className="chip">Reactive</span>
            <h2 className="mt-4 font-display text-4xl md:text-6xl font-black tracking-tighter">
              A mascot that <span className="font-serif italic text-primary">listens.</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-md">
              Ozing reacts in real time — covers her eyes when you type a password, perks her ears when listening, blinks when curious, sparkles when celebrating.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {[
                { icon: Eye, label: "16+ moods" },
                { icon: Zap, label: "Spring physics" },
                { icon: Globe, label: "Web-aware" },
                { icon: Mic, label: "Voice mode" },
                { icon: Code2, label: "Code-first" },
                { icon: Shield, label: "Private by default" },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-2.5 glass rounded-xl px-3 py-2.5"
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
            transition={{ duration: 0.7 }}
            className="relative aspect-square max-w-md mx-auto"
          >
            <div className="absolute inset-8 rounded-3xl bg-gradient-to-br from-primary/20 via-tertiary/20 to-secondary/20 blur-2xl" />
            <div className="relative h-full glass-strong rounded-[2.5rem] p-8 grid place-items-center shadow-elev">
              <Ozing mood="love" size={240} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* MANIFESTO — big serif */}
      <section id="manifesto" className="relative z-10 container py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto text-center"
        >
          <span className="chip">Manifesto</span>
          <p className="mt-6 font-serif text-3xl md:text-5xl leading-[1.1] text-foreground">
            We believe AI should feel <em className="text-primary">human</em>. Not robotic. Not corporate. Not sterile. It should have a face, a heartbeat, and an opinion.
          </p>
          <p className="mt-6 font-serif text-3xl md:text-5xl leading-[1.1] text-muted-foreground">
            That's why we built <em className="text-tertiary">Ozing</em>.
          </p>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="relative z-10 container py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative bg-ink text-ink-foreground rounded-[2.5rem] p-10 md:p-16 overflow-hidden noise"
        >
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-tertiary/30 blur-3xl" />
          <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="font-display text-4xl md:text-6xl font-black tracking-tighter">
                Ready to meet <span className="font-serif italic text-primary">Ozing</span>?
              </h2>
              <p className="mt-4 text-ink-foreground/70 max-w-md">
                Free to start. No credit card. Just a cat and six minds waiting to help.
              </p>
              <div className="mt-8 flex gap-3 flex-wrap">
                <Link to="/auth?mode=signup">
                  <Button size="lg" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-7 font-semibold shine">
                    Start free <ArrowRight className="ml-1" />
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="lg" variant="outline" className="rounded-full bg-transparent border-ink-foreground/30 text-ink-foreground hover:bg-ink-foreground/10 h-12 px-7 font-semibold">
                    Sign in
                  </Button>
                </Link>
              </div>
            </div>
            <div className="grid place-items-center">
              <Ozing mood="celebrate" size={220} />
            </div>
          </div>
        </motion.div>
      </section>

      <footer className="relative z-10 container py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground border-t border-border/40">
        <div className="flex items-center gap-2">
          <span className="size-6 rounded-lg bg-ink grid place-items-center text-ink-foreground text-xs font-black">M</span>
          MV AI · Crafted with care
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          <a href="#" className="hover:text-foreground transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  );
}
