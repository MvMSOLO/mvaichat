import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useChatStream, generateTitle, ChatMsg } from "@/hooks/useChatStream";
import { MODELS, MODEL_LIST, ModelId } from "@/lib/models";
import { Ozing, OzingMood } from "@/components/Ozing";
import { Ozing3D, Ozing3DMood } from "@/components/Ozing3D";
import { MessageContent } from "@/components/MessageContent";
import { Panel } from "@/components/Panel";
import { BrandMark } from "@/components/BrandMark";
import { SlashMenu } from "@/components/SlashMenu";
import { ModeShell } from "@/components/ModeShell";
import { useMemory } from "@/hooks/useMemory";
import { runSlash } from "@/lib/slashHandlers";
import { useSettings } from "@/hooks/useSettings";
import { runToolCalls } from "@/lib/autonomy";
import { loadSkills, getEnabledSkillsPrompt } from "@/lib/skills";
import { CommandPalette } from "@/components/CommandPalette";
import { VoiceMode } from "@/components/VoiceMode";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Plus, Send, Mic, MicOff, Square, Settings as SettingsIcon, Menu,
  Pin, Trash2, ChevronDown, LayoutPanelLeft, LogOut, Image as ImageIcon, X,
  Sparkles, Copy, Check, RotateCcw, ThumbsUp, ThumbsDown, Search,
  MessageSquare, Clock, Download, Share2, Keyboard, ChevronRight,
  Maximize2, Minimize2, Github, BookOpen, Zap, Palette, Type,
  AlignLeft, AlignJustify, SlidersHorizontal, Heart, Laugh, Lightbulb,
  Star, Flag, Camera, Link2,
} from "lucide-react";

interface Conversation { id: string; title: string; modelId: ModelId; pinned: boolean; updatedAt: string; }

const CUSTOM_INSTRUCTIONS_KEY = "mv-custom-instructions";
const getCustomInstructions = () => {
  try { return JSON.parse(localStorage.getItem(CUSTOM_INSTRUCTIONS_KEY) || "{}"); } catch { return {}; }
};

function formatTime(ts?: number | string): string {
  const d = ts ? new Date(ts) : new Date();
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "hozir";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}d oldin`;
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function TypingDots() {
  return (
    <motion.div className="flex items-center gap-1.5 py-1.5 px-2 rounded-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i} className={`rounded-full ${i === 0 ? "size-2 bg-primary/80" : i === 1 ? "size-2.5 bg-primary/60" : "size-2 bg-primary/40"}`}
          animate={{ y: [0, -7, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
        />
      ))}
    </motion.div>
  );
}

function StreamingCursor() {
  return (
    <motion.span
      className="inline-block w-[3px] h-[1.1em] rounded-full bg-primary ml-0.5 align-middle"
      animate={{ opacity: [1, 0] }}
      transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
    />
  );
}

const EMOJI_REACTIONS = [
  { emoji: "👍", label: "like" },
  { emoji: "❤️", label: "heart" },
  { emoji: "🔥", label: "fire" },
  { emoji: "💡", label: "idea" },
  { emoji: "😄", label: "laugh" },
  { emoji: "🤔", label: "think" },
];

function MessageActions({
  content, onRegenerate, onReaction, reactions, onPin, pinned, onFork,
}: {
  content: string;
  onRegenerate?: () => void;
  onReaction?: (type: string) => void;
  reactions?: Record<string, boolean>;
  onPin?: () => void;
  pinned?: boolean;
  onFork?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

  return (
    <motion.div
      className="flex items-center gap-0.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-wrap"
      initial={{ opacity: 0 }}
    >
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={() => { navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        className="action-btn"
        title="Nusxalash"
      >
        {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
      </motion.button>
      {onRegenerate && (
        <motion.button whileTap={{ scale: 0.88 }} onClick={onRegenerate} className="action-btn" title="Qayta yaratish">
          <RotateCcw className="size-3.5" />
        </motion.button>
      )}
      {onPin && (
        <motion.button whileTap={{ scale: 0.88 }} onClick={onPin} className={`action-btn ${pinned ? "!text-primary !bg-primary/15" : ""}`} title={pinned ? "Pindan chiqarish" : "Pinlash"}>
          <Pin className="size-3.5" />
        </motion.button>
      )}
      {onFork && (
        <motion.button whileTap={{ scale: 0.88 }} onClick={onFork} className="action-btn" title="Bu yerdan yangi chat">
          <Share2 className="size-3.5" />
        </motion.button>
      )}

      {/* Emoji reactions */}
      <div className="relative">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => setShowEmoji((v) => !v)}
          className={`action-btn ${showEmoji ? "!text-primary !bg-primary/15" : ""}`}
          title="Reaksiya"
        >
          <Laugh className="size-3.5" />
        </motion.button>
        <AnimatePresence>
          {showEmoji && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 4 }}
              className="absolute bottom-full mb-1 left-0 flex gap-0.5 glass-strong rounded-2xl p-1.5 border border-border/50 z-10"
            >
              {EMOJI_REACTIONS.map((r) => (
                <motion.button
                  key={r.label}
                  onClick={() => { onReaction?.(r.label); setShowEmoji(false); }}
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.9 }}
                  className={`size-8 grid place-items-center rounded-xl text-base transition-colors ${reactions?.[r.label] ? "bg-primary/20" : "hover:bg-muted/60"}`}
                >
                  {r.emoji}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Show active emoji reactions */}
      {reactions && Object.entries(reactions).filter(([, v]) => v).map(([k]) => {
        const er = EMOJI_REACTIONS.find((r) => r.label === k);
        return er ? (
          <motion.span key={k} initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="px-1.5 py-0.5 rounded-full bg-primary/10 text-xs">{er.emoji}</motion.span>
        ) : null;
      })}
    </motion.div>
  );
}

const EMPTY_PROMPTS: Record<ModelId, string[]> = {
  humanoid: ["Bugun meni qiziqtirgan narsa...", "Menga she'r yoz...", "Qanday qilib motivatsiya topaman?", "Yaxshi kitob tavsiya qil"],
  ideal: ["Step by step tushuntir: neyron tarmoqlar", "Kuchli argumentlar yozish strategiyasi", "Murakkab qarorlar qabul qilish", "Dunyoning kelajagi qanday bo'ladi?"],
  code: ["React hook yoz: local storage sync", "Python FastAPI CRUD endpoint", "TypeScript generic utility types", "SQL query optimization misollar"],
  vision: ["Bu rasmni tahlil qil", "Screenshot UI ni tushuntir", "Logo dizayni haqida fikr ber", "Diagrammani o'qi va izohlа"],
  search: ["Hozirgi AI yangiliklari", "Crypto bozori ahvoli", "O'zbekiston texnologiya yangiliklari", "Eng yaxshi frontend freymvorklar 2025"],
  voice: ["Bugun nima qilishim kerak?", "Motivatsiya ber", "Qisqa maslahat", "Menga bir narsa ayt"],
  agents: ["Biznes strategiya ishlab chiq", "Kuchli marketing kampaniya", "Yangi loyiha uchun reja", "Murakkab muammoni hal qil"],
  social: ["YouTube'da qidir: lo-fi music", "@MrBeast kanaliga obuna bo'l", "Telegram kanalim: @mvai", "Instagram'da post ulash"],
};

type DensityMode = "compact" | "comfortable" | "spacious";
type FontSize = "sm" | "base" | "lg";

export default function Chat() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [modelId, setModelId] = useState<ModelId>("humanoid");
  const [input, setInput] = useState("");
  const [mood, setMood] = useState<OzingMood>("idle");
  const [panelOpen, setPanelOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [voiceModeOpen, setVoiceModeOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [density, setDensity] = useState<DensityMode>("comfortable");
  const [fontSize, setFontSize] = useState<FontSize>("base");
  const [isDragging, setIsDragging] = useState(false);
  const [lastStreamedText, setLastStreamedText] = useState("");
  const [pinnedMsgIndices, setPinnedMsgIndices] = useState<Set<number>>(new Set());
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [urlInputOpen, setUrlInputOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [inputFocused, setInputFocused] = useState(false);
  const [convsLoading, setConvsLoading] = useState(true);

  const recogRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { send, stop, streaming, provider } = useChatStream();
  const { memories, autoExtract } = useMemory(user?.id);
  const { settings } = useSettings(user?.id);

  // Load custom instructions + skills on mount
  const getEnrichedSettings = useCallback(() => {
    const ci = getCustomInstructions();
    const skills = loadSkills();
    const skillsPrompt = getEnabledSkillsPrompt(skills);
    return {
      ...settings,
      customInstructions: ci.about ? `USER INFO: ${ci.about}` : "",
      customStyle: ci.style ? `STYLE PREFERENCE: ${ci.style}` : "",
      skillsPrompt,
    };
  }, [settings]);

  // Check for GitHub pending import
  useEffect(() => {
    const pending = localStorage.getItem("mv-pending-import");
    if (pending) {
      try {
        const { content, filename } = JSON.parse(pending);
        localStorage.removeItem("mv-pending-import");
        const preview = content.slice(0, 500);
        setInput(`GitHub'dan import qilindi: **${filename}**\n\n\`\`\`\n${preview}${content.length > 500 ? "\n…" : ""}\n\`\`\`\n\nBu fayl haqida nima qilishim kerak?`);
        toast.success(`"${filename}" import qilindi`);
      } catch {}
    }
  }, []);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    setConvsLoading(true);
    try {
      const r = await fetch("/api/conversations", { credentials: "include" });
      if (r.ok) {
        const data: Conversation[] = await r.json();
        data.sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
        setConversations(data);
      }
    } finally {
      setConvsLoading(false);
    }
  }, [user]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (!activeId) { setMessages([]); setPinnedMsgIndices(new Set()); setSuggestions([]); return; }
    fetch(`/api/conversations/${activeId}/messages`, { credentials: "include" }).then(async (r) => {
      if (r.ok) {
        const data = await r.json();
        setMessages(data.map((m: any) => ({
          role: m.role, content: m.content, attachments: m.attachments,
          timestamp: new Date(m.createdAt || Date.now()).getTime(), modelId: m.modelId,
        })));
      }
    });
  }, [activeId]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setIsAtBottom(atBottom);
  }, []);

  useEffect(() => {
    if (isAtBottom) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, streaming, isAtBottom]);

  useEffect(() => {
    if (streaming) setMood("speaking");
    else if (input.length > 0) setMood("curious");
    else setMood("idle");
  }, [streaming, input]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setPaletteOpen(true); }
      if ((e.metaKey || e.ctrlKey) && e.key === "f") { e.preventDefault(); setFocusMode((v) => !v); }
      if (e.key === "Escape" && voiceModeOpen) setVoiceModeOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [voiceModeOpen]);

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setPendingAttachments((prev) => [...prev, dataUrl]);
        if (modelId !== "vision") setModelId("vision");
      };
      reader.readAsDataURL(file);
    });
    if (files.length) toast.success(`${files.length} ta rasm biriktirildi`);
  }, [modelId]);

  // Clipboard paste handler (Ctrl+V for images)
  useEffect(() => {
    const handler = async (e: ClipboardEvent) => {
      if (!e.clipboardData?.items) return;
      for (const item of Array.from(e.clipboardData.items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            setPendingAttachments((prev) => [...prev, dataUrl]);
            if (modelId !== "vision") setModelId("vision");
            toast.success("Rasm clipboarddan qo'shildi");
          };
          reader.readAsDataURL(file);
        }
      }
    };
    document.addEventListener("paste", handler);
    return () => document.removeEventListener("paste", handler);
  }, [modelId]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
    if (e.target.value.length === 0) setSuggestions([]);
  };

  const newChat = () => { setActiveId(null); setMessages([]); setSheetOpen(false); setSuggestions([]); };

  const handleRegenerate = async () => {
    if (!messages.length || streaming) return;
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    const withoutLast = messages.slice(0, -1);
    setMessages([...withoutLast, { role: "assistant", content: "" }]);
    let acc = "";
    await send(
      withoutLast.map((m) => ({ role: m.role, content: m.content })),
      modelId,
      (chunk) => {
        acc += chunk;
        setMessages((prev) => { const next = [...prev]; next[next.length - 1] = { role: "assistant", content: acc, timestamp: Date.now() }; return next; });
      },
      undefined, memories,
      async (calls) => {
        const results = await runToolCalls(calls);
        const summary = results.map((r) => r.message || (r.ok ? "Done" : `Error: ${r.error || ""}`)).join("\n");
        if (summary) {
          acc += (acc ? "\n\n" : "") + `_${summary}_`;
          setMessages((prev) => { const next = [...prev]; next[next.length - 1] = { role: "assistant", content: acc }; return next; });
        }
      },
      getEnrichedSettings(),
    );
  };

  const handleReaction = (index: number, type: string) => {
    setMessages((prev) => prev.map((m, i) => {
      if (i !== index) return m;
      const reactions = { ...(m.reactions as Record<string, boolean> || {}) };
      reactions[type] = !reactions[type];
      return { ...m, reactions };
    }));
  };

  const handlePinMsg = (index: number) => {
    setPinnedMsgIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  };

  const handleForkFromMessage = async (index: number) => {
    const slicedMsgs = messages.slice(0, index + 1);
    const r = await fetch("/api/conversations", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ title: "Fork: " + (messages[0]?.content || "Chat").slice(0, 40), modelId }),
    });
    if (!r.ok) return;
    const conv = await r.json();
    for (const m of slicedMsgs) {
      await fetch(`/api/conversations/${conv.id}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ role: m.role, content: m.content }),
      });
    }
    setActiveId(conv.id);
    setMessages(slicedMsgs);
    loadConversations();
    toast.success("Chat fork qilindi ✓");
  };

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if ((!text && !pendingAttachments.length) || !user) return;
    const attachments = [...pendingAttachments];
    setInput("");
    setPendingAttachments([]);
    setSuggestions([]);
    if (inputRef.current) inputRef.current.style.height = "auto";

    let convId = activeId;
    let isNew = false;
    if (!convId) {
      const r = await fetch("/api/conversations", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ title: "Yangi chat", modelId }),
      });
      if (!r.ok) { toast.error("Suhbat yaratishda xato"); return; }
      const conv = await r.json();
      convId = conv.id; setActiveId(convId); isNew = true;
    }

    const userMsg: ChatMsg = { role: "user", content: text, attachments, timestamp: Date.now() };
    const baseMessages = [...messages, userMsg];
    setMessages([...baseMessages, { role: "assistant", content: "", timestamp: Date.now() }]);

    await fetch(`/api/conversations/${convId}/messages`, {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ role: "user", content: text, attachments }),
    });
    autoExtract(text).catch(() => {});

    if (isNew) {
      generateTitle(text).then(async (title) => {
        await fetch(`/api/conversations/${convId}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include",
          body: JSON.stringify({ title }),
        });
        loadConversations();
      });
    }

    if (text.startsWith("/")) {
      setMood("thinking");
      const slashOut = await runSlash(text);
      if (slashOut !== null) {
        setMessages((prev) => { const next = [...prev]; next[next.length - 1] = { role: "assistant", content: slashOut, timestamp: Date.now() }; return next; });
        await fetch(`/api/conversations/${convId}/messages`, {
          method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
          body: JSON.stringify({ role: "assistant", content: slashOut, modelId }),
        });
        await fetch(`/api/conversations/${convId}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include",
          body: JSON.stringify({ updatedAt: new Date().toISOString() }),
        });
        setMood("happy"); setTimeout(() => setMood("idle"), 1500);
        loadConversations(); return;
      }
    }

    let acc = "";
    await send(
      baseMessages.map((m) => ({ role: m.role, content: m.content })),
      modelId,
      (chunk) => {
        acc += chunk;
        setLastStreamedText(acc);
        setMessages((prev) => { const next = [...prev]; next[next.length - 1] = { role: "assistant", content: acc }; return next; });
      },
      attachments.length > 0 ? attachments : undefined,
      memories,
      async (calls) => {
        const results = await runToolCalls(calls);
        const summary = results.map((r) => r.message || (r.ok ? "Done" : `Error: ${r.error || ""}`)).join("\n");
        if (summary) {
          acc += (acc ? "\n\n" : "") + `_${summary}_`;
          setMessages((prev) => { const next = [...prev]; next[next.length - 1] = { role: "assistant", content: acc }; return next; });
        }
      },
      getEnrichedSettings(),
    );

    if (acc) {
      await fetch(`/api/conversations/${convId}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ role: "assistant", content: acc, modelId }),
      });
      await fetch(`/api/conversations/${convId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ updatedAt: new Date().toISOString() }),
      });
      if (modelId === "voice" && settings?.voice_enabled !== false && "speechSynthesis" in window) {
        const clean = acc.replace(/[*_`#>]/g, "").replace(/\n+/g, " ").slice(0, 300);
        const u = new SpeechSynthesisUtterance(clean);
        u.rate = 1.05; u.pitch = 1.1;
        window.speechSynthesis.speak(u);
      }
      // Generate smart suggestions based on last reply
      generateSmartSuggestions(acc, modelId);
      setMood("happy"); setTimeout(() => setMood("idle"), 1800);
    }
    loadConversations();
  };

  const generateSmartSuggestions = (aiReply: string, mode: ModelId) => {
    const suggestions: Record<ModelId, string[]> = {
      humanoid: ["Batafsil tushuntir", "Misollar kel", "Qanday boshlash mumkin?"],
      ideal: ["Muqobil yondashuv bormi?", "Bu fikrni davom ettir", "Kamchiliklarini ayt"],
      code: ["Testlar yoz", "Optimize qil", "Type safe qil", "Xatolarni qayta ko'r"],
      vision: ["Yaxshilash yo'llari?", "Dizayn mezonlari", "Ranglar haqida"],
      search: ["Yangi qidirish", "Manbalar ko'rsatir", "Solishtir"],
      voice: ["Yana bir narsa", "Davom et", "Qisqaroq ayt"],
      agents: ["Yangi strategiya", "Boshqacha yondashuv", "Natijani baholash"],
      social: ["Boshqa platforma", "Post matni yoz", "DM yubor"],
    };
    const list = suggestions[mode] || suggestions.humanoid;
    setSuggestions(list.slice(0, 3));
    setShowSuggestions(true);
    setTimeout(() => setShowSuggestions(false), 8000);
  };

  const toggleListen = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Ovoz kiritish qo'llab-quvvatlanmaydi"); return; }
    if (listening) { recogRef.current?.stop(); setListening(false); return; }
    const r = new SR();
    r.continuous = false; r.interimResults = true; r.lang = "uz-UZ";
    r.onresult = (e: any) => { const t = Array.from(e.results).map((r: any) => r[0].transcript).join(""); setInput(t); };
    r.onend = () => setListening(false);
    r.onerror = () => { setListening(false); toast.error("Mikrofon xatosi"); };
    r.start(); recogRef.current = r; setListening(true); setMood("listening");
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setPendingAttachments((prev) => [...prev, dataUrl]);
        if (modelId !== "vision") setModelId("vision");
      };
      reader.readAsDataURL(file);
    }
    if (files.length) toast.success(`${files.length} ta rasm biriktirildi`);
    e.target.value = "";
  };

  const handleImageUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    setPendingAttachments((prev) => [...prev, url]);
    if (modelId !== "vision") setModelId("vision");
    setUrlInput("");
    setUrlInputOpen(false);
    toast.success("Rasm URL qo'shildi");
  };

  const deleteConv = async (id: string) => {
    await fetch(`/api/conversations/${id}`, { method: "DELETE", credentials: "include" });
    if (activeId === id) newChat();
    loadConversations();
  };

  const togglePin = async (c: Conversation) => {
    await fetch(`/api/conversations/${c.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ pinned: !c.pinned }),
    });
    loadConversations();
  };

  const exportConversation = (format: "txt" | "md" | "json" = "txt") => {
    if (!messages.length) return;
    let content = "";
    const date = new Date().toLocaleDateString();
    if (format === "json") {
      content = JSON.stringify({ date, modelId, messages }, null, 2);
    } else if (format === "md") {
      content = `# MV AI Chat — ${date}\n\n`;
      content += messages.map((m) => `## ${m.role === "user" ? "👤 Men" : "🤖 Ozing"}\n\n${m.content}`).join("\n\n---\n\n");
    } else {
      content = `MV AI Chat — ${date}\n${"=".repeat(40)}\n\n`;
      content += messages.map((m) => `[${m.role.toUpperCase()}]\n${m.content}`).join("\n\n---\n\n");
    }
    const mime = format === "json" ? "application/json" : "text/" + (format === "md" ? "markdown" : "plain");
    const blob = new Blob([content], { type: mime });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `mv-ai-${Date.now()}.${format}`;
    a.click();
    toast.success(`Chat .${format} formatda saqlandi`);
  };

  const filteredConversations = conversations.filter((c) =>
    !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ActiveModel = MODELS[modelId];

  const densityPad = { compact: "py-2", comfortable: "py-4", spacious: "py-8" }[density];
  const fontSizeCls = { sm: "text-xs", base: "text-sm md:text-base", lg: "text-base md:text-lg" }[fontSize];

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border/60">
        <div className="flex items-center gap-2 mb-4">
          <BrandMark size={32} />
          <span className="font-display text-lg tracking-tight">MV AI</span>
          <span className="ml-auto flex items-center gap-1.5">
            {!convsLoading && conversations.length > 0 && (
              <span className="text-[9px] tabular-nums text-muted-foreground/40">{conversations.length}</span>
            )}
            <span className="text-[9px] font-mono uppercase tracking-widest text-primary/60 px-1.5 py-0.5 rounded-full border border-primary/20">v9</span>
          </span>
        </div>
        <motion.div whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.01 }}>
          <Button onClick={newChat} variant="ink" className="w-full rounded-xl h-10 font-semibold shine">
            <Plus className="size-4" /> Yangi chat
          </Button>
        </motion.div>
        <div className="mt-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Chatlarni qidirish…"
            className="w-full pl-8 pr-8 py-2 text-xs rounded-xl bg-muted/40 border border-border/40 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:bg-muted/60 placeholder:text-muted-foreground/50 transition-colors"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors">
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {pinnedMsgIndices.size > 0 && (
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary/60 flex items-center gap-1">
            <Pin className="size-2.5" /> Pinlangan xabarlar ({pinnedMsgIndices.size})
          </div>
        )}
        {convsLoading && conversations.length === 0 && (
          <div className="space-y-0.5 px-1">
            {[70, 90, 55, 80, 65].map((w, i) => (
              <div key={i} className="px-3 py-2.5 rounded-xl">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="skeleton size-2 rounded-full shrink-0" />
                  <span className={`skeleton h-2.5 rounded-full`} style={{ width: `${w}%` }} />
                </div>
                <span className="skeleton h-2 rounded-full ml-4" style={{ width: "35%" }} />
              </div>
            ))}
          </div>
        )}
        <AnimatePresence initial={false}>
          {filteredConversations.map((c) => (
            <motion.div
              key={c.id} layout
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className={`group relative flex items-center gap-1 rounded-xl transition-colors ${activeId === c.id ? "bg-primary/10 conv-item-active" : "hover:bg-muted/60"}`}
            >
              <button onClick={() => { setActiveId(c.id); setModelId(c.modelId as ModelId); setSheetOpen(false); }}
                className="flex-1 text-left px-3 py-2.5 min-w-0 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`size-2 shrink-0 rounded-full bg-gradient-to-br ${MODELS[c.modelId as ModelId]?.gradient || "from-primary to-secondary"}`} />
                  {c.pinned && <Pin className="size-3 text-primary shrink-0" />}
                  <span className={`font-medium truncate ${activeId === c.id ? "text-primary" : ""}`}>{c.title}</span>
                </div>
                <div className="text-[10px] text-muted-foreground/50 mt-0.5 pl-4">{formatTime(c.updatedAt)}</div>
              </button>
              <div className="flex opacity-0 group-hover:opacity-100 transition-opacity pr-1 gap-0.5 shrink-0">
                <motion.button whileTap={{ scale: 0.88 }} onClick={() => togglePin(c)} className="action-btn text-muted-foreground/60" title={c.pinned ? "Pindan chiqarish" : "Pinlash"}>
                  <Pin className={`size-3 ${c.pinned ? "text-primary fill-primary" : ""}`} />
                </motion.button>
                <motion.button whileTap={{ scale: 0.88 }} onClick={() => deleteConv(c.id)} className="action-btn !hover:bg-destructive/10 !hover:text-destructive text-muted-foreground/50" title="O'chirish">
                  <Trash2 className="size-3" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {filteredConversations.length === 0 && !convsLoading && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-10 px-4">
            <div className="text-2xl mb-2 opacity-40">{searchQuery ? "🔍" : "✨"}</div>
            <p className="text-xs text-muted-foreground/60 leading-relaxed">
              {searchQuery
                ? `"${searchQuery}" — hech narsa topilmadi`
                : "Hali chatlar yo'q. Yuqoridagi «Yangi chat» tugmasini bosing."}
            </p>
          </motion.div>
        )}
      </div>

      <div className="p-2 border-t border-border/60 space-y-0.5">
        {user && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1 rounded-xl hover:bg-muted/40 transition-colors cursor-default">
            {user.imageUrl ? (
              <img src={user.imageUrl} alt={user.fullName || ""} className="size-7 rounded-full object-cover ring-1 ring-border/40 shrink-0" />
            ) : (
              <div className="size-7 rounded-full bg-gradient-to-br from-primary to-secondary grid place-items-center shrink-0">
                <span className="text-[10px] font-bold text-white">{(user.firstName?.[0] || user.primaryEmailAddress?.emailAddress?.[0] || "?").toUpperCase()}</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold truncate">{user.fullName || user.primaryEmailAddress?.emailAddress?.split("@")[0] || "Foydalanuvchi"}</div>
              <div className="text-[10px] text-muted-foreground/50 truncate">{user.primaryEmailAddress?.emailAddress}</div>
            </div>
          </div>
        )}
        <Button variant="ghost" className="w-full justify-start rounded-xl h-9 font-medium text-sm gap-2" onClick={() => navigate("/skills")}>
          <BookOpen className="size-4" /> Skills
        </Button>
        <Button variant="ghost" className="w-full justify-start rounded-xl h-9 font-medium text-sm gap-2" onClick={() => navigate("/github")}>
          <Github className="size-4" /> GitHub
        </Button>
        <Button variant="ghost" className="w-full justify-start rounded-xl h-9 font-medium text-sm gap-2" onClick={() => navigate("/settings")}>
          <SettingsIcon className="size-4" /> Sozlamalar
        </Button>
        <Button variant="ghost" className="w-full justify-start rounded-xl h-9 font-medium text-sm gap-2 text-destructive/80 hover:text-destructive"
          onClick={async () => { await signOut(); navigate("/"); }}>
          <LogOut className="size-4" /> Chiqish
        </Button>
      </div>
    </div>
  );

  return (
    <div
      className="h-[100dvh] flex relative overflow-hidden bg-background"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="fixed inset-0 mesh-bg pointer-events-none" />
      <div className="fixed inset-0 aurora-bg opacity-30 pointer-events-none" />
      <div className="fixed inset-0 dot-grid-fade opacity-20 pointer-events-none" />

      {/* Drag overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] flex items-center justify-center"
            style={{ background: "hsla(var(--primary), 0.15)", backdropFilter: "blur(8px)" }}
          >
            <motion.div
              initial={{ scale: 0.8 }} animate={{ scale: 1 }}
              className="glass-strong rounded-3xl border-2 border-dashed border-primary/60 p-16 text-center"
            >
              <ImageIcon className="size-16 text-primary mx-auto mb-4" />
              <p className="text-xl font-display font-bold">Rasmni shu yerga tashlang</p>
              <p className="text-muted-foreground mt-2">Vision mode avtomatik yoqiladi</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Command Palette */}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        conversations={conversations}
        onSelectConversation={(id) => { setActiveId(id); const c = conversations.find((c) => c.id === id); if (c) setModelId(c.modelId); }}
        onNewChat={newChat}
        onModelSwitch={(id) => setModelId(id)}
        onExport={() => exportConversation("txt")}
      />

      {/* Voice Mode */}
      <AnimatePresence>
        {voiceModeOpen && (
          <VoiceMode
            onClose={() => setVoiceModeOpen(false)}
            onSend={(text) => { setVoiceModeOpen(false); handleSend(text); }}
            streamingText={lastStreamedText}
            isStreaming={streaming}
          />
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <AnimatePresence>
        {!focusMode && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="hidden md:flex w-72 border-r border-border/60 glass-strong z-10 flex-col"
          >
            <Sidebar />
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col min-w-0 z-10">
        {/* Top bar */}
        <header className="relative flex items-center justify-between gap-2 px-3 md:px-5 py-3 border-b border-border/60 glass-strong overflow-hidden">
          {streaming && <span className="streaming-bar" />}
          <div className="flex items-center gap-2">
            {/* Mobile sidebar */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button size="icon" variant="ghost" className="md:hidden rounded-xl"><Menu /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72"><Sidebar /></SheetContent>
            </Sheet>

            {/* Focus mode toggle (desktop) */}
            <Button size="icon" variant="ghost" onClick={() => setFocusMode((v) => !v)}
              className={`hidden md:flex rounded-xl size-8 ${focusMode ? "bg-primary/10 text-primary" : ""}`}
              title={focusMode ? "Sidebar ko'rsatish (Cmd+F)" : "Focus mode (Cmd+F)"}>
              {focusMode ? <Maximize2 className="size-3.5" /> : <Minimize2 className="size-3.5" />}
            </Button>

            {/* Model picker */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-full glass gap-2 h-9 px-3 hover:bg-muted/40 border-border/60">
                  <motion.span
                    key={modelId}
                    initial={{ scale: 0.7, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    className={`size-5 rounded-md bg-gradient-to-br ${ActiveModel.gradient} grid place-items-center text-white`}
                  >
                    <ActiveModel.icon className="size-3" />
                  </motion.span>
                  <span className="font-semibold text-sm">{ActiveModel.name}</span>
                  <ChevronDown className="size-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-80 rounded-2xl p-2">
                {MODEL_LIST.map((m) => (
                  <DropdownMenuItem key={m.id} onClick={() => setModelId(m.id)} className="gap-3 py-2.5 rounded-xl cursor-pointer">
                    <span className={`size-8 rounded-xl bg-gradient-to-br ${m.gradient} grid place-items-center text-white shrink-0`}>
                      <m.icon className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm">{m.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{m.tagline}</div>
                    </div>
                    {modelId === m.id && <Check className="size-3.5 text-primary shrink-0" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-1.5">
            <AnimatePresence>
              {streaming && (
                <motion.span
                  key="streaming-badge"
                  initial={{ opacity: 0, scale: 0.85, x: 8 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.85, x: 8 }}
                  className="hidden sm:inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full glass border border-primary/25 text-primary/70"
                >
                  <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                  Javob generatsiya qilinmoqda…
                </motion.span>
              )}
            </AnimatePresence>
            {provider && !streaming && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                className="hidden sm:inline-flex text-[10px] uppercase tracking-wider px-2 py-1 rounded-full glass border border-border/40 text-muted-foreground"
              >
                {provider.label}
              </motion.span>
            )}

            {/* Cmd+K hint */}
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden md:flex items-center gap-1 px-2 py-1 rounded-lg glass border border-border/40 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              <Zap className="size-2.5" />
              <kbd>⌘K</kbd>
            </button>

            {messages.length > 0 && (
              <>
                <Button size="icon" variant="ghost" onClick={() => setShowTimestamps((v) => !v)}
                  className={`rounded-xl size-8 ${showTimestamps ? "bg-primary/10 text-primary" : ""}`}>
                  <Clock className="size-3.5" />
                </Button>

                {/* Export dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="rounded-xl size-8"><Download className="size-3.5" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem onClick={() => exportConversation("txt")}>📝 TXT formatda</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportConversation("md")}>📄 Markdown formatda</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportConversation("json")}>🔧 JSON formatda</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            {/* Density & font */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="rounded-xl size-8 hidden sm:flex"><SlidersHorizontal className="size-3.5" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl w-44 p-2">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 pb-1 font-semibold">Joylashuv</div>
                {(["compact", "comfortable", "spacious"] as DensityMode[]).map((d) => (
                  <DropdownMenuItem key={d} onClick={() => setDensity(d)} className="rounded-lg">
                    {density === d && <Check className="size-3 mr-2 text-primary" />}
                    {d === "compact" ? "Ixcham" : d === "comfortable" ? "Qulay" : "Keng"}
                  </DropdownMenuItem>
                ))}
                <div className="h-px bg-border/50 my-1" />
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 pb-1 font-semibold">Matn o'lchami</div>
                {(["sm", "base", "lg"] as FontSize[]).map((f) => (
                  <DropdownMenuItem key={f} onClick={() => setFontSize(f)} className="rounded-lg">
                    {fontSize === f && <Check className="size-3 mr-2 text-primary" />}
                    {f === "sm" ? "Kichik" : f === "base" ? "O'rta" : "Katta"}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme switcher compact */}
            <div className="hidden sm:block">
              <ThemeSwitcher compact />
            </div>

            <Button size="icon" variant="ghost" onClick={() => setPanelOpen(true)} className="rounded-xl size-8" title="Panel (Ctrl+P)">
              <LayoutPanelLeft className="size-4" />
            </Button>
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} onScroll={handleScroll} className={`flex-1 overflow-y-auto px-3 md:px-6 ${densityPad} relative`}>
          <AnimatePresence>
            {!isAtBottom && (
              <motion.button
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.9 }}
                onClick={() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); setIsAtBottom(true); }}
                className="fixed bottom-28 right-6 z-20 glass-strong rounded-full p-2.5 border border-border/50 shadow-elev hover:border-primary/30 hover:bg-primary/10 transition-colors"
                title="Pastga o'tish"
              >
                <ChevronDown className="size-4 text-muted-foreground" />
              </motion.button>
            )}
          </AnimatePresence>
          <ModeShell mode={modelId}>
            {messages.length === 0 ? (
              <EmptyState model={ActiveModel} onPick={(s) => { setInput(s); inputRef.current?.focus(); }} mood={mood} />
            ) : (
              <div className={`mx-auto space-y-4 ${modelId === "code" ? "max-w-5xl" : modelId === "voice" ? "max-w-xl" : "max-w-3xl"} ${fontSizeCls}`}>
                <AnimatePresence initial={false}>
                  {messages.map((m, i) => {
                    const isLast = i === messages.length - 1;
                    const isStreamingAssistant = m.role === "assistant" && isLast && streaming;
                    const isUser = m.role === "user";
                    const isAssistant = m.role === "assistant";
                    const isPinned = pinnedMsgIndices.has(i);
                    return (
                      <motion.div
                        key={i} layout="position"
                        initial={{ opacity: 0, x: isUser ? 20 : -20, y: 10, scale: 0.97 }}
                        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: Math.min(i * 0.02, 0.1) }}
                        className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} group ${isPinned ? "relative" : ""}`}
                      >
                        {isPinned && (
                          <div className="absolute -left-2 top-0 h-full w-0.5 rounded-full bg-primary/50" />
                        )}
                        {isAssistant && (
                          <motion.div
                            className="shrink-0 mt-1"
                            initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.05 }}
                          >
                            <div className={`size-8 rounded-2xl glass grid place-items-center ring-1 ${isStreamingAssistant ? "ring-primary/40 shadow-[0_0_20px_-4px_hsl(var(--primary)/0.4)]" : "ring-primary/15"}`}>
                              <Ozing mood={isStreamingAssistant ? "speaking" : "idle"} size={28} gemColor={`hsl(${ActiveModel.gem})`} />
                            </div>
                          </motion.div>
                        )}

                        <div className="flex flex-col items-start max-w-[85%]">
                          <motion.div
                            className={`rounded-3xl px-4 py-3 transition-shadow duration-200 ${
                              isUser
                                ? "bg-ink text-ink-foreground rounded-tr-md shadow-md msg-user"
                                : `glass rounded-tl-md border msg-assistant ${isPinned ? "border-primary/30 shadow-[0_0_20px_-8px_hsl(var(--primary)/0.3)]" : "border-border/30"}`
                            }`}
                            whileHover={isUser ? { scale: 1.003 } : {}}
                          >
                            {m.attachments && m.attachments.length > 0 && (
                              <div className="flex gap-2 mb-2 flex-wrap">
                                {m.attachments.map((a, j) => (
                                  <motion.img key={j} src={a} alt="attachment"
                                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                    className="rounded-xl max-h-40 border border-border cursor-zoom-in" />
                                ))}
                              </div>
                            )}
                            {isAssistant ? (
                              m.content
                                ? <><MessageContent content={m.content} streaming={isStreamingAssistant} />{isStreamingAssistant && <StreamingCursor />}</>
                                : <TypingDots />
                            ) : (
                              <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                            )}
                          </motion.div>

                          <AnimatePresence>
                            {showTimestamps && m.timestamp && (
                              <motion.span
                                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                className="text-[10px] text-muted-foreground/50 mt-1 px-1"
                              >
                                {formatTime(m.timestamp)}
                              </motion.span>
                            )}
                          </AnimatePresence>

                          {isAssistant && m.content && !isStreamingAssistant && (
                            <MessageActions
                              content={m.content}
                              onRegenerate={isLast ? handleRegenerate : undefined}
                              onReaction={(type) => handleReaction(i, type)}
                              reactions={m.reactions as Record<string, boolean>}
                              onPin={() => handlePinMsg(i)}
                              pinned={isPinned}
                              onFork={() => handleForkFromMessage(i)}
                            />
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </ModeShell>
        </div>

        {/* Smart suggestions */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && !streaming && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              className="px-3 md:px-6 pb-2 flex gap-2 justify-center flex-wrap"
            >
              {suggestions.map((s, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                  onClick={() => { setInput(s); setShowSuggestions(false); inputRef.current?.focus(); }}
                  whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
                  className="px-3 py-1.5 rounded-xl glass border border-border/40 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="size-2.5 text-primary" /> {s}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Composer */}
        <div className="px-3 md:px-6 pb-4 pt-2">
          <div className={`mx-auto ${modelId === "code" ? "max-w-5xl" : "max-w-3xl"} relative`}>
            <AnimatePresence>
              {input.startsWith("/") && !input.includes("\n") && (
                <SlashMenu filter={input} onPick={(c) => setInput(c.insert)} />
              )}
            </AnimatePresence>

            {/* Image URL input */}
            <AnimatePresence>
              {urlInputOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                  className="flex gap-2 mb-2"
                >
                  <input
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleImageUrl(); if (e.key === "Escape") setUrlInputOpen(false); }}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 px-3 py-2 rounded-xl bg-muted/40 border border-border/50 text-sm outline-none focus:ring-1 focus:ring-primary/40 font-mono"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleImageUrl} className="rounded-xl">Qo'sh</Button>
                  <Button size="sm" variant="ghost" onClick={() => setUrlInputOpen(false)} className="rounded-xl"><X className="size-4" /></Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pending attachments preview */}
            <AnimatePresence>
              {pendingAttachments.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                  className="flex gap-2 mb-2 flex-wrap"
                >
                  {pendingAttachments.map((a, i) => (
                    <motion.div key={i} layout className="relative">
                      <img src={a} className="size-16 object-cover rounded-xl border border-border" />
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => setPendingAttachments((p) => p.filter((_, j) => j !== i))}
                        className="absolute -top-1 -right-1 size-5 bg-destructive text-destructive-foreground rounded-full grid place-items-center shadow-sm">
                        <X className="size-3" />
                      </motion.button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              className="glass-strong rounded-3xl shadow-soft border overflow-hidden"
              animate={
                streaming
                  ? { boxShadow: "0 0 0 1px hsl(var(--primary)/0.4), 0 0 30px -8px hsl(var(--primary)/0.3)", borderColor: "hsl(var(--primary)/0.3)" }
                  : inputFocused
                  ? { boxShadow: "0 0 0 1px hsl(var(--primary)/0.2), 0 0 16px -8px hsl(var(--primary)/0.15)", borderColor: "hsl(var(--border)/0.7)" }
                  : { boxShadow: "none", borderColor: "hsl(var(--border)/0.4)" }
              }
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-end gap-1.5 p-2">
                {/* Image attach */}
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFile} className="hidden" />
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="rounded-xl shrink-0 size-9 hover:bg-primary/10">
                      <ImageIcon className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="rounded-xl">
                    <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                      <ImageIcon className="size-3.5 mr-2" /> Galereya
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => cameraRef.current?.click()}>
                      <Camera className="size-3.5 mr-2" /> Kamera
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setUrlInputOpen(true)}>
                      <Link2 className="size-3.5 mr-2" /> URL dan
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                    if (e.key === "Escape") { setInput(""); if (inputRef.current) inputRef.current.style.height = "auto"; }
                  }}
                  placeholder={`${ActiveModel.name} ga yozing… · Shift+Enter yangi qator · Ctrl+V rasm`}
                  rows={1}
                  className="flex-1 bg-transparent outline-none resize-none px-2 py-2.5 text-sm placeholder:text-muted-foreground/40 leading-relaxed"
                  style={{ minHeight: 40, maxHeight: 160 }}
                />

                {/* Voice mode button */}
                <motion.div whileTap={{ scale: 0.9 }} className="relative">
                  {listening && (
                    <span className="absolute inset-0 rounded-xl bg-violet-500/20 animate-ping-slow" />
                  )}
                  <Button
                    size="icon" variant="ghost"
                    onClick={() => setVoiceModeOpen(true)}
                    className={`relative rounded-xl shrink-0 size-9 ${listening ? "bg-violet-500/15 text-violet-400" : "hover:bg-violet-500/10 text-muted-foreground hover:text-violet-400"}`}
                    title="Ideal Voice Mode"
                  >
                    <Mic className="size-4" />
                  </Button>
                </motion.div>

                {streaming ? (
                  <motion.div whileTap={{ scale: 0.9 }} className="relative">
                    <span className="absolute inset-0 rounded-xl bg-destructive/30 animate-ping-slow" />
                    <Button size="icon" variant="destructive" onClick={stop} className="relative rounded-xl shrink-0 size-9">
                      <Square className="size-4" />
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}>
                    <Button
                      size="icon" onClick={() => handleSend()}
                      disabled={!input.trim() && !pendingAttachments.length}
                      variant={(input.trim() || pendingAttachments.length) ? "glow" : "ink"}
                      className="rounded-xl shrink-0 size-9 disabled:opacity-30 shine"
                    >
                      <Send className="size-4" />
                    </Button>
                  </motion.div>
                )}
              </div>

              <div className="flex items-center justify-between px-4 pb-2 text-[10px] text-muted-foreground/40">
                <span className="flex items-center gap-1">
                  <Sparkles className="size-2.5" />
                  MV AI v9 · {ActiveModel.tagline}
                </span>
                <AnimatePresence mode="wait">
                  {input.length > 30 ? (
                    <motion.span key="count" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="tabular-nums">
                      {input.length} belgi
                    </motion.span>
                  ) : (
                    <motion.span key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="hidden sm:flex items-center gap-1">
                      <Keyboard className="size-2.5" /> ⌘K buyruqlar · Enter yuborish
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Panel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </div>
  );
}

function EmptyState({ model, onPick, mood }: { model: any; onPick: (s: string) => void; mood: OzingMood }) {
  const prompts = EMPTY_PROMPTS[model.id as ModelId] || EMPTY_PROMPTS.humanoid;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="mb-6"
      >
        <div className={`size-20 rounded-3xl bg-gradient-to-br ${model.gradient} grid place-items-center shadow-[0_0_60px_-10px] text-white mx-auto`}
          style={{ boxShadow: `0 0 60px -10px hsl(${model.gem}/0.5)` }}>
          <Ozing mood={mood} size={56} gemColor={`hsl(${model.gem})`} />
        </div>
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="font-display text-3xl md:text-4xl tracking-tight font-bold mb-2">
        {model.name}
      </motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="text-muted-foreground text-base max-w-sm mb-10">
        {model.description}
      </motion.p>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
        {prompts.map((p, i) => (
          <motion.button
            key={i} onClick={() => onPick(p)}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + i * 0.06 }}
            whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
            className="text-left px-4 py-3 rounded-2xl glass border border-border/40 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 text-sm text-foreground/80 group"
          >
            <span className="group-hover:text-foreground transition-colors">{p}</span>
            <ChevronRight className="inline size-3 ml-1 opacity-0 group-hover:opacity-60 transition-opacity" />
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
}
