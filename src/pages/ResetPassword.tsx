import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Ozing } from "@/components/Ozing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase emits PASSWORD_RECOVERY when user lands from reset email
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // If the hash already has type=recovery, also enable
    if (window.location.hash.includes("type=recovery")) setReady(true);
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("Passwords don't match"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    navigate("/chat", { replace: true });
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <div className="fixed inset-0 aurora-bg pointer-events-none" />
      <div className="relative z-10 w-full max-w-md glass-strong rounded-3xl p-8 shadow-elev">
        <div className="flex justify-center mb-2"><Ozing mood={ready ? "curious" : "sleep"} size={120} /></div>
        <h1 className="text-2xl font-display font-bold text-center mb-1">Set a new password</h1>
        <p className="text-center text-muted-foreground text-sm mb-6">
          {ready ? "Pick something you'll remember." : "Waiting for recovery link…"}
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="pw">New password</Label>
            <Input id="pw" type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} disabled={!ready} />
          </div>
          <div>
            <Label htmlFor="cf">Confirm</Label>
            <Input id="cf" type="password" minLength={6} required value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={!ready} />
          </div>
          <Button type="submit" disabled={loading || !ready} className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground">
            {loading && <Loader2 className="animate-spin size-4" />} Update password
          </Button>
        </form>
      </div>
    </div>
  );
}
