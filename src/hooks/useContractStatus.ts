import { useState, useEffect, useMemo } from "react";
import { differenceInDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ContractStatus {
  /** Se o contrato está vencido */
  isExpired: boolean;
  /** Dias restantes (negativo se vencido) */
  daysRemaining: number;
  /** Se o contrato está próximo do vencimento (<=30 dias) */
  isNearExpiration: boolean;
  /** Data de vencimento */
  expirationDate: Date | null;
  /** Se está carregando os dados */
  isLoading: boolean;
  /** Se houve erro ao carregar */
  hasError: boolean;
}

/**
 * Hook para verificar o status do contrato do franqueado
 */
export function useContractStatus(): ContractStatus {
  const { user, userRole } = useAuth();
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchContractStatus = async () => {
      // Admins e suporte não têm contrato - sempre liberados
      if (!user || userRole === "admin" || userRole === "suporte") {
        setIsLoading(false);
        setExpirationDate(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("franchisee_profiles")
          .select("contract_expiration_date")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Erro ao buscar status do contrato:", error);
          setHasError(true);
          setIsLoading(false);
          return;
        }

        if (data?.contract_expiration_date) {
          setExpirationDate(new Date(data.contract_expiration_date));
        } else {
          // Se não tem perfil, considera como não vencido (perfil será criado)
          const defaultDate = new Date();
          defaultDate.setFullYear(defaultDate.getFullYear() + 1);
          setExpirationDate(defaultDate);
        }
      } catch (error) {
        console.error("Erro ao buscar status do contrato:", error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContractStatus();
  }, [user, userRole]);

  return useMemo(() => {
    // Se carregando ou admin/suporte, retorna status liberado
    if (isLoading || !expirationDate) {
      return {
        isExpired: false,
        daysRemaining: 365,
        isNearExpiration: false,
        expirationDate: null,
        isLoading,
        hasError,
      };
    }

    const daysRemaining = differenceInDays(expirationDate, new Date());

    return {
      isExpired: daysRemaining < 0,
      daysRemaining,
      isNearExpiration: daysRemaining <= 30 && daysRemaining >= 0,
      expirationDate,
      isLoading: false,
      hasError,
    };
  }, [expirationDate, isLoading, hasError]);
}
