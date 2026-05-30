import { useCallback, useEffect, useState } from "react";

export interface Memory { key: string; value: string; weight: number; }

export function useMemory(userId: string | undefined) {
  const [memories, setMemories] = useState<Memory[]>([]);

  const load = useCallback(async () => {
    if (!userId) return;
    const r = await fetch("/api/memories", { credentials: "include" });
    if (r.ok) {
      const data = await r.json();
      setMemories(data as Memory[]);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const remember = useCallback(async (key: string, value: string, weight = 1) => {
    if (!userId) return;
    await fetch("/api/memories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ key, value, weight }),
    });
    load();
  }, [userId, load]);

  const forget = useCallback(async (key: string) => {
    if (!userId) return;
    await fetch(`/api/memories/${encodeURIComponent(key)}`, {
      method: "DELETE",
      credentials: "include",
    });
    load();
  }, [userId, load]);

  const autoExtract = useCallback(async (text: string) => {
    const remPatterns = [
      /(?:remember|esda saqla|note that)\s+(?:that\s+)?(.{4,120})/i,
      /my\s+(name|email|birthday|location|company|role|favorite [a-z]+|phone)\s+is\s+([^\n.,]{2,80})/i,
      /(?:meni\s+ismim|mening\s+ismim)\s+([^\n.,]{2,40})/i,
    ];
    for (const re of remPatterns) {
      const m = text.match(re);
      if (m) {
        if (re.source.includes("name|email")) await remember(m[1].toLowerCase(), m[2].trim(), 2);
        else if (re.source.includes("ismim")) await remember("name", m[1].trim(), 2);
        else await remember(`note_${Date.now()}`, m[1].trim(), 1);
        return true;
      }
    }
    return false;
  }, [remember]);

  return { memories, remember, forget, autoExtract, reload: load };
}
