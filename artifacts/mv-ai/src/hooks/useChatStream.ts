import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import type { ModelId } from "@/lib/models";

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  attachments?: string[];
}

const CHAT_URL = "/api/chat";

export function useChatStream() {
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [provider, setProvider] = useState<{ id: string; label: string } | null>(null);

  const send = useCallback(
    async (
      messages: ChatMsg[],
      modelId: ModelId,
      onDelta: (chunk: string) => void,
      attachments?: string[],
      memories?: Array<{ key: string; value: string }>,
      onToolCalls?: (calls: Array<{ name: string; args: any }>) => void,
      settings?: Record<string, any>,
      onProvider?: (p: { id: string; label: string }) => void,
    ) => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setStreaming(true);

      try {
        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          signal: ctrl.signal,
          body: JSON.stringify({ messages, modelId, attachments, memories, settings }),
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
        const toolAcc: Record<number, { name: string; args: string }> = {};

        const handleParsed = (parsed: any) => {
          const delta = parsed.choices?.[0]?.delta;
          if (!delta) return;
          if (delta.content) onDelta(delta.content);
          if (Array.isArray(delta.tool_calls)) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index ?? 0;
              if (!toolAcc[idx]) toolAcc[idx] = { name: "", args: "" };
              if (tc.function?.name) toolAcc[idx].name = tc.function.name;
              if (tc.function?.arguments) toolAcc[idx].args += tc.function.arguments;
            }
          }
        };

        while (!done) {
          const { done: d, value } = await reader.read();
          if (d) break;
          buf += decoder.decode(value, { stream: true });
          let idx: number;
          let pendingEvent: string | null = null;
          while ((idx = buf.indexOf("\n")) !== -1) {
            let line = buf.slice(0, idx);
            buf = buf.slice(idx + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":")) continue;
            if (!line.trim()) { pendingEvent = null; continue; }
            if (line.startsWith("event: ")) { pendingEvent = line.slice(7).trim(); continue; }
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (json === "[DONE]") { done = true; break; }
            if (pendingEvent === "provider") {
              try { const p = JSON.parse(json); setProvider(p); onProvider?.(p); } catch {}
              pendingEvent = null;
              continue;
            }
            try { handleParsed(JSON.parse(json)); } catch {
              buf = line + "\n" + buf;
              break;
            }
          }
        }

        const calls = Object.values(toolAcc)
          .filter((c) => c.name)
          .map((c) => { let args: any = {}; try { args = JSON.parse(c.args || "{}"); } catch {} return { name: c.name, args }; });
        if (calls.length && onToolCalls) onToolCalls(calls);
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

  return { send, stop, streaming, provider };
}

export async function generateTitle(message: string): Promise<string> {
  try {
    const r = await fetch("/api/chat/title", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ message }),
    });
    const data = await r.json();
    return data?.title || "New chat";
  } catch {
    return "New chat";
  }
}
