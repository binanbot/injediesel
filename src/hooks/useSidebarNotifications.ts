import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SidebarCounts {
  arquivos: number;
  mensagens: number;
}

/**
 * Fetches real notification counts for the franchisee sidebar:
 * - arquivos: received_files with status = 'concluido' (ready for download, not yet viewed)
 * - mensagens: unread support messages from admin/support
 */
export function useSidebarNotifications() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<SidebarCounts>({ arquivos: 0, mensagens: 0 });

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function fetchCounts() {
      // Get user's unit_id via their franchisee profile
      const { data: unitData } = await supabase
        .rpc("get_user_unit_id", { _user_id: user!.id });

      if (cancelled || !unitData) return;

      const unitId = unitData as string;

      // Count files ready for download (status = 'concluido')
      const { count: filesCount } = await supabase
        .from("received_files")
        .select("id", { count: "exact", head: true })
        .eq("unit_id", unitId)
        .eq("status", "concluido");

      // Count unread support messages (from admin/support, not from the user)
      const { data: convos } = await supabase
        .from("support_conversations")
        .select("id")
        .eq("franqueado_id", user!.id)
        .eq("status", "aberto");

      let unreadMessages = 0;
      if (convos && convos.length > 0) {
        const convoIds = convos.map((c) => c.id);
        const { count: msgCount } = await supabase
          .from("support_messages")
          .select("id", { count: "exact", head: true })
          .in("conversation_id", convoIds)
          .neq("sender_id", user!.id);

        unreadMessages = msgCount ?? 0;
      }

      if (!cancelled) {
        setCounts({
          arquivos: filesCount ?? 0,
          mensagens: unreadMessages,
        });
      }
    }

    fetchCounts();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return counts;
}
