import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy, Play, ZoomIn, Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DynamicBlock } from "@/components/dynamic/DynamicBlock";
import { CodeRunner } from "@/components/dynamic/CodeRunner";

export function MessageContent({ content }: { content: string }) {
  return (
    <div className="prose-mv">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img({ src, alt }: any) {
            return <InlineImage src={src} alt={alt} />;
          },
          code({ className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const inline = !match;
            if (inline) return <code className={className} {...props}>{children}</code>;
            const lang = match[1];
            const value = String(children).replace(/\n$/, "");
            if (lang === "mvai") return <DynamicBlock raw={value} />;
            return <CodeBlock language={lang} value={value} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function InlineImage({ src, alt }: { src?: string; alt?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  if (!src) return null;

  return (
    <>
      <span className="block my-3 group relative">
        {!loaded && !error && (
          <span className="flex items-center gap-2.5 px-5 py-7 rounded-2xl bg-muted/30 border border-border/40 text-sm text-muted-foreground">
            <span className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin inline-block shrink-0" />
            Rasm yaratilmoqda…
          </span>
        )}
        {error && (
          <span className="flex items-center gap-2 px-4 py-6 rounded-2xl bg-destructive/10 border border-destructive/30 text-sm text-destructive">
            Rasm yuklanmadi
          </span>
        )}
        <img
          src={src}
          alt={alt || "AI generated image"}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          onClick={() => setZoomed(true)}
          className={`rounded-2xl max-w-full cursor-zoom-in shadow-elev border border-border/20 transition-all duration-700 hover:scale-[1.01] ${loaded ? "opacity-100 scale-100" : "opacity-0 scale-95 absolute"}`}
          style={{ maxHeight: "440px", objectFit: "contain" }}
        />
        {loaded && (
          <span className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => { e.stopPropagation(); setZoomed(true); }}
              className="p-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white hover:bg-primary/80 transition-colors"
            >
              <ZoomIn className="size-3.5" />
            </button>
            <a
              href={src}
              download
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white hover:bg-primary/80 transition-colors"
            >
              <Download className="size-3.5" />
            </a>
          </span>
        )}
      </span>

      {zoomed && (
        <span
          className="fixed inset-0 z-[9999] bg-black/92 backdrop-blur-xl flex items-center justify-center p-6 cursor-zoom-out"
          onClick={() => setZoomed(false)}
        >
          <img
            src={src}
            alt={alt || "AI generated image"}
            className="max-w-full max-h-full rounded-2xl shadow-2xl ring-1 ring-white/10"
            style={{ maxHeight: "92vh" }}
          />
        </span>
      )}
    </>
  );
}

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const [running, setRunning] = useState(false);
  const runnable = ["jsx", "tsx", "js", "javascript", "ts", "typescript", "html"].includes(language);
  if (running) return <CodeRunner code={value} language={language} />;
  return (
    <div className="relative group rounded-xl overflow-hidden border border-border my-3">
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/60 text-xs">
        <span className="font-mono text-muted-foreground">{language}</span>
        <div className="flex gap-1">
          {runnable && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1" onClick={() => setRunning(true)}>
              <Play className="size-3" /> Run
            </Button>
          )}
          <Button
            variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1"
            onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          >
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{ margin: 0, borderRadius: 0, padding: "0.9rem 1rem", fontSize: "0.85rem" }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}
