import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

interface AuthContextType {
  isAuthenticated: boolean;
  userEmail: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  ready: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let ativo = true;
    let revision = 0;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!["SIGNED_IN", "SIGNED_OUT", "USER_UPDATED", "PASSWORD_RECOVERY"].includes(event)) return;
      const current = ++revision;
      if (event === "PASSWORD_RECOVERY") sessionStorage.setItem("templar_recovery", "true");
      if (event === "SIGNED_OUT") {
        setUserEmail(null);
        setReady(true);
        void router.invalidate();
        return;
      }
      // Run validation outside the auth callback to avoid an SDK lock deadlock.
      setTimeout(() => {
        void supabase.auth.getUser().then(({ data }) => {
          if (!ativo || revision !== current) return;
          setUserEmail(data.user?.email ?? null);
          setReady(true);
          void router.invalidate();
          void queryClient.invalidateQueries();
        });
      }, 0);
    });
    const initialRevision = revision;
    void supabase.auth.getUser().then(({ data }) => {
      if (ativo && revision === initialRevision) {
        setUserEmail(data.user?.email ?? null);
        setReady(true);
      }
    }).catch(() => { if (ativo) setReady(true); });
    return () => {
      ativo = false;
      subscription.unsubscribe();
    };
  }, [queryClient, router]);

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) return { success: false, message: error.code === "email_not_confirmed" ? "Confirme seu e-mail antes de entrar." : "E-mail ou senha inválidos." };
      const { data, error: validationError } = await supabase.auth.getUser();
      if (validationError || !data.user) return { success: false, message: "Não foi possível validar sua sessão." };
      setUserEmail(data.user.email ?? null);
      return { success: true, message: "Login realizado!" };
    } catch {
      return { success: false, message: "Não foi possível validar as credenciais." };
    }
  };

  const logout = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUserEmail(null);
    await router.navigate({ to: "/auth", replace: true });
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated: userEmail !== null, userEmail, login, logout, ready }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
}
