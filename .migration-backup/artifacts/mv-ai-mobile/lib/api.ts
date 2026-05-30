import { useAuth } from "@clerk/expo";
import { fetch } from "expo/fetch";

export function getApiBase(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}/api`;
  return "/api";
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  getToken?: () => Promise<string | null>
): Promise<Response> {
  const base = getApiBase();
  const url = `${base}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (getToken) {
    const token = await getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(url, { ...options, headers });
}

export type ModelId = "humanoid" | "ideal" | "code" | "vision" | "search" | "voice" | "agents" | "social";

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

export interface Conversation {
  id: string;
  title: string;
  modelId: ModelId;
  pinned: boolean;
  updatedAt: string;
}

export interface UserSettings {
  persona: string;
  language: string;
  response_style: string;
  response_length: string;
  sound_enabled: boolean;
  voice_enabled: boolean;
}

export const MODEL_LIST: { id: ModelId; name: string; emoji: string; gradient: [string, string] }[] = [
  { id: "humanoid", name: "Humanoid", emoji: "🧠", gradient: ["#a855f7", "#d946ef"] },
  { id: "ideal", name: "Ideal", emoji: "✨", gradient: ["#3b82f6", "#6366f1"] },
  { id: "code", name: "Code", emoji: "💻", gradient: ["#10b981", "#14b8a6"] },
  { id: "vision", name: "Vision", emoji: "👁️", gradient: ["#ec4899", "#f43f5e"] },
  { id: "search", name: "Search", emoji: "🔍", gradient: ["#f97316", "#f59e0b"] },
  { id: "voice", name: "Voice", emoji: "🎙️", gradient: ["#eab308", "#f97316"] },
  { id: "agents", name: "Agents", emoji: "🤖", gradient: ["#6366f1", "#a855f7"] },
  { id: "social", name: "Social", emoji: "🌐", gradient: ["#f43f5e", "#06b6d4"] },
];
