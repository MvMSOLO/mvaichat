// MV AI v5 — Autonomy bridge. Local tool execution with real browser intents.
import { toast } from "sonner";

export interface ToolResult {
  ok: boolean;
  message?: string;
  error?: string;
}

async function nativeOpen(url: string): Promise<boolean> {
  try {
    const cap = (window as any).Capacitor;
    if (cap?.Plugins?.Browser?.open) { await cap.Plugins.Browser.open({ url }); return true; }
    if (cap?.Plugins?.App?.openUrl) { await cap.Plugins.App.openUrl({ url }); return true; }
  } catch {}
  return false;
}

function openExternal(url: string) {
  nativeOpen(url).then((ok) => { if (!ok) window.open(url, "_blank", "noopener,noreferrer"); });
}

async function confirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    toast(message, {
      action: { label: "✓ Ha", onClick: () => resolve(true) },
      cancel: { label: "Bekor", onClick: () => resolve(false) },
      duration: 15000,
      onAutoClose: () => resolve(false),
    });
  });
}

// ── Tool handlers ────────────────────────────────────────────────────────────

async function handleOpenUrl(args: any): Promise<ToolResult> {
  const url = args.url as string;
  if (!url) return { ok: false, error: "URL kiritilmadi" };
  openExternal(url);
  return { ok: true, message: `Ochildi: ${url}` };
}

async function handleYoutubeAction(args: any): Promise<ToolResult> {
  const kind = args.kind as string;
  const target = (args.target as string) || "";

  switch (kind) {
    case "subscribe": {
      const ok = await confirm(`YouTube'da "${target}" kanaliga obuna bo'lish?`);
      if (!ok) return { ok: false, message: "Bekor qilindi" };
      const searchQ = encodeURIComponent(target.replace(/^@/, ""));
      const url = target.startsWith("http")
        ? target
        : `https://www.youtube.com/@${target.replace(/^@/, "")}?sub_confirmation=1`;
      openExternal(url);
      return { ok: true, message: `YouTube ochildi — "${target}" kanaliga obuna bo'ling` };
    }
    case "unsubscribe": {
      openExternal(`https://www.youtube.com/@${target.replace(/^@/, "")}`);
      return { ok: true, message: `"${target}" kanal sahifasi ochildi — obunani bekor qiling` };
    }
    case "open_video": {
      const url = target.startsWith("http") ? target : `https://www.youtube.com/results?search_query=${encodeURIComponent(target)}`;
      openExternal(url);
      return { ok: true, message: `YouTube video ochildi` };
    }
    case "search": {
      openExternal(`https://www.youtube.com/results?search_query=${encodeURIComponent(target)}`);
      return { ok: true, message: `YouTube'da "${target}" qidirmoqda` };
    }
    case "open_channel": {
      const url = target.startsWith("http") ? target : `https://www.youtube.com/@${target.replace(/^@/, "")}`;
      openExternal(url);
      return { ok: true, message: `"${target}" kanal ochildi` };
    }
    default:
      return { ok: false, error: `Noma'lum YouTube amali: ${kind}` };
  }
}

async function handleInstagramDm(args: any): Promise<ToolResult> {
  const username = (args.username as string || "").replace(/^@/, "");
  const message = (args.message as string) || "";
  if (!username) return { ok: false, error: "Foydalanuvchi nomi kiritilmadi" };

  const ok = await confirm(`Instagram'da @${username} ga xabar yozish?`);
  if (!ok) return { ok: false, message: "Bekor qilindi" };

  // Instagram deep link for DMs
  const deepLink = `instagram://user?username=${username}`;
  const webUrl = `https://www.instagram.com/${username}/`;

  const native = await nativeOpen(deepLink);
  if (!native) {
    openExternal(webUrl);
    if (message) {
      await navigator.clipboard.writeText(message).catch(() => {});
      toast.success(`@${username} profili ochildi`, { description: message ? "Xabar buferga nusxalandi" : undefined });
    }
  }
  return { ok: true, message: `Instagram @${username} profili ochildi${message ? " — xabar buferga nusxalandi" : ""}` };
}

async function handleTelegramAction(args: any): Promise<ToolResult> {
  const kind = args.kind as string;
  const target = (args.target as string || "").replace(/^@/, "");
  const text = (args.text as string) || "";

  switch (kind) {
    case "open_chat":
    case "send_message": {
      if (text) {
        const ok = await confirm(`Telegram'da @${target} ga xabar yozish?`);
        if (!ok) return { ok: false, message: "Bekor qilindi" };
        if (text) await navigator.clipboard.writeText(text).catch(() => {});
      }
      const deep = `tg://resolve?domain=${target}`;
      const web = `https://t.me/${target}`;
      const native = await nativeOpen(deep);
      if (!native) openExternal(web);
      return { ok: true, message: `Telegram @${target} ochildi${text ? " — xabar buferga nusxalandi" : ""}` };
    }
    case "join_channel": {
      const ok = await confirm(`Telegram kanaliga qo'shilish: @${target}?`);
      if (!ok) return { ok: false, message: "Bekor qilindi" };
      const deep = `tg://join?invite=${target}`;
      const web = `https://t.me/${target}`;
      const native = await nativeOpen(deep);
      if (!native) openExternal(web);
      return { ok: true, message: `Telegram kanal ochildi: @${target}` };
    }
    default:
      return { ok: false, error: `Noma'lum Telegram amali: ${kind}` };
  }
}

async function handleCallContact(args: any): Promise<ToolResult> {
  const number = args.number as string;
  if (!number) return { ok: false, error: "Telefon raqam kiritilmadi" };
  const ok = await confirm(`${number} ga qo'ng'iroq qilish?`);
  if (!ok) return { ok: false, message: "Bekor qilindi" };
  window.location.href = `tel:${number}`;
  return { ok: true, message: `Qo'ng'iroq: ${number}` };
}

async function handleSendSms(args: any): Promise<ToolResult> {
  const number = args.number as string;
  const text = args.text as string;
  if (!number) return { ok: false, error: "Telefon raqam kiritilmadi" };
  const ok = await confirm(`${number} ga SMS yuborish?`);
  if (!ok) return { ok: false, message: "Bekor qilindi" };
  window.location.href = `sms:${number}${text ? `?body=${encodeURIComponent(text)}` : ""}`;
  return { ok: true, message: `SMS: ${number}` };
}

async function handleOpenApp(args: any): Promise<ToolResult> {
  const app = (args.app as string || "").toLowerCase();
  const query = args.query as string || "";

  const appUrls: Record<string, { deep?: string; web: string }> = {
    youtube: { web: query ? `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}` : "https://www.youtube.com" },
    instagram: { web: query ? `https://www.instagram.com/${query.replace(/^@/, "")}/` : "https://www.instagram.com" },
    telegram: { deep: query ? `tg://resolve?domain=${query.replace(/^@/, "")}` : "tg://", web: query ? `https://t.me/${query.replace(/^@/, "")}` : "https://web.telegram.org" },
    github: { web: query ? `https://github.com/${query}` : "https://github.com" },
    maps: { web: `https://maps.google.com/?q=${encodeURIComponent(query)}` },
    twitter: { web: query ? `https://twitter.com/search?q=${encodeURIComponent(query)}` : "https://twitter.com" },
    x: { web: query ? `https://x.com/search?q=${encodeURIComponent(query)}` : "https://x.com" },
  };

  const target = appUrls[app];
  if (!target) {
    openExternal(`https://www.google.com/search?q=${encodeURIComponent(app + " " + query)}`);
    return { ok: true, message: `"${app}" qidirmoqda` };
  }

  if (target.deep) {
    const native = await nativeOpen(target.deep);
    if (!native) openExternal(target.web);
  } else {
    openExternal(target.web);
  }
  return { ok: true, message: `${app} ochildi` };
}

// ── Main dispatcher ───────────────────────────────────────────────────────────

export async function runToolCalls(calls: Array<{ name: string; args: any }>): Promise<ToolResult[]> {
  const results: ToolResult[] = [];

  for (const call of calls) {
    try {
      let result: ToolResult;
      switch (call.name) {
        case "open_url":         result = await handleOpenUrl(call.args); break;
        case "youtube_action":   result = await handleYoutubeAction(call.args); break;
        case "instagram_dm":     result = await handleInstagramDm(call.args); break;
        case "telegram_action":  result = await handleTelegramAction(call.args); break;
        case "call_contact":     result = await handleCallContact(call.args); break;
        case "send_sms":         result = await handleSendSms(call.args); break;
        case "open_app":         result = await handleOpenApp(call.args); break;
        // generate_image is handled server-side via SSE; skip here
        case "generate_image":   result = { ok: true }; break;
        default:
          result = { ok: false, error: `Noma'lum tool: ${call.name}` };
      }

      if (result.message && result.ok) toast.success(result.message);
      if (result.error) toast.error(result.error);
      results.push(result);
    } catch (e: any) {
      const err = { ok: false, error: e.message };
      toast.error(e.message);
      results.push(err);
    }
  }

  return results;
}
