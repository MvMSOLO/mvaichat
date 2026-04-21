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
import { ArrowLeft, Loader2 } from "lucide-react";

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
        toast.success("Welcome to MV AI!", { description: "You're all set." });
        navigate("/chat", { replace: true });
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMood("celebrate");
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
      setTimeout(() => setMood("idle"), 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <div className="fixed inset-0 aurora-bg pointer-events-none" />
      <div className="fixed -top-40 -right-40 w-[36rem] h-[36rem] rounded-full bg-primary/25 blur-3xl animate-blob pointer-events-none" />

      <Link to="/" className="absolute top-6 left-6 z-10">
        <Button variant="ghost" size="sm" className="glass"><ArrowLeft className="size-4 mr-1" /> Back</Button>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md glass-strong rounded-3xl p-8 shadow-elev"
      >
        <div className="flex justify-center mb-2">
          <Ozing mood={mood} size={120} />
        </div>
        <h1 className="text-2xl font-display font-bold text-center mb-1">
          {mode === "signup" ? "Join MV AI" : mode === "forgot" ? "Reset password" : "Welcome back"}
        </h1>
        <p className="text-center text-muted-foreground text-sm mb-6">
          {mode === "signup" ? "Ozing's been waiting." : mode === "forgot" ? "We'll send you a link." : "Ozing missed you."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="popLayout">
            {mode === "signup" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <Label htmlFor="name">Display name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
                  onFocus={() => setMood("curious")} onBlur={() => setMood("idle")} />
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com"
              onFocus={() => setMood("peek")} onBlur={() => setMood("idle")} />
          </div>

          {mode !== "forgot" && (
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {mode === "login" && (
                  <button type="button" onClick={() => setMode("forgot")} className="text-xs text-primary hover:underline">Forgot?</button>
                )}
              </div>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                onFocus={() => setMood("shy")} onBlur={() => setMood("idle")} />
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-glow rounded-xl h-11">
            {loading && <Loader2 className="animate-spin size-4" />}
            {mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
          </Button>
        </form>

        <div className="mt-5 text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>New here? <button onClick={() => setMode("signup")} className="text-primary font-medium hover:underline">Create account</button></>
          ) : mode === "signup" ? (
            <>Already have an account? <button onClick={() => setMode("login")} className="text-primary font-medium hover:underline">Sign in</button></>
          ) : (
            <button onClick={() => setMode("login")} className="text-primary font-medium hover:underline">Back to sign in</button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
