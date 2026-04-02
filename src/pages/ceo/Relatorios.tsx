import { BarChart3 } from "lucide-react";
import { CeoPlaceholderPage } from "@/components/ceo/CeoPlaceholderPage";

export default function CeoRelatorios() {
  return (
    <CeoPlaceholderPage
      icon={BarChart3}
      title="Relatórios Executivos"
      subtitle="Relatórios consolidados e exportáveis para tomada de decisão"
      description="Este módulo centralizará relatórios executivos com dados consolidados do grupo, permitindo exportação em PDF, compartilhamento e agendamento de envios periódicos."
      plannedBlocks={[
        { title: "Relatório Financeiro", description: "Demonstrativo consolidado de receita, custo e margem por período." },
        { title: "Relatório Operacional", description: "Volume de arquivos, pedidos, tickets e tempo de resposta por empresa." },
        { title: "Relatório Comparativo", description: "Benchmarks entre empresas do grupo com rankings e destaques." },
        { title: "Exportação e Agendamento", description: "Geração de PDF executivo e envio programado por e-mail." },
      ]}
    />
  );
}
