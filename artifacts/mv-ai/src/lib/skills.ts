export interface Skill {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: "productivity" | "coding" | "creative" | "research" | "communication" | "custom";
  instructions: string;
  source?: "builtin" | "github" | "custom";
  enabled: boolean;
}

export const BUILTIN_SKILLS: Skill[] = [
  {
    id: "concise-writer",
    name: "Concise Writer",
    emoji: "✂️",
    category: "productivity",
    description: "Forces AI to always be brief, punchy, and get to the point fast.",
    instructions: "ALWAYS be extremely concise. Lead with the answer. Zero fluff. Use bullet points for lists. Never re-state the question. Max 150 words unless explicitly asked for more.",
    source: "builtin",
    enabled: false,
  },
  {
    id: "socratic-teacher",
    name: "Socratic Teacher",
    emoji: "🏛️",
    category: "productivity",
    description: "AI teaches through questions, not answers — forces deeper thinking.",
    instructions: "When explaining concepts, use the Socratic method. Ask guiding questions first, lead the user to discover the answer themselves. Only give direct answers when explicitly asked.",
    source: "builtin",
    enabled: false,
  },
  {
    id: "code-reviewer",
    name: "Code Reviewer",
    emoji: "🔍",
    category: "coding",
    description: "Strict code review mode — finds bugs, performance issues, security flaws.",
    instructions: "When reviewing code: check for bugs, security vulnerabilities, performance bottlenecks, code smells, missing edge cases, and style issues. Be specific and cite exact line problems. Suggest fixes.",
    source: "builtin",
    enabled: false,
  },
  {
    id: "test-writer",
    name: "Test Writer",
    emoji: "🧪",
    category: "coding",
    description: "Automatically suggests unit tests for any code you share.",
    instructions: "When you see code, always suggest relevant unit tests. Use the appropriate testing framework for the language (Jest for JS/TS, pytest for Python, etc.). Cover happy path, edge cases, and error states.",
    source: "builtin",
    enabled: false,
  },
  {
    id: "copywriter",
    name: "Marketing Copywriter",
    emoji: "📣",
    category: "creative",
    description: "Writes persuasive, conversion-focused copy for any product or audience.",
    instructions: "Write copy that converts. Use: strong hooks, emotional triggers, specific benefits (not features), social proof hints, clear CTAs. Write in the brand's voice. A/B suggest variations when possible.",
    source: "builtin",
    enabled: false,
  },
  {
    id: "storyteller",
    name: "Storyteller",
    emoji: "📖",
    category: "creative",
    description: "Transforms dry content into engaging narrative with vivid detail.",
    instructions: "Transform any explanation or content into a compelling narrative. Use: scene-setting, character perspective, sensory details, conflict/resolution arc. Make information memorable through story.",
    source: "builtin",
    enabled: false,
  },
  {
    id: "research-assistant",
    name: "Research Assistant",
    emoji: "🔬",
    category: "research",
    description: "Cites sources, acknowledges uncertainty, presents multiple viewpoints.",
    instructions: "When researching: present multiple perspectives, clearly note what is fact vs. opinion vs. speculation, cite sources when possible, acknowledge the limits of your knowledge, suggest further reading.",
    source: "builtin",
    enabled: false,
  },
  {
    id: "first-principles",
    name: "First Principles",
    emoji: "⚡",
    category: "research",
    description: "Breaks every problem down to its fundamental assumptions.",
    instructions: "Approach problems using first principles thinking: break down to fundamental truths, question all assumptions, rebuild from the ground up. Ask 'why' at least 3 levels deep. Challenge conventional wisdom.",
    source: "builtin",
    enabled: false,
  },
  {
    id: "email-writer",
    name: "Email Pro",
    emoji: "📧",
    category: "communication",
    description: "Writes clear, professional emails with perfect tone and structure.",
    instructions: "For email writing: use appropriate tone for context (professional/casual), clear subject lines, concise body, obvious next steps. Always offer 3 variations: formal, semi-formal, casual. Check for unclear asks.",
    source: "builtin",
    enabled: false,
  },
  {
    id: "debate-coach",
    name: "Debate Coach",
    emoji: "⚖️",
    category: "communication",
    description: "Argues both sides of any issue to sharpen your thinking.",
    instructions: "Present balanced arguments on any topic. For every strong argument, present the strongest counter-argument. Help the user see their blind spots. Steelman every position before critiquing it.",
    source: "builtin",
    enabled: false,
  },
  {
    id: "uz-translator",
    name: "O'zbek Tarjimon",
    emoji: "🇺🇿",
    category: "communication",
    description: "Seamlessly translates and explains in Uzbek when needed.",
    instructions: "When the user writes in Uzbek, always respond in Uzbek unless they switch to another language. Translate any code comments or documentation to Uzbek when asked. Use natural, modern Uzbek (not overly formal).",
    source: "builtin",
    enabled: false,
  },
  {
    id: "design-reviewer",
    name: "Design Reviewer",
    emoji: "🎨",
    category: "creative",
    description: "Reviews UI/UX with expert eye — layout, color, typography, accessibility.",
    instructions: "When reviewing designs or UI: assess hierarchy, whitespace, color contrast, typography scale, consistency, accessibility (WCAG), mobile responsiveness, and user flow. Give specific actionable feedback.",
    source: "builtin",
    enabled: false,
  },
  {
    id: "rubber-duck",
    name: "Rubber Duck Debug",
    emoji: "🦆",
    category: "coding",
    description: "Helps you think out loud and debug by asking probing questions.",
    instructions: "Act as a rubber duck debugger. Ask clarifying questions to help the user think through their problem. Don't give the answer immediately — help them reason through it: 'What do you expect to happen? What actually happens? Have you checked X?'",
    source: "builtin",
    enabled: false,
  },
  {
    id: "startup-advisor",
    name: "Startup Advisor",
    emoji: "🚀",
    category: "productivity",
    description: "Thinks like a YC partner — ruthless product feedback, market focus.",
    instructions: "Think like a YC partner. Challenge every assumption about market size, differentiation, and defensibility. Ask 'why would someone switch from X?' Focus on: problem clarity, solution uniqueness, GTM, unit economics. Be direct and challenging.",
    source: "builtin",
    enabled: false,
  },
  {
    id: "documentation-writer",
    name: "Docs Writer",
    emoji: "📝",
    category: "coding",
    description: "Writes clear, well-structured technical documentation.",
    instructions: "Write documentation that developers love. Use: clear headers, code examples for every concept, 'Why' before 'How', troubleshooting sections, and quick-start guides. Follow the Divio documentation system (tutorials/how-tos/reference/explanation).",
    source: "builtin",
    enabled: false,
  },
];

const STORAGE_KEY = "mv-skills";

export function loadSkills(): Skill[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as Record<string, Partial<Skill>>;
    const custom: Skill[] = (JSON.parse(localStorage.getItem("mv-custom-skills") || "[]")) as Skill[];
    const builtin = BUILTIN_SKILLS.map((s) => ({ ...s, enabled: saved[s.id]?.enabled ?? false }));
    return [...builtin, ...custom.map((s) => ({ ...s, source: "custom" as const }))];
  } catch {
    return BUILTIN_SKILLS;
  }
}

export function saveSkillEnabled(id: string, enabled: boolean) {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  saved[id] = { ...saved[id], enabled };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
}

export function saveCustomSkill(skill: Omit<Skill, "id" | "source" | "enabled">) {
  const customs: Skill[] = JSON.parse(localStorage.getItem("mv-custom-skills") || "[]");
  const id = `custom-${Date.now()}`;
  customs.push({ ...skill, id, source: "custom", enabled: true });
  localStorage.setItem("mv-custom-skills", JSON.stringify(customs));
  return id;
}

export function deleteCustomSkill(id: string) {
  const customs: Skill[] = JSON.parse(localStorage.getItem("mv-custom-skills") || "[]");
  localStorage.setItem("mv-custom-skills", JSON.stringify(customs.filter((s) => s.id !== id)));
}

export function getEnabledSkillsPrompt(skills: Skill[]): string {
  const enabled = skills.filter((s) => s.enabled);
  if (!enabled.length) return "";
  return `\n\nACTIVE SKILLS:\n${enabled.map((s) => `${s.emoji} ${s.name}: ${s.instructions}`).join("\n\n")}`;
}
