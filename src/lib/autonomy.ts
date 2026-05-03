// MV AI v6 — Autonomy bridge: executes intents returned by tools-executor on
// the client (web + Capacitor native). Asks user confirm for sensitive ops.
import { toast } from "sonner";

export interface Intent {
  ok?: boolean;
  action?: string;
  url?: string;
  deep?: string;
  web?: string;
  app?: string;
  message?: string;
  requiresConfirm?: boolean;
  provider?: string;
  error?: string;
  name?: string;
}

async function nativeOpen(url: string): Promise<boolean> {
  // Capacitor Browser API if available
  try {
    const cap = (window as any).Capacitor;
    if (cap?.Plugins?.Browser?.open) {
      await cap.Plugins.Browser.open({ url });
      return true;
    }
  } catch {}
  return false;
}

export async function executeIntent(intent: Intent): Promise<void> {
  if (!intent.ok) {
    if (intent.action === "needs_auth") {
      toast.error(intent.message || `Connect ${intent.provider} first`, {
        action: { label: "Settings", onClick: () => (window.location.href = "/settings") },
      });
      return;
    }
    if (intent.error) toast.error(intent.error);
    return;
  }

  const confirmIfNeeded = async () => {
    if (!intent.requiresConfirm) return true;
    return new Promise<boolean>((resolve) => {
      toast(intent.message || "Confirm action?", {
        action: { label: "Approve", onClick: () => resolve(true) },
        cancel: { label: "Cancel", onClick: () => resolve(false) },
        duration: 10000,
        onAutoClose: () => resolve(false),
      });
    });
  };

  switch (intent.action) {
    case "open_url": {
      if (!intent.url) return;
      if (!(await nativeOpen(intent.url))) window.open(intent.url, "_blank", "noopener,noreferrer");
      break;
    }
    case "open_app": {
      const target = intent.deep || intent.web;
      if (!target) return;
      // Try deep first via location, fallback web
      if (intent.deep) {
        const t = setTimeout(() => intent.web && window.open(intent.web, "_blank", "noopener,noreferrer"), 800);
        try { window.location.href = intent.deep; } catch { clearTimeout(t); intent.web && window.open(intent.web, "_blank"); }
      } else {
        window.open(intent.web!, "_blank", "noopener,noreferrer");
      }
      break;
    }
    case "call":
    case "sms":
    case "email": {
      if (!intent.url) return;
      if (intent.action !== "email" && !(await confirmIfNeeded())) return;
      window.location.href = intent.url;
      break;
    }
  }
}

export async function runToolCalls(calls: Array<{ name: string; args: any }>) {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tools-executor`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
    body: JSON.stringify({ calls }),
  });
  const j = await r.json();
  const results: Intent[] = j?.results || [];
  for (const r of results) await executeIntent(r);
  return results;
}
