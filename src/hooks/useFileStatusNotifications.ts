import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { playNotificationSound } from "@/utils/notificationSound";
import { showBrowserNotification } from "@/utils/browserNotifications";

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  processing: "Em Processamento",
  completed: "Concluído",
  cancelled: "Cancelado",
  recall: "Recall Original",
  complex: "Arquivo complexo 48h",
  financial: "Contate o financeiro",
};

export function useFileStatusNotifications() {
  const { toast } = useToast();

  useEffect(() => {
    const channel = supabase
      .channel("file-status-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "received_files",
        },
        (payload) => {
          const oldStatus = (payload.old as any)?.status;
          const newStatus = (payload.new as any)?.status;
          const placa = (payload.new as any)?.placa;

          // Só notifica se o status mudou
          if (oldStatus !== newStatus && newStatus) {
            const statusLabel = statusLabels[newStatus] || newStatus;
            
            // Toast notification
            toast({
              title: "Status do arquivo atualizado",
              description: `O arquivo ${placa} foi marcado como ${statusLabel}.`,
            });

            // Play sound
            playNotificationSound();

            // Browser notification
            showBrowserNotification({
              title: "Status do Arquivo Atualizado",
              body: `O arquivo ${placa} foi marcado como ${statusLabel}.`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);
}
