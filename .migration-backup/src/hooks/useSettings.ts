// MV AI v6.5 — User settings hook (chat tone + permissions + demo mode).
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UserSettings {
  persona: string;
  language: string;
  response_style: string;
  response_length: string;
  animation_speed: string;
  demo_mode: boolean;
  adult_mode: boolean;
  permissions: Record<string, boolean>;
  sound_enabled: boolean;
  voice_enabled: boolean;
}

const DEFAULTS: UserSettings = {
  persona: "friend",
  language: "auto",
  response_style: "friendly",
  response_length: "balanced",
  animation_speed: "normal",
  demo_mode: false,
  adult_mode: false,
  permissions: { contacts: false, sms: true, call: true, instagram: true, telegram: true, youtube: true, github: true, location: false, camera: false, microphone: true },
  sound_enabled: true,
  voice_enabled: true,
};

export function useSettings(userId: string | undefined) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle();
    if (data) {
      setSettings({
        persona: (data as any).persona || "friend",
        language: (data as any).language || "auto",
        response_style: (data as any).response_style || "friendly",
        response_length: (data as any).response_length || "balanced",
        animation_speed: (data as any).animation_speed || "normal",
        demo_mode: !!(data as any).demo_mode,
        adult_mode: !!(data as any).adult_mode,
        permissions: (data as any).permissions || DEFAULTS.permissions,
        sound_enabled: data.sound_enabled,
        voice_enabled: data.voice_enabled,
      });
    }
    setLoaded(true);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (patch: Partial<UserSettings>) => {
    if (!userId) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    await supabase.from("user_settings").update(patch as any).eq("user_id", userId);
  }, [userId, settings]);

  return { settings, save, loaded, reload: load };
}
