import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Ozing } from "@/components/Ozing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, LogOut, Loader2, User, Sparkles, Volume2, Mic } from "lucide-react";

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [personality, setPersonality] = useState("playful");
  const [sound, setSound] = useState(true);
  const [voice, setVoice] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("profiles").select("display_name, mascot_personality").eq("id", user.id).maybeSingle(),
      supabase.from("user_settings").select("sound_enabled, voice_enabled").eq("user_id", user.id).maybeSingle(),
    ]).then(([p, s]) => {
      if (p.data) { setName(p.data.display_name || ""); setPersonality(p.data.mascot_personality || "playful"); }
      if (s.data) { setSound(s.data.sound_enabled); setVoice(s.data.voice_enabled); }
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const [r1, r2] = await Promise.all([
      supabase.from("profiles").update({ display_name: name, mascot_personality: personality }).eq("id", user.id),
      supabase.from("user_settings").update({ sound_enabled: sound, voice_enabled: voice }).eq("user_id", user.id),
    ]);
    setSaving(false);
    if (r1.error || r2.error) toast.error("Couldn't save"); else toast.success("Saved");
  };

  const moodForPersonality = personality === "playful" ? "happy" : personality === "calm" ? "idle" : "sleep";

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 mesh-bg pointer-events-none" />
      <div className="fixed inset-0 nebula-bg opacity-40 pointer-events-none" />
      <div className="relative z-10 container max-w-3xl py-8">
        <div className="flex items-center justify-between mb-8">
          <Link to="/chat"><Button variant="ghost" size="sm" className="glass rounded-full"><ArrowLeft className="size-4 mr-1" /> Chat</Button></Link>
          <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/"); }} className="rounded-full"><LogOut className="size-4 mr-1" /> Sign out</Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-strong rounded-[2rem] p-7 md:p-10 shadow-elev"
        >
          <div className="flex items-center gap-5 mb-8 pb-6 border-b border-border/60">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/30 blur-2xl" />
              <Ozing mood={moodForPersonality as any} size={100} />
            </div>
            <div>
              <h1 className="font-display text-3xl font-black tracking-tighter">
                <span className="font-serif italic text-primary">Hello,</span> {name || "you"}
              </h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-6">
            <SettingRow icon={User} label="Display name" desc="How Ozing greets you.">
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10 rounded-xl bg-background/60 max-w-xs" />
            </SettingRow>

            <SettingRow icon={Sparkles} label="Ozing's personality" desc="How playful she is.">
              <div className="flex gap-2 flex-wrap">
                {["playful", "calm", "silent"].map((p) => (
                  <motion.button
                    key={p} type="button"
                    onClick={() => setPersonality(p)}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${personality === p ? "bg-ink text-ink-foreground border-ink" : "border-border hover:bg-muted"}`}
                  >{p}</motion.button>
                ))}
              </div>
            </SettingRow>

            <SettingRow icon={Volume2} label="Sound cues" desc="Tiny chirps and purrs.">
              <Switch checked={sound} onCheckedChange={setSound} />
            </SettingRow>

            <SettingRow icon={Mic} label="Voice mode" desc="Mic input and spoken replies.">
              <Switch checked={voice} onCheckedChange={setVoice} />
            </SettingRow>
          </div>

          <Button onClick={save} disabled={saving} className="rounded-xl mt-8 bg-ink text-ink-foreground hover:bg-ink/90 h-11 px-6 font-semibold shine">
            {saving && <Loader2 className="size-4 animate-spin" />} Save changes
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

function SettingRow({ icon: Icon, label, desc, children }: any) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className="size-9 rounded-xl bg-muted grid place-items-center shrink-0">
          <Icon className="size-4 text-primary" />
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-sm">{label}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
