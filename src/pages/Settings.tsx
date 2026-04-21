import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Ozing } from "@/components/Ozing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, LogOut, Loader2 } from "lucide-react";

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

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 aurora-bg pointer-events-none" />
      <div className="relative z-10 container max-w-2xl py-8">
        <div className="flex items-center justify-between mb-6">
          <Link to="/chat"><Button variant="ghost" size="sm"><ArrowLeft className="size-4 mr-1" /> Chat</Button></Link>
          <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/"); }}><LogOut className="size-4 mr-1" /> Sign out</Button>
        </div>

        <div className="glass-strong rounded-3xl p-6 md:p-8 shadow-soft">
          <div className="flex items-center gap-4 mb-6">
            <Ozing mood="happy" size={80} />
            <div>
              <h1 className="font-display text-2xl font-bold">Settings</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <Label>Display name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Ozing's personality</Label>
              <div className="flex gap-2 mt-1">
                {["playful", "calm", "silent"].map((p) => (
                  <button key={p} onClick={() => setPersonality(p)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition ${personality === p ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>{p}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Sound cues</Label>
                <p className="text-xs text-muted-foreground">Tiny chirps and purrs from Ozing.</p>
              </div>
              <Switch checked={sound} onCheckedChange={setSound} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Voice mode</Label>
                <p className="text-xs text-muted-foreground">Mic input and spoken replies.</p>
              </div>
              <Switch checked={voice} onCheckedChange={setVoice} />
            </div>

            <Button onClick={save} disabled={saving} className="rounded-xl">
              {saving && <Loader2 className="size-4 animate-spin" />} Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
