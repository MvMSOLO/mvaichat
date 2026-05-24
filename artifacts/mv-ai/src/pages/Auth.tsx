import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, SignIn } from "@clerk/react";

export default function Auth() {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSignedIn) navigate("/chat", { replace: true });
  }, [isSignedIn, navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <div className="fixed inset-0 mesh-bg pointer-events-none" />
      <div className="fixed inset-0 aurora-bg pointer-events-none opacity-70" />
      <div className="fixed inset-0 dot-grid-fade pointer-events-none opacity-40" />
      <div className="relative z-10">
        <SignIn
          routing="hash"
          afterSignInUrl="/chat"
          afterSignUpUrl="/chat"
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-background/80 backdrop-blur-xl border border-border/60 shadow-2xl rounded-3xl",
            },
          }}
        />
      </div>
    </div>
  );
}
