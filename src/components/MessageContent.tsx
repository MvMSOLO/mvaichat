import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
            return <CodeBlock language={match[1]} value={String(children).replace(/\n$/, "")} />;
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
  return (
    <div className="relative group rounded-xl overflow-hidden border border-border my-3">
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/60 text-xs">
        <span className="font-mono text-muted-foreground">{language}</span>
        <Button
          variant="ghost" size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <SyntaxHighlighter language={language} style={oneDark} customStyle={{ margin: 0, borderRadius: 0, padding: "0.9rem 1rem", fontSize: "0.85rem" }}>
        {value}
      </SyntaxHighlighter>
    </div>
  );
}
