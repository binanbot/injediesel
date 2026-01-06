import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const RECENTLY_UPDATED_DURATION = 30000; // 30 seconds

export function useRecentlyUpdatedFiles() {
  const [recentlyUpdatedIds, setRecentlyUpdatedIds] = useState<Set<string>>(new Set());

  const markAsUpdated = useCallback((id: string) => {
    setRecentlyUpdatedIds((prev) => new Set(prev).add(id));
    
    // Remove after duration
    setTimeout(() => {
      setRecentlyUpdatedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, RECENTLY_UPDATED_DURATION);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("file-updates-indicator")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "received_files",
        },
        (payload) => {
          const id = (payload.new as any)?.id;
          if (id) {
            markAsUpdated(id);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "received_files",
        },
        (payload) => {
          const id = (payload.new as any)?.id;
          if (id) {
            markAsUpdated(id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [markAsUpdated]);

  const isRecentlyUpdated = useCallback(
    (id: string) => recentlyUpdatedIds.has(id),
    [recentlyUpdatedIds]
  );

  return { isRecentlyUpdated, recentlyUpdatedIds };
}
