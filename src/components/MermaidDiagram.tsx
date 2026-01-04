import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

interface MermaidDiagramProps {
  chart: string;
  id: string;
}

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  themeVariables: {
    primaryColor: "#3b82f6",
    primaryTextColor: "#fff",
    primaryBorderColor: "#60a5fa",
    lineColor: "#94a3b8",
    secondaryColor: "#f97316",
    tertiaryColor: "#1e293b",
    background: "#0f172a",
    mainBkg: "#1e293b",
    nodeBorder: "#3b82f6",
    clusterBkg: "#1e293b",
    clusterBorder: "#3b82f6",
    titleColor: "#f8fafc",
    edgeLabelBackground: "#1e293b",
  },
  flowchart: {
    htmlLabels: true,
    curve: "basis",
  },
});

export function MermaidDiagram({ chart, id }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderChart = async () => {
      if (!containerRef.current) return;
      
      try {
        const { svg } = await mermaid.render(`mermaid-${id}`, chart);
        setSvg(svg);
        setError(null);
      } catch (err) {
        console.error("Mermaid render error:", err);
        setError("Erro ao renderizar diagrama");
      }
    };

    renderChart();
  }, [chart, id]);

  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm">
        {error}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="mermaid-container overflow-x-auto bg-background/50 p-4 rounded-lg border"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
