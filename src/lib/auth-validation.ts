export function passwordProblem(password: string, confirmation: string): string | null {
  if (password.length < 8) return "Use uma senha com pelo menos 8 caracteres.";
  if (password !== confirmation) return "As senhas não coincidem.";
  return null;
}