// MV AI v5 — Reliable in-browser code runner (no CDN required for HTML/JS)
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { RefreshCw, ExternalLink, AlertCircle } from "lucide-react";

interface Props { code: string; language?: string; }

export function CodeRunner({ code, language = "jsx" }: Props) {
  const lang = language.toLowerCase();
  const [key, setKey] = useState(0); // remount iframe to re-run

  const srcdoc = useMemo(() => buildSrcdoc(lang, code), [lang, code]);

  // For languages we can't run in-browser, show a CodeSandbox link
  if (!srcdoc) {
    const ext = getExt(lang);
    const files = encodeURIComponent(JSON.stringify({ [`/index.${ext}`]: { content: code } }));
    const url = `https://codesandbox.io/api/v1/sandboxes/define?parameters=${files}`;
    return (
      <div className="rounded-xl border border-border bg-muted/20 p-4 my-3 flex items-center gap-3">
        <AlertCircle className="size-5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">Live run unsupported for {lang}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Open in CodeSandbox to run this code</div>
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0">
          <ExternalLink className="size-3" /> Open
        </a>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden border border-border/60 my-3 bg-[#1a1a2e]"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 border-b border-border/40">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-red-500/80" />
          <span className="size-2.5 rounded-full bg-yellow-500/80" />
          <span className="size-2.5 rounded-full bg-green-500/80" />
          <span className="text-xs text-muted-foreground font-mono ml-1">
            {lang === "html" ? "HTML Preview" : lang === "css" ? "CSS Preview" : "JS Console"}
          </span>
        </div>
        <button
          onClick={() => setKey((k) => k + 1)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="size-3" /> Restart
        </button>
      </div>
      <iframe
        key={key}
        srcDoc={srcdoc}
        sandbox="allow-scripts allow-same-origin"
        className="w-full border-none bg-white"
        style={{ minHeight: 300, maxHeight: 480 }}
        title="Code output"
      />
    </motion.div>
  );
}

function buildSrcdoc(lang: string, code: string): string | null {
  if (lang === "html") {
    // Inject resize observer to auto-size iframe
    return `${code}<script>
if(window.parent!==window){
  const ro=new ResizeObserver(()=>window.parent.postMessage({iframeHeight:document.body.scrollHeight},'*'));
  ro.observe(document.body);
}
</script>`;
  }

  if (lang === "css") {
    return `<!doctype html><html><head><style>
body{font-family:system-ui,sans-serif;padding:16px;background:#fff;color:#111}
h1{font-size:2rem;margin:0 0 8px}p{margin:0 0 8px}a{color:#6d28d9}
button{cursor:pointer;padding:6px 14px;border-radius:8px;border:1px solid #ccc}
.card{border:1px solid #eee;border-radius:12px;padding:16px;margin:8px 0;max-width:320px}
${code}
</style></head><body>
<h1>Heading 1</h1>
<p>Sample paragraph with <a href="#">a link</a> and <strong>bold text</strong>.</p>
<button>Click me</button>
<div class="card"><strong>Card</strong><p>Card content goes here</p></div>
</body></html>`;
  }

  if (lang === "js" || lang === "javascript") {
    return `<!doctype html><html><head><style>
body{font-family:'Courier New',monospace;background:#0d1117;color:#c9d1d9;padding:16px;margin:0;font-size:13px}
.out{margin:2px 0;padding:2px 0;border-bottom:1px solid #21262d}
.err{color:#f85149}.info{color:#58a6ff}.warn{color:#d29922}
</style></head><body><div id="out"></div><script>
const _out=document.getElementById('out');
const _log=(cls,args)=>{const d=document.createElement('div');d.className='out '+cls;d.textContent=args.map(a=>{try{return typeof a==='object'?JSON.stringify(a,null,2):String(a)}catch{return String(a)}}).join(' ');_out.appendChild(d);};
const _c=console;
console.log=(...a)=>{ _c.log(...a);_log('',a); };
console.error=(...a)=>{ _c.error(...a);_log('err',a); };
console.info=(...a)=>{ _c.info(...a);_log('info',a); };
console.warn=(...a)=>{ _c.warn(...a);_log('warn',a); };
window.onerror=(m,s,l)=>{ _log('err',['Error: '+m+' (line '+l+')']); return true; };
try{ ${code} }catch(e){ _log('err',[e.message]); }
</script></body></html>`;
  }

  if (lang === "ts" || lang === "typescript") {
    // Strip basic type annotations for simple TS (good enough for demos)
    const stripped = code
      .replace(/:\s*(string|number|boolean|any|void|null|undefined|never)(\[\])?/g, "")
      .replace(/<[A-Z][A-Za-z]*>/g, "")
      .replace(/interface\s+\w+\s*\{[^}]*\}/g, "")
      .replace(/type\s+\w+\s*=\s*[^;]+;/g, "");
    return buildSrcdoc("javascript", stripped);
  }

  if (lang === "jsx" || lang === "tsx" || lang === "react") {
    // Use Babel CDN to transpile JSX in browser
    return `<!doctype html><html><head>
<script src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<style>body{margin:0;font-family:system-ui,sans-serif;background:#fff}</style>
</head><body><div id="root"></div>
<script type="text/babel" data-presets="react">
${code.includes("export default") ? code.replace(/export default\s+/, "const _DefaultExport = ") + "\nReactDOM.createRoot(document.getElementById('root')).render(React.createElement(_DefaultExport));" : code}
</script></body></html>`;
  }

  return null; // unsupported language
}

function getExt(lang: string): string {
  const map: Record<string, string> = {
    python: "py", java: "java", cpp: "cpp", c: "c",
    go: "go", rust: "rs", ruby: "rb", php: "php",
    swift: "swift", kotlin: "kt",
  };
  return map[lang] || lang;
}
