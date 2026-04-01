import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SystemDocumentationContent } from "@/components/admin/SystemDocumentationContent";

export default function DocumentacaoSistema() {
  const handleExportPDF = () => {
    window.open("/admin/documentacao/print", "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Documentação do Sistema
          </h1>
          <p className="text-muted-foreground">
            Relatório completo de arquitetura, jornadas e funcionalidades
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      <SystemDocumentationContent printMode={false} />
    </div>
  );
}
