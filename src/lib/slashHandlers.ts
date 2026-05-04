// MV AI v6 — Slash command runners. Returns a markdown string to inject as
// the assistant message, or null if it should fall through to LLM.
import { supabase } from "@/integrations/supabase/client";
import { runToolCalls } from "@/lib/autonomy";

export async function runSlash(text: string): Promise<string | null> {
  const m = text.match(/^\s*\/(\w+)\s*(.*)$/s);
  if (!m) return null;
  const cmd = m[1].toLowerCase();
  const arg = m[2].trim();

  switch (cmd) {
    case "image": {
      if (!arg) return "Usage: `/image <prompt>`";
      const { data, error } = await supabase.functions.invoke("image-studio", { body: { prompt: arg } });
      if (error || !data?.image) return `Image generation failed: ${error?.message || data?.error || "unknown"}`;
      return `**Image generated**\n\n![generated](${data.image})\n\n_Prompt: ${data.finalPrompt || arg}_`;
    }
    case "pdf": {
      if (!arg) return "Usage: `/pdf <topic>`";
      const { data, error } = await supabase.functions.invoke("pdf-gen", { body: { topic: arg } });
      if (error || !data?.dataUrl) return `PDF failed: ${error?.message || "unknown"}`;
      return `**${data.title || "Document"}.pdf** ready.\n\n[📄 Download PDF](${data.dataUrl})`;
    }
    case "open": {
      if (!arg) return "Usage: `/open <url|app name>`";
      // URL?
      if (/^https?:\/\//i.test(arg)) {
        await runToolCalls([{ name: "open_url", args: { url: arg } }]);
        return `Opening ${arg}`;
      }
      // app keyword + optional query
      const [app, ...rest] = arg.split(/\s+/);
      await runToolCalls([{ name: "open_app", args: { app: app.toLowerCase(), query: rest.join(" ") } }]);
      return `Opening ${app}${rest.length ? `: ${rest.join(" ")}` : ""}`;
    }
    case "github": {
      // /github owner/repo path/to/file.md\n```\ncontent\n```
      const head = arg.split("\n")[0].trim();
      const body = arg.slice(head.length).trim();
      const [repo, path] = head.split(/\s+/);
      const code = body.replace(/^```[\w]*\n?/, "").replace(/```\s*$/, "");
      if (!repo || !path || !code) return "Usage: `/github owner/repo path/file.md` then code block with content";
      const [r] = await runToolCalls([{ name: "github_push", args: { repo, files: [{ path, content: code }], message: "MV AI commit" } }]);
      return r?.ok ? `Pushed to [${repo}/${path}](${r.url})` : `GitHub failed: ${r?.error || r?.message}`;
    }
    case "figma": {
      const [r] = await runToolCalls([{ name: "figma_create", args: { name: arg, brief: arg } }]);
      return r?.ok ? `Figma opened. Brief: ${arg}` : `Figma failed: ${r?.error || r?.message}`;
    }
    case "search": {
      // fall through - chat function auto-routes to web-search
      return null;
    }
  }
  return null;
}
