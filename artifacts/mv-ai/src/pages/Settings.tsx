import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Ozing3D } from "@/components/Ozing3D";
import { InstallPrompt } from "@/components/InstallPrompt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  ArrowLeft, LogOut, Loader2, User, Sparkles, Volume2, Mic,
  Smartphone, Languages, Gauge, FlaskConical, Shield,
  Lock, AlertTriangle, Phone, MessageSquare, Instagram,
  Youtube, Github, MapPin, Camera, Bot, Globe, Hash,
} from "lucide-react";

const PERSONAS = [
  { id: "friend",       label: "Do'st",      emoji: "🤝" },
  { id: "professional", label: "Professional", emoji: "💼" },
  { id: "funny",        label: "Hazilkash",  emoji: "😄" },
  { id: "mentor",       label: "Mentor",     emoji: "🎓" },
  { id: "poet",         label: "Shoir",      emoji: "✍️" },
];

const LANGS = [
  { id: "auto",    label: "Avtomatik", flag: "🌐" },
  { id: "Uzbek",   label: "O'zbek",    flag: "🇺🇿" },
  { id: "Russian", label: "Русский",   flag: "🇷🇺" },
  { id: "English", label: "English",   flag: "🇺🇸" },
];

const LENGTHS = [
  { id: "short",    label: "Qisqa",    desc: "2-3 jumla" },
  { id: "balanced", label: "Balansli", desc: "Optimal" },
  { id: "long",     label: "Batafsil", desc: "To'liq" },
];

const PERMS: { key: string; label: string; Icon: any; color: string }[] = [
  { key: "contacts",   label: "Kontaktlar",  Icon: Phone,          color: "text-blue-400" },
  { key: "sms",        label: "SMS",         Icon: MessageSquare,  color: "text-green-400" },
  { key: "call",       label: "Qo'ng'iroq",  Icon: Phone,          color: "text-emerald-400" },
  { key: "instagram",  label: "Instagram",   Icon: Instagram,      color: "text-pink-400" },
  { key: "telegram",   label: "Telegram",    Icon: Bot,            color: "text-sky-400" },
  { key: "youtube",    label: "YouTube",     Icon: Youtube,        color: "text-red-400" },
  { key: "github",     label: "GitHub",      Icon: Github,         color: "text-gray-400" },
  { key: "microphone", label: "Mikrofon",    Icon: Mic,            color: "text-violet-400" },
  { key: "camera",     label: "Kamera",      Icon: Camera,         color: "text-amber-400" },
  { key: "location",   label: "Joylashuv",   Icon: MapPin,         color: "text-orange-400" },
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
  const [adultConfirmed, setAdultConfirmed] = useState(false);
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
        if (s.adultMode) setAdultConfirmed(true);
        setPerms(s.permissions || {});
      }
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const [r1, r2] = await Promise.all([
      fetch("/api/profile", {
        method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ displayName: name, mascotPersonality: personality }),
      }),
      fetch("/api/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ soundEnabled: sound, voiceEnabled: voice, persona, language, responseLength: length, demoMode: demo, adultMode: adult, permissions: perms }),
      }),
    ]);
    setSaving(false);
    if (!r1.ok || !r2.ok) toast.error("Saqlashda xato"); else toast.success("✓ Sozlamalar saqlandi");
  };

  const handleAdultToggle = (v: boolean) => {
    if (v && !adultConfirmed) {
      toast("18+ Kattalar rejimi", {
        description: "Bu rejim yoqilsa AI cheklovsiz, ochiq javoblar beradi. Davom etasizmi?",
        action: { label: "Ha, yoqish", onClick: () => { setAdult(true); setAdultConfirmed(true); } },
        cancel: { label: "Yo'q", onClick: () => {} },
        duration: 10000,
      });
      return;
    }
    setAdult(v);
  };

  const Section = ({ icon: Icon, title, children, accent }: any) => (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-2xl p-5 space-y-4"
    >
      <div className={`flex items-center gap-2 text-sm font-semibold uppercase tracking-wider ${accent || "text-foreground/50"}`}>
        <Icon className="size-4" /> {title}
      </div>
      {children}
    </motion.section>
  );

  const Chip = ({ active, onClick, label, emoji }: any) => (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/30"
          : "glass hover:bg-muted/60 border border-border/40 text-foreground/80"
      }`}
    >
      {emoji && <span className="mr-1.5">{emoji}</span>}{label}
    </button>
  );

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 mesh-bg pointer-events-none" />
      <div className="fixed inset-0 aurora-bg opacity-20 pointer-events-none" />

      <div className="relative z-10 container max-w-2xl py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/chat">
            <Button variant="ghost" size="sm" className="glass rounded-full gap-1.5">
              <ArrowLeft className="size-4" /> Chat
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Ozing3D mood="happy" size={44} />
            <span className="font-display text-lg font-bold">Sozlamalar</span>
          </div>
          <Button
            variant="ghost" size="sm"
            className="glass rounded-full text-destructive gap-1.5"
            onClick={async () => { await signOut(); navigate("/"); }}
          >
            <LogOut className="size-4" /> Chiqish
          </Button>
        </div>

        <div className="space-y-4">
          {/* Profile */}
          <Section icon={User} title="Profil">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1.5 block">Ismingiz</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ismingizni kiriting" className="rounded-xl bg-background/60" />
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

          {/* AI Behavior */}
          <Section icon={Sparkles} title="AI Xulqi">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-2 block">Persona</label>
                <div className="flex flex-wrap gap-2">
                  {PERSONAS.map((p) => (
                    <Chip key={p.id} active={persona === p.id} onClick={() => setPersona(p.id)} label={p.label} emoji={p.emoji} />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-2 block">Javob tili</label>
                <div className="flex flex-wrap gap-2">
                  {LANGS.map((l) => (
                    <Chip key={l.id} active={language === l.id} onClick={() => setLanguage(l.id)} label={l.label} emoji={l.flag} />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-2 block">Javob uzunligi</label>
                <div className="flex gap-2">
                  {LENGTHS.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setLength(l.id)}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        length === l.id
                          ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/30"
                          : "glass hover:bg-muted/60 border border-border/40"
                      }`}
                    >
                      <div className="font-semibold">{l.label}</div>
                      <div className={`text-xs mt-0.5 ${length === l.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{l.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* Sound */}
          <Section icon={Volume2} title="Ovoz & Nutq">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-1">
                <div>
                  <div className="font-medium">Ovoz effektlari</div>
                  <div className="text-xs text-muted-foreground">UI sound effects</div>
                </div>
                <Switch checked={sound} onCheckedChange={setSound} />
              </div>
              <div className="h-px bg-border/40" />
              <div className="flex items-center justify-between py-1">
                <div>
                  <div className="font-medium">Nutq sintezi</div>
                  <div className="text-xs text-muted-foreground">Ozing ovoz bilan o'qiydi</div>
                </div>
                <Switch checked={voice} onCheckedChange={setVoice} />
              </div>
            </div>
          </Section>

          {/* Lab */}
          <Section icon={FlaskConical} title="Lab · Eksperimental">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-1">
                <div>
                  <div className="font-medium">Demo rejimi</div>
                  <div className="text-xs text-muted-foreground">Sinov uchun soxta AI javoblari</div>
                </div>
                <Switch checked={demo} onCheckedChange={setDemo} />
              </div>

              <div className="h-px bg-border/40" />

              <div className={`rounded-xl p-3.5 transition-colors ${adult ? "bg-rose-500/10 border border-rose-500/30" : "glass border border-border/40"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${adult ? "bg-rose-500/20 text-rose-400" : "bg-muted/60 text-muted-foreground"}`}>
                      {adult ? <AlertTriangle className="size-4" /> : <Lock className="size-4" />}
                    </div>
                    <div>
                      <div className="font-semibold text-sm flex items-center gap-1.5">
                        Kattalar rejimi
                        {adult && <span className="text-xs px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold">18+</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">Cheklovsiz, ochiq AI javoblari</div>
                    </div>
                  </div>
                  <Switch
                    checked={adult}
                    onCheckedChange={handleAdultToggle}
                    className={adult ? "data-[state=checked]:bg-rose-500" : ""}
                  />
                </div>
                {adult && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-2.5 pt-2.5 border-t border-rose-500/20 text-xs text-rose-400/80"
                  >
                    ⚠️ Kattalar rejimi faol — AI yosh cheklovlarsiz javob beradi
                  </motion.div>
                )}
              </div>
            </div>
          </Section>

          {/* Permissions */}
          <Section icon={Shield} title="AI Ruxsatlar">
            <p className="text-xs text-muted-foreground -mt-1">
              Qaysi xizmatlardan foydalanishga AI ga ruxsat berasiz?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PERMS.map(({ key, label, Icon, color }) => (
                <div
                  key={key}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                    perms[key]
                      ? "glass-strong border border-primary/30 bg-primary/5"
                      : "glass border border-border/40 opacity-70"
                  }`}
                >
                  <Icon className={`size-4 shrink-0 ${perms[key] ? color : "text-muted-foreground"}`} />
                  <span className="text-sm font-medium flex-1">{label}</span>
                  <Switch
                    checked={perms[key] ?? false}
                    onCheckedChange={(v) => setPerms((prev) => ({ ...prev, [key]: v }))}
                  />
                </div>
              ))}
            </div>
          </Section>

          {/* PWA */}
          <Section icon={Smartphone} title="Ilova o'rnatish">
            <InstallPrompt />
          </Section>

          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button
              onClick={save}
              disabled={saving}
              className="w-full h-12 rounded-2xl bg-ink text-ink-foreground hover:bg-ink/90 font-semibold shine gap-2"
            >
              {saving ? <Loader2 className="animate-spin size-4" /> : <Sparkles className="size-4" />}
              {saving ? "Saqlanmoqda…" : "Saqlash"}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
