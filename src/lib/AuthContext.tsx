import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { register, login, getSession, clearSession, type AuthUser } from "./auth";

interface AuthCtx {
  user: AuthUser | null;
  signUp: (name: string, email: string, password: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getSession());

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const result = register(name, email, password);
    if ("error" in result) return { error: result.error };
    setUser(result.user);
    return {};
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = login(email, password);
    if ("error" in result) return { error: result.error };
    setUser(result.user);
    return {};
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  return (
    <Ctx.Provider value={{ user, signUp, signIn, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
