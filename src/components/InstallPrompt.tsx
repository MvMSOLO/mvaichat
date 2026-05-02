import { motion } from "framer-motion";
import { Download, Smartphone, Monitor, Check, Apple } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useState } from "react";

export function InstallPrompt() {
  const { canInstall, installed, isIOS, install } = usePWAInstall();
  const [showIOS, setShowIOS] = useState(false);

  if (installed) {
    return (
      <div className="glass rounded-2xl p-5 flex items-center gap-3">
        <div className="size-10 rounded-xl bg-emerald-500/15 grid place-items-center">
          <Check className="size-5 text-emerald-400" />
        </div>
        <div>
          <div className="font-semibold text-sm">App installed</div>
          <div className="text-xs text-foreground/60">MV AI is running as a native app.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center">
          <Download className="size-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm">Install MV AI</div>
          <div className="text-xs text-foreground/60">Run as a real app. Auto-updates. Works offline-friendly.</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-foreground/10 p-3 text-center">
          <Smartphone className="size-4 mx-auto mb-1 text-cyan-300" />
          <div className="text-[10px] uppercase tracking-wider text-foreground/50">Mobile</div>
        </div>
        <div className="rounded-xl border border-foreground/10 p-3 text-center">
          <Monitor className="size-4 mx-auto mb-1 text-violet-300" />
          <div className="text-[10px] uppercase tracking-wider text-foreground/50">Desktop</div>
        </div>
      </div>

      {isIOS ? (
        <>
          <Button onClick={() => setShowIOS((s) => !s)} className="w-full rounded-xl bg-ink text-ink-foreground hover:bg-ink/90">
            <Apple className="size-4 mr-2" /> Add to Home Screen
          </Button>
          {showIOS && (
            <motion.ol
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="text-xs text-foreground/70 space-y-1.5 list-decimal pl-5"
            >
              <li>Tap the <strong>Share</strong> button in Safari.</li>
              <li>Choose <strong>Add to Home Screen</strong>.</li>
              <li>Confirm — MV AI launches like a native app.</li>
            </motion.ol>
          )}
        </>
      ) : canInstall ? (
        <Button onClick={install} className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:opacity-90 shine">
          <Download className="size-4 mr-2" /> Install now
        </Button>
      ) : (
        <div className="text-xs text-foreground/60 leading-relaxed">
          On Chrome/Edge open the address bar menu → <strong>Install MV AI</strong>.<br />
          On Android use Chrome's <strong>Add to Home Screen</strong>.
        </div>
      )}
    </div>
  );
}
