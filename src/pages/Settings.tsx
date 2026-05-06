import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Ozing3D } from "@/components/Ozing3D";
import { InstallPrompt } from "@/components/InstallPrompt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  ArrowLeft, LogOut, Loader2, User, Sparkles, Volume2, Mic, Smartphone,
  Languages, Gauge, FlaskConical, Shield, Heart,
} from "lucide-react";

const PERSONAS = [
  { id: "friend", label: "Do'st" },
  { id: "professional", label: "Professional" },
  { id: "funny", label: "Hazilkash" },
  { id: "mentor", label: "Mentor" },
  { id: "poet", label: "Shoir" },
];
const LANGS = [
  { id: "auto", label: "Avtomatik" },
  { id: "Uzbek", label: "O'zbek" },
  { id: "Russian", label: "Русский" },
  { id: "English", label: "English" },
];
const LENGTHS = [
  { id: "short", label: "Qisqa" },
  { id: "balanced", label: "Balansli" },
  { id: "long", label: "Batafsil" },
];
const PERMS = [
  { key: "contacts", label: "Kontakt" },
  { key: "sms", label: "SMS" },
  { key: "call", label: "Qo'ng'iroq" },
  { key: "instagram", label: "Instagram" },
  { key: "telegram", label: "Telegram" },
  { key: "youtube", label: "YouTube" },
  { key: "github", label: "GitHub" },
  { key: "microphone", label: "Mikrofon" },
  { key: "camera", label: "Kamera" },
  { key: "location", label: "Joylashuv" },
];

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [personality, setPersonality] = useState("playful");
  const [sound, setSound] = useState(true);
  const [voice, setVoice] = useState(true);
  const [persona, setPersona] = useState("friend");
  const [language, setLanguage] = useState("auto");
  const [length, setLength] = useState("balanced");
  const [demo, setDemo] = useState(false);
  const [adult, setAdult] = useState(false);
  const [perms, setPerms] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("profiles").select("display_name, mascot_personality").eq("id", user.id).maybeSingle(),
      supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle(),
    ]).then(([p, s]) => {
      if (p.data) { setName(p.data.display_name || ""); setPersonality(p.data.mascot_personality || "playful"); }
      if (s.data) {
        setSound(s.data.sound_enabled);
        setVoice(s.data.voice_enabled);
        setPersona((s.data as any).persona || "friend");
        setLanguage((s.data as any).language || "auto");
        setLength((s.data as any).response_length || "balanced");
        setDemo(!!(s.data as any).demo_mode);
        setAdult(!!(s.data as any).adult_mode);
        setPerms((s.data as any).permissions || {});
      }
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const [r1, r2] = await Promise.all([
      supabase.from("profiles").update({ display_name: name, mascot_personality: personality }).eq("id", user.id),
      supabase.from("user_settings").update({
        sound_enabled: sound,
        voice_enabled: voice,
        persona,
        language,
        response_length: length,
        demo_mode: demo,
        adult_mode: adult,
        permissions: perms,
      } as any).eq("user_id", user.id),
    ]);
    setSaving(false);
    if (r1.error || r2.error) toast.error("Couldn't save"); else toast.success("Saqlandi");
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 mesh-bg pointer-events-none" />
      <div className="fixed inset-0 aurora-bg opacity-40 pointer-events-none" />
      <div className="fixed inset-0 dot-grid-fade pointer-events-none opacity-30" />
      <div className="relative z-10 container max-w-3xl py-8">
        <div className="flex items-center justify-between mb-8">
          <Link to="/chat"><Button variant="ghost" size="sm" className="glass rounded-full"><ArrowLeft className="size-4 mr-1" /> Chat</Button></Link>
          <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/"); }} className="rounded-full"><LogOut className="size-4 mr-1" /> Chiqish</Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-strong rounded-[2rem] p-7 md:p-10 shadow-elev"
        >
          <div className="flex items-center gap-5 mb-8 pb-6 border-b border-foreground/10">
            <Ozing3D
              mood={personality === "playful" ? "happy" : personality === "calm" ? "idle" : "think"}
              size={120}
              glow
            />
            <div>
              <h1 className="font-display text-3xl tracking-tighter">
                <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-violet-400">Salom,</span> {name || "do'stim"}
              </h1>
              <p className="text-sm text-foreground/60">{user?.email}</p>
              <p className="text-[11px] text-foreground/50 mt-1">Owner: <span className="font-semibold text-cyan-300">Avazbek Mirzayev</span></p>
            </div>
          </div>

          <Section title="Profil" icon={User}>
            <Row label="Ism">
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10 rounded-xl bg-background/60 max-w-xs" />
            </Row>
            <Row label="Ozing personality">
              <Chips options={[{id:"playful",label:"Playful"},{id:"calm",label:"Calm"},{id:"silent",label:"Silent"}]} value={personality} onChange={setPersonality} />
            </Row>
          </Section>

          <Section title="AI suhbat uslubi" icon={Heart}>
            <Row label="Persona">
              <Chips options={PERSONAS} value={persona} onChange={setPersona} />
            </Row>
            <Row label="Til" iconL={Languages}>
              <Chips options={LANGS} value={language} onChange={setLanguage} />
            </Row>
            <Row label="Javob uzunligi" iconL={Gauge}>
              <Chips options={LENGTHS} value={length} onChange={setLength} />
            </Row>
          </Section>

          <Section title="Ovoz va sound" icon={Volume2}>
            <Row label="Sound cues"><Switch checked={sound} onCheckedChange={setSound} /></Row>
            <Row label="Voice mode" iconL={Mic}><Switch checked={voice} onCheckedChange={setVoice} /></Row>
          </Section>

          <Section title="Demo rejim" icon={FlaskConical}>
            <Row label="Demo (real harakat bajarmasdan ko'rsatish)" desc="Yoqilganda AI SMS yubormaydi, follow bosmaydi — faqat namoyish qiladi.">
              <Switch checked={demo} onCheckedChange={setDemo} />
            </Row>
            <Row label="Erkin rejim (18+)" desc="Yoqilganda AI ochiq, dadil, sertstik javoblar yoza oladi. Real shikast yoki noqonuniy harakatlar baribir taqiqlanadi.">
              <Switch checked={adult} onCheckedChange={setAdult} />
            </Row>
          </Section>

          <Section title="Ruxsatlar" icon={Shield}>
            <div className="grid grid-cols-2 gap-3">
              {PERMS.map((p) => (
                <div key={p.key} className="flex items-center justify-between rounded-xl border border-border/40 px-3 py-2">
                  <span className="text-sm">{p.label}</span>
                  <Switch checked={!!perms[p.key]} onCheckedChange={(v) => setPerms({ ...perms, [p.key]: v })} />
                </div>
              ))}
            </div>
          </Section>

          <Button onClick={save} disabled={saving} className="rounded-xl mt-8 bg-ink text-ink-foreground hover:bg-ink/90 h-11 px-6 font-semibold shine">
            {saving && <Loader2 className="size-4 animate-spin" />} Saqlash
          </Button>

          <div className="mt-10 pt-6 border-t border-foreground/10">
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="size-4 text-cyan-300" />
              <h2 className="font-display font-bold text-lg tracking-tight">Telefon va kompyuter ilovasi</h2>
            </div>
            <InstallPrompt />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: any) {
  return (
    <div className="mt-7 first:mt-0">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="size-4 text-primary" />
        <h2 className="font-semibold text-sm tracking-wide uppercase text-foreground/70">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({ label, desc, iconL: IconL, children }: any) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-start gap-2 min-w-0">
        {IconL && <IconL className="size-3.5 mt-1 text-foreground/50" />}
        <div className="min-w-0">
          <div className="text-sm font-medium">{label}</div>
          {desc && <div className="text-xs text-muted-foreground">{desc}</div>}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Chips({ options, value, onChange }: { options: { id: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1.5 flex-wrap justify-end">
      {options.map((o) => (
        <motion.button
          key={o.id}
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange(o.id)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${value === o.id ? "bg-ink text-ink-foreground border-ink" : "border-border hover:bg-muted"}`}
        >{o.label}</motion.button>
      ))}
    </div>
  );
}
