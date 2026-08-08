import { Component, type ErrorInfo, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Impede que uma falha isolada (ex.: erro em uma sugestão de IA) derrube
 * o app inteiro na tela "Esta página não carregou".
 */
export class ErrorBoundary extends Component<
  { children: ReactNode; titulo?: string },
  { erro: boolean }
> {
  state = { erro: false };

  static getDerivedStateFromError() {
    return { erro: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Falha capturada:", error, info.componentStack);
    toast.error("Ocorreu um erro nesta seção. Seus dados foram preservados.");
  }

  render() {
    if (!this.state.erro) return this.props.children;
    return (
      <div className="space-y-3 rounded-xl border border-destructive/40 bg-card p-6 text-center">
        <p className="text-sm font-medium text-foreground">
          {this.props.titulo ?? "Não foi possível exibir esta seção."}
        </p>
        <Button variant="outline" onClick={() => this.setState({ erro: false })}>
          Tentar novamente
        </Button>
      </div>
    );
  }
}
