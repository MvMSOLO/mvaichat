// MV AI v6.5 — Slash command runners.
import { runToolCalls } from "@/lib/autonomy";

export async function runSlash(text: string): Promise<string | null> {
  const m = text.match(/^\s*\/(\w+)\s*(.*)$/s);
  if (!m) return null;
  const cmd = m[1].toLowerCase();
  const arg = m[2].trim();

  switch (cmd) {
    case "image": {
      if (!arg) return "Usage: `/image <prompt>`";
      const r = await fetch("/api/chat/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt: arg }),
      });
      if (!r.ok) return `Image generation failed: ${r.statusText}`;
      const data = await r.json();
      if (!data?.url) return `Image generation failed: ${data?.error || "unknown"}`;
      return `**Image generated**\n\n![generated](${data.url})\n\n_Prompt: ${data.revisedPrompt || arg}_`;
    }
    case "open": {
      if (!arg) return "Usage: `/open <url|app name> [query]`";
      if (/^https?:\/\//i.test(arg)) {
        await runToolCalls([{ name: "open_url", args: { url: arg } }]);
        return `Opening ${arg}`;
      }
      const [app, ...rest] = arg.split(/\s+/);
      await runToolCalls([{ name: "open_app", args: { app: app.toLowerCase(), query: rest.join(" ") } }]);
      return `Opening ${app}${rest.length ? `: ${rest.join(" ")}` : ""}`;
    }
    case "call": {
      if (!arg) return "Usage: `/call <phone number>`";
      const [r] = await runToolCalls([{ name: "call_contact", args: { number: arg } }]);
      return r?.message || "Call prepared";
    }
    case "sms": {
      const [num, ...rest] = arg.split("|").map((s) => s.trim());
      if (!num || !rest.length) return "Usage: `/sms +998901234567 | your message`";
      const [r] = await runToolCalls([{ name: "send_sms", args: { number: num, text: rest.join("|") } }]);
      return r?.message || "SMS prepared";
    }
    case "dm": {
      const [head, ...msg] = arg.split("|").map((s) => s.trim());
      const [platRaw, target] = head.split(/\s+/);
      const plat = (platRaw || "").toLowerCase();
      if (!target || !["ig", "instagram", "tg", "telegram"].includes(plat)) return "Usage: `/dm ig|tg @user | message`";
      const tool = plat.startsWith("t") ? "telegram_action" : "instagram_action";
      const [r] = await runToolCalls([{ name: tool, args: { kind: "dm", target, text: msg.join("|") } }]);
      return r?.message || "DM prepared";
    }
    case "follow": {
      const [platRaw, target] = arg.split(/\s+/);
      const plat = (platRaw || "").toLowerCase();
      if (!target) return "Usage: `/follow ig|tg|yt @user`";
      const tool = plat.startsWith("t") ? "telegram_action" : plat.startsWith("y") ? "youtube_action" : "instagram_action";
      const kind = tool === "youtube_action" ? "subscribe" : "follow";
      const [r] = await runToolCalls([{ name: tool, args: { kind, target } }]);
      return r?.message || "Opened";
    }
    case "story":
      return null;
    case "github": {
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
    case "search":
      return null;
  }
  return null;
}
