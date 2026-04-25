import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Ozing } from "@/components/Ozing";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  useEffect(() => { console.error("404:", location.pathname); }, [location.pathname]);

  return (
    <div className="min-h-screen relative grid place-items-center p-6 overflow-hidden">
      <div className="fixed inset-0 mesh-bg pointer-events-none" />
      <div className="fixed inset-0 aurora-bg pointer-events-none opacity-50" />
      <div className="fixed inset-0 dot-grid-fade pointer-events-none opacity-30" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 text-center glass-strong rounded-[2.5rem] p-10 md:p-14 max-w-md shadow-elev"
      >
        <div className="grid place-items-center">
          <Ozing mood="confused" size={160} />
        </div>
        <h1 className="font-display font-black text-7xl md:text-8xl tracking-tighter mt-4">
          <span className="text-gradient">404</span>
        </h1>
        <p className="font-serif italic text-2xl mt-2">Ozing got lost.</p>
        <p className="text-sm text-muted-foreground mt-2">This page doesn't exist — or it ran away.</p>
        <Link to="/" className="inline-block mt-6">
          <Button className="rounded-full bg-ink text-ink-foreground hover:bg-ink/90 h-11 px-6 font-semibold shine">
            <ArrowLeft className="size-4" /> Take me home
          </Button>
        </Link>
      </motion.div>
    </div>
  );
};
export default NotFound;
