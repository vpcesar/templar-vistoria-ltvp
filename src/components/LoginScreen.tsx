import { useState, type FormEvent } from "react";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { TemplarLogo } from "@/components/TemplarLogo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { passwordProblem } from "@/lib/auth-validation";

export default function LoginScreen() {
  const { login, isAuthenticated, userEmail, logout } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const changeMode = (next: typeof mode) => { setMode(next); setError(""); setNotice(""); setPassword(""); setConfirmation(""); };
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError(""); setNotice(""); setLoading(true);
    try {
      if (mode === "signin") {
        const result = await login(email, password);
        if (!result.success) setError(result.message);
        else await navigate({ to: "/", replace: true });
      } else if (mode === "signup") {
        const problem = passwordProblem(password, confirmation);
        if (problem) { setError(problem); return; }
        const { data, error: signupError } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin } });
        if (signupError) { setError(signupError.code === "over_email_send_rate_limit" ? "Muitos e-mails solicitados. Aguarde e tente novamente." : "Não foi possível criar a conta. Verifique o e-mail e os requisitos da senha."); return; }
        setPassword(""); setConfirmation("");
        if (data.session) await navigate({ to: "/", replace: true });
        else setNotice("Confira seu e-mail e clique no link para confirmar sua conta antes de entrar.");
      } else {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
        if (resetError) setError("Não foi possível enviar o e-mail. Aguarde e tente novamente.");
        else setNotice("Se houver uma conta com esse e-mail, você receberá um link para redefinir a senha.");
      }
    } catch { setError("Não foi possível conectar. Tente novamente."); }
    finally { setLoading(false); }
  };
  const social = async (provider: "google") => {
    setError(""); setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
      if (result.error) setError("Não foi possível entrar. Tente novamente.");
      else if (!result.redirected) await navigate({ to: "/", replace: true });
    } catch { setError("Não foi possível conectar. Tente novamente."); }
    finally { setLoading(false); }
  };
  const inputCls = "w-full rounded-md border border-input bg-background py-3 pl-11 pr-11 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30";
  if (isAuthenticated) return <div className="flex min-h-screen items-center justify-center bg-surface px-4"><div className="w-full max-w-md space-y-5 rounded-lg border border-border bg-card p-6 text-center shadow-card">
    <TemplarLogo size="lg" stacked />
    <h1 className="text-xl font-bold">Conta conectada</h1>
    <p className="break-all text-sm text-muted-foreground">{userEmail}</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button className="w-full" onClick={() => navigate({ to: "/", replace: true })}>Abrir ERP</Button>
    <Button variant="outline" className="w-full" onClick={() => { void logout().catch(() => setError("Não foi possível sair. Tente novamente.")); }}>Sair</Button>
  </div></div>;
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><TemplarLogo size="lg" stacked /></div>
        <div className="rounded-lg border border-border bg-card p-6 shadow-card sm:p-8">
          <h1 className="text-xl font-bold text-foreground">{mode === "signup" ? "Criar conta" : mode === "forgot" ? "Recuperar senha" : "Entrar no ERP"}</h1>
          {mode !== "forgot" && <div className="mt-5 grid grid-cols-2 gap-2">
            <Button variant={mode === "signin" ? "secondary" : "ghost"} disabled={loading} onClick={() => changeMode("signin")}>Entrar</Button>
            <Button variant={mode === "signup" ? "secondary" : "ghost"} disabled={loading} onClick={() => changeMode("signup")}>Criar conta</Button>
          </div>}
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div><label htmlFor="auth-email" className="mb-1 block text-sm font-medium">E-mail</label><div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input id="auth-email" type="email" required autoComplete="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} disabled={loading} />
            </div></div>
            {mode !== "forgot" && <div><label htmlFor="auth-password" className="mb-1 block text-sm font-medium">Senha</label><div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input id="auth-password" type={showPassword ? "text" : "password"} required minLength={mode === "signup" ? 8 : undefined} autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder={mode === "signup" ? "Pelo menos 8 caracteres" : "Sua senha"} value={password} onChange={e => setPassword(e.target.value)} className={inputCls} disabled={loading} />
              <Button type="button" variant="ghost" size="icon" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} className="absolute right-1 top-1/2 -translate-y-1/2">{showPassword ? <EyeOff /> : <Eye />}</Button>
            </div></div>}
            {mode === "signup" && <div><label htmlFor="auth-confirm" className="mb-1 block text-sm font-medium">Confirmar senha</label><input id="auth-confirm" type="password" required autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-3 text-sm" disabled={loading} /></div>}
            {error && <div role="alert" className="flex gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
            {notice && <p role="status" className="rounded-md bg-success/10 p-3 text-sm text-foreground">{notice}</p>}
            <Button type="submit" className="h-11 w-full" disabled={loading}>{loading && <Loader2 className="h-4 w-4 animate-spin" />}{mode === "signup" ? "Cadastrar" : mode === "forgot" ? "Enviar link de recuperação" : "Entrar"}</Button>
          </form>
          {mode !== "forgot" ? <>
            <Button variant="ghost" className="mt-2 w-full text-sm" disabled={loading} onClick={() => changeMode("forgot")}>Esqueci minha senha</Button>
            <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />ou<span className="h-px flex-1 bg-border" /></div>
            <div className="space-y-3">
              <Button variant="outline" className="google-auth-button h-11 w-full" disabled={loading} onClick={() => social("google")}>
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-[18px]"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
                Continuar com Google
              </Button>
            </div>
          </> : <Button variant="ghost" className="mt-3 w-full" disabled={loading} onClick={() => changeMode("signin")}>Voltar para entrar</Button>}
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
