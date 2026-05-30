import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, SignIn } from "@clerk/react";
import { motion } from "framer-motion";
import { BrandMark } from "@/components/BrandMark";
import { Sparkles, Zap, Globe, Brain } from "lucide-react";

const CLERK_APPEARANCE = {
  variables: {
    colorPrimary: "#8b5cf6",
    colorBackground: "#0c0a1a",
    colorInputBackground: "#16122e",
    colorText: "#f0ece0",
    colorTextSecondary: "#8a87a8",
    colorInputText: "#f0ece0",
    colorShimmer: "#4c1d95",
    borderRadius: "14px",
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
    fontSize: "15px",
  },
  elements: {
    rootBox: "w-full",
    card: "!bg-transparent !shadow-none !border-none w-full !p-0",
    headerTitle: "!font-bold !text-2xl !tracking-tight !text-white",
    headerSubtitle: "!text-[#8a87a8] !text-sm",
    socialButtonsBlockButton:
      "!border !border-white/10 hover:!bg-white/5 !rounded-xl !font-medium !text-white !transition-colors",
    socialButtonsBlockButtonText: "!text-white/90 !font-medium",
    socialButtonsBlockButtonArrow: "!text-white/50",
    formButtonPrimary:
      "!bg-violet-600 hover:!bg-violet-500 !text-white !rounded-xl !font-semibold !transition-all !shadow-lg",
    formFieldInput:
      "!bg-white/5 !border !border-white/10 !rounded-xl !text-white placeholder:!text-white/30 focus:!border-violet-500 !transition-colors",
    formFieldLabel: "!text-white/70 !font-medium !text-sm",
    formFieldInputShowPasswordButton: "!text-white/40 hover:!text-white/70",
    footerActionLink: "!text-violet-400 hover:!text-violet-300 !font-semibold",
    footerActionText: "!text-white/40",
    dividerLine: "!bg-white/10",
    dividerText: "!text-white/30 !text-xs",
    identityPreviewText: "!text-white/80",
    identityPreviewEditButton: "!text-violet-400",
    otpCodeFieldInput:
      "!bg-white/5 !border !border-white/10 !rounded-xl !text-white focus:!border-violet-500",
    alertText: "!text-white/80",
    alternativeMethodsBlockButton:
      "!border !border-white/10 hover:!bg-white/5 !rounded-xl !text-white/80",
    badge: "!bg-violet-900/50 !text-violet-300",
    navbar: "!hidden",
    navbarMobileMenuButton: "!hidden",
    pageScrollBox: "!p-0",
    main: "!gap-4",
    form: "!gap-4",
    formFields: "!gap-3",
  },
};

const FEATURES = [
  { icon: Brain,     label: "Nemotron 120B",   desc: "Nvidia's most powerful free AI" },
  { icon: Sparkles,  label: "Visual responses",desc: "Charts, images & rich answers" },
  { icon: Zap,       label: "Real-time stream", desc: "Instant token-by-token output" },
  { icon: Globe,     label: "MCP tools",        desc: "YouTube, Instagram, Telegram…" },
];

export default function Auth() {
  const { isSignedIn, isLoaded } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && isSignedIn) navigate("/chat", { replace: true });
  }, [isSignedIn, isLoaded, navigate]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c0a1a]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="size-10 rounded-full border-2 border-violet-600 border-t-transparent"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex overflow-hidden bg-[#0c0a1a]">
      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col items-center justify-center p-14 overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 30% 40%, hsl(268 80% 25% / 0.6) 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, hsl(320 70% 20% / 0.4) 0%, transparent 55%), #0a0816" }}
        />
        <div className="absolute inset-0 dot-grid-fade opacity-15" />

        {/* Animated glow orbs */}
        <motion.div
          className="absolute top-1/4 left-1/3 size-72 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, hsl(268 92% 68% / 0.22) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.15, 1], x: [-10, 10, -10] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 size-52 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, hsl(320 90% 65% / 0.18) 0%, transparent 70%)" }}
          animate={{ scale: [1.1, 1, 1.1], y: [8, -8, 8] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        <div className="relative z-10 w-full max-w-md">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <BrandMark size={52} />
              <div>
                <div className="font-display text-4xl text-white tracking-tight">MV AI</div>
                <div className="text-sm text-violet-400/80 font-medium">v5 · Nemotron Edition</div>
              </div>
            </div>
            <p className="text-white/60 text-lg leading-relaxed">
              Not a chatbot.<br />
              <span className="text-white font-semibold">A living AI cockpit.</span>
            </p>
          </motion.div>

          {/* Feature cards */}
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="relative overflow-hidden rounded-2xl p-4"
                style={{
                  background: "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(255,255,255,0.04) 100%)",
                  border: "1px solid rgba(139,92,246,0.2)",
                }}
              >
                <div className="absolute top-0 right-0 w-16 h-16 rounded-full"
                  style={{ background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)" }} />
                <f.icon className="size-5 text-violet-400 mb-2.5" />
                <div className="text-sm font-semibold text-white">{f.label}</div>
                <div className="text-xs text-white/40 mt-0.5 leading-snug">{f.desc}</div>
              </motion.div>
            ))}
          </div>

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-10 text-xs text-white/25 text-center"
          >
            Powered by Nvidia Nemotron · OpenRouter · Pollinations
          </motion.div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Clerk form ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {/* Mobile brand */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex lg:hidden items-center gap-2 mb-8"
        >
          <BrandMark size={36} />
          <span className="font-display text-2xl text-white">MV AI</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <SignIn
            routing="hash"
            forceRedirectUrl="/chat"
            afterSignInUrl="/chat"
            afterSignUpUrl="/chat"
            appearance={CLERK_APPEARANCE}
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-xs text-white/20 text-center"
        >
          By signing in you agree to our terms of service
        </motion.p>
      </div>
    </div>
  );
}
