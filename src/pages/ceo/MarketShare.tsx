import { PieChart } from "lucide-react";
import { CeoPlaceholderPage } from "@/components/ceo/CeoPlaceholderPage";

export default function MarketShare() {
  return (
    <CeoPlaceholderPage
      icon={PieChart}
      title="Market Share"
      subtitle="Participação de mercado e posicionamento competitivo do grupo"
      description="Este módulo apresentará a participação de cada empresa do grupo dentro do ecossistema, com indicadores de penetração por região, concentração de clientes e evolução de market share ao longo do tempo."
      plannedBlocks={[
        { title: "Share por Empresa", description: "Participação de cada empresa no faturamento total do grupo." },
        { title: "Penetração Regional", description: "Cobertura geográfica e densidade de operação por estado e cidade." },
        { title: "Concentração de Clientes", description: "Índice de dependência dos maiores clientes por empresa." },
        { title: "Evolução de Market Share", description: "Variação da participação de cada empresa ao longo dos trimestres." },
      ]}
    />
  );
}
