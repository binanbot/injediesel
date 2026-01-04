import { AlertTriangle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { differenceInDays } from "date-fns";

interface ContractAlertProps {
  /** Data de vencimento do contrato (ISO string ou Date) */
  expirationDate: string | Date;
  /** Variante de exibição */
  variant?: "banner" | "compact" | "inline";
  /** Mostrar animação de entrada */
  animate?: boolean;
  /** Classes adicionais */
  className?: string;
}

/**
 * Calcula os dias restantes até o vencimento
 */
function getDaysRemaining(expirationDate: string | Date): number {
  const expDate = typeof expirationDate === "string" 
    ? new Date(expirationDate) 
    : expirationDate;
  return differenceInDays(expDate, new Date());
}

/**
 * Retorna configuração visual baseada nos dias restantes
 */
function getUrgencyConfig(daysRemaining: number) {
  if (daysRemaining <= 0) {
    return {
      badgeClass: "bg-destructive text-destructive-foreground border-destructive animate-pulse",
      borderClass: "border-destructive/40",
      bgClass: "bg-destructive/10",
      label: "Vencido",
      urgent: true,
    };
  }
  if (daysRemaining <= 7) {
    return {
      badgeClass: "bg-destructive/20 text-destructive border-destructive/40",
      borderClass: "border-destructive/30",
      bgClass: "bg-destructive/5",
      label: `${daysRemaining} ${daysRemaining === 1 ? "dia" : "dias"}`,
      urgent: true,
    };
  }
  if (daysRemaining <= 30) {
    return {
      badgeClass: "bg-amber-500/20 text-amber-400 border-amber-500/40",
      borderClass: "border-warning/30",
      bgClass: "bg-warning/5",
      label: `${daysRemaining} dias`,
      urgent: false,
    };
  }
  return {
    badgeClass: "bg-muted text-muted-foreground border-border",
    borderClass: "border-border",
    bgClass: "bg-muted/10",
    label: `${daysRemaining} dias`,
    urgent: false,
  };
}

const RENEW_ROUTE = "/franqueado/perfil";

export function ContractAlert({
  expirationDate,
  variant = "banner",
  animate = true,
  className = "",
}: ContractAlertProps) {
  const daysRemaining = getDaysRemaining(expirationDate);
  const config = getUrgencyConfig(daysRemaining);

  // Não mostrar se falta mais de 30 dias
  if (daysRemaining > 30) return null;

  const Wrapper = animate ? motion.div : "div";
  const wrapperProps = animate
    ? { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }
    : {};

  if (variant === "compact") {
    return (
      <Link to={RENEW_ROUTE}>
        <Badge 
          variant="outline" 
          className={`${config.badgeClass} cursor-pointer hover:opacity-80 transition-opacity ${className}`}
        >
          <Clock className="h-3 w-3 mr-1" />
          Contrato: {config.label}
        </Badge>
      </Link>
    );
  }

  if (variant === "inline") {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <AlertTriangle className="h-4 w-4 text-warning" />
        <span className="text-warning font-medium">Contrato vence em</span>
        <Badge variant="outline" className={config.badgeClass}>
          {config.label}
        </Badge>
        <Link to={RENEW_ROUTE}>
          <Button variant="link" size="sm" className="h-auto p-0 text-primary">
            Renovar agora →
          </Button>
        </Link>
      </div>
    );
  }

  // Banner (default)
  return (
    <Wrapper
      {...wrapperProps}
      className={`p-4 rounded-xl ${config.bgClass} border ${config.borderClass} flex items-start gap-3 ${className}`}
    >
      <AlertTriangle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${config.urgent ? "text-destructive" : "text-warning"}`} />
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`font-medium ${config.urgent ? "text-destructive" : "text-warning"}`}>
            Contrato próximo do vencimento
          </p>
          <Badge variant="outline" className={config.badgeClass}>
            <Clock className="h-3 w-3 mr-1" />
            Faltam {config.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {daysRemaining <= 0 
            ? "Seu contrato está vencido. Renove agora para continuar utilizando o sistema."
            : "Renove agora para continuar utilizando o sistema sem interrupções."
          }
        </p>
      </div>
      <Link to={RENEW_ROUTE}>
        <Button 
          variant={config.urgent ? "destructive" : "warning"} 
          size="sm"
          className={config.urgent ? "animate-pulse" : ""}
        >
          Renovar agora
        </Button>
      </Link>
    </Wrapper>
  );
}

export { getDaysRemaining, getUrgencyConfig };
