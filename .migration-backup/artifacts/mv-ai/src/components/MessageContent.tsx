import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
// @ts-ignore — no @types package for react-syntax-highlighter
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// @ts-ignore
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy, Play, ZoomIn, Download, Terminal, ExternalLink } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { DynamicBlock } from "@/components/dynamic/DynamicBlock";
import { CodeRunner } from "@/components/dynamic/CodeRunner";

interface Props {
  content: string;
  streaming?: boolean;
}

export function MessageContent({ content, streaming }: Props) {
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
            if (inline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[0.85em] font-mono border border-primary/20"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            const lang = match[1];
            const value = String(children).replace(/\n$/, "");
            if (lang === "mvai") return <DynamicBlock raw={value} />;
            return <CodeBlock language={lang} value={value} streaming={streaming} />;
          },
          a({ href, children }: any) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:text-primary/80 inline-flex items-center gap-0.5 transition-colors"
              >
                {children}
                <ExternalLink className="size-2.5 opacity-60" />
              </a>
            );
          },
          table({ children }: any) {
            return (
              <div className="overflow-x-auto my-3 rounded-xl border border-border/50">
                <table className="w-full text-sm">{children}</table>
              </div>
            );
          },
          th({ children }: any) {
            return <th className="px-3 py-2 bg-muted/60 font-semibold text-left border-b border-border/50 first:rounded-tl-xl last:rounded-tr-xl">{children}</th>;
          },
          td({ children }: any) {
            return <td className="px-3 py-2 border-b border-border/20 last:border-0">{children}</td>;
          },
          blockquote({ children }: any) {
            return (
              <blockquote className="border-l-2 border-primary/50 pl-4 my-3 text-muted-foreground italic bg-primary/5 py-2 rounded-r-xl">
                {children}
              </blockquote>
            );
          },
          h1({ children }: any) {
            return <h1 className="text-2xl font-display font-bold mt-5 mb-2 text-foreground">{children}</h1>;
          },
          h2({ children }: any) {
            return <h2 className="text-xl font-display font-bold mt-4 mb-2 text-foreground border-b border-border/30 pb-1">{children}</h2>;
          },
          h3({ children }: any) {
            return <h3 className="text-base font-display font-semibold mt-3 mb-1 text-foreground">{children}</h3>;
          },
          ul({ children }: any) {
            return <ul className="list-none pl-0 my-2 space-y-1.5">{children}</ul>;
          },
          ol({ children }: any) {
            return <ol className="list-decimal pl-5 my-2 space-y-1.5">{children}</ol>;
          },
          li({ children }: any) {
            return (
              <li className="flex gap-2 items-start text-sm leading-relaxed">
                <span className="mt-2 size-1.5 rounded-full bg-primary/60 shrink-0" />
                <span>{children}</span>
              </li>
            );
          },
          p({ children }: any) {
            return <p className="my-2 text-sm md:text-[0.95rem] leading-relaxed">{children}</p>;
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
      <span className="block my-4 group relative">
        <AnimatePresence>
          {!loaded && !error && (
            <motion.span
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 px-5 py-8 rounded-2xl bg-muted/30 border border-border/40 text-sm text-muted-foreground"
            >
              <motion.span
                className="size-5 rounded-full border-2 border-primary border-t-transparent shrink-0"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <span>Rasm yaratilmoqda…</span>
              <span className="ml-auto text-xs opacity-50">Pollinations AI</span>
            </motion.span>
          )}
        </AnimatePresence>
        {error && (
          <span className="flex items-center gap-2 px-4 py-6 rounded-2xl bg-destructive/10 border border-destructive/30 text-sm text-destructive">
            Rasm yuklanmadi
          </span>
        )}
        <motion.img
          src={src}
          alt={alt || "AI generated image"}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          onClick={() => setZoomed(true)}
          initial={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
          animate={loaded ? { opacity: 1, scale: 1, filter: "blur(0px)" } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className={`rounded-2xl max-w-full cursor-zoom-in shadow-elev border border-border/20 hover:scale-[1.01] transition-transform duration-300 ${loaded ? "block" : "hidden"}`}
          style={{ maxHeight: "480px", objectFit: "contain" }}
        />
        {loaded && (
          <span className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => { e.stopPropagation(); setZoomed(true); }}
              className="p-1.5 rounded-lg bg-black/70 backdrop-blur-sm text-white hover:bg-primary/80 transition-colors"
            >
              <ZoomIn className="size-3.5" />
            </button>
            <a
              href={src} download target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg bg-black/70 backdrop-blur-sm text-white hover:bg-primary/80 transition-colors"
            >
              <Download className="size-3.5" />
            </a>
          </span>
        )}
      </span>

      <AnimatePresence>
        {zoomed && (
          <motion.span
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 cursor-zoom-out"
            onClick={() => setZoomed(false)}
          >
            <motion.img
              src={src} alt={alt || "AI generated image"}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-full max-h-full rounded-2xl shadow-2xl ring-1 ring-white/10"
              style={{ maxHeight: "92vh" }}
            />
          </motion.span>
        )}
      </AnimatePresence>
    </>
  );
}

function CodeBlock({ language, value, streaming }: { language: string; value: string; streaming?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [running, setRunning] = useState(false);
  const [lineCount, setLineCount] = useState(0);
  const runnable = ["jsx", "tsx", "js", "javascript", "ts", "typescript", "html"].includes(language);

  useEffect(() => {
    setLineCount(value.split("\n").length);
  }, [value]);

  if (running) return <CodeRunner code={value} language={language} />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group rounded-xl overflow-hidden border border-border/60 my-3 shadow-soft"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1b26] border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          {/* Traffic lights */}
          <div className="flex gap-1.5">
            <span className="size-3 rounded-full bg-[#ff5f57]" />
            <span className="size-3 rounded-full bg-[#febc2e]" />
            <span className="size-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex items-center gap-1.5">
            <Terminal className="size-3 text-white/30" />
            <span className="font-mono text-[11px] text-white/50 uppercase tracking-wider">{language}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-white/25 font-mono">{lineCount} lines</span>
          {runnable && (
            <Button variant="ghost" size="sm"
              className="h-6 px-2 text-[11px] gap-1 text-white/60 hover:text-white hover:bg-white/10 rounded-md"
              onClick={() => setRunning(true)}>
              <Play className="size-3" /> Run
            </Button>
          )}
          <Button variant="ghost" size="sm"
            className="h-6 px-2 text-[11px] gap-1 text-white/60 hover:text-white hover:bg-white/10 rounded-md"
            onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
            {copied ? <><Check className="size-3 text-green-400" /> Copied</> : <><Copy className="size-3" /> Copy</>}
          </Button>
        </div>
      </div>

      {/* Code */}
      <div className="relative">
        {streaming && (
          <motion.div
            className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        )}
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          showLineNumbers={lineCount > 5}
          customStyle={{
            margin: 0, borderRadius: 0, padding: "1rem",
            fontSize: "0.82rem", lineHeight: "1.6",
            background: "#1a1b26",
          }}
          lineNumberStyle={{ color: "#3b3d52", fontSize: "0.7rem", minWidth: "2.5em" }}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </motion.div>
  );
}
