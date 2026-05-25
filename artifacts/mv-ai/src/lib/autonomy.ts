// MV AI v5 — Autonomy bridge. Local tool execution with real native app opening.
import { toast } from "sonner";

export interface ToolResult {
  ok: boolean;
  message?: string;
  error?: string;
}

// ── App opener with blur-detection ──────────────────────────────────────────
// When a native app opens, the browser window loses focus. If focus is NOT
// lost within the timeout, the app didn't open → fall back to web URL.

function openWithAppFallback(
  appScheme: string,
  webUrl: string,
  timeoutMs = 1800,
): void {
  let didBlur = false;

  const onBlur = () => { didBlur = true; };
  window.addEventListener("blur", onBlur, { once: true });

  // Try native app scheme
  window.location.href = appScheme;

  setTimeout(() => {
    window.removeEventListener("blur", onBlur);
    if (!didBlur) {
      // Native app didn't open → open web
      window.open(webUrl, "_blank", "noopener,noreferrer");
    }
  }, timeoutMs);
}

function openExternal(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

// Capacitor native bridge (for Expo/Capacitor hybrid apps)
async function nativeOpen(url: string): Promise<boolean> {
  try {
    const cap = (window as any).Capacitor;
    if (cap?.Plugins?.Browser?.open) { await cap.Plugins.Browser.open({ url }); return true; }
    if (cap?.Plugins?.App?.openUrl) { await cap.Plugins.App.openUrl({ url }); return true; }
  } catch {}
  return false;
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

// ── YouTube ──────────────────────────────────────────────────────────────────

async function handleYoutubeAction(args: any): Promise<ToolResult> {
  const kind = (args.kind as string) || "search";
  const target = (args.target as string) || "";

  const name = target.replace(/^@/, "");

  switch (kind) {
    case "subscribe": {
      const ok = await confirm(`YouTube'da "${name}" kanaliga obuna bo'lish?`);
      if (!ok) return { ok: false, message: "Bekor qilindi" };

      // Try native YouTube app first (iOS & Android support youtube:// scheme)
      const appUrl = `youtube://www.youtube.com/@${name}`;
      const webUrl = `https://www.youtube.com/@${name}?sub_confirmation=1`;

      // Check Capacitor first
      const native = await nativeOpen(webUrl);
      if (!native) {
        // Try app scheme with blur-detection fallback
        openWithAppFallback(appUrl, webUrl);
      }
      return {
        ok: true,
        message: `YouTube ochildi — "${name}" sahifasida "Obuna bo'lish" tugmasini bosing`,
      };
    }

    case "unsubscribe": {
      const appUrl = `youtube://www.youtube.com/@${name}`;
      const webUrl = `https://www.youtube.com/@${name}`;
      const native = await nativeOpen(webUrl);
      if (!native) openWithAppFallback(appUrl, webUrl);
      return { ok: true, message: `"${name}" YouTube kanali ochildi — obunani bekor qiling` };
    }

    case "search": {
      const q = encodeURIComponent(target);
      const appUrl = `youtube://results?search_query=${q}`;
      const webUrl = `https://www.youtube.com/results?search_query=${q}`;
      const native = await nativeOpen(webUrl);
      if (!native) openWithAppFallback(appUrl, webUrl);
      return { ok: true, message: `YouTube'da "${target}" qidirilmoqda` };
    }

    case "open_video": {
      const isUrl = target.startsWith("http");
      const appUrl = isUrl
        ? `youtube://${target.replace(/^https?:\/\//, "")}`
        : `youtube://results?search_query=${encodeURIComponent(target)}`;
      const webUrl = isUrl
        ? target
        : `https://www.youtube.com/results?search_query=${encodeURIComponent(target)}`;
      const native = await nativeOpen(webUrl);
      if (!native) openWithAppFallback(appUrl, webUrl);
      return { ok: true, message: `YouTube video ochildi` };
    }

    case "open_channel": {
      const appUrl = `youtube://www.youtube.com/@${name}`;
      const webUrl = target.startsWith("http") ? target : `https://www.youtube.com/@${name}`;
      const native = await nativeOpen(webUrl);
      if (!native) openWithAppFallback(appUrl, webUrl);
      return { ok: true, message: `"${name}" YouTube kanali ochildi` };
    }

    default:
      return { ok: false, error: `Noma'lum YouTube amali: ${kind}` };
  }
}

// ── Instagram ────────────────────────────────────────────────────────────────

async function handleInstagramDm(args: any): Promise<ToolResult> {
  const username = (args.username as string || "").replace(/^@/, "");
  const message = (args.message as string) || "";
  if (!username) return { ok: false, error: "Foydalanuvchi nomi kiritilmadi" };

  const ok = await confirm(`Instagram'da @${username} ga DM yozish?`);
  if (!ok) return { ok: false, message: "Bekor qilindi" };

  // Instagram deep link
  const appUrl = `instagram://user?username=${username}`;
  const webUrl = `https://www.instagram.com/${username}/`;

  if (message) {
    await navigator.clipboard.writeText(message).catch(() => {});
    toast.info(`Xabar buferga nusxalandi`, { description: message.slice(0, 60) });
  }

  const native = await nativeOpen(appUrl);
  if (!native) openWithAppFallback(appUrl, webUrl);

  return {
    ok: true,
    message: `Instagram @${username} ochildi${message ? " — xabar buferga nusxalandi" : ""}`,
  };
}

// ── Telegram ─────────────────────────────────────────────────────────────────

async function handleTelegramAction(args: any): Promise<ToolResult> {
  const kind = args.kind as string;
  const target = (args.target as string || "").replace(/^@/, "");
  const text = (args.text as string) || "";

  const appDeep = `tg://resolve?domain=${target}`;
  const webUrl = `https://t.me/${target}`;

  switch (kind) {
    case "send_message": {
      const ok = await confirm(`Telegram'da @${target} ga xabar yozish?`);
      if (!ok) return { ok: false, message: "Bekor qilindi" };
      if (text) {
        await navigator.clipboard.writeText(text).catch(() => {});
        toast.info("Xabar buferga nusxalandi");
      }
      const native = await nativeOpen(appDeep);
      if (!native) openWithAppFallback(appDeep, webUrl);
      return { ok: true, message: `Telegram @${target} ochildi${text ? " — xabar buferga nusxalandi" : ""}` };
    }
    case "join_channel": {
      const ok = await confirm(`Telegram kanaliga qo'shilish: @${target}?`);
      if (!ok) return { ok: false, message: "Bekor qilindi" };
      const native = await nativeOpen(appDeep);
      if (!native) openWithAppFallback(appDeep, webUrl);
      return { ok: true, message: `@${target} Telegram kanali ochildi` };
    }
    case "open_chat":
    default: {
      const native = await nativeOpen(appDeep);
      if (!native) openWithAppFallback(appDeep, webUrl);
      return { ok: true, message: `Telegram @${target} ochildi` };
    }
  }
}

// ── Phone & SMS ───────────────────────────────────────────────────────────────

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
  return { ok: true, message: `SMS tayyorlandi: ${number}` };
}

// ── App opener ───────────────────────────────────────────────────────────────

async function handleOpenUrl(args: any): Promise<ToolResult> {
  const url = args.url as string;
  if (!url) return { ok: false, error: "URL kiritilmadi" };
  const native = await nativeOpen(url);
  if (!native) openExternal(url);
  return { ok: true, message: `Ochildi: ${url}` };
}

async function handleOpenApp(args: any): Promise<ToolResult> {
  const app = (args.app as string || "").toLowerCase();
  const query = (args.query as string) || "";

  const MAP: Record<string, { app?: string; web: string }> = {
    youtube: {
      app: query ? `youtube://results?search_query=${encodeURIComponent(query)}` : `youtube://`,
      web: query ? `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}` : `https://www.youtube.com`,
    },
    instagram: {
      app: query ? `instagram://user?username=${query.replace(/^@/, "")}` : `instagram://`,
      web: query ? `https://www.instagram.com/${query.replace(/^@/, "")}/` : `https://www.instagram.com`,
    },
    telegram: {
      app: query ? `tg://resolve?domain=${query.replace(/^@/, "")}` : `tg://`,
      web: query ? `https://t.me/${query.replace(/^@/, "")}` : `https://web.telegram.org`,
    },
    twitter: {
      app: query ? `twitter://search?query=${encodeURIComponent(query)}` : `twitter://`,
      web: query ? `https://x.com/search?q=${encodeURIComponent(query)}` : `https://x.com`,
    },
    x: {
      app: query ? `twitter://search?query=${encodeURIComponent(query)}` : `twitter://`,
      web: query ? `https://x.com/search?q=${encodeURIComponent(query)}` : `https://x.com`,
    },
    github: {
      web: query ? `https://github.com/${query}` : `https://github.com`,
    },
    maps: {
      app: `maps://?q=${encodeURIComponent(query)}`,
      web: `https://maps.google.com/?q=${encodeURIComponent(query)}`,
    },
    spotify: {
      app: `spotify://search/${encodeURIComponent(query)}`,
      web: `https://open.spotify.com/search/${encodeURIComponent(query)}`,
    },
    tiktok: {
      app: `tiktok://`,
      web: query ? `https://www.tiktok.com/@${query.replace(/^@/, "")}` : `https://www.tiktok.com`,
    },
  };

  const target = MAP[app];
  if (!target) {
    const webSearch = `https://www.google.com/search?q=${encodeURIComponent(app + (query ? " " + query : ""))}`;
    openExternal(webSearch);
    return { ok: true, message: `"${app}" qidirmoqda` };
  }

  if (target.app) {
    const native = await nativeOpen(target.app);
    if (!native) openWithAppFallback(target.app, target.web);
  } else {
    openExternal(target.web);
  }
  return { ok: true, message: `${app} ochildi${query ? `: ${query}` : ""}` };
}

// ── Main dispatcher ───────────────────────────────────────────────────────────

export async function runToolCalls(
  calls: Array<{ name: string; args: any }>,
): Promise<ToolResult[]> {
  const results: ToolResult[] = [];

  for (const call of calls) {
    try {
      let result: ToolResult;
      switch (call.name) {
        case "open_url":        result = await handleOpenUrl(call.args); break;
        case "youtube_action":  result = await handleYoutubeAction(call.args); break;
        case "instagram_dm":    result = await handleInstagramDm(call.args); break;
        case "telegram_action": result = await handleTelegramAction(call.args); break;
        case "call_contact":    result = await handleCallContact(call.args); break;
        case "send_sms":        result = await handleSendSms(call.args); break;
        case "open_app":        result = await handleOpenApp(call.args); break;
        // generate_image is handled server-side via SSE
        case "generate_image":  result = { ok: true }; break;
        default:
          result = { ok: false, error: `Noma'lum tool: ${call.name}` };
      }

      if (result.ok && result.message) toast.success(result.message);
      else if (result.error) toast.error(result.error);
      results.push(result);
    } catch (e: any) {
      toast.error(e.message);
      results.push({ ok: false, error: e.message });
    }
  }

  return results;
}
