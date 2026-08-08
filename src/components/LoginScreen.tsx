import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { TemplarLogo } from "@/components/TemplarLogo";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    if (!result.success) setError(result.message);
    setLoading(false);
  };


  const inputCls =
    "w-full rounded-lg border border-input bg-background py-3 pl-11 pr-11 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/30";

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <TemplarLogo size="lg" stacked />
        </div>

        <div className="rounded-xl border border-border bg-card p-8 shadow-card">
          <h1 className="text-xl font-bold text-foreground">
            {isFirstAccess ? "Primeiro Acesso" : "Login"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isFirstAccess
              ? "Defina sua senha para acessar o sistema."
              : "Acesse com suas credenciais para continuar."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                required
                autoComplete="username"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder={isFirstAccess ? "Mínimo 6 caracteres" : "Sua senha"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {isFirstAccess && (
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Repita a senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputCls}
                />
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-70"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Processando..." : isFirstAccess ? "Definir Senha e Entrar" : "Entrar"}
            </button>
          </form>
        </div>

        <footer className="mt-8 space-y-2 text-center text-xs text-muted-foreground">
          <p>TEMPLAR ENGENHARIA — Vistorias • Inspeções • Laudos • Perícias</p>
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <a
              className="hover:text-primary"
              href="https://www.templarengenharia.com.br"
              target="_blank"
              rel="noreferrer"
            >
              www.templarengenharia.com.br
            </a>
            <span aria-hidden>|</span>
            <a className="hover:text-primary" href="mailto:templarengenharia@hotmail.com">
              templarengenharia@hotmail.com
            </a>
            <span aria-hidden>|</span>
            <a
              className="hover:text-primary"
              href="https://wa.me/5521981808812"
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp (21) 98180-8812
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
