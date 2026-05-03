// MV AI v6 — User memory hook. Auto-extracts and stores facts; reads on chat open.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Memory { key: string; value: string; weight: number; }

export function useMemory(userId: string | undefined) {
  const [memories, setMemories] = useState<Memory[]>([]);

  const load = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from("user_memories").select("key,value,weight").eq("user_id", userId).order("weight", { ascending: false }).limit(20);
    if (data) setMemories(data as Memory[]);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const remember = useCallback(async (key: string, value: string, weight = 1) => {
    if (!userId) return;
    await supabase.from("user_memories").upsert({ user_id: userId, key, value, weight }, { onConflict: "user_id,key" });
    load();
  }, [userId, load]);

  const forget = useCallback(async (key: string) => {
    if (!userId) return;
    await supabase.from("user_memories").delete().eq("user_id", userId).eq("key", key);
    load();
  }, [userId, load]);

  // Lightweight client-side extractor: catches "remember that..." / "my X is Y"
  const autoExtract = useCallback(async (text: string) => {
    const lower = text.toLowerCase();
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
