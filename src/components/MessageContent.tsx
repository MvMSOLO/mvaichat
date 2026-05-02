import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy, Play } from "lucide-react";
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
          code({ className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const inline = !match;
            if (inline) return <code className={className} {...props}>{children}</code>;
            const lang = match[1];
            const value = String(children).replace(/\n$/, "");
            // mvai dynamic block
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
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1"
            onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>
      <SyntaxHighlighter language={language} style={oneDark} customStyle={{ margin: 0, borderRadius: 0, padding: "0.9rem 1rem", fontSize: "0.85rem" }}>
        {value}
      </SyntaxHighlighter>
    </div>
  );
}
