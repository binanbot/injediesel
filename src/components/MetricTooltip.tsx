import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MetricTooltipProps {
  /** Explicação da métrica */
  explanation: string;
  /** Tamanho do ícone */
  size?: "sm" | "md";
}

/**
 * Tooltip explicativo para métricas e KPIs
 */
export function MetricTooltip({ explanation, size = "sm" }: MetricTooltipProps) {
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button 
          type="button" 
          className="text-muted-foreground/60 hover:text-muted-foreground transition-colors focus:outline-none"
          aria-label="Informações sobre esta métrica"
        >
          <Info className={iconSize} />
        </button>
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        className="max-w-[250px] text-xs leading-relaxed"
      >
        {explanation}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Definições de métricas comuns do sistema
 */
export const metricDefinitions = {
  // Franqueado - Dashboard
  arquivosEnviados: "Total de arquivos de ECU enviados para processamento.",
  arquivosConcluidos: "Arquivos que foram processados e estão prontos para download.",
  arquivosProcessando: "Arquivos que estão sendo analisados pela equipe técnica.",
  downloadsDisponiveis: "Arquivos modificados prontos para download.",
  
  // Franqueado - Relatórios
  faturamentoTotal: "Soma de todos os valores dos serviços realizados no período selecionado.",
  totalServicos: "Quantidade total de serviços de remapeamento concluídos no período.",
  ticketMedio: "Valor médio por serviço = Faturamento Total ÷ Número de Serviços.",
  
  // Admin - Dashboard
  totalFranqueados: "Número total de unidades franqueadas cadastradas no sistema.",
  arquivosPendentes: "Arquivos recebidos aguardando análise inicial da equipe.",
  emProcessamento: "Arquivos sendo trabalhados pela equipe técnica.",
  downloadsProntos: "Arquivos finalizados e disponíveis para o franqueado baixar.",
  
  // Admin - Relatórios
  franqueadosAtivos: "Franqueados com contrato válido e acesso liberado.",
  franqueadosVencendo: "Franqueados com contrato vencendo nos próximos 30 dias.",
  contratoVencido: "Franqueados com contrato vencido e acesso bloqueado.",
  receitaTotal: "Soma de todos os valores faturados por todas as unidades.",
  crescimento: "Variação percentual em relação ao período anterior.",
  arquivosRecebidos: "Total de arquivos recebidos de todos os franqueados.",
  tempoMedioResposta: "Tempo médio entre recebimento e conclusão do arquivo.",
  
  // Gráficos
  distribuicaoCategoria: "Participação de cada categoria no faturamento total.",
  evolucaoMensal: "Variação do volume de arquivos e receita mês a mês.",
  desempenhoCategoria: "Métricas de arquivos, receita e crescimento por tipo de veículo.",
  rankingRevendas: "Classificação das unidades por volume de arquivos e faturamento.",
  arquivosPorMes: "Evolução mensal do volume de arquivos recebidos de todas as unidades.",
  distribuicaoStatus: "Proporção de arquivos por situação atual (concluído, processando, etc.).",
  topUnidades: "Ranking das unidades com maior volume de arquivos enviados.",
};
