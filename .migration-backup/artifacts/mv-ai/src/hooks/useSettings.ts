import { useCallback, useEffect, useState } from "react";

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
    const r = await fetch("/api/settings", { credentials: "include" });
    if (r.ok) {
      const data = await r.json();
      setSettings({
        persona: data.persona || "friend",
        language: data.language || "auto",
        response_style: data.responseStyle || "friendly",
        response_length: data.responseLength || "balanced",
        animation_speed: data.animationSpeed || "normal",
        demo_mode: !!data.demoMode,
        adult_mode: !!data.adultMode,
        permissions: data.permissions || DEFAULTS.permissions,
        sound_enabled: data.soundEnabled ?? true,
        voice_enabled: data.voiceEnabled ?? true,
      });
    }
    setLoaded(true);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (patch: Partial<UserSettings>) => {
    if (!userId) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    // Map snake_case to camelCase for the API
    const body: any = {};
    if (patch.persona != null) body.persona = patch.persona;
    if (patch.language != null) body.language = patch.language;
    if (patch.response_style != null) body.responseStyle = patch.response_style;
    if (patch.response_length != null) body.responseLength = patch.response_length;
    if (patch.animation_speed != null) body.animationSpeed = patch.animation_speed;
    if (patch.demo_mode != null) body.demoMode = patch.demo_mode;
    if (patch.adult_mode != null) body.adultMode = patch.adult_mode;
    if (patch.permissions != null) body.permissions = patch.permissions;
    if (patch.sound_enabled != null) body.soundEnabled = patch.sound_enabled;
    if (patch.voice_enabled != null) body.voiceEnabled = patch.voice_enabled;
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
  }, [userId, settings]);

  return { settings, save, loaded, reload: load };
}
