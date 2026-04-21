import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Ozing } from "@/components/Ozing";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  useEffect(() => {
    console.error("404:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen relative grid place-items-center p-6">
      <div className="fixed inset-0 aurora-bg pointer-events-none" />
      <div className="relative z-10 text-center glass-strong rounded-3xl p-10 max-w-md">
        <Ozing mood="confused" size={140} />
        <h1 className="font-display text-6xl font-extrabold text-gradient mt-4">404</h1>
        <p className="text-muted-foreground my-3">Ozing can't find this page.</p>
        <Link to="/"><Button className="rounded-full">Go home</Button></Link>
      </div>
    </div>
  );
};
export default NotFound;
