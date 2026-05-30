import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { loadSkills, saveSkillEnabled, saveCustomSkill, deleteCustomSkill, Skill, BUILTIN_SKILLS } from "@/lib/skills";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  ArrowLeft, BookOpen, Plus, Trash2, Github, Download,
  Sparkles, Check, X, Search, Filter, ChevronRight, Loader2, Zap,
} from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

const CATEGORIES = ["all", "productivity", "coding", "creative", "research", "communication", "custom"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_LABELS: Record<Category, string> = {
  all: "Hammasi",
  productivity: "Samaradorlik",
  coding: "Dasturlash",
  creative: "Ijodiy",
  research: "Tadqiqot",
  communication: "Muloqot",
  custom: "Mening Skills",
};

const CATEGORY_COLORS: Record<Category, string> = {
  all: "bg-foreground/10",
  productivity: "bg-blue-500/10 text-blue-400",
  coding: "bg-emerald-500/10 text-emerald-400",
  creative: "bg-pink-500/10 text-pink-400",
  research: "bg-amber-500/10 text-amber-400",
  communication: "bg-violet-500/10 text-violet-400",
  custom: "bg-primary/10 text-primary",
};

export default function SkillsPage() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [filter, setFilter] = useState<Category>("all");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: "", emoji: "✨", description: "", instructions: "", category: "custom" as Skill["category"] });

  useEffect(() => { setSkills(loadSkills()); }, []);

  const toggleSkill = (id: string, enabled: boolean) => {
    saveSkillEnabled(id, enabled);
    setSkills((prev) => prev.map((s) => s.id === id ? { ...s, enabled } : s));
  };

  const enabledCount = skills.filter((s) => s.enabled).length;

  const filtered = skills.filter((s) => {
    const matchCat = filter === "all" || s.category === filter;
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleCreateSkill = () => {
    if (!newSkill.name || !newSkill.instructions) { toast.error("Ism va ko'rsatmalar kerak"); return; }
    saveCustomSkill({ ...newSkill });
    setSkills(loadSkills());
    setNewSkill({ name: "", emoji: "✨", description: "", instructions: "", category: "custom" });
    setShowCreate(false);
    toast.success(`"${newSkill.name}" skill yaratildi`);
  };

  const handleDeleteSkill = (id: string, name: string) => {
    deleteCustomSkill(id);
    setSkills(loadSkills());
    toast.success(`"${name}" o'chirildi`);
  };

  const handleImportFromGitHub = async () => {
    if (!importUrl) return;
    setImporting(true);
    try {
      // Convert github.com URLs to raw URLs
      const rawUrl = importUrl
        .replace("github.com", "raw.githubusercontent.com")
        .replace("/blob/", "/");
      const resp = await fetch(rawUrl);
      if (!resp.ok) throw new Error("Fayl topilmadi");
      const text = await resp.text();
      // Parse as skill markdown: first line = title, second = desc, rest = instructions
      const lines = text.split("\n");
      const name = lines[0]?.replace(/^#+ ?/, "").trim() || "GitHub Skill";
      const description = lines.find((l) => l.trim() && !l.startsWith("#") && !l.startsWith("-"))?.trim() || "";
      saveCustomSkill({ name, emoji: "🐙", description, instructions: text, category: "custom" });
      setSkills(loadSkills());
      setImportUrl("");
      setShowImport(false);
      toast.success(`"${name}" import qilindi`);
    } catch (e: any) {
      toast.error("Import xatosi: " + e.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <div className="fixed inset-0 mesh-bg pointer-events-none" />
      <div className="fixed inset-0 aurora-bg opacity-20 pointer-events-none" />

      <div className="relative z-10 container max-w-4xl py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate("/chat")} className="glass rounded-full gap-1.5">
            <ArrowLeft className="size-4" /> Chat
          </Button>
          <div className="flex items-center gap-2">
            <BrandMark size={28} />
            <span className="font-display text-lg font-bold">Skills</span>
            {enabledCount > 0 && (
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full"
              >
                {enabledCount} aktiv
              </motion.span>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowImport(true)} className="rounded-full glass gap-1.5 text-xs">
              <Github className="size-3.5" /> Import
            </Button>
            <Button size="sm" onClick={() => setShowCreate(true)} className="rounded-full gap-1.5 text-xs">
              <Plus className="size-3.5" /> Yangi skill
            </Button>
          </div>
        </div>

        {/* Info banner */}
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl border border-primary/20 p-4 mb-6 flex items-start gap-3"
        >
          <Zap className="size-5 text-primary shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-sm">Skills nima?</div>
            <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Skills — AI xulqini o'zgartiruvchi maxsus ko'rsatmalar. Yoqilgan skilllar har bir chatga avtomatik qo'shiladi.
              Masalan "Code Reviewer" skilini yoqsangiz, AI barcha kodlarni automatic review qiladi.
            </div>
          </div>
        </motion.div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Skill qidirish…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/40 border border-border/40 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground/60"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                  filter === cat
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-border/40 hover:border-border/80 text-muted-foreground hover:text-foreground"
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Skills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((skill, i) => (
              <motion.div
                key={skill.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className={`relative rounded-2xl border p-4 transition-all ${skill.enabled ? "border-primary/30 bg-primary/5 shadow-[0_0_30px_-10px_hsl(var(--primary)/0.3)]" : "border-border/40 glass hover:border-border/80"}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0 mt-0.5">{skill.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{skill.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[skill.category as Category]}`}>
                        {CATEGORY_LABELS[skill.category as Category]}
                      </span>
                      {skill.source === "github" && <span className="text-[10px] text-muted-foreground">GitHub</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{skill.description}</p>
                    {skill.enabled && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="mt-2 text-[11px] text-primary/80 bg-primary/8 rounded-lg px-2 py-1.5 font-mono leading-relaxed line-clamp-3"
                      >
                        {skill.instructions.slice(0, 180)}…
                      </motion.div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {skill.source === "custom" && (
                      <button
                        onClick={() => handleDeleteSkill(skill.id, skill.name)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                    <Switch
                      checked={skill.enabled}
                      onCheckedChange={(v) => toggleSkill(skill.id, v)}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="size-12 mx-auto mb-3 opacity-30" />
            <p>Hech narsa topilmadi</p>
          </div>
        )}

        {/* Create Skill Modal */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-strong rounded-2xl border border-border/50 p-6 w-full max-w-md shadow-elev"
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-display text-lg font-bold">Yangi Skill yaratish</h3>
                  <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground">
                    <X className="size-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input value={newSkill.emoji} onChange={(e) => setNewSkill((p) => ({ ...p, emoji: e.target.value }))} placeholder="✨" className="w-16 rounded-xl text-center text-xl" />
                    <Input value={newSkill.name} onChange={(e) => setNewSkill((p) => ({ ...p, name: e.target.value }))} placeholder="Skill nomi" className="flex-1 rounded-xl" />
                  </div>
                  <Input value={newSkill.description} onChange={(e) => setNewSkill((p) => ({ ...p, description: e.target.value }))} placeholder="Qisqa tavsif" className="rounded-xl" />
                  <textarea
                    value={newSkill.instructions}
                    onChange={(e) => setNewSkill((p) => ({ ...p, instructions: e.target.value }))}
                    placeholder="AI ga ko'rsatmalar — bu matn har bir chatga qo'shiladi…"
                    rows={5}
                    className="w-full rounded-xl bg-muted/40 border border-border/50 p-3 text-sm resize-none outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground/60"
                  />
                  <Button onClick={handleCreateSkill} className="w-full rounded-xl">
                    <Plus className="size-4 mr-2" /> Yaratish
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Import Modal */}
        <AnimatePresence>
          {showImport && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={(e) => e.target === e.currentTarget && setShowImport(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-strong rounded-2xl border border-border/50 p-6 w-full max-w-md shadow-elev"
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-display text-lg font-bold">GitHub dan import</h3>
                  <button onClick={() => setShowImport(false)} className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground">
                    <X className="size-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground glass rounded-xl p-3 border border-border/40">
                    GitHub'dan raw fayl URLini kiriting. Markdown (.md) yoki matn (.txt) fayllar qo'llab-quvvatlanadi.
                    Masalan: <span className="text-primary font-mono">https://github.com/user/repo/blob/main/skill.md</span>
                  </div>
                  <Input
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    placeholder="https://github.com/user/repo/blob/main/skill.md"
                    className="rounded-xl font-mono text-xs"
                  />
                  <Button onClick={handleImportFromGitHub} disabled={!importUrl || importing} className="w-full rounded-xl">
                    {importing ? <Loader2 className="size-4 animate-spin mr-2" /> : <Download className="size-4 mr-2" />}
                    {importing ? "Import qilinmoqda…" : "Import qilish"}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
