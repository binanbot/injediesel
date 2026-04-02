import { useCallback, useState } from "react";

export type ExportFormat = "pdf" | "xlsx";

/**
 * Hook that prepares CEO report sections for export.
 * Collects all elements marked with data-export-section
 * and triggers PDF (via print) or flags for future Excel export.
 */
export function useExportReport() {
  const [exporting, setExporting] = useState(false);

  const getExportSections = useCallback(() => {
    const elements = document.querySelectorAll<HTMLElement>("[data-export-section]");
    return Array.from(elements).map((el) => ({
      key: el.getAttribute("data-export-section") ?? "",
      title: el.getAttribute("data-export-title") ?? "",
      element: el,
    }));
  }, []);

  const exportPdf = useCallback(() => {
    setExporting(true);
    // Small delay to let any pending renders finish
    setTimeout(() => {
      window.print();
      setExporting(false);
    }, 300);
  }, []);

  return { exporting, getExportSections, exportPdf };
}
