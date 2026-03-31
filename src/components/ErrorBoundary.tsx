import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  /** Nome do módulo para exibir na mensagem de erro */
  moduleName?: string;
  /** Callback opcional quando um erro é capturado */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Componente de fallback personalizado */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary genérico para capturar erros de renderização React.
 * Use em módulos críticos como Importações, Loja/Checkout, Enviar Arquivo.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary capturou erro:", error, errorInfo);
    
    // Log para monitoramento (em produção, enviar para serviço de logging)
    if (import.meta.env.DEV) {
      console.group("🔴 Error Boundary - Detalhes");
      console.error("Error:", error);
      console.error("Component Stack:", errorInfo.componentStack);
      console.groupEnd();
    }

    this.props.onError?.(error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReport = () => {
    // Redireciona para suporte com informações do erro
    const errorMessage = encodeURIComponent(
      `Erro no módulo ${this.props.moduleName || "Sistema"}: ${this.state.error?.message || "Desconhecido"}`
    );
    window.location.href = `/franqueado/suporte?assunto=${errorMessage}`;
  };

  public render() {
    if (this.state.hasError) {
      // Se foi passado fallback personalizado, usar ele
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-destructive/30 bg-destructive/5">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-xl">Ocorreu um erro</CardTitle>
              <CardDescription className="text-muted-foreground">
                {this.props.moduleName 
                  ? `Houve um problema no módulo "${this.props.moduleName}".`
                  : "Houve um problema ao carregar esta seção."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="p-3 rounded-lg bg-muted text-xs font-mono overflow-auto max-h-32">
                  {this.state.error.message}
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={this.handleReset}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar novamente
                </Button>
                <Button 
                  variant="default"
                  className="flex-1"
                  onClick={this.handleReload}
                >
                  Recarregar página
                </Button>
              </div>
              
              <Button 
                variant="ghost" 
                className="w-full text-muted-foreground"
                onClick={this.handleReport}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Reportar problema
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC para adicionar Error Boundary a um componente
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  moduleName?: string
): React.FC<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || "Component";
  
  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary moduleName={moduleName || displayName}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );
  
  WithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;
  
  return WithErrorBoundary;
}

export default ErrorBoundary;