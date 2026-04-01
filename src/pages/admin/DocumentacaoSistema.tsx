import { FileText, Download, Printer, ChevronDown, ChevronRight, Map, Users, Shield, Database, Palette, GitBranch, Workflow, Network, ShoppingCart, Store, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { MermaidDiagram } from "@/components/MermaidDiagram";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Mermaid diagram definitions
const ARCHITECTURE_DIAGRAM = `
flowchart TB
    subgraph Frontend["🖥️ Frontend (React + Vite)"]
        UI[UI Components]
        Router[React Router v7]
        State[React Query + Zustand]
        Auth[Auth Context]
    end
    
    subgraph Backend["☁️ Lovable Cloud (Supabase)"]
        AuthService[Auth Service]
        Database[(PostgreSQL)]
        Storage[Storage Buckets]
        EdgeFn[Edge Functions]
        Realtime[Realtime WebSocket]
    end
    
    subgraph External["🌐 Integrações"]
        WhatsApp[WhatsApp API]
        ViaCEP[ViaCEP API]
        Mapbox[Mapbox Maps]
    end
    
    UI --> Router
    Router --> State
    State --> Auth
    Auth --> AuthService
    State --> Database
    UI --> Storage
    Realtime --> UI
    EdgeFn --> External
    UI --> WhatsApp
    UI --> ViaCEP
    
    style Frontend fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Backend fill:#1e293b,stroke:#f97316,color:#fff
    style External fill:#1e293b,stroke:#22c55e,color:#fff
`;

const DATA_FLOW_DIAGRAM = `
sequenceDiagram
    participant F as Franqueado
    participant FE as Frontend
    participant API as Supabase API
    participant DB as PostgreSQL
    participant RT as Realtime
    participant A as Admin
    
    F->>FE: Login
    FE->>API: signInWithPassword()
    API->>DB: Valida credenciais
    DB-->>API: user + session
    API-->>FE: JWT Token
    FE->>DB: Busca user_roles
    DB-->>FE: role: franqueado
    
    F->>FE: Envia Arquivo ECU
    FE->>API: Upload Storage
    FE->>DB: INSERT arquivo
    DB-->>RT: Notifica
    RT-->>A: Novo arquivo
    
    A->>FE: Processa arquivo
    FE->>DB: UPDATE status
    DB-->>RT: Status changed
    RT-->>F: Notificação
`;

const ORDER_FLOW_DIAGRAM = `
sequenceDiagram
    participant F as Franqueado
    participant FE as Frontend
    participant DB as PostgreSQL
    participant WA as WhatsApp
    participant A as Admin

    F->>FE: Navega na Loja
    F->>FE: Adiciona ao Carrinho (Zustand)
    F->>FE: Checkout (Revisão → Entrega → Pagamento → Confirmação)
    FE->>DB: INSERT order + order_items + financial_entries
    FE->>WA: Abre mensagem formatada
    FE->>FE: Limpa carrinho + redireciona
    F->>FE: Visualiza status do pedido
    A->>FE: Altera payment_status / fulfillment_status
    FE->>DB: UPDATE orders + INSERT order_status_history
`;

const SUPPORT_FLOW_DIAGRAM = `
flowchart LR
    subgraph Franqueado
        F1[Abre Ticket]
        F2[Envia Mensagem]
        F3[Recebe Resposta]
    end
    
    subgraph Supabase
        C[(Conversations)]
        M[(Messages)]
        RT{{Realtime}}
    end
    
    subgraph Admin
        A1[Visualiza Tickets]
        A2[Responde]
        A3[Fecha Ticket]
    end
    
    F1 --> C
    F2 --> M
    M --> RT
    RT --> F3
    RT --> A1
    A2 --> M
    A3 --> C
    
    style Franqueado fill:#1e3a5f,stroke:#3b82f6
    style Admin fill:#422006,stroke:#f97316
    style Supabase fill:#1e293b,stroke:#22c55e
`;

const DATABASE_DIAGRAM = `
erDiagram
    AUTH_USERS ||--o{ USER_ROLES : has
    AUTH_USERS ||--o{ PROFILES_FRANCHISEES : has
    PROFILES_FRANCHISEES ||--o{ UNITS : owns
    UNITS ||--o{ CUSTOMERS : has
    UNITS ||--o{ RECEIVED_FILES : has
    CUSTOMERS ||--o{ VEHICLES : owns
    UNITS ||--o{ ORDERS : places
    ORDERS ||--o{ ORDER_ITEMS : contains
    ORDERS ||--o{ ORDER_STATUS_HISTORY : tracks
    ORDERS ||--o{ FINANCIAL_ENTRIES : generates
    AUTH_USERS ||--o{ SUPPORT_CONVERSATIONS : creates
    SUPPORT_CONVERSATIONS ||--o{ SUPPORT_MESSAGES : contains
    CORRECTION_TICKETS ||--o| SUPPORT_CONVERSATIONS : links
    
    USER_ROLES {
        uuid id PK
        uuid user_id FK
        enum role
    }
    
    PROFILES_FRANCHISEES {
        uuid id PK
        uuid user_id FK
        text email
        text display_name
        text cnpj
        jsonb delivery_address
        date contract_expiration_date
    }

    UNITS {
        uuid id PK
        uuid franchisee_id FK
        text name
        text city
        text state
    }

    ORDERS {
        uuid id PK
        uuid franchise_profile_id FK
        uuid unit_id FK
        text order_number
        text status
        text payment_status
        text fulfillment_status
        text payment_method
        numeric total_amount
        jsonb delivery_address
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        text product_name
        integer quantity
        numeric unit_price
        numeric line_total
    }

    ORDER_STATUS_HISTORY {
        uuid id PK
        uuid order_id FK
        text previous_status
        text new_status
        text internal_note
        uuid changed_by
    }

    PRODUCTS {
        uuid id PK
        text sku
        text name
        text brand
        numeric price
        text category
        boolean available
    }

    FINANCIAL_ENTRIES {
        uuid id PK
        uuid order_id FK
        uuid franchise_profile_id FK
        text scope
        text entry_type
        text category
        numeric amount
    }
`;

export default function DocumentacaoSistema() {
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    diagramas: true,
    mapa: false,
    visao: false,
    auth: false,
    franqueado: false,
    loja: false,
    admin: false,
    banco: false,
    ui: false,
    fluxo: false,
    jornadas: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const expandAll = () => {
    const allOpen: Record<string, boolean> = {};
    Object.keys(openSections).forEach((k) => (allOpen[k] = true));
    setOpenSections(allOpen);
  };

  const handlePrint = () => {
    expandAll();
    setTimeout(() => window.print(), 300);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    // Expand all sections first
    const allOpen: Record<string, boolean> = {};
    Object.keys(openSections).forEach((k) => (allOpen[k] = true));
    setOpenSections(allOpen);

    // Wait for DOM to render expanded content
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await new Promise((r) => setTimeout(r, 800));

    try {
      const node = contentRef.current;
      if (!node) throw new Error("Conteúdo não encontrado");

      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0f172a",
        logging: false,
        windowWidth: node.scrollWidth,
        windowHeight: node.scrollHeight,
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = 210;
      const pageH = 297;
      const margin = 5;
      const contentW = pageW - margin * 2;
      const imgH = (canvas.height * contentW) / canvas.width;

      let position = 0;
      let firstPage = true;

      while (position < imgH) {
        if (!firstPage) pdf.addPage();
        firstPage = false;

        pdf.addImage(
          canvas.toDataURL("image/png"),
          "PNG",
          margin,
          margin - position,
          contentW,
          imgH
        );
        position += pageH - margin * 2;
      }

      pdf.save(`documentacao-injediesel-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast({ title: "PDF exportado!", description: "Todas as seções foram incluídas no arquivo." });
    } catch (err: any) {
      console.error("Export error:", err);
      toast({ title: "Erro ao exportar", description: err.message, variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const currentDate = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

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
          <Button variant="outline" onClick={expandAll}>Expandir Tudo</Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />Imprimir
          </Button>
          <Button onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />Exportar PDF
          </Button>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible; }
          .print-content { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
        }
      `}</style>

      {/* Document Content */}
      <Card className="print-content" ref={contentRef}>
        <CardHeader className="text-center border-b">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">SISTEMA INJEDIESEL</CardTitle>
          <p className="text-muted-foreground">
            Sistema de Gestão de Arquivos ECU e Loja Promax para Franqueados
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
            <span>Versão: 3.0</span>
            <span>•</span>
            <span>Data: {currentDate}</span>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <ScrollArea className="h-[calc(100vh-400px)] pr-4">
            <div className="space-y-4">

              {/* DIAGRAMAS */}
              <Section title="DIAGRAMAS DE ARQUITETURA" icon={<Network className="h-5 w-5" />} isOpen={openSections.diagramas} onToggle={() => toggleSection("diagramas")}>
                <div className="space-y-8">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2"><Badge variant="outline">1</Badge> Arquitetura Geral do Sistema</h4>
                    <p className="text-sm text-muted-foreground mb-4">Visão geral da estrutura frontend/backend, integrações externas e conexões.</p>
                    <MermaidDiagram chart={ARCHITECTURE_DIAGRAM} id="architecture" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2"><Badge variant="outline">2</Badge> Fluxo de Dados - Autenticação e Envio de Arquivo</h4>
                    <p className="text-sm text-muted-foreground mb-4">Sequência de operações desde o login até o processamento de arquivos.</p>
                    <MermaidDiagram chart={DATA_FLOW_DIAGRAM} id="dataflow" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2"><Badge variant="outline">3</Badge> Fluxo de Pedido - Loja Promax</h4>
                    <p className="text-sm text-muted-foreground mb-4">Jornada completa do pedido: carrinho → checkout → WhatsApp → gestão admin.</p>
                    <MermaidDiagram chart={ORDER_FLOW_DIAGRAM} id="orderflow" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2"><Badge variant="outline">4</Badge> Fluxo de Suporte em Tempo Real</h4>
                    <p className="text-sm text-muted-foreground mb-4">Comunicação bidirecional entre franqueados e administradores via Realtime.</p>
                    <MermaidDiagram chart={SUPPORT_FLOW_DIAGRAM} id="support" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2"><Badge variant="outline">5</Badge> Modelo de Dados (ER Diagram)</h4>
                    <p className="text-sm text-muted-foreground mb-4">Relacionamentos entre as tabelas do banco de dados PostgreSQL.</p>
                    <MermaidDiagram chart={DATABASE_DIAGRAM} id="database" />
                  </div>
                </div>
              </Section>

              <Separator />

              {/* MAPA MENTAL */}
              <Section title="MAPA MENTAL DO SISTEMA" icon={<Map className="h-5 w-5" />} isOpen={openSections.mapa} onToggle={() => toggleSection("mapa")}>
                <div className="bg-gradient-to-br from-muted/50 to-muted/30 p-6 rounded-xl border">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-3">
                      <span className="text-2xl font-bold text-primary-foreground">ID</span>
                    </div>
                    <h3 className="text-xl font-bold">INJEDIESEL SYSTEM</h3>
                    <p className="text-sm text-muted-foreground">Plataforma SaaS B2B</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Lado Franqueado */}
                    <div className="bg-background/60 backdrop-blur p-4 rounded-lg border border-blue-500/30">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-white" />
                        </div>
                        <h4 className="font-bold text-blue-400">PAINEL FRANQUEADO</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        {[
                          "Home (Dashboard + Arquivos Recentes)",
                          "Enviar Arquivo (ECU + Cliente + Serviços)",
                          "Meus Arquivos (Lista + Detalhes + Correção)",
                          "Loja Promax (Catálogo + Carrinho + Checkout)",
                          "Meus Pedidos (Status + Timeline + Histórico)",
                          "Materiais & Tutoriais",
                          "Atualizações (Notificações)",
                          "Mensagens (Comunicados)",
                          "Relatórios (Faturamento)",
                          "Suporte (Chat + Tickets)",
                          "Perfil (Configurações + Endereço)",
                        ].map((item) => (
                          <div key={item} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Lado Admin */}
                    <div className="bg-background/60 backdrop-blur p-4 rounded-lg border border-orange-500/30">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                          <Shield className="h-4 w-4 text-white" />
                        </div>
                        <h4 className="font-bold text-orange-400">PAINEL ADMINISTRATIVO</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        {[
                          "Dashboard (KPIs + Alertas)",
                          "Arquivos (Gestão + Processamento)",
                          "Correções (Tickets de Correção)",
                          "Franqueados (Gestão + Importação)",
                          "Clientes (CRUD + Veículos)",
                          "Loja Promax - Produtos (CRUD + Importação)",
                          "Loja Promax - Compras (Gestão de Pedidos)",
                          "Loja Promax - Dashboard (Inteligência Comercial)",
                          "Áreas / Cobertura (Mapa Mapbox)",
                          "Banners (Marketing)",
                          "Mensagens (Comunicados)",
                          "Suporte (Tickets + Chat)",
                          "Relatórios (Analytics + Exportação LGPD)",
                          "Contratos (Gestão + Histórico)",
                          "Configurações",
                          "Documentação (Este Documento)",
                        ].map((item) => (
                          <div key={item} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-400 rounded-full" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <div className="inline-flex items-center gap-4 bg-muted/50 px-6 py-3 rounded-full">
                      <Badge variant="outline" className="border-blue-500 text-blue-400">Franqueado</Badge>
                      <span className="text-muted-foreground">⟷ Supabase Realtime ⟷</span>
                      <Badge variant="outline" className="border-orange-500 text-orange-400">Admin</Badge>
                    </div>
                  </div>
                </div>
              </Section>

              <Separator />

              {/* JORNADAS */}
              <Section title="JORNADAS DO USUÁRIO" icon={<Workflow className="h-5 w-5" />} isOpen={openSections.jornadas} onToggle={() => toggleSection("jornadas")}>
                <div className="mb-8">
                  <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"><span className="text-xs text-white font-bold">F</span></div>
                    Jornada do Franqueado
                  </h4>
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-blue-500/30" />
                    <div className="space-y-4">
                      <JourneyStep number={1} title="Login" description="Autenticação com email/senha → Redirecionamento para /franqueado" color="blue" />
                      <JourneyStep number={2} title="Home Dashboard" description="Estatísticas pessoais, arquivos recentes, atalhos rápidos e banner carousel" color="blue" />
                      <JourneyStep number={3} title="Enviar Arquivo" description="Seleciona cliente, escolhe serviços por categoria, faz upload do ECU" color="blue" />
                      <JourneyStep number={4} title="Acompanhar Status" description="Em 'Meus Arquivos' visualiza status: Pendente → Em Análise → Concluído" color="blue" />
                      <JourneyStep number={5} title="Loja Promax" description="Navega catálogo de produtos, adiciona ao carrinho (Zustand + localStorage)" color="blue" />
                      <JourneyStep number={6} title="Checkout Multi-etapa" description="Revisão → Endereço (ViaCEP) → Pagamento → Confirmação e envio via WhatsApp" color="blue" />
                      <JourneyStep number={7} title="Acompanhar Pedido" description="Timeline visual com status de pagamento e logística, histórico detalhado" color="blue" />
                      <JourneyStep number={8} title="Solicitar Correção" description="Abre ticket de correção com motivo e anexo opcional" color="blue" />
                      <JourneyStep number={9} title="Relatórios" description="Faturamento por período, gráficos por categoria de serviço" color="blue" />
                      <JourneyStep number={10} title="Suporte" description="Chat em tempo real, histórico de conversas, contato via WhatsApp/telefone" color="blue" />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center"><span className="text-xs text-white font-bold">A</span></div>
                    Jornada do Administrador
                  </h4>
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-orange-500/30" />
                    <div className="space-y-4">
                      <JourneyStep number={1} title="Login Admin" description="Autenticação com role 'admin' ou 'suporte' → Redirecionamento para /admin" color="orange" />
                      <JourneyStep number={2} title="Dashboard" description="Alertas prioritários, KPIs, arquivos pendentes" color="orange" />
                      <JourneyStep number={3} title="Processar Arquivos" description="Fila de arquivos, processa ECU, upload de arquivo modificado" color="orange" />
                      <JourneyStep number={4} title="Gerenciar Pedidos (Loja)" description="Lista de compras, detalhe com timeline, painel de status de pagamento e logística separados" color="orange" />
                      <JourneyStep number={5} title="Dashboard Loja Promax" description="Cards de resumo, top 10 produtos, top 10 unidades, gráfico mensal, ranking por categoria" color="orange" />
                      <JourneyStep number={6} title="Gerenciar Correções" description="Tickets de correção, timeline, chat com franqueado" color="orange" />
                      <JourneyStep number={7} title="Atender Suporte" description="Responde tickets e chats em tempo real" color="orange" />
                      <JourneyStep number={8} title="Gestão de Franqueados" description="CRUD, importação em massa, áreas de cobertura (Mapbox)" color="orange" />
                      <JourneyStep number={9} title="Gestão de Clientes" description="CRUD de clientes e veículos vinculados a unidades" color="orange" />
                      <JourneyStep number={10} title="Gestão de Produtos" description="CRUD de produtos, importação em massa, imagens via Storage" color="orange" />
                      <JourneyStep number={11} title="Relatórios" description="Analytics, top revendas, exportação com conformidade LGPD" color="orange" />
                      <JourneyStep number={12} title="Contratos" description="Gestão de contratos com histórico e alertas de vencimento" color="orange" />
                    </div>
                  </div>
                </div>
              </Section>

              <Separator />

              {/* VISÃO GERAL */}
              <Section title="VISÃO GERAL DO SISTEMA" icon={<GitBranch className="h-5 w-5" />} isOpen={openSections.visao} onToggle={() => toggleSection("visao")}>
                <p className="mb-4">
                  O sistema é uma plataforma SaaS B2B para gestão de arquivos de ECU (Engine Control Unit)
                  e loja de peças/acessórios entre franqueados e a franqueadora Injediesel.
                  Permite envio e processamento de arquivos, compra de produtos via loja online
                  com checkout integrado ao WhatsApp, e comunicação em tempo real.
                </p>

                <h4 className="font-semibold mb-2">Tecnologias Utilizadas:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  {["React 18 + TypeScript", "Vite", "Tailwind CSS", "Framer Motion", "Lovable Cloud", "PostgreSQL", "Supabase Auth", "Supabase Realtime", "React Query", "React Router v7", "Shadcn/UI", "Lucide Icons", "Zustand (Carrinho)", "Recharts (Gráficos)", "Mapbox GL", "Mermaid.js"].map((t) => (
                    <Badge key={t} variant="outline">{t}</Badge>
                  ))}
                </div>

                <h4 className="font-semibold mb-2">Arquitetura:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                  <li>Frontend: SPA React com roteamento client-side e lazy loading</li>
                  <li>Backend: Lovable Cloud (Supabase) com Edge Functions</li>
                  <li>Database: PostgreSQL com RLS (Row Level Security)</li>
                  <li>Storage: Supabase Storage para arquivos, anexos e imagens de produtos</li>
                  <li>Realtime: WebSocket para chat e notificações</li>
                  <li>Estado local: Zustand com persistência em localStorage para carrinho</li>
                  <li>Integrações: WhatsApp (pedidos), ViaCEP (endereços), Mapbox (cobertura)</li>
                </ul>
              </Section>

              <Separator />

              {/* AUTENTICAÇÃO */}
              <Section title="AUTENTICAÇÃO E RBAC" icon={<Shield className="h-5 w-5" />} isOpen={openSections.auth} onToggle={() => toggleSection("auth")}>
                <h4 className="font-semibold mb-2">Sistema de Autenticação:</h4>
                <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
                  <li>Autenticação via Supabase Auth (email/senha)</li>
                  <li>Sessões gerenciadas automaticamente com JWT</li>
                  <li>Rotas protegidas via ProtectedRoute component</li>
                  <li>Roles armazenadas em tabela separada (user_roles) para segurança</li>
                </ul>

                <h4 className="font-semibold mb-2">Níveis de Acesso (RBAC):</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left border">Role</th>
                        <th className="p-2 text-left border">Rotas</th>
                        <th className="p-2 text-left border">Permissões</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2 border"><Badge variant="outline">franqueado</Badge></td>
                        <td className="p-2 border font-mono text-xs">/franqueado/*</td>
                        <td className="p-2 border">Acesso ao painel de franqueado e loja</td>
                      </tr>
                      <tr>
                        <td className="p-2 border"><Badge variant="outline">suporte</Badge></td>
                        <td className="p-2 border font-mono text-xs">/admin/* + /franqueado/*</td>
                        <td className="p-2 border">Acesso admin e franqueado para suporte</td>
                      </tr>
                      <tr>
                        <td className="p-2 border"><Badge variant="outline">admin</Badge></td>
                        <td className="p-2 border font-mono text-xs">/admin/* + /franqueado/*</td>
                        <td className="p-2 border">Acesso total ao sistema</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h4 className="font-semibold mt-4 mb-2">Funções de Segurança (SECURITY DEFINER):</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                  <li><code className="text-xs bg-muted px-1 rounded">has_role(user_id, role)</code> — Verifica se usuário possui determinada role</li>
                  <li><code className="text-xs bg-muted px-1 rounded">is_franchisor_admin(user_id)</code> — Verifica se é admin ou suporte</li>
                  <li><code className="text-xs bg-muted px-1 rounded">get_user_unit_id(user_id)</code> — Retorna o unit_id do franqueado</li>
                </ul>
              </Section>

              <Separator />

              {/* PAINEL FRANQUEADO */}
              <Section title="PAINEL DO FRANQUEADO" icon={<Users className="h-5 w-5" />} isOpen={openSections.franqueado} onToggle={() => toggleSection("franqueado")}>
                <h4 className="font-semibold mb-2">Rotas Disponíveis:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                  {["/franqueado", "/franqueado/enviar", "/franqueado/arquivos", "/franqueado/arquivos/:id", "/franqueado/loja", "/franqueado/loja/carrinho", "/franqueado/loja/checkout", "/franqueado/loja/pedidos", "/franqueado/loja/pedidos/:id", "/franqueado/atualizacoes", "/franqueado/tutoriais", "/franqueado/materiais", "/franqueado/mensagens", "/franqueado/relatorios", "/franqueado/suporte", "/franqueado/perfil", "/franqueado/cursos"].map((r) => (
                    <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>
                  ))}
                </div>

                <h4 className="font-semibold mb-2">Funcionalidades Principais:</h4>
                <div className="space-y-3">
                  <FeatureItem title="Home" description="Dashboard com estatísticas, arquivos recentes com ação rápida, atalhos e banner carousel" />
                  <FeatureItem title="Enviar Arquivo" description="Seleção/cadastro de cliente, serviços por categoria, upload de arquivo ECU com validações" />
                  <FeatureItem title="Meus Arquivos" description="Lista paginada com filtros por status, busca por nome, detalhes com timeline" />
                  <FeatureItem title="Loja Promax" description="Catálogo de produtos com busca e filtros, cards com imagem/preço/promoção, carrinho local (Zustand)" />
                  <FeatureItem title="Checkout" description="Multi-etapa: Revisão → Entrega (ViaCEP) → Pagamento (7 métodos) → Confirmação e envio via WhatsApp" />
                  <FeatureItem title="Meus Pedidos" description="Lista de pedidos com badges de status, filtros por período e status" />
                  <FeatureItem title="Detalhe do Pedido" description="Timeline visual de pagamento e logística, badges de status, endereço, pagamento, itens, histórico" />
                  <FeatureItem title="Solicitar Correção" description="Formulário com motivo obrigatório, anexo opcional, cria ticket e conversa de suporte" />
                  <FeatureItem title="Relatórios" description="Faturamento por período com gráficos por categoria de serviço" />
                  <FeatureItem title="Suporte" description="Chat em tempo real via Realtime, histórico de conversas, WhatsApp/telefone/email" />
                  <FeatureItem title="Perfil" description="Dados pessoais, endereço de entrega padrão, equipamentos, contrato" />
                </div>
              </Section>

              <Separator />

              {/* LOJA PROMAX */}
              <Section title="LOJA PROMAX" icon={<Store className="h-5 w-5" />} isOpen={openSections.loja} onToggle={() => toggleSection("loja")}>
                <h4 className="font-semibold mb-2">Visão Geral:</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  A Loja Promax é o módulo de e-commerce B2B integrado ao sistema, permitindo que franqueados
                  comprem peças e acessórios diretamente pela plataforma com confirmação via WhatsApp.
                </p>

                <h4 className="font-semibold mb-2">Carrinho de Compras:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm mb-4">
                  <li>Estado gerenciado por Zustand (useCartStore)</li>
                  <li>Persistência em localStorage (chave: promax-cart)</li>
                  <li>Interface CartItem: id, name, sku, price, quantity, image, category</li>
                  <li>Operações: addItem, removeItem, updateQuantity, clearCart, getTotal</li>
                </ul>

                <h4 className="font-semibold mb-2">Checkout Multi-etapa:</h4>
                <div className="bg-muted/50 p-4 rounded-lg mb-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge>1. Revisão</Badge><span>→</span>
                    <Badge>2. Entrega (ViaCEP)</Badge><span>→</span>
                    <Badge>3. Pagamento</Badge><span>→</span>
                    <Badge>4. Confirmação</Badge><span>→</span>
                    <Badge variant="secondary">WhatsApp</Badge>
                  </div>
                </div>

                <h4 className="font-semibold mb-2">Formas de Pagamento:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  {["PIX", "Boleto", "Cartão de Crédito", "Cartão de Débito", "Transferência", "A Prazo", "Pagamento na Entrega"].map((p) => (
                    <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                  ))}
                </div>

                <h4 className="font-semibold mb-2">Gestão de Status (Admin):</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h5 className="font-semibold text-sm mb-2">💳 Status de Pagamento</h5>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {["Pendente", "Aguardando Comprovante", "Aprovado", "Recusado", "Estornado"].map((s) => (
                        <div key={s} className="flex items-center gap-2"><div className="w-2 h-2 bg-amber-400 rounded-full" />{s}</div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h5 className="font-semibold text-sm mb-2">📦 Status de Logística</h5>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {["Pedido Realizado", "Em Separação", "Em Preparação", "Enviado", "Em Trânsito", "Entregue", "Cancelado"].map((s) => (
                        <div key={s} className="flex items-center gap-2"><div className="w-2 h-2 bg-primary rounded-full" />{s}</div>
                      ))}
                    </div>
                  </div>
                </div>

                <h4 className="font-semibold mt-4 mb-2">Componentes da Loja:</h4>
                <div className="space-y-3">
                  <FeatureItem title="ProductCard" description="Card com imagem, nome, preço, promoção, badge de categoria e botão de adicionar" />
                  <FeatureItem title="CartDrawer" description="Drawer lateral com itens do carrinho, quantidades e resumo" />
                  <FeatureItem title="DeliveryAddressForm" description="Formulário de endereço com integração ViaCEP e botão 'Usar endereço do cadastro'" />
                  <FeatureItem title="PaymentMethodForm" description="Seletor de forma de pagamento com observação opcional" />
                  <FeatureItem title="OrderTimeline" description="Timeline visual com ícones e estados (concluído/atual/aguardando/interrompido)" />
                  <FeatureItem title="OrderTimelineFromHistory" description="Timeline baseada no histórico real de order_status_history com data/hora" />
                  <FeatureItem title="AdminOrderStatusPanel" description="Painel admin com selects de pagamento e logística, observação interna e histórico" />
                  <FeatureItem title="OrderStatusBadges" description="Badges visuais de payment_status e fulfillment_status" />
                </div>

                <h4 className="font-semibold mt-4 mb-2">Dashboard de Inteligência Comercial (Admin):</h4>
                <div className="space-y-3">
                  <FeatureItem title="StoreSummaryCards" description="Faturamento total, pedidos totais, ticket médio, itens vendidos" />
                  <FeatureItem title="TopProductsCard" description="Top 10 produtos por quantidade vendida e por faturamento" />
                  <FeatureItem title="TopBuyingUnitsCard" description="Top 10 unidades que mais compram (pedidos, valor, ticket médio, itens)" />
                  <FeatureItem title="MonthlyStoreSalesChart" description="Gráfico Recharts com faturamento e pedidos mensais" />
                  <FeatureItem title="CategoryRankingCard" description="Ranking por categoria de produto (quantidade, faturamento, pedidos)" />
                </div>
              </Section>

              <Separator />

              {/* PAINEL ADMIN */}
              <Section title="PAINEL ADMINISTRATIVO" icon={<Shield className="h-5 w-5" />} isOpen={openSections.admin} onToggle={() => toggleSection("admin")}>
                <h4 className="font-semibold mb-2">Rotas Disponíveis:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                  {["/admin", "/admin/arquivos", "/admin/arquivos/:id", "/admin/correcoes", "/admin/franqueados", "/admin/franqueados/:id", "/admin/importar", "/admin/cobertura", "/admin/clientes", "/admin/clientes/:id", "/admin/produtos", "/admin/importar-produtos", "/admin/compras", "/admin/compras/:id", "/admin/loja-dashboard", "/admin/areas", "/admin/banners", "/admin/mensagens", "/admin/suporte", "/admin/relatorios", "/admin/contratos", "/admin/configuracoes", "/admin/documentacao"].map((r) => (
                    <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>
                  ))}
                </div>

                <h4 className="font-semibold mb-2">Funcionalidades Principais:</h4>
                <div className="space-y-3">
                  <FeatureItem title="Dashboard" description="Alertas neon de prioridade, KPIs em cards, resumo de pendências, atividade recente" />
                  <FeatureItem title="Gestão de Arquivos" description="Fila de processamento, detalhes com timeline, upload de arquivo modificado, status" />
                  <FeatureItem title="Tickets de Correção" description="Lista com status, timeline visual, painel de chat integrado, resolução" />
                  <FeatureItem title="Franqueados" description="CRUD completo, importação em massa, detalhe com contrato, receita, clientes, suporte" />
                  <FeatureItem title="Clientes e Veículos" description="CRUD vinculado a unidades, histórico de serviços" />
                  <FeatureItem title="Produtos" description="CRUD com imagens via Storage, importação em massa, categorias" />
                  <FeatureItem title="Compras dos Franqueados" description="Lista de pedidos com badges duplos, detalhe com timeline, painel de status admin" />
                  <FeatureItem title="Dashboard Loja Promax" description="Inteligência comercial com filtros por período: resumo, top produtos, top unidades, vendas mensais, categorias" />
                  <FeatureItem title="Cobertura" description="Mapa interativo Mapbox com áreas de atuação e cidades" />
                  <FeatureItem title="Contratos" description="Gestão de contratos com histórico, tipos e alertas de vencimento" />
                  <FeatureItem title="Relatórios" description="Top 10 revendas, desempenho por categoria, exportação com conformidade LGPD" />
                  <FeatureItem title="Suporte" description="Todas as conversas, filtros por status, chat em tempo real" />
                  <FeatureItem title="Documentação" description="Esta página - documentação técnica completa com exportação PDF" />
                </div>
              </Section>

              <Separator />

              {/* BANCO DE DADOS */}
              <Section title="BANCO DE DADOS" icon={<Database className="h-5 w-5" />} isOpen={openSections.banco} onToggle={() => toggleSection("banco")}>
                <h4 className="font-semibold mb-2">Tabelas do Sistema:</h4>

                <div className="space-y-4">
                  {[
                    { name: "user_roles", fields: "id, user_id (FK), role (ENUM: admin | suporte | franqueado), created_at" },
                    { name: "profiles_franchisees", fields: "id, user_id, email, display_name, cnpj, cpf, phone, delivery_address (JSONB), contract_expiration_date, service_areas (JSONB), equipment_type, kess_serial, ktag_serial, street, city, state, zip_code" },
                    { name: "units", fields: "id, franchisee_id (FK), name, city, state, country, is_active" },
                    { name: "customers", fields: "id, unit_id (FK), full_name, cpf, cnpj, email, phone, address_line, address_city, address_state, active_city" },
                    { name: "vehicles", fields: "id, unit_id (FK), customer_id (FK), plate, brand, model, year, category, engine" },
                    { name: "received_files", fields: "id, unit_id (FK), customer_id (FK), vehicle_id (FK), placa, marca, modelo, servico, categorias[], status, arquivo_original_url, arquivo_modificado_url, valor_brl, plate_lookup_payload (JSONB)" },
                    { name: "file_status_history", fields: "id, arquivo_id, status_anterior, status_novo, observacao, alterado_por" },
                    { name: "products", fields: "id, sku, ref, name, brand, price, promo_price, promo_type, category, models[], specifications[], image_url, available, weight_kg" },
                    { name: "orders", fields: "id, franchise_profile_id (FK), unit_id (FK), order_number, status, payment_status, fulfillment_status, payment_method, payment_note, total_amount, subtotal, shipping_amount, discount_amount, items_count, delivery_address (JSONB), notes" },
                    { name: "order_items", fields: "id, order_id (FK), product_id (FK), product_name, product_sku, quantity, unit_price, line_total, product_snapshot (JSONB)" },
                    { name: "order_status_history", fields: "id, order_id (FK), previous_status, new_status, internal_note, changed_by" },
                    { name: "financial_entries", fields: "id, franchise_profile_id (FK), order_id (FK), scope (franqueado|matriz), entry_type (custo|receita), category, description, amount, competency_date" },
                    { name: "carts", fields: "id, unit_id" },
                    { name: "cart_items", fields: "id, cart_id (FK), product_id (FK), quantity" },
                    { name: "support_conversations", fields: "id, franqueado_id, subject, status, attachment_url, attachment_name" },
                    { name: "support_messages", fields: "id, conversation_id (FK), sender_id, sender_type, content" },
                    { name: "correction_tickets", fields: "id, arquivo_id, franqueado_id, motivo, status, arquivo_anexo_url, conversation_id (FK)" },
                    { name: "contract_history", fields: "id, franqueado_id, start_date, end_date, contract_type, status, notes, renewal_date" },
                    { name: "services", fields: "id, unit_id (FK), customer_id (FK), vehicle_id (FK), service_type, protocol, status, amount_brl, description" },
                    { name: "exports_log", fields: "id, requested_by_user_id, unit_id, export_type, filters_used (JSONB), accepted_privacy_terms, accepted_at" },
                    { name: "cities_reference", fields: "id, country, state, city, search_key" },
                    { name: "plate_lookup_cache", fields: "id, plate, country, payload (JSONB), expires_at" },
                    { name: "system_settings", fields: "id, key, value" },
                  ].map((table) => (
                    <div key={table.name} className="bg-muted/50 p-4 rounded-lg">
                      <h5 className="font-mono text-sm font-semibold mb-2 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Tabela</Badge>
                        {table.name}
                      </h5>
                      <code className="text-xs block whitespace-pre-wrap text-muted-foreground">{table.fields}</code>
                    </div>
                  ))}
                </div>

                <h4 className="font-semibold mt-4 mb-2">Segurança (RLS):</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                  <li>Franqueados só visualizam/modificam dados da própria unidade</li>
                  <li>Pedidos visíveis apenas para o franqueado que criou ou admins</li>
                  <li>Mensagens visíveis apenas para participantes da conversa</li>
                  <li>Inserção validada por autenticação (auth.uid())</li>
                  <li>Funções SECURITY DEFINER para evitar recursão em políticas RLS</li>
                  <li>Admin/Suporte podem visualizar e gerenciar todos os dados</li>
                </ul>

                <h4 className="font-semibold mt-4 mb-2">Storage Buckets:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                  <li><code className="text-xs bg-muted px-1 rounded">received-files</code> — Arquivos ECU originais e modificados (privado)</li>
                  <li><code className="text-xs bg-muted px-1 rounded">correction-files</code> — Anexos de tickets de correção (privado)</li>
                  <li><code className="text-xs bg-muted px-1 rounded">product-images</code> — Imagens de produtos da loja (público)</li>
                  <li><code className="text-xs bg-muted px-1 rounded">support-attachments</code> — Anexos de conversas de suporte (privado)</li>
                </ul>

                <h4 className="font-semibold mt-4 mb-2">Edge Functions:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                  <li><code className="text-xs bg-muted px-1 rounded">get-mapbox-token</code> — Retorna token público do Mapbox para o mapa de cobertura</li>
                  <li><code className="text-xs bg-muted px-1 rounded">import-franchisees</code> — Importação em massa de franqueados via CSV</li>
                  <li><code className="text-xs bg-muted px-1 rounded">import-ibge-cities</code> — Importação de cidades do IBGE para referência</li>
                  <li><code className="text-xs bg-muted px-1 rounded">lookup-plate</code> — Consulta de placas de veículos com cache</li>
                </ul>
              </Section>

              <Separator />

              {/* DESIGN SYSTEM */}
              <Section title="DESIGN SYSTEM" icon={<Palette className="h-5 w-5" />} isOpen={openSections.ui} onToggle={() => toggleSection("ui")}>
                <h4 className="font-semibold mb-2">Tema Visual:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm mb-4">
                  <li>Dark Premium com suporte a Light mode</li>
                  <li>Glassmorphism (backdrop-blur 12-20px)</li>
                  <li>Gradientes em tons de azul marinho, índigo e grafite</li>
                  <li>Cores semânticas via CSS variables HSL</li>
                  <li>Textura grain em containers</li>
                </ul>

                <h4 className="font-semibold mb-2">Componentes Base (Shadcn/UI):</h4>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
                  {["Button", "Card", "Dialog", "Drawer", "Table", "Tabs", "Form", "Input", "Select", "Badge", "Toast/Sonner", "Sidebar", "Sheet", "Popover", "Command", "Separator", "ScrollArea", "Collapsible"].map((c) => (
                    <Badge key={c} variant="outline">{c}</Badge>
                  ))}
                </div>

                <h4 className="font-semibold mb-2">Efeitos Especiais:</h4>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {["Neon Pulse (Alertas)", "Glassmorphism", "Typing Animation", "Hover Scale", "Fade In/Out", "Slide Animations"].map((e) => (
                    <Badge key={e}>{e}</Badge>
                  ))}
                </div>

                <h4 className="font-semibold mb-2">Componentes Customizados:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                  <li>Logo — SVG responsivo da marca</li>
                  <li>BannerCarousel — Carousel de banners na home</li>
                  <li>SupportChat — Chat em tempo real</li>
                  <li>TicketTimeline — Timeline visual de tickets</li>
                  <li>ClienteSelect — Seletor com cadastro inline</li>
                  <li>ProductCard — Card de produto com imagem, preço e promoção</li>
                  <li>CartDrawer — Drawer lateral do carrinho</li>
                  <li>OrderTimeline — Timeline visual de pagamento e logística</li>
                  <li>OrderTimelineFromHistory — Timeline baseada no histórico real</li>
                  <li>AdminOrderStatusPanel — Painel admin de gestão de status</li>
                  <li>OrderStatusBadges — Badges duplos de pagamento e logística</li>
                  <li>StoreSummaryCards — Cards de resumo da loja</li>
                  <li>TopProductsCard — Ranking de produtos</li>
                  <li>TopBuyingUnitsCard — Ranking de unidades</li>
                  <li>MonthlyStoreSalesChart — Gráfico mensal (Recharts)</li>
                  <li>CategoryRankingCard — Ranking por categoria</li>
                  <li>CoverageMap — Mapa de cobertura (Mapbox)</li>
                  <li>SecureAttachment — Download seguro com signed URLs</li>
                  <li>LGPDExportModal — Modal de exportação com conformidade LGPD</li>
                  <li>MermaidDiagram — Diagramas interativos (Mermaid.js)</li>
                </ul>
              </Section>

              <Separator />

              {/* FLUXOS DE TRABALHO */}
              <Section title="FLUXOS DE TRABALHO" icon={<GitBranch className="h-5 w-5" />} isOpen={openSections.fluxo} onToggle={() => toggleSection("fluxo")}>
                <h4 className="font-semibold mb-3">Fluxo de Envio de Arquivo:</h4>
                <div className="bg-muted/50 p-4 rounded-lg mb-6">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge>1. Seleciona Cliente</Badge><span>→</span>
                    <Badge>2. Escolhe Serviços</Badge><span>→</span>
                    <Badge>3. Upload ECU</Badge><span>→</span>
                    <Badge>4. Status: Pendente</Badge><span>→</span>
                    <Badge variant="secondary">5. Admin Processa</Badge><span>→</span>
                    <Badge variant="secondary">6. Status: Concluído</Badge><span>→</span>
                    <Badge>7. Download</Badge>
                  </div>
                </div>

                <h4 className="font-semibold mb-3">Fluxo de Pedido na Loja:</h4>
                <div className="bg-muted/50 p-4 rounded-lg mb-6">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge>1. Navega Catálogo</Badge><span>→</span>
                    <Badge>2. Adiciona ao Carrinho</Badge><span>→</span>
                    <Badge>3. Checkout (4 etapas)</Badge><span>→</span>
                    <Badge>4. Cria Pedido (DB)</Badge><span>→</span>
                    <Badge variant="secondary">5. WhatsApp</Badge><span>→</span>
                    <Badge>6. Visualiza Status</Badge><span>→</span>
                    <Badge variant="secondary">7. Admin Gerencia</Badge><span>→</span>
                    <Badge variant="secondary">8. Entregue</Badge>
                  </div>
                </div>

                <h4 className="font-semibold mb-3">Fluxo de Gestão de Status (Admin):</h4>
                <div className="bg-muted/50 p-4 rounded-lg mb-6">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant="secondary">1. Acessa Pedido</Badge><span>→</span>
                    <Badge variant="secondary">2. Altera Pagamento</Badge><span>→</span>
                    <Badge variant="secondary">3. Altera Logística</Badge><span>→</span>
                    <Badge variant="secondary">4. Observação Interna</Badge><span>→</span>
                    <Badge variant="secondary">5. Salva (Histórico)</Badge>
                  </div>
                </div>

                <h4 className="font-semibold mb-3">Fluxo de Correção:</h4>
                <div className="bg-muted/50 p-4 rounded-lg mb-6">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge>1. Detalhes Arquivo</Badge><span>→</span>
                    <Badge>2. Solicitar Correção</Badge><span>→</span>
                    <Badge>3. Preenche Motivo</Badge><span>→</span>
                    <Badge>4. Anexa Arquivo (opc)</Badge><span>→</span>
                    <Badge variant="secondary">5. Ticket Criado</Badge><span>→</span>
                    <Badge variant="secondary">6. Admin Analisa</Badge><span>→</span>
                    <Badge variant="secondary">7. Resolve</Badge>
                  </div>
                </div>

                <h4 className="font-semibold mb-3">Fluxo de Suporte:</h4>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge>1. Abre Conversa</Badge><span>→</span>
                    <Badge>2. Escreve Mensagem</Badge><span>→</span>
                    <Badge variant="secondary">3. Admin Recebe (Realtime)</Badge><span>→</span>
                    <Badge variant="secondary">4. Admin Responde</Badge><span>→</span>
                    <Badge>5. Franqueado Recebe (Realtime)</Badge><span>→</span>
                    <Badge variant="secondary">6. Fecha Conversa</Badge>
                  </div>
                </div>
              </Section>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
                <p>© {new Date().getFullYear()} Injediesel - Todos os direitos reservados</p>
                <p className="mt-1">Documento gerado automaticamente pelo sistema</p>
                <p className="mt-2 text-xs">Versão 3.0 - Atualizado em {currentDate}</p>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function Section({ title, icon, isOpen, onToggle, children }: { title: string; icon?: React.ReactNode; isOpen: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-2 hover:text-primary transition-colors">
        {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        {icon && <span className="text-primary">{icon}</span>}
        <h3 className="text-lg font-bold">{title}</h3>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-7 pt-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}

function FeatureItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
      <div>
        <span className="font-medium">{title}:</span>{" "}
        <span className="text-muted-foreground">{description}</span>
      </div>
    </div>
  );
}

function JourneyStep({ number, title, description, color }: { number: number; title: string; description: string; color: "blue" | "orange" }) {
  return (
    <div className="flex gap-4 pl-1">
      <div className={`w-7 h-7 rounded-full ${color === "blue" ? "bg-blue-500" : "bg-orange-500"} flex items-center justify-center shrink-0 z-10`}>
        <span className="text-xs font-bold text-white">{number}</span>
      </div>
      <div className={`bg-background/60 backdrop-blur p-3 rounded-lg border ${color === "blue" ? "border-blue-500/30" : "border-orange-500/30"} flex-1`}>
        <h5 className={`font-semibold ${color === "blue" ? "text-blue-400" : "text-orange-400"}`}>{title}</h5>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
