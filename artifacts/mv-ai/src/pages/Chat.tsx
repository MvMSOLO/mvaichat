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
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Plus, Send, Mic, MicOff, Square, Settings as SettingsIcon, Menu,
  Pin, Trash2, ChevronDown, LayoutPanelLeft, LogOut, Image as ImageIcon, X,
  Sparkles, Copy, Check, RotateCcw, ThumbsUp, ThumbsDown, Search,
  MessageSquare, Clock, Download, Share2, Keyboard, ChevronRight,
} from "lucide-react";

interface Conversation { id: string; title: string; modelId: ModelId; pinned: boolean; updatedAt: string; }

function formatTime(ts?: number | string): string {
  const d = ts ? new Date(ts) : new Date();
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function TypingDots() {
  return (
    <motion.div className="flex items-center gap-1.5 py-1 px-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-2 rounded-full bg-primary/60"
          animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
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

function MessageActions({
  content, onRegenerate, onReaction, reactions,
}: {
  content: string;
  onRegenerate?: () => void;
  onReaction?: (type: "like" | "dislike") => void;
  reactions?: { like?: boolean; dislike?: boolean };
}) {
  const [copied, setCopied] = useState(false);
  return (
    <motion.div
      className="flex items-center gap-0.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      initial={{ opacity: 0 }}
    >
      <button
        onClick={() => { navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        className="p-1.5 rounded-lg hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
        title="Copy"
      >
        {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
      </button>
      {onRegenerate && (
        <button onClick={onRegenerate} className="p-1.5 rounded-lg hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors" title="Regenerate">
          <RotateCcw className="size-3.5" />
        </button>
      )}
      {onReaction && (
        <>
          <button
            onClick={() => onReaction("like")}
            className={`p-1.5 rounded-lg transition-colors ${reactions?.like ? "text-primary bg-primary/10" : "hover:bg-muted/80 text-muted-foreground hover:text-foreground"}`}
            title="Good response"
          >
            <ThumbsUp className="size-3.5" />
          </button>
          <button
            onClick={() => onReaction("dislike")}
            className={`p-1.5 rounded-lg transition-colors ${reactions?.dislike ? "text-destructive bg-destructive/10" : "hover:bg-muted/80 text-muted-foreground hover:text-foreground"}`}
            title="Bad response"
          >
            <ThumbsDown className="size-3.5" />
          </button>
        </>
      )}
    </motion.div>
  );
}

const EMPTY_PROMPTS: Record<ModelId, string[]> = {
  humanoid: ["Bugun meni qiziqtirgan narsa...", "Menga \u0634\u0639\u0631 yoz...", "Qanday qilib motivatsiya topaman?", "Yaxshi kitob tavsiya qil"],
  ideal: ["Step by step tushuntir: neyron tarmoqlar", "Kuchli argumentlar yozish strategiyasi", "Murakkab qarorlar qabul qilish", "Dunyoning kelajagi qanday bo'ladi?"],
  code: ["React hook yoz: local storage sync", "Python FastAPI CRUD endpoint", "TypeScript generic utility types", "SQL query optimization misollar"],
  vision: ["Bu rasmni tahlil qil", "Screenshot UI ni tushuntir", "Logo dizayni haqida fikr ber", "Diagrammani o'qi va izohlа"],
  search: ["Hozirgi AI yangiliklari", "Crypto bozori ahvoli", "O'zbekiston texnologiya yangiliklari", "Eng yaxshi frontend freymvorklar 2025"],
  voice: ["Bugun nima qilishim kerak?", "Motivatsiya ber", "Qisqa maslahat", "Menga bir narsa ayt"],
  agents: ["Biznes strategiya ishlab chiq", "Kuchli marketing kampaniya", "Yangi loyiha uchun rejа", "Murakkab muammoni hal qil"],
  social: ["YouTube'da qidir: lo-fi music", "@MrBeast kanaliga obuna bo'l", "Telegram kanalim: @mvai", "Instagram'da post ulash"],
};

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
  const [searchOpen, setSearchOpen] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(false);
  const recogRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { send, stop, streaming, provider } = useChatStream();
  const { memories, autoExtract } = useMemory(user?.id);
  const { settings } = useSettings(user?.id);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    const r = await fetch("/api/conversations", { credentials: "include" });
    if (r.ok) {
      const data: Conversation[] = await r.json();
      data.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      setConversations(data);
    }
  }, [user]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    fetch(`/api/conversations/${activeId}/messages`, { credentials: "include" }).then(async (r) => {
      if (r.ok) {
        const data = await r.json();
        setMessages(data.map((m: any) => ({
          role: m.role,
          content: m.content,
          attachments: m.attachments,
          timestamp: new Date(m.createdAt || Date.now()).getTime(),
          modelId: m.modelId,
        })));
      }
    });
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => {
    if (streaming) setMood("speaking");
    else if (input.length > 0) setMood("curious");
    else setMood("idle");
  }, [streaming, input]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };

  const newChat = () => { setActiveId(null); setMessages([]); setSheetOpen(false); };

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
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: acc, timestamp: Date.now() };
          return next;
        });
      },
      undefined, memories,
      async (calls) => {
        if (!calls.length) return;
        const results = await runToolCalls(calls);
        const summary = results.map((r) => r.message || (r.ok ? "Done" : `Error: ${r.error || ""}`)).join("\n");
        if (summary) {
          acc += (acc ? "\n\n" : "") + `_${summary}_`;
          setMessages((prev) => { const next = [...prev]; next[next.length - 1] = { role: "assistant", content: acc }; return next; });
        }
      },
      settings,
    );
  };

  const handleReaction = (index: number, type: "like" | "dislike") => {
    setMessages((prev) => prev.map((m, i) => {
      if (i !== index) return m;
      const reactions = { ...m.reactions };
      if (type === "like") reactions.like = !reactions.like;
      if (type === "dislike") reactions.dislike = !reactions.dislike;
      return { ...m, reactions };
    }));
  };

  const handleSend = async () => {
    if (!input.trim() || !user) return;
    const text = input.trim();
    const attachments = [...pendingAttachments];
    setInput("");
    setPendingAttachments([]);
    if (inputRef.current) inputRef.current.style.height = "auto";

    let convId = activeId;
    let isNew = false;
    if (!convId) {
      const r = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: "Yangi chat", modelId }),
      });
      if (!r.ok) { toast.error("Suhbat yaratishda xato"); return; }
      const conv = await r.json();
      convId = conv.id;
      setActiveId(convId);
      isNew = true;
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
        setMessages((prev) => { const next = [...prev]; next[next.length - 1] = { role: "assistant", content: acc }; return next; });
      },
      attachments.length > 0 ? attachments : undefined,
      memories,
      async (calls) => {
        if (!calls.length) return;
        const results = await runToolCalls(calls);
        const summary = results.map((r) => r.message || (r.ok ? "Done" : `Error: ${r.error || ""}`)).join("\n");
        if (summary) {
          acc += (acc ? "\n\n" : "") + `_${summary}_`;
          setMessages((prev) => { const next = [...prev]; next[next.length - 1] = { role: "assistant", content: acc }; return next; });
        }
      },
      settings,
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
      setMood("happy"); setTimeout(() => setMood("idle"), 1800);
    }
    loadConversations();
  };

  const toggleListen = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Ovoz kiritish qo'llab-quvvatlanmaydi"); return; }
    if (listening) { recogRef.current?.stop(); setListening(false); return; }
    const r = new SR();
    r.continuous = false; r.interimResults = true; r.lang = "uz-UZ";
    r.onresult = (e: any) => {
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join("");
      setInput(t);
    };
    r.onend = () => setListening(false);
    r.onerror = () => { setListening(false); toast.error("Mikrofon xatosi"); };
    r.start();
    recogRef.current = r;
    setListening(true);
    setMood("listening");
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPendingAttachments((prev) => [...prev, dataUrl]);
      if (modelId !== "vision") setModelId("vision");
      toast.success("Rasm biriktirildi");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
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

  const exportConversation = () => {
    if (!messages.length) return;
    const text = messages.map((m) => `[${m.role.toUpperCase()}]\n${m.content}`).join("\n\n---\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `mv-ai-chat-${Date.now()}.txt`;
    a.click();
  };

  const filteredConversations = conversations.filter((c) =>
    !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ActiveModel = MODELS[modelId];

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border/60">
        <div className="flex items-center gap-2 mb-4">
          <BrandMark size={32} />
          <span className="font-display text-lg tracking-tight">MV AI</span>
          <span className="ml-auto text-[9px] font-mono uppercase tracking-widest text-primary/60 px-1.5 py-0.5 rounded-full border border-primary/20">v7</span>
        </div>
        <Button onClick={newChat} className="w-full rounded-xl bg-ink text-ink-foreground hover:bg-ink/90 h-10 font-semibold shine">
          <Plus className="size-4" /> Yangi chat
        </Button>
        <div className="mt-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Chatlarni qidirish…"
            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-muted/50 border border-border/40 focus:outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground/60"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        <AnimatePresence initial={false}>
          {filteredConversations.map((c) => (
            <motion.div
              key={c.id} layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`group flex items-center gap-1 rounded-xl transition-colors ${activeId === c.id ? "bg-primary/10" : "hover:bg-muted/60"}`}
            >
              <button onClick={() => { setActiveId(c.id); setModelId(c.modelId as ModelId); setSheetOpen(false); }}
                className="flex-1 text-left px-3 py-2.5 truncate text-sm">
                {c.pinned && <Pin className="inline size-3 mr-1 text-primary" />}
                <span className={`font-medium ${activeId === c.id ? "text-primary" : ""}`}>{c.title}</span>
                <div className="text-[10px] text-muted-foreground/60 mt-0.5">{formatTime(c.updatedAt)}</div>
              </button>
              <div className="flex opacity-0 group-hover:opacity-100 transition pr-1">
                <button onClick={() => togglePin(c)} className="p-1.5 hover:bg-background rounded-md"><Pin className="size-3" /></button>
                <button onClick={() => deleteConv(c.id)} className="p-1.5 hover:bg-background rounded-md text-destructive"><Trash2 className="size-3" /></button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {filteredConversations.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8 px-4">
            {searchQuery ? "Hech narsa topilmadi" : "Hali chatlar yo'q.\nQuyida boshlang."}
          </p>
        )}
      </div>
      <div className="p-2 border-t border-border/60 space-y-0.5">
        <Button variant="ghost" className="w-full justify-start rounded-xl h-9 font-medium text-sm" onClick={() => navigate("/settings")}>
          <SettingsIcon className="size-4" /> Sozlamalar
        </Button>
        <Button variant="ghost" className="w-full justify-start rounded-xl h-9 font-medium text-sm" onClick={async () => { await signOut(); navigate("/"); }}>
          <LogOut className="size-4" /> Chiqish
        </Button>
      </div>
    </div>
  );

  return (
    <div className="h-[100dvh] flex relative overflow-hidden bg-background">
      <div className="fixed inset-0 mesh-bg pointer-events-none" />
      <div className="fixed inset-0 aurora-bg opacity-30 pointer-events-none" />
      <div className="fixed inset-0 dot-grid-fade opacity-20 pointer-events-none" />

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-72 border-r border-border/60 glass-strong z-10">
        <Sidebar />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 z-10">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-2 px-3 md:px-5 py-3 border-b border-border/60 glass-strong">
          <div className="flex items-center gap-2">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button size="icon" variant="ghost" className="md:hidden rounded-xl"><Menu /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72"><Sidebar /></SheetContent>
            </Sheet>

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
                    {modelId === m.id && <span className="size-1.5 rounded-full bg-primary shrink-0" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-1.5">
            {provider && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="hidden sm:inline-flex text-[10px] uppercase tracking-wider px-2 py-1 rounded-full glass border border-border/40 text-muted-foreground"
              >
                {provider.label}
              </motion.span>
            )}
            {messages.length > 0 && (
              <>
                <Button size="icon" variant="ghost" onClick={() => setShowTimestamps((v) => !v)} title="Show timestamps"
                  className={`rounded-xl size-8 ${showTimestamps ? "bg-primary/10 text-primary" : ""}`}>
                  <Clock className="size-3.5" />
                </Button>
                <Button size="icon" variant="ghost" onClick={exportConversation} title="Export chat" className="rounded-xl size-8">
                  <Download className="size-3.5" />
                </Button>
              </>
            )}
            <Button size="icon" variant="ghost" onClick={() => setPanelOpen(true)} title="Open Mini Ozing" className="rounded-xl size-8">
              <LayoutPanelLeft className="size-4" />
            </Button>
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 md:px-6 py-6">
          <ModeShell mode={modelId}>
            {messages.length === 0 ? (
              <EmptyState model={ActiveModel} onPick={(s) => { setInput(s); inputRef.current?.focus(); }} mood={mood} />
            ) : (
              <div className={`mx-auto space-y-4 ${modelId === "code" ? "max-w-5xl" : modelId === "voice" ? "max-w-xl" : "max-w-3xl"}`}>
                <AnimatePresence initial={false}>
                  {messages.map((m, i) => {
                    const isLast = i === messages.length - 1;
                    const isStreamingAssistant = m.role === "assistant" && isLast && streaming;
                    const isUser = m.role === "user";
                    const isAssistant = m.role === "assistant";
                    return (
                      <motion.div
                        key={i}
                        layout="position"
                        initial={{ opacity: 0, x: isUser ? 20 : -20, y: 10, scale: 0.97 }}
                        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: Math.min(i * 0.02, 0.1) }}
                        className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} group`}
                      >
                        {isAssistant && (
                          <motion.div
                            className="shrink-0 mt-1"
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.05 }}
                          >
                            <div className={`size-8 rounded-2xl glass grid place-items-center ring-1 ${isStreamingAssistant ? "ring-primary/40 shadow-[0_0_20px_-4px_hsl(var(--primary)/0.4)]" : "ring-primary/15"}`}>
                              <Ozing mood={isStreamingAssistant ? "speaking" : "idle"} size={28} gemColor={`hsl(${ActiveModel.gem})`} />
                            </div>
                          </motion.div>
                        )}

                        <div className="flex flex-col items-start max-w-[85%]">
                          <motion.div
                            className={`rounded-3xl px-4 py-3 ${
                              isUser
                                ? "bg-ink text-ink-foreground rounded-tr-md shadow-md"
                                : "glass rounded-tl-md border border-border/30"
                            }`}
                            whileHover={isUser ? { scale: 1.003 } : {}}
                          >
                            {m.attachments && m.attachments.length > 0 && (
                              <div className="flex gap-2 mb-2 flex-wrap">
                                {m.attachments.map((a, j) => (
                                  <motion.img key={j} src={a} alt="attachment"
                                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                    className="rounded-xl max-h-40 border border-border" />
                                ))}
                              </div>
                            )}
                            {isAssistant ? (
                              m.content
                                ? <>
                                    <MessageContent content={m.content} streaming={isStreamingAssistant} />
                                    {isStreamingAssistant && <StreamingCursor />}
                                  </>
                                : <TypingDots />
                            ) : (
                              <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">{m.content}</p>
                            )}
                          </motion.div>

                          {/* Timestamp */}
                          <AnimatePresence>
                            {showTimestamps && m.timestamp && (
                              <motion.span
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                className="text-[10px] text-muted-foreground/50 mt-1 px-1"
                              >
                                {formatTime(m.timestamp)}
                              </motion.span>
                            )}
                          </AnimatePresence>

                          {/* Message actions */}
                          {isAssistant && m.content && !isStreamingAssistant && (
                            <MessageActions
                              content={m.content}
                              onRegenerate={isLast ? handleRegenerate : undefined}
                              onReaction={(type) => handleReaction(i, type)}
                              reactions={m.reactions}
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

        {/* Composer */}
        <div className="px-3 md:px-6 pb-4 pt-2">
          <div className={`mx-auto ${modelId === "code" ? "max-w-5xl" : "max-w-3xl"} relative`}>
            <AnimatePresence>
              {input.startsWith("/") && !input.includes("\n") && (
                <SlashMenu filter={input} onPick={(c) => setInput(c.insert)} />
              )}
            </AnimatePresence>
            <AnimatePresence>
              {pendingAttachments.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                  className="flex gap-2 mb-2 flex-wrap"
                >
                  {pendingAttachments.map((a, i) => (
                    <motion.div key={i} layout className="relative">
                      <img src={a} className="size-16 object-cover rounded-xl border border-border" />
                      <button onClick={() => setPendingAttachments((p) => p.filter((_, j) => j !== i))}
                        className="absolute -top-1 -right-1 size-5 bg-destructive text-destructive-foreground rounded-full grid place-items-center">
                        <X className="size-3" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              className="glass-strong rounded-3xl shadow-soft border border-border/40 overflow-hidden"
              animate={streaming ? { boxShadow: "0 0 0 1px hsl(var(--primary)/0.3), 0 0 30px -8px hsl(var(--primary)/0.25)" } : {}}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-end gap-1.5 p-2">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                <Button size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} title="Rasm biriktirish"
                  className="rounded-xl shrink-0 size-9 hover:bg-primary/10">
                  <ImageIcon className="size-4" />
                </Button>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                    if (e.key === "Escape") { setInput(""); if (inputRef.current) inputRef.current.style.height = "auto"; }
                  }}
                  placeholder={`${ActiveModel.name} ga yozing… (Shift+Enter — yangi qator)`}
                  rows={1}
                  className="flex-1 bg-transparent outline-none resize-none px-2 py-2.5 text-sm placeholder:text-muted-foreground/50 leading-relaxed"
                  style={{ minHeight: 40, maxHeight: 160 }}
                />
                <Button size="icon" variant={listening ? "default" : "ghost"} onClick={toggleListen} title="Ovozli kiritish"
                  className={`rounded-xl shrink-0 size-9 ${listening ? "bg-primary text-primary-foreground animate-pulse-glow" : "hover:bg-primary/10"}`}>
                  {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                </Button>
                {streaming ? (
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <Button size="icon" variant="destructive" onClick={stop} className="rounded-xl shrink-0 size-9">
                      <Square className="size-4" />
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}>
                    <Button size="icon" onClick={handleSend} disabled={!input.trim() && !pendingAttachments.length}
                      className="rounded-xl bg-ink text-ink-foreground hover:bg-ink/90 shrink-0 size-9 disabled:opacity-30 shine">
                      <Send className="size-4" />
                    </Button>
                  </motion.div>
                )}
              </div>
              {/* Bottom hint */}
              <div className="flex items-center justify-between px-4 pb-2 text-[10px] text-muted-foreground/40">
                <span className="flex items-center gap-1">
                  <Sparkles className="size-2.5" />
                  MV AI · {ActiveModel.tagline}
                </span>
                <span className="hidden sm:flex items-center gap-1">
                  <Keyboard className="size-2.5" /> Enter yuborish · Shift+Enter yangi qator
                </span>
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
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

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="font-display text-3xl md:text-4xl tracking-tight font-bold mb-2"
      >
        {model.name}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-muted-foreground text-base max-w-sm mb-10"
      >
        {model.description}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full"
      >
        {prompts.map((p, i) => (
          <motion.button
            key={i}
            onClick={() => onPick(p)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + i * 0.06 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
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
