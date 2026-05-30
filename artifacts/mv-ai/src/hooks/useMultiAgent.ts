import { useCallback, useRef, useState } from "react";

export interface AgentInfo {
  id: string;
  name: string;
  emoji: string;
  role: string;
}

export interface AgentTurn {
  id: string;
  status: "thinking" | "done";
  content: string;
}

const AGENT_URL = `/api/multi-agent`;

export function useMultiAgent() {
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [turns, setTurns] = useState<AgentTurn[]>([]);
  const [running, setRunning] = useState(false);
  const [final, setFinal] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setAgents([]);
    setTurns([]);
    setFinal("");
  }, []);

  const run = useCallback(
    async (prompt: string, history: { role: string; content: string }[], onFinalDelta?: (c: string) => void) => {
      reset();
      setRunning(true);
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const resp = await fetch(AGENT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: ctrl.signal,
          body: JSON.stringify({ prompt, history }),
        });

        if (!resp.ok || !resp.body) {
          setRunning(false);
          return;
        }

        const reader = resp.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        let acc = "";

        const handle = (event: string, data: any) => {
          if (event === "start") setAgents(data.agents);
          else if (event === "agent_start") {
            setTurns((p) => [...p, { id: data.id, status: "thinking", content: "" }]);
          } else if (event === "agent_message") {
            setTurns((p) => p.map((t) => (t.id === data.id && t.status === "thinking" ? { ...t, status: "done", content: data.content } : t)));
          } else if (event === "final_delta") {
            acc += data.content;
            setFinal(acc);
            onFinalDelta?.(data.content);
          } else if (event === "done") {
            setRunning(false);
          } else if (event === "error") {
            setRunning(false);
          }
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          // SSE event blocks separated by \n\n
          let sep;
          while ((sep = buf.indexOf("\n\n")) !== -1) {
            const block = buf.slice(0, sep);
            buf = buf.slice(sep + 2);
            const lines = block.split("\n");
            let event = "message";
            let data = "";
            for (const ln of lines) {
              if (ln.startsWith("event: ")) event = ln.slice(7).trim();
              else if (ln.startsWith("data: ")) data += ln.slice(6);
            }
            if (data) {
              try { handle(event, JSON.parse(data)); } catch { /* ignore */ }
            }
          }
        }
      } catch (e: any) {
        if (e?.name !== "AbortError") console.error("multi-agent error:", e);
      } finally {
        setRunning(false);
        abortRef.current = null;
      }
    },
    [reset],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  return { agents, turns, running, final, run, stop, reset };
}
