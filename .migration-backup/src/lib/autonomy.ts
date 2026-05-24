// MV AI v6.5 — Autonomy bridge. Web + Capacitor native intent execution
// with confirmations and contact picker support.
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
  query?: string;
}

async function nativeOpen(url: string): Promise<boolean> {
  try {
    const cap = (window as any).Capacitor;
    if (cap?.Plugins?.Browser?.open) {
      await cap.Plugins.Browser.open({ url });
      return true;
    }
    if (cap?.Plugins?.App?.openUrl) {
      await cap.Plugins.App.openUrl({ url });
      return true;
    }
  } catch {}
  return false;
}

async function pickContacts(query?: string) {
  const nav: any = navigator;
  if (!nav?.contacts?.select) {
    toast.error("Contact picker not supported", { description: "Use Chrome on Android, or pick the number manually." });
    return;
  }
  try {
    const props = ["name", "tel"];
    const results = await nav.contacts.select(props, { multiple: true });
    if (!results?.length) return;
    const filtered = query
      ? results.filter((c: any) => (c.name || []).some((n: string) => n.toLowerCase().includes(query.toLowerCase())))
      : results;
    const summary = filtered.slice(0, 5).map((c: any) => `${c.name?.[0] || "?"} — ${c.tel?.[0] || ""}`).join("\n");
    toast.success("Contacts", { description: summary || "No matches" });
  } catch (e: any) {
    toast.error("Contact pick failed", { description: e?.message });
  }
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
        duration: 12000,
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
      if (intent.requiresConfirm && !(await confirmIfNeeded())) return;
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
    case "contacts_picker": {
      await pickContacts(intent.query);
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
