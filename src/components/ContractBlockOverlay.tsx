import { Lock, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface ContractBlockOverlayProps {
  /** Tipo de ação bloqueada */
  action: "upload" | "download";
  /** Classes adicionais */
  className?: string;
}

const RENEW_ROUTE = "/franqueado/perfil";

const actionMessages = {
  upload: {
    title: "Envio de arquivos bloqueado",
    description: "Seu contrato está vencido. Renove para continuar enviando arquivos.",
  },
  download: {
    title: "Download bloqueado",
    description: "Seu contrato está vencido. Renove para fazer download dos arquivos.",
  },
};

/**
 * Overlay de bloqueio exibido quando o contrato está vencido
 */
export function ContractBlockOverlay({ action, className = "" }: ContractBlockOverlayProps) {
  const messages = actionMessages[action];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`absolute inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm rounded-xl ${className}`}
    >
      <div className="text-center p-8 max-w-md">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <Lock className="h-8 w-8 text-destructive" />
        </div>
        
        <div className="flex items-center justify-center gap-2 mb-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h3 className="text-lg font-semibold text-destructive">{messages.title}</h3>
        </div>
        
        <p className="text-muted-foreground mb-6">{messages.description}</p>
        
        <Link to={RENEW_ROUTE}>
          <Button variant="destructive" className="gap-2">
            Renovar contrato agora
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

/**
 * Badge de aviso para botões bloqueados
 */
export function ContractBlockBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-destructive">
      <Lock className="h-3 w-3" />
      Contrato vencido
    </span>
  );
}
