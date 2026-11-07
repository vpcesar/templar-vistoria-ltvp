import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { TemplarLogo } from "@/components/TemplarLogo";
import { passwordProblem } from "@/lib/auth-validation";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Redefinir senha | TEMPLAR ENGENHARIA" },
    { name: "description", content: "Redefina a senha da sua conta Templar Engenharia com segurança." },
    { property: "og:title", content: "Redefinir senha | TEMPLAR ENGENHARIA" },
    { property: "og:description", content: "Recuperação de acesso ao ERP Templar Engenharia." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [valid, setValid] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.hash.slice(1));
    const recovery = params.get("type") === "recovery" || sessionStorage.getItem("templar_recovery") === "true";
    void supabase.auth.getUser().then(({ data }) => {
      if (active) { setValid(recovery && !!data.user); setChecking(false); }
    }).catch(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const problem = passwordProblem(password, confirmation);
    if (problem) { setError(problem); return; }
    setError(""); setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) setError("Não foi possível atualizar a senha. Solicite um novo link ou escolha outra senha.");
      else { sessionStorage.removeItem("templar_recovery"); setPassword(""); setConfirmation(""); setDone(true); }
    } catch { setError("Não foi possível conectar. Tente novamente."); }
    finally { setSaving(false); }
  };
  return <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10"><div className="w-full max-w-md">
    <div className="mb-8 flex justify-center"><TemplarLogo size="lg" stacked /></div>
    <div className="rounded-lg border border-border bg-card p-6 shadow-card">
      <h1 className="mb-5 text-xl font-bold">Redefinir senha</h1>
      {checking ? <p role="status">Validando link...</p> : done ? <><p role="status" className="mb-4">Senha atualizada com sucesso.</p><Button onClick={() => navigate({ to: "/", replace: true })}>Abrir ERP</Button></> : !valid ? <><p role="alert" className="mb-4 text-sm text-muted-foreground">Este link é inválido ou expirou. Solicite um novo link de recuperação.</p><Button onClick={() => navigate({ to: "/auth", replace: true })}>Voltar para entrar</Button></> : <form onSubmit={submit} className="space-y-4">
        <div><label htmlFor="new-password" className="mb-1 block text-sm font-medium">Nova senha</label><input id="new-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-md border border-input bg-background p-3" /></div>
        <div><label htmlFor="confirm-password" className="mb-1 block text-sm font-medium">Confirmar senha</label><input id="confirm-password" type="password" autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} className="w-full rounded-md border border-input bg-background p-3" /></div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={saving} className="h-11 w-full">{saving ? "Salvando..." : "Salvar nova senha"}</Button>
      </form>}
    </div>
  </div></div>;
}