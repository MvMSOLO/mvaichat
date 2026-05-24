// MV AI v6.5 — Run JS / TS / React / HTML / CSS code in-chat.
import { Sandpack } from "@codesandbox/sandpack-react";

export function CodeRunner({ code, language = "jsx" }: { code: string; language?: string }) {
  const lang = language.toLowerCase();
  const isReact =
    lang === "jsx" || lang === "tsx" ||
    /import\s+React|from\s+["']react/.test(code) ||
    /export\s+default\s+function/.test(code);

  if (isReact) {
    return (
      <div className="rounded-xl overflow-hidden border border-foreground/10 my-3">
        <Sandpack
          template="react"
          theme="dark"
          options={{ showLineNumbers: true, editorHeight: 360, showTabs: false }}
          files={{ "/App.js": code }}
        />
      </div>
    );
  }

  if (lang === "html") {
    return (
      <div className="rounded-xl overflow-hidden border border-foreground/10 my-3">
        <Sandpack
          template="static"
          theme="dark"
          options={{ showLineNumbers: true, editorHeight: 360, showTabs: false }}
          files={{ "/index.html": code }}
        />
      </div>
    );
  }

  if (lang === "css") {
    const html = `<!doctype html><html><head><style>${code}</style></head><body>
<h1>Heading</h1><p>Paragraph with <a href="#">a link</a> and <strong>bold</strong>.</p>
<button>Button</button><div class="card">Card</div></body></html>`;
    return (
      <div className="rounded-xl overflow-hidden border border-foreground/10 my-3">
        <Sandpack
          template="static"
          theme="dark"
          options={{ editorHeight: 360, showTabs: false }}
          files={{ "/index.html": html }}
        />
      </div>
    );
  }

  // js / ts / vanilla
  return (
    <div className="rounded-xl overflow-hidden border border-foreground/10 my-3">
      <Sandpack
        template="vanilla"
        theme="dark"
        options={{ showLineNumbers: true, editorHeight: 360, showTabs: false }}
        files={{ "/index.js": code }}
      />
    </div>
  );
}
