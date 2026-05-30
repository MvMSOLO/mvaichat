import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ozing } from "@/components/Ozing";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, X, Send, Settings2, Volume2, VolumeX, RotateCcw, ChevronDown } from "lucide-react";

interface Props {
  onClose: () => void;
  onSend: (text: string) => void;
  streamingText?: string;
  isStreaming?: boolean;
  language?: string;
}

const LANGUAGES = [
  { id: "uz-UZ", label: "O'zbek" },
  { id: "ru-RU", label: "Русский" },
  { id: "en-US", label: "English" },
];

const BAR_COUNT = 24;

export function VoiceMode({ onClose, onSend, streamingText, isStreaming, language: defaultLang = "uz-UZ" }: Props) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [bars, setBars] = useState<number[]>(new Array(BAR_COUNT).fill(4));
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [lang, setLang] = useState(defaultLang);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [silenceTimer, setSilenceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [phase, setPhase] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [volume, setVolume] = useState(0);

  const recogRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Waveform animation
  useEffect(() => {
    const tick = () => {
      if (analyserRef.current && listening) {
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const step = Math.floor(data.length / BAR_COUNT);
        const newBars = Array.from({ length: BAR_COUNT }, (_, i) => {
          const val = data[i * step] || 0;
          return Math.max(4, (val / 255) * 80);
        });
        setBars(newBars);
        const avg = newBars.reduce((a, b) => a + b, 0) / newBars.length;
        setVolume(avg);
      } else if (isStreaming) {
        // Animated waveform while AI is speaking
        setBars(Array.from({ length: BAR_COUNT }, (_, i) =>
          4 + Math.abs(Math.sin(Date.now() / 200 + i * 0.5)) * 50
        ));
      } else {
        setBars((prev) => prev.map((b) => Math.max(4, b * 0.85 + Math.random() * 2)));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [listening, isStreaming]);

  // TTS when streaming text finishes
  useEffect(() => {
    if (!ttsEnabled || !streamingText || isStreaming) return;
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const clean = streamingText.replace(/[*_`#>~\[\]]/g, "").replace(/\n+/g, " ").slice(0, 500);
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = lang;
    u.rate = 1.05;
    u.pitch = 1.1;
    u.volume = 1;
    u.onstart = () => setPhase("speaking");
    u.onend = () => setPhase("idle");
    synthRef.current = u;
    window.speechSynthesis.speak(u);
  }, [streamingText, isStreaming, ttsEnabled, lang]);

  useEffect(() => {
    if (isStreaming) setPhase("thinking");
    else if (listening) setPhase("listening");
    else if (!isStreaming && phase === "thinking") setPhase("idle");
  }, [isStreaming, listening]);

  const startListening = useCallback(async () => {
    if (listening) return;
    setTranscript("");
    setInterimText("");

    // Init Web Audio for waveform
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      const src = ctx.createMediaStreamSource(stream);
      src.connect(analyser);
    } catch {}

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = lang;

    r.onresult = (e: any) => {
      let final = "";
      let interim = "";
      for (const res of Array.from(e.results) as any[]) {
        if (res.isFinal) final += res[0].transcript;
        else interim += res[0].transcript;
      }
      setTranscript(final);
      setInterimText(interim);

      // Auto-send after 1.5s silence
      if (silenceTimer) clearTimeout(silenceTimer);
      if (final) {
        const timer = setTimeout(() => {
          stopListening();
          if (final.trim()) onSend(final.trim());
        }, 1800);
        setSilenceTimer(timer);
      }
    };
    r.onend = () => {
      setListening(false);
      setPhase("idle");
      cleanupAudio();
    };
    r.onerror = () => {
      setListening(false);
      setPhase("idle");
      cleanupAudio();
    };
    r.start();
    recogRef.current = r;
    setListening(true);
    setPhase("listening");
  }, [lang, listening, silenceTimer, onSend]);

  const stopListening = useCallback(() => {
    recogRef.current?.stop();
    setListening(false);
    setPhase("idle");
    cleanupAudio();
    if (silenceTimer) clearTimeout(silenceTimer);
  }, [silenceTimer]);

  const cleanupAudio = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close();
    streamRef.current = null;
    audioCtxRef.current = null;
    analyserRef.current = null;
  };

  const handleSend = () => {
    const text = (transcript + " " + interimText).trim();
    if (!text) return;
    stopListening();
    onSend(text);
    setTranscript("");
    setInterimText("");
  };

  const phaseColor = {
    idle: "hsl(var(--muted-foreground))",
    listening: "hsl(var(--primary))",
    thinking: "hsl(var(--accent))",
    speaking: "hsl(var(--secondary))",
  }[phase];

  const phaseLabel = {
    idle: "Bosing va gapiring",
    listening: "Eshitilyapman…",
    thinking: "O'ylayapman…",
    speaking: "Javob berayapman…",
  }[phase];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{ background: "hsla(var(--background), 0.97)", backdropFilter: "blur(40px)" }}
    >
      {/* Close */}
      <button
        onClick={() => { stopListening(); window.speechSynthesis?.cancel(); onClose(); }}
        className="absolute top-6 right-6 p-2.5 rounded-2xl glass border border-border/40 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="size-5" />
      </button>

      {/* Language picker */}
      <div className="absolute top-6 left-6 relative">
        <button
          onClick={() => setShowLangPicker((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass border border-border/40 text-sm text-muted-foreground hover:text-foreground transition"
        >
          {LANGUAGES.find((l) => l.id === lang)?.label}
          <ChevronDown className="size-3.5" />
        </button>
        <AnimatePresence>
          {showLangPicker && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              className="absolute top-full mt-1 left-0 glass-strong rounded-xl border border-border/50 py-1 min-w-[120px] z-10"
            >
              {LANGUAGES.map((l) => (
                <button
                  key={l.id}
                  onClick={() => { setLang(l.id); setShowLangPicker(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/60 transition-colors ${lang === l.id ? "text-primary font-semibold" : "text-foreground"}`}
                >
                  {l.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* TTS toggle */}
      <button
        onClick={() => { setTtsEnabled((v) => !v); window.speechSynthesis?.cancel(); }}
        className="absolute top-6 left-40 p-2.5 rounded-2xl glass border border-border/40 text-muted-foreground hover:text-foreground transition-colors"
        title="Ovozli javob"
      >
        {ttsEnabled ? <Volume2 className="size-5 text-primary" /> : <VolumeX className="size-5" />}
      </button>

      {/* Phase label */}
      <motion.p
        key={phase}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs font-mono uppercase tracking-widest mb-8"
        style={{ color: phaseColor }}
      >
        ● {phaseLabel}
      </motion.p>

      {/* Waveform bars */}
      <div className="relative mb-10">
        {/* Outer pulse ring */}
        <AnimatePresence>
          {(listening || phase === "speaking") && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full"
              style={{
                width: 260, height: 260, left: "50%", top: "50%",
                transform: "translate(-50%,-50%)",
                background: `radial-gradient(circle, ${phaseColor}22 0%, transparent 70%)`,
              }}
            />
          )}
        </AnimatePresence>

        {/* Main orb with Ozing */}
        <motion.div
          animate={{ scale: listening ? 1 + volume / 800 : 1, boxShadow: listening ? `0 0 60px -10px ${phaseColor}80` : "none" }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="relative size-36 rounded-full grid place-items-center glass-strong border border-border/30"
          style={{ background: `radial-gradient(circle, ${phaseColor}18 0%, transparent 70%)` }}
        >
          <Ozing
            mood={phase === "listening" ? "curious" : phase === "thinking" ? "thinking" : phase === "speaking" ? "speaking" : "idle"}
            size={120}
          />
        </motion.div>

        {/* Waveform around orb */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ width: 340, left: "50%", transform: "translateX(-50%)" }}>
          {bars.map((h, i) => {
            const angle = (i / BAR_COUNT) * Math.PI * 2;
            const r = 90;
            const x = Math.cos(angle - Math.PI / 2) * r;
            const y = Math.sin(angle - Math.PI / 2) * r;
            return (
              <motion.div
                key={i}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: 3,
                  height: h,
                  borderRadius: 4,
                  background: phaseColor,
                  opacity: listening || isStreaming ? 0.7 : 0.2,
                  transformOrigin: "center center",
                  transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${(i / BAR_COUNT) * 360}deg)`,
                }}
                animate={{ height: h }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />
            );
          })}
        </div>
      </div>

      {/* Transcript */}
      <div className="w-full max-w-lg px-8 min-h-[80px] mb-8 text-center">
        <AnimatePresence mode="wait">
          {(transcript || interimText) ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass rounded-2xl p-4 border border-border/40"
            >
              <p className="text-base leading-relaxed">
                <span className="text-foreground">{transcript}</span>
                <span className="text-muted-foreground">{interimText}</span>
              </p>
            </motion.div>
          ) : streamingText ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-4 border border-primary/20"
            >
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{streamingText}</p>
            </motion.div>
          ) : (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-muted-foreground/60 text-sm"
            >
              {phase === "idle" ? "Mikrofon tugmasini bosing va gapiring…" : ""}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {transcript && !listening && (
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Button variant="outline" size="icon" className="size-12 rounded-2xl glass" onClick={() => { setTranscript(""); setInterimText(""); }}>
              <RotateCcw className="size-5" />
            </Button>
          </motion.div>
        )}

        {/* Main mic button */}
        <motion.button
          onPointerDown={startListening}
          onPointerUp={listening ? stopListening : undefined}
          animate={listening ? { scale: [1, 1.05, 1], boxShadow: [`0 0 0 0 ${phaseColor}60`, `0 0 0 20px ${phaseColor}00`, `0 0 0 0 ${phaseColor}60`] } : { scale: 1 }}
          transition={listening ? { duration: 1.5, repeat: Infinity } : {}}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="size-20 rounded-full grid place-items-center text-white shadow-2xl transition-colors"
          style={{ background: listening ? `linear-gradient(135deg, ${phaseColor}, ${phaseColor}cc)` : "hsl(var(--primary))" }}
        >
          {listening ? <MicOff className="size-7" /> : <Mic className="size-7" />}
        </motion.button>

        {(transcript || interimText) && (
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Button
              size="icon"
              className="size-12 rounded-2xl bg-ink text-ink-foreground hover:bg-ink/90 shine"
              onClick={handleSend}
            >
              <Send className="size-5" />
            </Button>
          </motion.div>
        )}
      </div>

      <p className="mt-6 text-[11px] text-muted-foreground/40 font-mono uppercase tracking-widest">
        {listening ? "Qo'yib yuborsangiz avtomatik yuboriladi" : "Bosib tuting — gapiring — qo'yib yuboring"}
      </p>
    </motion.div>
  );
}
