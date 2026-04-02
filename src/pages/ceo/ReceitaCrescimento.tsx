import { TrendingUp } from "lucide-react";
import { CeoPlaceholderPage } from "@/components/ceo/CeoPlaceholderPage";

export default function ReceitaCrescimento() {
  return (
    <CeoPlaceholderPage
      icon={TrendingUp}
      title="Receita & Crescimento"
      subtitle="Análise detalhada de receita, crescimento e tendências do grupo"
      description="Este módulo permitirá acompanhar a evolução de receita consolidada do grupo com visões de crescimento mensal, trimestral e anual, incluindo projeções e comparativos entre períodos."
      plannedBlocks={[
        { title: "Evolução de Receita", description: "Gráfico de receita acumulada com comparativo YoY e projeção de tendência." },
        { title: "Taxa de Crescimento", description: "Crescimento percentual por empresa, unidade e categoria de serviço." },
        { title: "Receita por Canal", description: "Distribuição de receita por tipo de serviço e linha de produto." },
        { title: "Projeção de Faturamento", description: "Estimativa de faturamento para os próximos meses com base no histórico." },
      ]}
    />
  );
}
