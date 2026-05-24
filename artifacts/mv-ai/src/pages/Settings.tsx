import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
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
      fetch("/api/profile", { credentials: "include" }).then((r) => r.ok ? r.json() : null),
      fetch("/api/settings", { credentials: "include" }).then((r) => r.ok ? r.json() : null),
    ]).then(([p, s]) => {
      if (p) { setName(p.displayName || ""); setPersonality(p.mascotPersonality || "playful"); }
      if (s) {
        setSound(s.soundEnabled ?? true);
        setVoice(s.voiceEnabled ?? true);
        setPersona(s.persona || "friend");
        setLanguage(s.language || "auto");
        setLength(s.responseLength || "balanced");
        setDemo(!!s.demoMode);
        setAdult(!!s.adultMode);
        setPerms(s.permissions || {});
      }
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const [r1, r2] = await Promise.all([
      fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ displayName: name, mascotPersonality: personality }),
      }),
      fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          soundEnabled: sound,
          voiceEnabled: voice,
          persona,
          language,
          responseLength: length,
          demoMode: demo,
          adultMode: adult,
          permissions: perms,
        }),
      }),
    ]);
    setSaving(false);
    if (!r1.ok || !r2.ok) toast.error("Couldn't save"); else toast.success("Saqlandi");
  };

  const Section = ({ icon: Icon, title, children }: any) => (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-2xl p-5 space-y-4"
    >
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground/60">
        <Icon className="size-4" /> {title}
      </div>
      {children}
    </motion.section>
  );

  const Chip = ({ active, onClick, label }: any) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${active ? "bg-primary text-primary-foreground shadow-sm" : "glass hover:bg-muted/60 border border-border/40"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 mesh-bg pointer-events-none" />
      <div className="fixed inset-0 aurora-bg opacity-20 pointer-events-none" />

      <div className="relative z-10 container max-w-2xl py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/chat"><Button variant="ghost" size="sm" className="glass rounded-full"><ArrowLeft className="size-4 mr-1" /> Chat</Button></Link>
          <div className="flex items-center gap-2">
            <Ozing3D mood="happy" size={48} />
            <span className="font-display text-lg font-bold">Sozlamalar</span>
          </div>
          <Button
            variant="ghost" size="sm"
            className="glass rounded-full text-destructive"
            onClick={async () => { await signOut(); navigate("/"); }}
          >
            <LogOut className="size-4 mr-1" /> Chiqish
          </Button>
        </div>

        <div className="space-y-4">
          {/* Profile */}
          <Section icon={User} title="Profil">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1 block">Ism</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ismingiz" className="rounded-xl bg-background/60" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-2 block">Ozing xarakteri</label>
                <div className="flex flex-wrap gap-2">
                  {["playful", "cool", "wise", "cute"].map((p) => (
                    <Chip key={p} active={personality === p} onClick={() => setPersonality(p)} label={p} />
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* Persona */}
          <Section icon={Sparkles} title="AI Xulqi">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-2 block">Persona</label>
              <div className="flex flex-wrap gap-2">
                {PERSONAS.map((p) => (
                  <Chip key={p.id} active={persona === p.id} onClick={() => setPersona(p.id)} label={p.label} />
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-2 block">Til</label>
              <div className="flex flex-wrap gap-2">
                {LANGS.map((l) => (
                  <Chip key={l.id} active={language === l.id} onClick={() => setLanguage(l.id)} label={l.label} />
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-2 block">Javob uzunligi</label>
              <div className="flex flex-wrap gap-2">
                {LENGTHS.map((l) => (
                  <Chip key={l.id} active={length === l.id} onClick={() => setLength(l.id)} label={l.label} />
                ))}
              </div>
            </div>
          </Section>

          {/* Sound */}
          <Section icon={Volume2} title="Ovoz & Nutq">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Ovoz effektlari</div>
                <div className="text-xs text-muted-foreground">UI sounds</div>
              </div>
              <Switch checked={sound} onCheckedChange={setSound} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Nutq sintezi</div>
                <div className="text-xs text-muted-foreground">Ozing reads aloud</div>
              </div>
              <Switch checked={voice} onCheckedChange={setVoice} />
            </div>
          </Section>

          {/* Lab */}
          <Section icon={FlaskConical} title="Lab">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Demo rejimi</div>
                <div className="text-xs text-muted-foreground">Fake AI responses for demos</div>
              </div>
              <Switch checked={demo} onCheckedChange={setDemo} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Kattalar rejimi</div>
                <div className="text-xs text-muted-foreground">Uncensored creative writing</div>
              </div>
              <Switch checked={adult} onCheckedChange={setAdult} />
            </div>
          </Section>

          {/* Permissions */}
          <Section icon={Shield} title="Ruxsatlar">
            <div className="grid grid-cols-2 gap-2">
              {PERMS.map((p) => (
                <div key={p.key} className="flex items-center justify-between glass rounded-xl px-3 py-2">
                  <span className="text-sm font-medium">{p.label}</span>
                  <Switch
                    checked={perms[p.key] ?? false}
                    onCheckedChange={(v) => setPerms((prev) => ({ ...prev, [p.key]: v }))}
                  />
                </div>
              ))}
            </div>
          </Section>

          {/* PWA */}
          <Section icon={Smartphone} title="Ilova">
            <InstallPrompt />
          </Section>

          <Button
            onClick={save}
            disabled={saving}
            className="w-full h-12 rounded-2xl bg-ink text-ink-foreground hover:bg-ink/90 font-semibold shine"
          >
            {saving && <Loader2 className="animate-spin size-4" />}
            Saqlash
          </Button>
        </div>
      </div>
    </div>
  );
}
