import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Ozing, OzingMood } from "@/components/Ozing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Mail, Lock, User } from "lucide-react";

export default function Auth() {
  const [params] = useSearchParams();
  const initialMode = params.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<"login" | "signup" | "forgot">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [mood, setMood] = useState<OzingMood>("idle");
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => { if (user) navigate("/chat", { replace: true }); }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMood("thinking");
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/chat`,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        setMood("celebrate");
        toast.success("Welcome to MV AI", { description: "Ozing is ready for you." });
        navigate("/chat", { replace: true });
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMood("love");
        navigate("/chat", { replace: true });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMood("happy");
        toast.success("Check your inbox for a reset link.");
        setMode("login");
      }
    } catch (err: any) {
      setMood("error");
      toast.error(err.message || "Something went wrong");
      setTimeout(() => setMood("idle"), 1800);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="fixed inset-0 mesh-bg pointer-events-none" />
      <div className="fixed inset-0 aurora-bg pointer-events-none opacity-70" />
      <div className="fixed inset-0 dot-grid-fade pointer-events-none opacity-40" />
      <motion.div
        className="fixed top-1/4 -right-40 w-[36rem] h-[36rem] rounded-full bg-primary/20 blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.15, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="fixed bottom-1/4 -left-40 w-[36rem] h-[36rem] rounded-full bg-tertiary/20 blur-3xl pointer-events-none"
        animate={{ scale: [1.1, 1, 1.1], rotate: [0, -90, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />

      <Link to="/" className="absolute top-6 left-6 z-20">
        <Button variant="ghost" size="sm" className="glass rounded-full"><ArrowLeft className="size-4 mr-1" /> Back</Button>
      </Link>

      <div className="relative z-10 grid md:grid-cols-2 gap-8 max-w-4xl w-full items-center">
        {/* Left — Ozing showcase */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="hidden md:flex flex-col items-center text-center"
        >
          <div className="relative">
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/30 via-tertiary/30 to-secondary/30 blur-3xl scale-125"
              animate={{ scale: [1.2, 1.4, 1.2] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <Ozing mood={mood} size={260} followCursor />
          </div>
          <h2 className="mt-6 font-display text-3xl font-black tracking-tighter">
            <span className="font-serif italic text-primary">Hi</span>, I'm Ozing.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs">
            Your AI companion. I react to everything you do — even your password.
          </p>
        </motion.div>

        {/* Right — form card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          {/* Mobile only Ozing */}
          <div className="md:hidden flex justify-center mb-4">
            <Ozing mood={mood} size={120} />
          </div>

          <div className="glass-strong rounded-3xl p-7 md:p-8 shadow-elev">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="text-3xl md:text-4xl font-display font-black tracking-tighter">
                  {mode === "signup" ? <>Make an <span className="font-serif italic text-primary">account</span></> :
                   mode === "forgot" ? <>Reset your <span className="font-serif italic text-primary">password</span></> :
                   <>Welcome <span className="font-serif italic text-primary">back</span></>}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {mode === "signup" ? "Free forever. No credit card." :
                   mode === "forgot" ? "We'll email you a link." :
                   "Ozing missed you."}
                </p>
              </motion.div>
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <AnimatePresence mode="popLayout">
                {mode === "signup" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider">Name</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
                        className="pl-10 h-11 rounded-xl bg-background/60"
                        onFocus={() => setMood("curious")} onBlur={() => setMood("idle")} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider">Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com"
                    className="pl-10 h-11 rounded-xl bg-background/60"
                    onFocus={() => setMood("peek")} onBlur={() => setMood("idle")} />
                </div>
              </div>

              {mode !== "forgot" && (
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider">Password</Label>
                    {mode === "login" && (
                      <button type="button" onClick={() => setMode("forgot")} className="text-xs text-primary hover:underline">Forgot?</button>
                    )}
                  </div>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                      className="pl-10 h-11 rounded-xl bg-background/60"
                      onFocus={() => setMood("shy")} onBlur={() => setMood("idle")} />
                  </div>
                </div>
              )}

              <Button type="submit" disabled={loading}
                className="w-full bg-ink text-ink-foreground hover:bg-ink/90 rounded-xl h-12 font-semibold shine mt-2">
                {loading && <Loader2 className="animate-spin size-4" />}
                {mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
              </Button>
            </form>

            <div className="mt-5 text-center text-sm text-muted-foreground">
              {mode === "login" ? (
                <>New here? <button onClick={() => setMode("signup")} className="text-primary font-semibold hover:underline">Create account</button></>
              ) : mode === "signup" ? (
                <>Already have one? <button onClick={() => setMode("login")} className="text-primary font-semibold hover:underline">Sign in</button></>
              ) : (
                <button onClick={() => setMode("login")} className="text-primary font-semibold hover:underline">Back to sign in</button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
