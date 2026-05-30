import { useEffect, useState, useCallback } from "react";

export type ThemeId = "eclipse" | "deep" | "neon" | "volcanic" | "arctic" | "sakura" | "light";

export interface ThemeDef {
  id: ThemeId;
  name: string;
  emoji: string;
  dark: boolean;
  desc: string;
  preview: [string, string, string]; // gradient colors for preview swatch
}

export const THEMES: ThemeDef[] = [
  { id: "eclipse", name: "Eclipse", emoji: "🌑", dark: true, desc: "Deep violet glow — default premium dark", preview: ["#8b5cf6", "#a855f7", "#ec4899"] },
  { id: "deep",    name: "Deep Black", emoji: "⚫", dark: true, desc: "OLED pure black with neon accents", preview: ["#22d3ee", "#06b6d4", "#0e7490"] },
  { id: "neon",    name: "Neon", emoji: "💚", dark: true, desc: "Cyberpunk green matrix vibes", preview: ["#4ade80", "#22c55e", "#16a34a"] },
  { id: "volcanic",name: "Volcanic", emoji: "🌋", dark: true, desc: "Lava orange & red with ember glow", preview: ["#f97316", "#ef4444", "#dc2626"] },
  { id: "arctic",  name: "Arctic", emoji: "🧊", dark: true, desc: "Icy blue aurora northern lights", preview: ["#38bdf8", "#0ea5e9", "#7dd3fc"] },
  { id: "sakura",  name: "Sakura", emoji: "🌸", dark: true, desc: "Cherry blossom pink glow", preview: ["#f472b6", "#ec4899", "#db2777"] },
  { id: "light",   name: "Premium Light", emoji: "☀️", dark: false, desc: "Warm cream — clean and elegant", preview: ["#f59e0b", "#fb923c", "#f97316"] },
];

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const saved = localStorage.getItem("mv-theme") as ThemeId;
    return THEMES.find((t) => t.id === saved) ? saved : "eclipse";
  });

  const applyTheme = useCallback((id: ThemeId) => {
    const def = THEMES.find((t) => t.id === id);
    if (!def) return;
    const root = document.documentElement;
    root.setAttribute("data-theme", id);
    if (def.dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("mv-theme", id);
  }, []);

  useEffect(() => { applyTheme(theme); }, [theme, applyTheme]);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeState(id);
    applyTheme(id);
  }, [applyTheme]);

  return { theme, setTheme, themes: THEMES };
}
