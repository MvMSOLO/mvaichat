import { Sandpack } from "@codesandbox/sandpack-react";

export function CodeRunner({ code, language = "jsx" }: { code: string; language?: string }) {
  const isReact = language === "jsx" || language === "tsx" || /import\s+React|from\s+["']react/.test(code);
  if (isReact) {
    return (
      <div className="rounded-xl overflow-hidden border border-foreground/10 my-3">
        <Sandpack
          template="react"
          theme="dark"
          options={{ showLineNumbers: true, editorHeight: 320, showTabs: false }}
          files={{ "/App.js": code }}
        />
      </div>
    );
  }
  return (
    <div className="rounded-xl overflow-hidden border border-foreground/10 my-3">
      <Sandpack
        template="vanilla"
        theme="dark"
        options={{ showLineNumbers: true, editorHeight: 320, showTabs: false }}
        files={{ "/index.js": code }}
      />
    </div>
  );
}
