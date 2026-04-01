import { useState, useEffect } from "react";
import { FileText, Download, BookOpen, Wrench, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SystemDocumentationContent } from "@/components/admin/SystemDocumentationContent";
import { cn } from "@/lib/utils";

const NAV_SECTIONS = [
  {
    group: "Documentação Executiva",
    icon: BookOpen,
    items: [
      { id: "visao-geral", label: "Visão Geral" },
      { id: "mapa-mental", label: "Mapa Mental" },
      { id: "jornadas", label: "Jornadas do Usuário" },
      { id: "painel-franqueado", label: "Painel Franqueado" },
      { id: "loja-promax", label: "Loja Promax" },
      { id: "painel-admin", label: "Painel Administrativo" },
      { id: "fluxos", label: "Fluxos de Trabalho" },
    ],
  },
  {
    group: "Documentação Técnica",
    icon: Wrench,
    items: [
      { id: "diagramas", label: "Diagramas de Arquitetura" },
      { id: "arquitetura-frontend", label: "Arquitetura do Front-end" },
      { id: "autenticacao", label: "Autenticação e RBAC" },
      { id: "banco-dados", label: "Banco de Dados" },
      { id: "design-system", label: "Design System" },
      { id: "regras-negocio", label: "Regras de Negócio" },
      { id: "modelo-canonico", label: "Modelo Canônico" },
      { id: "estados-transicoes", label: "Estados e Transições" },
    ],
  },
];

export default function DocumentacaoSistema() {
  const [activeSection, setActiveSection] = useState("");

  const handleExportPDF = () => {
    window.open("/documentacao/impressao", "_blank");
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );

    const allIds = NAV_SECTIONS.flatMap((g) => g.items.map((i) => i.id));
    allIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

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

      <div className="flex gap-6">
        {/* Side Navigation */}
        <nav className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-4 space-y-6 max-h-[calc(100vh-120px)] overflow-y-auto pr-2 pb-8">
            {NAV_SECTIONS.map((group) => (
              <div key={group.group}>
                <div className="flex items-center gap-2 mb-2 px-2">
                  <group.icon className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {group.group}
                  </span>
                </div>
                <ul className="space-y-0.5">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => scrollTo(item.id)}
                        className={cn(
                          "w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1.5",
                          activeSection === item.id
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        <ChevronRight
                          className={cn(
                            "h-3 w-3 transition-transform shrink-0",
                            activeSection === item.id ? "rotate-90 text-primary" : "text-transparent"
                          )}
                        />
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <SystemDocumentationContent printMode={false} />
        </div>
      </div>
    </div>
  );
}
