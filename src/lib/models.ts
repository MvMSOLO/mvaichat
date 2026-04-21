import { Brain, Sparkles, Code2, Eye, Globe, Mic } from "lucide-react";

export type ModelId = "humanoid" | "ideal" | "code" | "vision" | "search" | "voice";

export interface ModelDef {
  id: ModelId;
  name: string;
  tagline: string;
  description: string;
  icon: typeof Brain;
  gem: string; // hsl variable name
  gradient: string;
  // Underlying gateway model (kept on backend in chat function)
  systemPrompt: string;
}

export const MODELS: Record<ModelId, ModelDef> = {
  humanoid: {
    id: "humanoid",
    name: "Humanoid",
    tagline: "Warm, conversational AI",
    description: "Friendly, natural conversation for everyday questions.",
    icon: Brain,
    gem: "var(--gem-humanoid)",
    gradient: "from-violet-500 to-fuchsia-500",
    systemPrompt: "You are MV AI's Humanoid mode — warm, direct, and human. Skip filler ('how can I help', 'let me know'). Be useful first, friendly second. Use markdown when it helps clarity.",
  },
  ideal: {
    id: "ideal",
    name: "Ideal",
    tagline: "Deep reasoning, premium answers",
    description: "Slow, careful, and thorough — for the hard questions.",
    icon: Sparkles,
    gem: "var(--gem-ideal)",
    gradient: "from-blue-500 to-indigo-500",
    systemPrompt: "You are MV AI's Ideal mode — deep, methodical reasoning. Think step by step internally, present answers with structured clarity (sections, lists, examples). Cite tradeoffs. No filler.",
  },
  code: {
    id: "code",
    name: "Code Editor",
    tagline: "Coding & debugging",
    description: "Write, refactor, and debug code in any language.",
    icon: Code2,
    gem: "var(--gem-code)",
    gradient: "from-emerald-500 to-teal-500",
    systemPrompt: "You are MV AI's Code mode. Output complete, working code in fenced blocks with the language tag. Explain only what matters. Prefer modern idioms. Point out edge cases.",
  },
  vision: {
    id: "vision",
    name: "Vision",
    tagline: "Image & screenshot understanding",
    description: "Analyze screenshots, photos, diagrams, and UI.",
    icon: Eye,
    gem: "var(--gem-vision)",
    gradient: "from-pink-500 to-rose-500",
    systemPrompt: "You are MV AI's Vision mode. Describe images precisely. Extract text, identify UI components, infer intent. Be concrete.",
  },
  search: {
    id: "search",
    name: "Search",
    tagline: "Web-connected answers",
    description: "Pulls fresh information when you need facts.",
    icon: Globe,
    gem: "var(--gem-search)",
    gradient: "from-orange-500 to-amber-500",
    systemPrompt: "You are MV AI's Search mode. When a question depends on current facts, answer based on widely-known information up to your training, and clearly note when something might be out-of-date. Cite sources by name when relevant.",
  },
  voice: {
    id: "voice",
    name: "Voice",
    tagline: "Spoken assistant",
    description: "Short, natural answers that sound great spoken.",
    icon: Mic,
    gem: "var(--gem-voice)",
    gradient: "from-yellow-500 to-orange-500",
    systemPrompt: "You are MV AI's Voice mode. Reply in short, naturally spoken sentences. Avoid markdown, lists, code blocks. Keep replies under 60 words unless asked for detail.",
  },
};

export const MODEL_LIST = Object.values(MODELS);
