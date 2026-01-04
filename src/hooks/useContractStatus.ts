import { useMemo } from "react";
import { differenceInDays } from "date-fns";

interface ContractStatus {
  /** Se o contrato está vencido */
  isExpired: boolean;
  /** Dias restantes (negativo se vencido) */
  daysRemaining: number;
  /** Se o contrato está próximo do vencimento (<=30 dias) */
  isNearExpiration: boolean;
  /** Data de vencimento */
  expirationDate: Date;
}

/**
 * Hook para verificar o status do contrato do franqueado
 * TODO: Substituir pela data real do contrato do usuário logado
 */
export function useContractStatus(): ContractStatus {
  // TODO: Buscar data de vencimento real do banco de dados
  // Por enquanto, usando uma data mock para demonstração
  const mockExpirationDate = useMemo(() => {
    // Simula contrato vencendo em 25 dias (para testes, altere para o passado para simular vencido)
    const date = new Date();
    date.setDate(date.getDate() + 25);
    return date;
  }, []);

  return useMemo(() => {
    const daysRemaining = differenceInDays(mockExpirationDate, new Date());
    
    return {
      isExpired: daysRemaining < 0,
      daysRemaining,
      isNearExpiration: daysRemaining <= 30 && daysRemaining >= 0,
      expirationDate: mockExpirationDate,
    };
  }, [mockExpirationDate]);
}
