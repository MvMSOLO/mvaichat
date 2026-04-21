import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Ozing } from "@/components/Ozing";
import { MODEL_LIST } from "@/lib/models";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Aurora background */}
      <div className="fixed inset-0 aurora-bg pointer-events-none" />
      <div className="fixed -top-40 -right-40 w-[36rem] h-[36rem] rounded-full bg-primary/30 blur-3xl animate-blob pointer-events-none" />
      <div className="fixed -bottom-40 -left-40 w-[36rem] h-[36rem] rounded-full bg-secondary/30 blur-3xl animate-blob pointer-events-none" style={{ animationDelay: "2s" }} />

      {/* Header */}
      <header className="relative z-10 container flex items-center justify-between py-6">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl">
          <span className="size-8 rounded-xl bg-gradient-to-br from-primary to-secondary grid place-items-center text-white">
            <Sparkles className="size-4" />
          </span>
          MV&nbsp;AI
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/auth"><Button variant="ghost">Sign in</Button></Link>
          <Link to="/auth?mode=signup"><Button>Get started</Button></Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 container pt-12 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mb-8 grid place-items-center"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/40 via-secondary/40 to-accent/40 blur-2xl scale-110" />
            <div className="relative glass rounded-full p-6 shadow-elev">
              <Ozing mood="happy" size={180} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-medium text-primary mb-4">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Meet Ozing — your animated AI companion
          </span>
          <h1 className="font-display font-extrabold text-5xl md:text-7xl tracking-tight mb-4">
            <span className="text-gradient">Smarter chat,</span><br />with feelings.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            MV AI is a multi-model AI workspace built around Ozing, a custom mascot that reacts to everything you do. Ask, code, see, and speak.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link to="/auth?mode=signup">
              <Button size="lg" className="rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-glow hover:scale-105 transition-transform">
                Start chatting <ArrowRight className="ml-1" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="rounded-full glass">Sign in</Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Models grid */}
      <section className="relative z-10 container pb-24">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-3">Six minds, one Ozing</h2>
        <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">Switch between native modes purpose-built for conversation, reasoning, code, vision, search, and voice.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODEL_LIST.map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                className="glass rounded-2xl p-5 group cursor-default"
              >
                <div className={`size-11 rounded-xl bg-gradient-to-br ${m.gradient} grid place-items-center text-white mb-3 shadow-soft group-hover:scale-110 transition-transform`}>
                  <Icon className="size-5" />
                </div>
                <h3 className="font-display font-bold text-lg">{m.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{m.description}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <footer className="relative z-10 container py-8 text-center text-sm text-muted-foreground">
        Crafted with care · MV AI
      </footer>
    </div>
  );
}
