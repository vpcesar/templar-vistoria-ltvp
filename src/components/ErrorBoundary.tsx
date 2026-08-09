import { Component, type ErrorInfo, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Impede que uma falha isolada (ex.: erro em uma sugestão de IA) derrube
 * o app inteiro na tela "Esta página não carregou".
 */
export class ErrorBoundary extends Component<
  { children: ReactNode; titulo?: string },
  { erro: boolean; mensagem: string | null }
> {
  override state = { erro: false, mensagem: null as string | null };

  static getDerivedStateFromError(error: Error) {
    return { erro: true, mensagem: error?.message ?? null };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Falha capturada:", error, info.componentStack);
    toast.error("Ocorreu um erro nesta seção. Seus dados foram preservados.");
  }

  override render() {
    if (!this.state.erro) return this.props.children;
    return (
      <div className="space-y-3 rounded-xl border border-destructive/40 bg-card p-6 text-center">
        <p className="text-sm font-medium text-foreground">
          {this.props.titulo ?? "Não foi possível exibir esta seção."}
        </p>
        {this.state.mensagem && (
          <p className="text-xs text-muted-foreground">Detalhe: {this.state.mensagem}</p>
        )}
        <Button
          variant="outline"
          type="button"
          onClick={() => this.setState({ erro: false, mensagem: null })}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }
}

