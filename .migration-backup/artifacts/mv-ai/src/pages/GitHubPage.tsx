import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { GitHubPanel } from "@/components/GitHubPanel";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/BrandMark";
import { ArrowLeft, Github } from "lucide-react";
import { toast } from "sonner";

export default function GitHubPage() {
  const navigate = useNavigate();
  const [importedContent, setImportedContent] = useState<{ content: string; filename: string } | null>(null);

  const handleImport = (content: string, filename: string) => {
    setImportedContent({ content, filename });
  };

  const sendToChat = () => {
    if (!importedContent) return;
    localStorage.setItem("mv-pending-import", JSON.stringify(importedContent));
    navigate("/chat");
    toast.success("Chat sahifasiga o'tildi — fayl tayyorlandi");
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <div className="fixed inset-0 mesh-bg pointer-events-none" />
      <div className="fixed inset-0 aurora-bg opacity-20 pointer-events-none" />
      <div className="relative z-10 container max-w-4xl py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate("/chat")} className="glass rounded-full gap-1.5">
            <ArrowLeft className="size-4" /> Chat
          </Button>
          <div className="flex items-center gap-2">
            <BrandMark size={28} />
            <span className="font-display text-lg font-bold">GitHub</span>
          </div>
          <div />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong rounded-2xl border border-border/40 overflow-hidden"
            style={{ height: "70vh" }}
          >
            <GitHubPanel onImport={handleImport} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            {importedContent ? (
              <div className="glass-strong rounded-2xl border border-primary/30 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Github className="size-4 text-primary" />
                  <span className="font-semibold text-sm">{importedContent.filename}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{importedContent.content.length} belgi</span>
                </div>
                <pre className="text-xs text-muted-foreground bg-muted/40 rounded-xl p-3 overflow-auto max-h-48 border border-border/40 font-mono leading-relaxed">
                  {importedContent.content.slice(0, 600)}{importedContent.content.length > 600 ? "\n…" : ""}
                </pre>
                <Button onClick={sendToChat} className="w-full rounded-xl shine">
                  <ArrowLeft className="size-4 mr-2" />
                  Chatga yuborish
                </Button>
              </div>
            ) : (
              <div className="glass rounded-2xl border border-border/40 p-8 text-center">
                <Github className="size-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Chapdan fayl tanlang — u yerda ko'rasiz</p>
              </div>
            )}

            <div className="glass rounded-2xl border border-border/40 p-4 space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">GitHub bilan nima qilish mumkin?</div>
              {[
                "📦 O'z repolaringizni ko'rish",
                "📂 Fayl va papkalar ichida ko'zdan kechirish",
                "⬇️ Fayl mazmunini chatga import qilish",
                "📝 Yangi fayl yaratish va commit qilish",
                "🔄 Mavjud faylni yangilash (update)",
                "✨ AI yozgan kodni to'g'ridan GitHub ga saqlash",
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
                  className="text-sm text-muted-foreground py-1">
                  {item}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
