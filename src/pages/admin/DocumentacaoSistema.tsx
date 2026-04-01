import { FileText, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { SystemDocumentationContent } from "@/components/admin/SystemDocumentationContent";

export default function DocumentacaoSistema() {
  const { toast } = useToast();

  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank", "width=1400,height=900");
    if (!printWindow) {
      toast({
        title: "Erro",
        description: "Não foi possível abrir a janela de impressão. Verifique se popups estão permitidos.",
        variant: "destructive",
      });
      return;
    }

    // We need to render the print version server-side-style
    // Create a temporary container, render the print content, grab innerHTML
    const tempDiv = document.createElement("div");
    tempDiv.id = "print-capture";
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.width = "1100px";
    document.body.appendChild(tempDiv);

    // Use ReactDOM to render print version
    import("react-dom/client").then(({ createRoot }) => {
      const root = createRoot(tempDiv);
      root.render(
        <SystemDocumentationContent printMode={true} />
      );

      // Wait for render
      setTimeout(() => {
        const htmlContent = tempDiv.innerHTML;
        root.unmount();
        document.body.removeChild(tempDiv);

        printWindow.document.write(`<!doctype html><html><head>
<meta charset="utf-8"/>
<title>Documentação do Sistema - Injediesel</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 14mm 12mm; }
  html, body {
    background: #fff !important;
    color: #1a1a1a !important;
    margin: 0; padding: 0; width: 100%;
    font-family: Inter, system-ui, sans-serif;
    font-size: 13px; line-height: 1.6;
  }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  img, svg, table, pre, blockquote, section, article { break-inside: avoid; page-break-inside: avoid; }
  thead { display: table-header-group; }
  tr, td, th { page-break-inside: avoid; break-inside: avoid; }
  table { width: 100% !important; border-collapse: collapse; }
  .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
  button { display: none !important; }
</style>
</head><body>
<div style="max-width:1100px;margin:0 auto;padding:20px;">${htmlContent}</div>
<script>window.onload=function(){setTimeout(function(){window.print();},500)}<\/script>
</body></html>`);

        printWindow.document.close();
        toast({ title: "PDF pronto!", description: "Escolha 'Salvar como PDF' na impressora." });
      }, 600);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Screen version (dark) */}
      <SystemDocumentationContent printMode={false} />
    </div>
  );
}
