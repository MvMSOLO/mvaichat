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
import { SmoothStream } from "@/components/SmoothStream";
import { SlashMenu, SLASH } from "@/components/SlashMenu";
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
  Pin, Trash2, ChevronDown, LayoutPanelLeft, LogOut, Image as ImageIcon, X, Sparkles
} from "lucide-react";

interface Conversation { id: string; title: string; modelId: ModelId; pinned: boolean; updatedAt: string; }

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
  const recogRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { send, stop, streaming, provider } = useChatStream();
  const { memories, autoExtract } = useMemory(user?.id);
  const { settings } = useSettings(user?.id);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    const r = await fetch("/api/conversations", { credentials: "include" });
    if (r.ok) {
      const data: Conversation[] = await r.json();
      // Sort pinned first, then by updatedAt desc
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
        setMessages(data.map((m: any) => ({ role: m.role, content: m.content, attachments: m.attachments })));
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

  const newChat = () => { setActiveId(null); setMessages([]); setSheetOpen(false); };

  const handleSend = async () => {
    if (!input.trim() || !user) return;
    const text = input.trim();
    const attachments = [...pendingAttachments];
    setInput("");
    setPendingAttachments([]);

    let convId = activeId;
    let isNew = false;
    if (!convId) {
      const r = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: "New chat", modelId }),
      });
      if (!r.ok) { toast.error("Failed to create conversation"); return; }
      const conv = await r.json();
      convId = conv.id;
      setActiveId(convId);
      isNew = true;
    }

    const userMsg: ChatMsg = { role: "user", content: text, attachments };
    const baseMessages = [...messages, userMsg];
    setMessages([...baseMessages, { role: "assistant", content: "" }]);

    await fetch(`/api/conversations/${convId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ role: "user", content: text, attachments }),
    });
    autoExtract(text).catch(() => {});

    if (isNew) {
      generateTitle(text).then(async (title) => {
        await fetch(`/api/conversations/${convId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ title }),
        });
        loadConversations();
      });
    }

    // Slash command short-circuit
    if (text.startsWith("/")) {
      setMood("thinking");
      const slashOut = await runSlash(text);
      if (slashOut !== null) {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: slashOut };
          return next;
        });
        await fetch(`/api/conversations/${convId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ role: "assistant", content: slashOut, modelId }),
        });
        await fetch(`/api/conversations/${convId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ updatedAt: new Date().toISOString() }),
        });
        setMood("happy"); setTimeout(() => setMood("idle"), 1500);
        loadConversations();
        return;
      }
    }

    let acc = "";
    await send(
      baseMessages.map((m) => ({ role: m.role, content: m.content })),
      modelId,
      (chunk) => {
        acc += chunk;
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: acc };
          return next;
        });
      },
      attachments.length > 0 ? attachments : undefined,
      memories,
      async (calls) => {
        if (!calls.length) return;
        const results = await runToolCalls(calls);
        const summary = results.map((r) => r.message || (r.ok ? "Done" : `Error: ${r.error || ""}`)).join("\n");
        if (summary) {
          acc += (acc ? "\n\n" : "") + `_${summary}_`;
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = { role: "assistant", content: acc };
            return next;
          });
        }
      },
      settings,
      (p) => {
        if (p.id !== "openai") toast.message(`Switched to ${p.label}`, { description: "Primary provider was busy — using a healthy backup." });
      },
    );

    if (acc) {
      await fetch(`/api/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role: "assistant", content: acc, modelId }),
      });
      await fetch(`/api/conversations/${convId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ updatedAt: new Date().toISOString() }),
      });
      if (modelId === "voice" && "speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(acc);
        u.rate = 1.05; u.pitch = 1.1;
        window.speechSynthesis.speak(u);
      }
      setMood("happy");
      setTimeout(() => setMood("idle"), 1800);
    }
    loadConversations();
  };

  const toggleListen = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Voice input not supported in this browser"); return; }
    if (listening) { recogRef.current?.stop(); setListening(false); return; }
    const r = new SR();
    r.continuous = false; r.interimResults = true; r.lang = "en-US";
    r.onresult = (e: any) => {
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join("");
      setInput(t);
    };
    r.onend = () => setListening(false);
    r.onerror = () => { setListening(false); toast.error("Mic error"); };
    r.start();
    recogRef.current = r;
    setListening(true);
    setMood("listening");
  };

  // For file uploads, we use a data URL approach (no storage backend needed for images in chat)
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPendingAttachments((prev) => [...prev, dataUrl]);
      if (modelId !== "vision") setModelId("vision");
      toast.success("Image attached");
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
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ pinned: !c.pinned }),
    });
    loadConversations();
  };

  const ActiveModel = MODELS[modelId];

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border/60">
        <div className="flex items-center gap-2 mb-4">
          <BrandMark size={32} />
          <span className="font-display text-lg tracking-tight">MV AI</span>
        </div>
        <Button onClick={newChat} className="w-full rounded-xl bg-ink text-ink-foreground hover:bg-ink/90 h-10 font-semibold shine">
          <Plus className="size-4" /> New chat
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        <AnimatePresence initial={false}>
          {conversations.map((c) => (
            <motion.div
              key={c.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`group flex items-center gap-1 rounded-xl transition-colors ${activeId === c.id ? "bg-primary/10 text-primary-foreground" : "hover:bg-muted/60"}`}
            >
              <button onClick={() => { setActiveId(c.id); setModelId(c.modelId as ModelId); setSheetOpen(false); }}
                className="flex-1 text-left px-3 py-2 truncate text-sm font-medium">
                {c.pinned && <Pin className="inline size-3 mr-1 text-primary" />}
                <span className={activeId === c.id ? "text-foreground" : ""}>{c.title}</span>
              </button>
              <div className="flex opacity-0 group-hover:opacity-100 transition pr-1">
                <button onClick={() => togglePin(c)} className="p-1.5 hover:bg-background rounded-md"><Pin className="size-3" /></button>
                <button onClick={() => deleteConv(c.id)} className="p-1.5 hover:bg-background rounded-md text-destructive"><Trash2 className="size-3" /></button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {conversations.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">No chats yet.<br/>Start one below.</p>
        )}
      </div>
      <div className="p-2 border-t border-border/60 space-y-0.5">
        <Button variant="ghost" className="w-full justify-start rounded-xl h-10 font-medium" onClick={() => navigate("/settings")}>
          <SettingsIcon className="size-4" /> Settings
        </Button>
        <Button variant="ghost" className="w-full justify-start rounded-xl h-10 font-medium" onClick={async () => { await signOut(); navigate("/"); }}>
          <LogOut className="size-4" /> Sign out
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
                <Button variant="outline" className="rounded-full glass gap-2 h-10 px-3 hover:bg-muted/40 border-border/60">
                  <motion.span
                    key={modelId}
                    initial={{ scale: 0.8, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className={`size-6 rounded-lg bg-gradient-to-br ${ActiveModel.gradient} grid place-items-center text-white shadow-sm`}
                  >
                    <ActiveModel.icon className="size-3.5" />
                  </motion.span>
                  <span className="font-semibold text-sm">{ActiveModel.name}</span>
                  <ChevronDown className="size-3.5 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-80 rounded-2xl p-2">
                {MODEL_LIST.map((m) => (
                  <DropdownMenuItem key={m.id} onClick={() => setModelId(m.id)} className="gap-3 py-3 rounded-xl cursor-pointer">
                    <span className={`size-9 rounded-xl bg-gradient-to-br ${m.gradient} grid place-items-center text-white shrink-0 shadow-sm`}>
                      <m.icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm">{m.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{m.tagline}</div>
                    </div>
                    {modelId === m.id && <span className="size-2 rounded-full bg-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2">
            {provider && (
              <span className="hidden sm:inline-flex text-[10px] uppercase tracking-wider px-2 py-1 rounded-full glass border border-border/40 text-muted-foreground">
                via {provider.label}
              </span>
            )}
            <Button size="icon" variant="ghost" onClick={() => setPanelOpen(true)} title="Open Mini Ozing"
              className="rounded-xl hover:bg-muted/40">
              <LayoutPanelLeft />
            </Button>
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 md:px-6 py-6">
          <ModeShell mode={modelId}>
          {messages.length === 0 ? (
            <EmptyState model={ActiveModel} onPick={(s) => setInput(s)} mood={mood} />
          ) : (
            <div className={`mx-auto space-y-5 ${modelId === "code" ? "max-w-5xl" : modelId === "voice" ? "max-w-xl" : "max-w-3xl"}`}>
              <AnimatePresence initial={false}>
                {messages.map((m, i) => {
                  const isLast = i === messages.length - 1;
                  const isStreamingAssistant = m.role === "assistant" && isLast && streaming;
                  return (
                  <motion.div
                    key={i}
                    layout
                    initial={{ opacity: 0, y: 12, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
                  >
                    {m.role === "assistant" && (
                      <div className="shrink-0">
                        <div className="size-9 rounded-2xl glass grid place-items-center">
                          <Ozing mood={isStreamingAssistant ? "speaking" : "idle"} size={32} gemColor={`hsl(${ActiveModel.gem})`} />
                        </div>
                      </div>
                    )}
                    <div className={`max-w-[85%] rounded-3xl px-4 py-3 ${m.role === "user" ? "bg-ink text-ink-foreground rounded-tr-md" : "glass rounded-tl-md"}`}>
                      {m.attachments && m.attachments.length > 0 && (
                        <div className="flex gap-2 mb-2 flex-wrap">
                          {m.attachments.map((a, j) => (
                            <img key={j} src={a} alt="attachment" className="rounded-xl max-h-40 border border-border" />
                          ))}
                        </div>
                      )}
                      {m.role === "assistant" ? (
                        m.content
                          ? <MessageContent content={m.content} />
                          : <TypingDots />
                      ) : (
                        <p className="whitespace-pre-wrap text-sm md:text-base">{m.content}</p>
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
          <div className="max-w-3xl mx-auto relative">
            <AnimatePresence>
              {input.startsWith("/") && !input.includes("\n") && (
                <SlashMenu
                  filter={input}
                  onPick={(c) => setInput(c.insert)}
                />
              )}
            </AnimatePresence>
            <AnimatePresence>
              {pendingAttachments.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="flex gap-2 mb-2 flex-wrap"
                >
                  {pendingAttachments.map((a, i) => (
                    <motion.div key={i} layout className="relative">
                      <img src={a} className="size-16 object-cover rounded-xl border border-border" />
                      <button onClick={() => setPendingAttachments((p) => p.filter((_, j) => j !== i))}
                        className="absolute -top-1 -right-1 size-5 bg-destructive text-destructive-foreground rounded-full grid place-items-center text-xs">
                        <X className="size-3" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div
              className="glass-strong rounded-3xl shadow-soft p-2 flex items-end gap-1.5 border border-border/40"
              whileFocus={{ scale: 1.005 }}
            >
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
              <Button size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} title="Attach image" className="rounded-xl shrink-0">
                <ImageIcon className="size-4" />
              </Button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={`Ask ${ActiveModel.name}…`}
                rows={1}
                className="flex-1 bg-transparent outline-none resize-none px-2 py-2.5 max-h-40 text-sm placeholder:text-muted-foreground/60"
                style={{ minHeight: 40 }}
              />
              <Button size="icon" variant={listening ? "default" : "ghost"} onClick={toggleListen} title="Voice input"
                className={`rounded-xl shrink-0 ${listening ? "bg-primary text-primary-foreground animate-pulse-glow" : ""}`}>
                {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
              </Button>
              {streaming ? (
                <Button size="icon" variant="destructive" onClick={stop} className="rounded-xl shrink-0"><Square className="size-4" /></Button>
              ) : (
                <motion.div whileTap={{ scale: 0.9 }}>
                  <Button size="icon" onClick={handleSend} disabled={!input.trim()}
                    className="rounded-xl bg-ink text-ink-foreground hover:bg-ink/90 shrink-0 disabled:opacity-40">
                    <Send className="size-4" />
                  </Button>
                </motion.div>
              )}
            </motion.div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              <Sparkles className="inline size-2.5" /> MV AI can make mistakes. Verify important info.
            </p>
          </div>
        </div>
      </main>

      <Panel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex gap-1 py-2">
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="size-2 rounded-full bg-primary"
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4], scale: [1, 1.2, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }} />
      ))}
    </div>
  );
}

function EmptyState({ model, onPick, mood }: { model: typeof MODELS[ModelId]; onPick: (s: string) => void; mood: OzingMood }) {
  const suggestions: Record<ModelId, string[]> = {
    humanoid: ["Plan my week", "Suggest a weekend hobby", "Help me word a tricky email"],
    ideal: ["Compare two career paths", "Explain quantum entanglement clearly", "Build a 30-day learning plan"],
    code: ["Refactor a React component", "Explain this stack trace", "Write a SQL query for top users"],
    vision: ["Describe an attached image", "Extract text from a screenshot", "Identify UI components"],
    search: ["Recent news on AI safety", "Best practices for indie launches", "What's trending in design?"],
    voice: ["Tell me a fun fact", "How's the weather described?", "Quick stretch routine for desks"],
    agents: ["Plan a product launch", "Research + write a poem about Tashkent", "Brainstorm an app idea end-to-end"],
    social: ["Open @mrbeast on YouTube", "https://instagram.com/zendaya", "tiktok.com/@khaby.lame"],
  };

  const mood3D: Ozing3DMood =
    mood === "thinking" || mood === "loading" ? "think"
    : mood === "happy" || mood === "celebrate" || mood === "love" || mood === "success" ? "happy"
    : mood === "listening" || mood === "speaking" ? "focus"
    : mood === "curious" || mood === "awe" || mood === "magic" ? "curious"
    : "idle";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto px-4"
    >
      <Ozing3D mood={mood3D} size={160} followCursor glow />
      <h2 className="mt-6 font-display text-3xl tracking-tighter">
        Chat with <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-violet-400">{model.name}</span>
      </h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-xs">{model.tagline}</p>
      <div className="mt-6 flex flex-wrap gap-2 justify-center">
        {(suggestions[model.id] || []).map((s) => (
          <button key={s} onClick={() => onPick(s)}
            className="px-4 py-2 rounded-full glass text-xs font-medium hover:bg-muted/60 transition-colors border border-border/40">
            {s}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
