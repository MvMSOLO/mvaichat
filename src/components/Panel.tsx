import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { Ozing } from "@/components/Ozing";
import { Button } from "@/components/ui/button";
import { useChatStream, ChatMsg } from "@/hooks/useChatStream";
import { MessageContent } from "@/components/MessageContent";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { X, Camera, Image as ImageIcon, Send, Sparkles, GripHorizontal } from "lucide-react";

interface PanelProps { open: boolean; onClose: () => void; }

export function Panel({ open, onClose }: PanelProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const { send, streaming } = useChatStream();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const captureScreen = async () => {
    if (!user) return;
    try {
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
      const track = stream.getVideoTracks()[0];
      // @ts-ignore
      const ic = new ImageCapture(track);
      const bitmap = await ic.grabFrame();
      track.stop();
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width; canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bitmap, 0, 0);
      const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/png"));
      await uploadAndAttach(new File([blob], `screenshot-${Date.now()}.png`, { type: "image/png" }));
      // Auto-send
      setTimeout(() => sendMessage("What's on this screen?"), 200);
    } catch (e) {
      toast.error("Screen capture cancelled");
    }
  };

  const uploadAndAttach = async (file: File) => {
    if (!user) return;
    const path = `${user.id}/panel/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("attachments").upload(path, file);
    if (error) { toast.error("Upload failed"); return; }
    const { data } = await supabase.storage.from("attachments").createSignedUrl(path, 3600);
    if (data?.signedUrl) setPending((p) => [...p, data.signedUrl]);
  };

  const sendMessage = async (overrideText?: string) => {
    const text = overrideText ?? input.trim();
    if (!text && pending.length === 0) return;
    const atts = [...pending];
    setInput(""); setPending([]);
    const userMsg: ChatMsg = { role: "user", content: text || "What do you see?", attachments: atts };
    const base = [...messages, userMsg];
    setMessages([...base, { role: "assistant", content: "" }]);
    let acc = "";
    await send(
      base.map((m) => ({ role: m.role, content: m.content })),
      atts.length > 0 ? "vision" : "humanoid",
      (chunk) => {
        acc += chunk;
        setMessages((prev) => { const n = [...prev]; n[n.length - 1] = { role: "assistant", content: acc }; return n; });
      },
      atts.length > 0 ? atts : undefined
    );
  };

  if (!open) return null;

  const Body = (
    <div className="flex flex-col h-full">
      <div
        onPointerDown={!isMobile ? (e) => dragControls.start(e) : undefined}
        className="flex items-center justify-between p-3 border-b border-border cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2">
          <Ozing mood="curious" size={28} />
          <div>
            <div className="font-display font-bold text-sm">Mini Ozing</div>
            <div className="text-[10px] text-muted-foreground">Quick tasks · Vision</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!isMobile && <GripHorizontal className="size-4 text-muted-foreground" />}
          <Button size="icon" variant="ghost" onClick={onClose}><X className="size-4" /></Button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-3">Capture a screenshot or upload an image — Mini Ozing will analyze it.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button size="sm" variant="outline" onClick={captureScreen} className="rounded-full"><Camera className="size-3" /> Capture</Button>
              <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} className="rounded-full"><ImageIcon className="size-3" /> Upload</Button>
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.role === "user" ? "justify-end" : ""}`}>
            <div className={`max-w-[88%] rounded-xl px-3 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "glass"}`}>
              {m.attachments && m.attachments.map((a, j) => (
                <img key={j} src={a} className="rounded mb-2 max-h-32" />
              ))}
              {m.role === "assistant" ? <MessageContent content={m.content || "..."} /> : m.content}
            </div>
          </motion.div>
        ))}
      </div>

      {pending.length > 0 && (
        <div className="px-3 pb-2 flex gap-2 flex-wrap">
          {pending.map((a, i) => (
            <img key={i} src={a} className="size-10 object-cover rounded border border-border" />
          ))}
        </div>
      )}

      <div className="p-2 border-t border-border flex items-center gap-1">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
          const f = e.target.files?.[0]; if (f) uploadAndAttach(f); e.target.value = "";
        }} />
        <Button size="icon" variant="ghost" onClick={captureScreen} title="Capture"><Camera className="size-4" /></Button>
        <Button size="icon" variant="ghost" onClick={() => fileRef.current?.click()}><ImageIcon className="size-4" /></Button>
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
          placeholder="Ask anything…" className="flex-1 bg-muted/50 rounded-lg px-3 py-1.5 text-sm outline-none" />
        <Button size="icon" onClick={() => sendMessage()} disabled={streaming}
          className="bg-gradient-to-br from-primary to-secondary text-primary-foreground"><Send className="size-3" /></Button>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isMobile ? (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/40 z-40" />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed bottom-0 inset-x-0 h-[78dvh] glass-strong rounded-t-3xl z-50 shadow-elev flex flex-col"
          >{Body}</motion.div>
        </>
      ) : (
        <motion.div
          drag dragControls={dragControls} dragListener={false} dragMomentum={false}
          initial={{ opacity: 0, scale: 0.9, x: 60, y: 60 }}
          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed bottom-6 right-6 w-[360px] h-[520px] glass-strong rounded-2xl shadow-elev z-50 flex flex-col overflow-hidden"
        >{Body}</motion.div>
      )}
    </AnimatePresence>
  );
}
