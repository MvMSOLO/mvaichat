import { createContext, useContext, ReactNode } from "react";
import { useUser, useClerk } from "@clerk/react";

interface AuthCtx {
  user: { id: string; email?: string } | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({ user: null, loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  const mapped = user
    ? { id: user.id, email: user.primaryEmailAddress?.emailAddress }
    : null;

  const signOut = async () => {
    await clerkSignOut();
  };

  return (
    <Ctx.Provider value={{ user: mapped, loading: !isLoaded, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
