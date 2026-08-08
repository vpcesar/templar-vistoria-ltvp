import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { loginServidor, logoutServidor, sessaoServidor } from "@/lib/gate.functions";

interface AuthContextType {
  isAuthenticated: boolean;
  userEmail: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  ready: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let ativo = true;
    sessaoServidor()
      .then((r) => {
        if (ativo) setUserEmail(r.email ?? null);
      })
      .catch(() => {
        if (ativo) setUserEmail(null);
      })
      .finally(() => {
        if (ativo) setReady(true);
      });
    return () => {
      ativo = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await loginServidor({ data: { email, password } });
      if (result.success) setUserEmail(email.trim().toLowerCase());
      return { success: result.success, message: result.message };
    } catch {
      return { success: false, message: "Não foi possível validar as credenciais." };
    }
  };

  const logout = () => {
    void logoutServidor().catch(() => undefined);
    setUserEmail(null);
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
