import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useChatStream, generateTitle, ChatMsg } from "@/hooks/useChatStream";
import { MODELS, MODEL_LIST, ModelId } from "@/lib/models";
import { Ozing, OzingMood } from "@/components/Ozing";
import { MessageContent } from "@/components/MessageContent";
import { Panel } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Plus, Send, Mic, MicOff, Square, Settings as SettingsIcon, Menu,
  Pin, Trash2, ChevronDown, Sparkles, Volume2, LayoutPanelLeft, LogOut, Image as ImageIcon, X
} from "lucide-react";

interface Conversation { id: string; title: string; model_id: ModelId; pinned: boolean; updated_at: string; }

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
  const { send, stop, streaming } = useChatStream();

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("conversations").select("*").eq("user_id", user.id).order("pinned", { ascending: false }).order("updated_at", { ascending: false });
    if (data) setConversations(data as Conversation[]);
  }, [user]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    supabase.from("messages").select("*").eq("conversation_id", activeId).order("created_at").then(({ data }) => {
      if (data) setMessages(data.map((m: any) => ({ role: m.role, content: m.content, attachments: m.attachments })));
    });
  }, [activeId]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  // Mood reactions
  useEffect(() => {
    if (streaming) setMood("speaking");
    else if (input.length > 0) setMood("curious");
    else setMood("idle");
  }, [streaming, input]);

  const newChat = () => {
    setActiveId(null);
    setMessages([]);
    setSheetOpen(false);
  };

  const handleSend = async () => {
    if (!input.trim() || !user) return;
    const text = input.trim();
    const attachments = [...pendingAttachments];
    setInput("");
    setPendingAttachments([]);

    let convId = activeId;
    let isNew = false;
    if (!convId) {
      const { data: conv } = await supabase.from("conversations").insert({ user_id: user.id, title: "New chat", model_id: modelId }).select().single();
      if (!conv) { toast.error("Failed to create conversation"); return; }
      convId = conv.id;
      setActiveId(convId);
      isNew = true;
    }

    const userMsg: ChatMsg = { role: "user", content: text, attachments };
    const baseMessages = [...messages, userMsg];
    setMessages([...baseMessages, { role: "assistant", content: "" }]);

    // Persist user message
    await supabase.from("messages").insert({ conversation_id: convId, user_id: user.id, role: "user", content: text, attachments });

    // Title for new chats
    if (isNew) {
      generateTitle(text).then(async (title) => {
        await supabase.from("conversations").update({ title }).eq("id", convId!);
        loadConversations();
      });
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
      attachments.length > 0 ? attachments : undefined
    );

    if (acc) {
      await supabase.from("messages").insert({ conversation_id: convId, user_id: user.id, role: "assistant", content: acc, model_id: modelId });
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
      // Voice mode: speak it
      if (modelId === "voice" && "speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(acc);
        u.rate = 1.05; u.pitch = 1.1;
        window.speechSynthesis.speak(u);
      }
      setMood("happy");
      setTimeout(() => setMood("idle"), 1500);
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

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("attachments").upload(path, file);
    if (error) { toast.error("Upload failed"); return; }
    const { data: signed } = await supabase.storage.from("attachments").createSignedUrl(path, 3600);
    if (signed?.signedUrl) {
      setPendingAttachments((prev) => [...prev, signed.signedUrl]);
      if (modelId !== "vision") setModelId("vision");
      toast.success("Image attached");
    }
    e.target.value = "";
  };

  const deleteConv = async (id: string) => {
    await supabase.from("conversations").delete().eq("id", id);
    if (activeId === id) newChat();
    loadConversations();
  };

  const togglePin = async (c: Conversation) => {
    await supabase.from("conversations").update({ pinned: !c.pinned }).eq("id", c.id);
    loadConversations();
  };

  const ActiveModel = MODELS[modelId];

  // Sidebar content
  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <Button onClick={newChat} className="w-full rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground">
          <Plus className="size-4" /> New chat
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.map((c) => (
          <div key={c.id} className={`group flex items-center gap-1 rounded-lg ${activeId === c.id ? "bg-primary/10" : "hover:bg-muted"}`}>
            <button onClick={() => { setActiveId(c.id); setModelId(c.model_id); setSheetOpen(false); }}
              className="flex-1 text-left px-3 py-2 truncate text-sm">
              {c.pinned && <Pin className="inline size-3 mr-1 text-primary" />}
              {c.title}
            </button>
            <div className="flex opacity-0 group-hover:opacity-100 transition pr-1">
              <button onClick={() => togglePin(c)} className="p-1 hover:bg-background rounded"><Pin className="size-3" /></button>
              <button onClick={() => deleteConv(c.id)} className="p-1 hover:bg-background rounded text-destructive"><Trash2 className="size-3" /></button>
            </div>
          </div>
        ))}
      </div>
      <div className="p-2 border-t border-border space-y-1">
        <Button variant="ghost" className="w-full justify-start" onClick={() => navigate("/settings")}>
          <SettingsIcon className="size-4" /> Settings
        </Button>
        <Button variant="ghost" className="w-full justify-start" onClick={async () => { await signOut(); navigate("/"); }}>
          <LogOut className="size-4" /> Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="h-[100dvh] flex relative overflow-hidden">
      <div className="fixed inset-0 aurora-bg pointer-events-none opacity-50" />

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-72 border-r border-border glass-strong z-10">
        <Sidebar />
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 z-10">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-2 px-3 md:px-5 py-3 border-b border-border glass-strong">
          <div className="flex items-center gap-2">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button size="icon" variant="ghost" className="md:hidden"><Menu /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72"><Sidebar /></SheetContent>
            </Sheet>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-full glass gap-2 h-9">
                  <span className={`size-5 rounded-md bg-gradient-to-br ${ActiveModel.gradient} grid place-items-center text-white`}>
                    <ActiveModel.icon className="size-3" />
                  </span>
                  <span className="font-medium">{ActiveModel.name}</span>
                  <ChevronDown className="size-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                {MODEL_LIST.map((m) => (
                  <DropdownMenuItem key={m.id} onClick={() => setModelId(m.id)} className="gap-3 py-2.5">
                    <span className={`size-8 rounded-lg bg-gradient-to-br ${m.gradient} grid place-items-center text-white shrink-0`}>
                      <m.icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{m.tagline}</div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Button size="icon" variant="ghost" onClick={() => setPanelOpen(true)} title="Open Panel">
            <LayoutPanelLeft />
          </Button>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 md:px-6 py-6">
          {messages.length === 0 ? (
            <EmptyState model={ActiveModel} onPick={(s) => setInput(s)} mood={mood} />
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              <AnimatePresence initial={false}>
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
                  >
                    {m.role === "assistant" && (
                      <div className="shrink-0">
                        <div className="size-8 rounded-xl glass grid place-items-center">
                          <Ozing mood={streaming && i === messages.length - 1 ? "speaking" : "idle"} size={28} gemColor={`hsl(${ActiveModel.gem})`} />
                        </div>
                      </div>
                    )}
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.role === "user" ? "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground" : "glass"}`}>
                      {m.attachments && m.attachments.length > 0 && (
                        <div className="flex gap-2 mb-2 flex-wrap">
                          {m.attachments.map((a, j) => (
                            <img key={j} src={a} alt="attachment" className="rounded-lg max-h-40 border border-border" />
                          ))}
                        </div>
                      )}
                      {m.role === "assistant" ? (
                        m.content ? <MessageContent content={m.content} /> : <TypingDots />
                      ) : (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="px-3 md:px-6 pb-4 pt-2">
          <div className="max-w-3xl mx-auto">
            {pendingAttachments.length > 0 && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {pendingAttachments.map((a, i) => (
                  <div key={i} className="relative">
                    <img src={a} className="size-16 object-cover rounded-lg border border-border" />
                    <button onClick={() => setPendingAttachments((p) => p.filter((_, j) => j !== i))}
                      className="absolute -top-1 -right-1 size-5 bg-destructive text-destructive-foreground rounded-full grid place-items-center text-xs">
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="glass-strong rounded-2xl shadow-soft p-2 flex items-end gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
              <Button size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} title="Attach image">
                <ImageIcon className="size-4" />
              </Button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={`Ask ${ActiveModel.name}…`}
                rows={1}
                className="flex-1 bg-transparent outline-none resize-none px-2 py-2 max-h-40 text-sm"
                style={{ minHeight: 36 }}
              />
              <Button size="icon" variant={listening ? "default" : "ghost"} onClick={toggleListen} title="Voice input"
                className={listening ? "animate-pulse-glow" : ""}>
                {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
              </Button>
              {streaming ? (
                <Button size="icon" variant="destructive" onClick={stop}><Square className="size-4" /></Button>
              ) : (
                <Button size="icon" onClick={handleSend} disabled={!input.trim()}
                  className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                  <Send className="size-4" />
                </Button>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">MV AI can make mistakes. Verify important info.</p>
          </div>
        </div>
      </main>

      {/* Floating panel */}
      <Panel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="size-2 rounded-full bg-primary/60"
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }} />
      ))}
    </div>
  );
}

function EmptyState({ model, onPick, mood }: { model: typeof MODELS[ModelId]; onPick: (s: string) => void; mood: OzingMood }) {
  const Icon = model.icon;
  const suggestions: Record<ModelId, string[]> = {
    humanoid: ["Plan my week", "Suggest a weekend hobby", "Help me word a tricky email"],
    ideal: ["Compare two career paths", "Explain quantum entanglement clearly", "Build a 30-day learning plan"],
    code: ["Refactor a React component", "Explain this stack trace", "Write a SQL query for top users"],
    vision: ["Describe an attached image", "Extract text from a screenshot", "Identify UI components"],
    search: ["Recent news on AI safety", "Best practices for indie launches", "What's trending in design?"],
    voice: ["Tell me a fun fact", "How's the weather described?", "Quick stretch routine for desks"],
  };
  return (
    <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto">
      <Ozing mood={mood} size={140} gemColor={`hsl(${model.gem})`} />
      <h2 className="font-display text-3xl font-bold mt-4">
        <span className="text-gradient">{model.name}</span>
      </h2>
      <p className="text-muted-foreground mt-1">{model.tagline}</p>
      <div className="grid sm:grid-cols-3 gap-2 mt-6 w-full">
        {suggestions[model.id].map((s) => (
          <button key={s} onClick={() => onPick(s)}
            className="text-sm text-left p-3 glass rounded-xl hover:scale-[1.02] hover:shadow-soft transition">{s}</button>
        ))}
      </div>
    </div>
  );
}
