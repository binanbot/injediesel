import { Target } from "lucide-react";
import { CeoPlaceholderPage } from "@/components/ceo/CeoPlaceholderPage";

export default function MetasOkrs() {
  return (
    <CeoPlaceholderPage
      icon={Target}
      title="Metas & OKRs"
      subtitle="Acompanhamento de metas estratégicas e resultados-chave do grupo"
      description="Este módulo permitirá definir e acompanhar metas estratégicas por empresa e para o grupo, com key results mensuráveis, status de progresso e alertas de desvio."
      plannedBlocks={[
        { title: "OKRs do Grupo", description: "Objetivos estratégicos globais com progresso consolidado e desvios." },
        { title: "Metas por Empresa", description: "Metas individuais por empresa com comparativo de atingimento." },
        { title: "Indicadores de Progresso", description: "Barras de progresso, semáforos de risco e alertas de prazo." },
        { title: "Histórico de Ciclos", description: "Análise de ciclos anteriores com lições aprendidas e tendências." },
      ]}
    />
  );
}
