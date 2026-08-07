import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  userEmail: string | null;
  login: (email: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  isFirstAccess: boolean;
  ready: boolean;
  setupPassword: (email: string, password: string) => { success: boolean; message: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTHORIZED_EMAIL = "vinicius.vpc@gmail.com";
const STORAGE_KEYS = {
  CREDENTIALS: "templar_auth_credentials",
  SESSION: "templar_auth_session",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isFirstAccess, setIsFirstAccess] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const storedCredentials = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
      const session = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (storedCredentials) setIsFirstAccess(false);
      if (session) {
        const sessionData = JSON.parse(session) as { email?: string };
        if (sessionData.email === AUTHORIZED_EMAIL) {
          setIsAuthenticated(true);
          setUserEmail(sessionData.email);
        }
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const setupPassword = (email: string, password: string) => {
    if (email.trim().toLowerCase() !== AUTHORIZED_EMAIL)
      return { success: false, message: "E-mail não autorizado." };
    if (password.length < 6)
      return { success: false, message: "A senha deve ter no mínimo 6 caracteres." };
    const credentials = { email: AUTHORIZED_EMAIL, password: btoa(password) };
    localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(credentials));
    localStorage.setItem(
      STORAGE_KEYS.SESSION,
      JSON.stringify({ email: AUTHORIZED_EMAIL, timestamp: Date.now() }),
    );
    setIsFirstAccess(false);
    setIsAuthenticated(true);
    setUserEmail(AUTHORIZED_EMAIL);
    return { success: true, message: "Senha definida com sucesso!" };
  };

  const login = (email: string, password: string) => {
    const stored = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
    if (!stored) return { success: false, message: "Nenhuma senha cadastrada." };
    const credentials = JSON.parse(stored) as { password: string };
    if (email.trim().toLowerCase() !== AUTHORIZED_EMAIL)
      return { success: false, message: "E-mail não autorizado." };
    if (btoa(password) !== credentials.password)
      return { success: false, message: "Senha incorreta." };
    localStorage.setItem(
      STORAGE_KEYS.SESSION,
      JSON.stringify({ email: AUTHORIZED_EMAIL, timestamp: Date.now() }),
    );
    setIsAuthenticated(true);
    setUserEmail(AUTHORIZED_EMAIL);
    return { success: true, message: "Login realizado!" };
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    setIsAuthenticated(false);
    setUserEmail(null);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, userEmail, login, logout, isFirstAccess, setupPassword, ready }}
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
