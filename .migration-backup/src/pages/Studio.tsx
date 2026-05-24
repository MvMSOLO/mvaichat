import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wand2, Download, Copy, Figma, Palette, Loader2, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

export default function Studio() {
  const [prompt, setPrompt] = useState("");
  const [svg, setSvg] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setSvg("");
    try {
      const { data, error } = await supabase.functions.invoke("logo-engine", { body: { prompt } });
      if (error) throw error;
      if (data?.svg) setSvg(data.svg); else throw new Error("No SVG");
    } catch (e: any) {
      toast.error("Logo generation failed", { description: e.message });
    } finally { setLoading(false); }
  };

  const downloadSVG = () => {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `mvai-logo-${Date.now()}.svg`; a.click();
    URL.revokeObjectURL(url);
  };
  const copySVG = () => { navigator.clipboard.writeText(svg); setCopied(true); setTimeout(() => setCopied(false), 1500); toast.success("Copied! Paste into Figma."); };
  const openCanva = () => window.open("https://www.canva.com/design/play?create&type=logo", "_blank");

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 mesh-bg pointer-events-none" />
      <div className="fixed inset-0 aurora-bg opacity-40 pointer-events-none" />
      <div className="relative z-10 container max-w-5xl py-8">
        <div className="flex items-center justify-between mb-8">
          <Link to="/"><Button variant="ghost" size="sm" className="glass rounded-full"><ArrowLeft className="size-4 mr-1" /> Home</Button></Link>
          <div className="flex items-center gap-2">
            <BrandMark size={20} />
            <span className="font-display text-sm font-bold">Studio</span>
          </div>
        </div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs mb-4">
            <Palette className="size-3 text-fuchsia-400" /> Brand Engine · Golden Ratio · SVG
          </div>
          <h1 className="font-display text-4xl md:text-6xl tracking-tighter font-bold">
            <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-violet-400">Logo</span> Studio
          </h1>
          <p className="text-foreground/60 mt-3">Describe your brand. Get a clean, math-precise SVG. Export to Figma or Canva.</p>
        </motion.div>

        <div className="glass-strong rounded-3xl p-6 md:p-8 space-y-5">
          <div className="flex gap-2">
            <Input
              placeholder="e.g. minimalist mountain peak for an AI startup"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generate()}
              className="h-12 rounded-xl bg-background/60"
            />
            <Button onClick={generate} disabled={loading} className="h-12 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold px-6 shine">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
              Generate
            </Button>
          </div>

          {svg && (
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="grid md:grid-cols-2 gap-5">
              <div className="aspect-square glass rounded-2xl grid place-items-center p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(268_92%_70%/0.08)_0%,transparent_70%)]" />
                <div className="relative w-full h-full" dangerouslySetInnerHTML={{ __html: svg }} />
              </div>
              <div className="space-y-3 flex flex-col justify-center">
                <Button onClick={downloadSVG} className="rounded-xl h-11 justify-start"><Download className="size-4 mr-2" /> Download .svg</Button>
                <Button onClick={copySVG} variant="secondary" className="rounded-xl h-11 justify-start">
                  {copied ? <Check className="size-4 mr-2 text-emerald-400" /> : <Copy className="size-4 mr-2" />}
                  Copy SVG (paste into Figma)
                </Button>
                <Button onClick={openCanva} variant="secondary" className="rounded-xl h-11 justify-start">
                  <Palette className="size-4 mr-2" /> Open Canva editor
                </Button>
                <div className="text-xs text-foreground/50 leading-relaxed mt-2">
                  In Figma: paste with <kbd className="px-1.5 py-0.5 rounded bg-foreground/10 text-[10px]">Cmd+V</kbd> on canvas — it imports as vector layers.
                </div>
              </div>
            </motion.div>
          )}

          {!svg && !loading && (
            <div className="text-center py-12 text-foreground/40 text-sm">Type a brief and hit Generate.</div>
          )}
        </div>
      </div>
    </div>
  );
}
