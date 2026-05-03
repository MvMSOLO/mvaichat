import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ModelId } from "@/lib/models";

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  attachments?: string[];
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export function useChatStream() {
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (
      messages: ChatMsg[],
      modelId: ModelId,
      onDelta: (chunk: string) => void,
      attachments?: string[],
      memories?: Array<{ key: string; value: string }>,
    ) => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setStreaming(true);

      try {
        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          signal: ctrl.signal,
          body: JSON.stringify({ messages, modelId, attachments, memories }),
        });

        if (resp.status === 429) {
          toast.error("Slow down", { description: "Too many requests. Try again in a moment." });
          return;
        }
        if (resp.status === 402) {
          toast.error("Out of AI credits", { description: "Add credits in Settings → Workspace → Usage." });
          return;
        }
        if (!resp.ok || !resp.body) {
          toast.error("Connection error");
          return;
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let done = false;

        while (!done) {
          const { done: d, value } = await reader.read();
          if (d) break;
          buf += decoder.decode(value, { stream: true });

          let idx: number;
          while ((idx = buf.indexOf("\n")) !== -1) {
            let line = buf.slice(0, idx);
            buf = buf.slice(idx + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || !line.trim()) continue;
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (json === "[DONE]") { done = true; break; }
            try {
              const parsed = JSON.parse(json);
              const c = parsed.choices?.[0]?.delta?.content;
              if (c) onDelta(c);
            } catch {
              buf = line + "\n" + buf;
              break;
            }
          }
        }
        if (buf.trim()) {
          for (let raw of buf.split("\n")) {
            if (raw.endsWith("\r")) raw = raw.slice(0, -1);
            if (!raw.startsWith("data: ")) continue;
            const json = raw.slice(6).trim();
            if (json === "[DONE]") continue;
            try {
              const p = JSON.parse(json);
              const c = p.choices?.[0]?.delta?.content;
              if (c) onDelta(c);
            } catch { /* skip */ }
          }
        }
      } catch (e: any) {
        if (e.name !== "AbortError") {
          console.error(e);
          toast.error("Stream failed");
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    []
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { send, stop, streaming };
}

export async function generateTitle(message: string): Promise<string> {
  try {
    const { data } = await supabase.functions.invoke("title-conversation", { body: { message } });
    return data?.title || "New chat";
  } catch {
    return "New chat";
  }
}
