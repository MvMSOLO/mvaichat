import { ClerkProvider, useAuth as useClerkAuth, RedirectToSignIn } from "@clerk/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { MagneticCursor } from "@/components/MagneticCursor";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import Studio from "./pages/Studio";
import NotFound from "./pages/NotFound";
import SkillsPage from "./pages/SkillsPage";
import GitHubPage from "./pages/GitHubPage";

const queryClient = new QueryClient();

function Protected({ children }: { children: React.ReactElement }) {
  const { isSignedIn, isLoaded } = useClerkAuth();
  if (!isLoaded) return <AppLoader />;
  if (!isSignedIn) return <RedirectToSignIn />;
  return children;
}

function AuthRoute() {
  const { isSignedIn, isLoaded } = useClerkAuth();
  if (!isLoaded) return <AppLoader />;
  if (isSignedIn) return <Navigate to="/chat" replace />;
  return <Auth />;
}

function AppLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        className="size-10 rounded-full border-2 border-primary border-t-transparent"
      />
    </div>
  );
}

function ThemeInit() {
  useTheme();
  return null;
}

const App = () => {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ThemeInit />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <MagneticCursor />
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<AuthRoute />} />
                <Route path="/reset-password" element={<Navigate to="/auth" replace />} />
                <Route path="/chat" element={<Protected><Chat /></Protected>} />
                <Route path="/settings" element={<Protected><Settings /></Protected>} />
                <Route path="/skills" element={<Protected><SkillsPage /></Protected>} />
                <Route path="/github" element={<Protected><GitHubPage /></Protected>} />
                <Route path="/studio" element={<Studio />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
};

export default App;
