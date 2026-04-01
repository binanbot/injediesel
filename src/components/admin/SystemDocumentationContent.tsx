import { FileText, Map, Users, Shield, Database, Palette, GitBranch, Workflow, Network, Store, BookOpen } from "lucide-react";
import { MermaidDiagram } from "@/components/MermaidDiagram";

// ── Mermaid Diagrams ──────────────────────────────────────────────
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
    USER_ROLES { uuid id PK uuid user_id FK enum role }
    PROFILES_FRANCHISEES { uuid id PK uuid user_id FK text email text display_name text cnpj jsonb delivery_address date contract_expiration_date }
    UNITS { uuid id PK uuid franchisee_id FK text name text city text state }
    ORDERS { uuid id PK uuid franchise_profile_id FK uuid unit_id FK text order_number text status text payment_status text fulfillment_status text payment_method numeric total_amount jsonb delivery_address }
    ORDER_ITEMS { uuid id PK uuid order_id FK uuid product_id FK text product_name integer quantity numeric unit_price numeric line_total }
    ORDER_STATUS_HISTORY { uuid id PK uuid order_id FK text previous_status text new_status text internal_note uuid changed_by }
    PRODUCTS { uuid id PK text sku text name text brand numeric price text category boolean available }
    FINANCIAL_ENTRIES { uuid id PK uuid order_id FK uuid franchise_profile_id FK text scope text entry_type text category numeric amount }
`;

// ── Helper: conditional class ──────────────────────────────────────
type PM = { printMode: boolean };

const cx = (printMode: boolean, dark: string, light: string) =>
  printMode ? light : dark;

// ── Sub-components ─────────────────────────────────────────────────
function SectionTitle({ children, printMode }: { children: React.ReactNode } & PM) {
  return (
    <h2
      className={cx(
        printMode,
        "text-lg font-bold flex items-center gap-2 mb-3",
        "text-lg font-bold flex items-center gap-2 mb-3 text-slate-900 border-b-2 border-blue-500 pb-1"
      )}
    >
      {children}
    </h2>
  );
}

function SectionBlock({ children, printMode }: { children: React.ReactNode } & PM) {
  return (
    <div className={cx(printMode, "mb-6", "mb-6 break-inside-avoid")}>
      {children}
    </div>
  );
}

function InfoCard({ children, printMode }: { children: React.ReactNode } & PM) {
  return (
    <div
      className={cx(
        printMode,
        "bg-muted/50 p-4 rounded-lg",
        "bg-slate-50 border border-slate-200 p-4 rounded-lg"
      )}
    >
      {children}
    </div>
  );
}

function BadgeItem({ children, printMode, variant = "outline" }: { children: React.ReactNode; variant?: string } & PM) {
  return (
    <span
      className={cx(
        printMode,
        `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variant === "secondary" ? "bg-secondary text-secondary-foreground border-border" : "border-border text-foreground"}`,
        `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border border-slate-300 ${variant === "secondary" ? "bg-slate-200 text-slate-700" : "bg-slate-50 text-slate-700"}`
      )}
    >
      {children}
    </span>
  );
}

function FeatureItem({ title, description, printMode }: { title: string; description: string } & PM) {
  return (
    <div className="flex gap-3">
      <div className={cx(printMode, "w-2 h-2 rounded-full bg-primary mt-2 shrink-0", "w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0")} />
      <div>
        <span className={cx(printMode, "font-medium", "font-medium text-slate-900")}>{title}:</span>{" "}
        <span className={cx(printMode, "text-muted-foreground", "text-slate-600")}>{description}</span>
      </div>
    </div>
  );
}

function JourneyStep({ number, title, description, color, printMode }: { number: number; title: string; description: string; color: "blue" | "orange" } & PM) {
  const bgColor = color === "blue" ? "bg-blue-500" : "bg-orange-500";
  const textColor = color === "blue"
    ? cx(printMode, "text-blue-400", "text-blue-700")
    : cx(printMode, "text-orange-400", "text-orange-700");
  const borderColor = color === "blue" ? "border-blue-500/30" : "border-orange-500/30";

  return (
    <div className="flex gap-4 pl-1">
      <div className={`w-7 h-7 rounded-full ${bgColor} flex items-center justify-center shrink-0 z-10`}>
        <span className="text-xs font-bold text-white">{number}</span>
      </div>
      <div className={cx(
        printMode,
        `bg-background/60 backdrop-blur p-3 rounded-lg border ${borderColor} flex-1`,
        `bg-white p-3 rounded-lg border ${borderColor} flex-1`
      )}>
        <h5 className={`font-semibold ${textColor}`}>{title}</h5>
        <p className={cx(printMode, "text-sm text-muted-foreground", "text-sm text-slate-600")}>{description}</p>
      </div>
    </div>
  );
}

// ── Flow badge row ─────────────────────────────────────────────────
function FlowSteps({ steps, printMode }: { steps: { label: string; secondary?: boolean }[] } & PM) {
  return (
    <InfoCard printMode={printMode}>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {steps.map((s, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span className={cx(printMode, "text-muted-foreground", "text-slate-400")}>→</span>}
            <BadgeItem printMode={printMode} variant={s.secondary ? "secondary" : "outline"}>{s.label}</BadgeItem>
          </span>
        ))}
      </div>
    </InfoCard>
  );
}

// ── Main component ─────────────────────────────────────────────────
type Props = {
  printMode?: boolean;
};

export function SystemDocumentationContent({ printMode = false }: Props) {
  const currentDate = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const headingColor = cx(printMode, "text-foreground", "text-slate-900");
  const subtextColor = cx(printMode, "text-muted-foreground", "text-slate-600");
  const listColor = cx(printMode, "text-muted-foreground text-sm", "text-slate-600 text-sm");

  return (
    <div className={cx(printMode, "", "bg-white text-slate-900")}>
      <div className={cx(printMode, "p-6", "mx-auto w-full max-w-[1100px] p-10")}>

        {/* ── HEADER ───────────────────────── */}
        <header className={cx(printMode, "text-center border-b pb-6 mb-6", "text-center border-b border-slate-200 pb-6 mb-8")}>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className={cx(printMode, "w-12 h-12 bg-primary rounded-lg flex items-center justify-center", "w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center")}>
              <FileText className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className={cx(printMode, "text-2xl font-bold", "text-3xl font-bold text-slate-900")}>SISTEMA INJEDIESEL</h1>
          <p className={subtextColor}>
            Sistema de Gestão de Arquivos ECU e Loja Promax para Franqueados
          </p>
          <div className={`flex items-center justify-center gap-4 mt-4 text-sm ${subtextColor}`}>
            <span>Versão: 4.0</span>
            <span>•</span>
            <span>Data: {currentDate}</span>
          </div>
        </header>

        {/* ── DIAGRAMAS ────────────────────── */}
        <div id="diagramas" className="scroll-mt-20" />
        {!printMode && (
          <SectionBlock printMode={printMode}>
            <SectionTitle printMode={printMode}>
              <Network className="h-5 w-5 text-primary" />
              DIAGRAMAS DE ARQUITETURA
            </SectionTitle>
            <div className="space-y-8">
              <div>
                <h4 className="font-semibold mb-3">1. Arquitetura Geral do Sistema</h4>
                <MermaidDiagram chart={ARCHITECTURE_DIAGRAM} id="architecture" />
              </div>
              <div>
                <h4 className="font-semibold mb-3">2. Fluxo de Dados - Autenticação e Envio de Arquivo</h4>
                <MermaidDiagram chart={DATA_FLOW_DIAGRAM} id="dataflow" />
              </div>
              <div>
                <h4 className="font-semibold mb-3">3. Fluxo de Pedido - Loja Promax</h4>
                <MermaidDiagram chart={ORDER_FLOW_DIAGRAM} id="orderflow" />
              </div>
              <div>
                <h4 className="font-semibold mb-3">4. Fluxo de Suporte em Tempo Real</h4>
                <MermaidDiagram chart={SUPPORT_FLOW_DIAGRAM} id="support" />
              </div>
              <div>
                <h4 className="font-semibold mb-3">5. Modelo de Dados (ER Diagram)</h4>
                <MermaidDiagram chart={DATABASE_DIAGRAM} id="database" />
              </div>
            </div>
          </SectionBlock>
        )}

        {printMode && (
          <SectionBlock printMode={printMode}>
            <SectionTitle printMode={printMode}>
              <Network className="h-5 w-5 text-blue-500" />
              DIAGRAMAS DE ARQUITETURA
            </SectionTitle>
            <p className={subtextColor}>
              Os diagramas interativos (Mermaid.js) estão disponíveis apenas na versão online do sistema.
              Acesse /admin/documentacao para visualizá-los.
            </p>
          </SectionBlock>
        )}

        <hr className={cx(printMode, "border-border my-4", "border-slate-200 my-6")} />

        {/* ── MAPA MENTAL ──────────────────── */}
        <div id="mapa-mental" className="scroll-mt-20" />
        <SectionBlock printMode={printMode}>
          <SectionTitle printMode={printMode}>
            <Map className="h-5 w-5" />
            MAPA MENTAL DO SISTEMA
          </SectionTitle>
          <div className={cx(printMode, "bg-gradient-to-br from-muted/50 to-muted/30 p-6 rounded-xl border", "bg-slate-50 p-6 rounded-xl border border-slate-200")}>
            <div className="text-center mb-6">
              <div className={cx(printMode, "inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-3", "inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-3")}>
                <span className="text-2xl font-bold text-white">ID</span>
              </div>
              <h3 className={`text-xl font-bold ${headingColor}`}>INJEDIESEL SYSTEM</h3>
              <p className={`text-sm ${subtextColor}`}>Plataforma SaaS B2B</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Franqueado */}
              <div className={cx(printMode, "bg-background/60 backdrop-blur p-4 rounded-lg border border-blue-500/30", "bg-white p-4 rounded-lg border border-blue-300")}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <h4 className={cx(printMode, "font-bold text-blue-400", "font-bold text-blue-700")}>PAINEL FRANQUEADO</h4>
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
                      <div className="w-2 h-2 bg-blue-400 rounded-full shrink-0" />
                      <span className={cx(printMode, "", "text-slate-700")}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin */}
              <div className={cx(printMode, "bg-background/60 backdrop-blur p-4 rounded-lg border border-orange-500/30", "bg-white p-4 rounded-lg border border-orange-300")}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  <h4 className={cx(printMode, "font-bold text-orange-400", "font-bold text-orange-700")}>PAINEL ADMINISTRATIVO</h4>
                </div>
                <div className="space-y-2 text-sm">
                  {[
                    "Dashboard (KPIs + Alertas)",
                    "Arquivos (Gestão + Processamento)",
                    "Correções (Tickets de Correção)",
                    "Franqueados (Gestão + Importação)",
                    "Clientes (CRUD + Veículos)",
                    "Loja Promax - Produtos (CRUD + Importação/Exportação)",
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
                      <div className="w-2 h-2 bg-orange-400 rounded-full shrink-0" />
                      <span className={cx(printMode, "", "text-slate-700")}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </SectionBlock>

        <hr className={cx(printMode, "border-border my-4", "border-slate-200 my-6")} />

        {/* ── JORNADAS ─────────────────────── */}
        <SectionBlock printMode={printMode}>
          <SectionTitle printMode={printMode}>
            <Workflow className="h-5 w-5" />
            JORNADAS DO USUÁRIO
          </SectionTitle>

          <div className="mb-8">
            <h4 className={`font-bold text-lg mb-4 flex items-center gap-2 ${headingColor}`}>
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"><span className="text-xs text-white font-bold">F</span></div>
              Jornada do Franqueado
            </h4>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-blue-500/30" />
              <div className="space-y-4">
                <JourneyStep printMode={printMode} number={1} title="Login" description="Autenticação com email/senha → Redirecionamento para /franqueado" color="blue" />
                <JourneyStep printMode={printMode} number={2} title="Home Dashboard" description="Estatísticas pessoais, arquivos recentes, atalhos rápidos e banner carousel" color="blue" />
                <JourneyStep printMode={printMode} number={3} title="Enviar Arquivo" description="Seleciona cliente, escolhe serviços por categoria, faz upload do ECU" color="blue" />
                <JourneyStep printMode={printMode} number={4} title="Acompanhar Status" description="Em 'Meus Arquivos' visualiza status: Pendente → Em Análise → Concluído" color="blue" />
                <JourneyStep printMode={printMode} number={5} title="Loja Promax" description="Navega catálogo de produtos, adiciona ao carrinho (Zustand + localStorage)" color="blue" />
                <JourneyStep printMode={printMode} number={6} title="Checkout Multi-etapa" description="Revisão → Endereço (ViaCEP) → Pagamento → Confirmação e envio via WhatsApp" color="blue" />
                <JourneyStep printMode={printMode} number={7} title="Acompanhar Pedido" description="Timeline visual com status de pagamento e logística, histórico detalhado" color="blue" />
                <JourneyStep printMode={printMode} number={8} title="Solicitar Correção" description="Abre ticket de correção com motivo e anexo opcional" color="blue" />
                <JourneyStep printMode={printMode} number={9} title="Relatórios" description="Faturamento por período, gráficos por categoria de serviço" color="blue" />
                <JourneyStep printMode={printMode} number={10} title="Suporte" description="Chat em tempo real, histórico de conversas, contato via WhatsApp/telefone" color="blue" />
              </div>
            </div>
          </div>

          <div>
            <h4 className={`font-bold text-lg mb-4 flex items-center gap-2 ${headingColor}`}>
              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center"><span className="text-xs text-white font-bold">A</span></div>
              Jornada do Administrador
            </h4>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-orange-500/30" />
              <div className="space-y-4">
                <JourneyStep printMode={printMode} number={1} title="Login Admin" description="Autenticação com role 'admin' ou 'suporte' → Redirecionamento para /admin" color="orange" />
                <JourneyStep printMode={printMode} number={2} title="Dashboard" description="Alertas prioritários, KPIs, arquivos pendentes" color="orange" />
                <JourneyStep printMode={printMode} number={3} title="Processar Arquivos" description="Fila de arquivos, processa ECU, upload de arquivo modificado" color="orange" />
                <JourneyStep printMode={printMode} number={4} title="Gerenciar Pedidos (Loja)" description="Lista de compras, detalhe com timeline, painel de status de pagamento e logística separados" color="orange" />
                <JourneyStep printMode={printMode} number={5} title="Dashboard Loja Promax" description="Cards de resumo, top 10 produtos, top 10 unidades, gráfico mensal, ranking por categoria" color="orange" />
                <JourneyStep printMode={printMode} number={6} title="Gerenciar Correções" description="Tickets de correção, timeline, chat com franqueado" color="orange" />
                <JourneyStep printMode={printMode} number={7} title="Atender Suporte" description="Responde tickets e chats em tempo real" color="orange" />
                <JourneyStep printMode={printMode} number={8} title="Gestão de Franqueados" description="CRUD, importação em massa, áreas de cobertura (Mapbox)" color="orange" />
                <JourneyStep printMode={printMode} number={9} title="Gestão de Clientes" description="CRUD de clientes e veículos vinculados a unidades" color="orange" />
                <JourneyStep printMode={printMode} number={10} title="Gestão de Produtos" description="CRUD de produtos, importação/exportação em massa, imagens via Storage" color="orange" />
                <JourneyStep printMode={printMode} number={11} title="Relatórios" description="Analytics, top revendas, desempenho por categoria, exportação com conformidade LGPD" color="orange" />
                <JourneyStep printMode={printMode} number={12} title="Contratos" description="Gestão de contratos com histórico e alertas de vencimento" color="orange" />
              </div>
            </div>
          </div>
        </SectionBlock>

        <hr className={cx(printMode, "border-border my-4", "border-slate-200 my-6")} />

        {/* ── VISÃO GERAL ──────────────────── */}
        <SectionBlock printMode={printMode}>
          <SectionTitle printMode={printMode}>
            <GitBranch className="h-5 w-5" />
            VISÃO GERAL DO SISTEMA
          </SectionTitle>
          <p className={`mb-4 ${cx(printMode, "", "text-slate-700")}`}>
            O sistema é uma plataforma SaaS B2B para gestão de arquivos de ECU (Engine Control Unit)
            e loja de peças/acessórios entre franqueados e a franqueadora Injediesel.
            Permite envio e processamento de arquivos, compra de produtos via loja online
            com checkout integrado ao WhatsApp, e comunicação em tempo real.
          </p>

          <h4 className={`font-semibold mb-2 ${headingColor}`}>Tecnologias Utilizadas:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {["React 18 + TypeScript", "Vite", "Tailwind CSS", "Framer Motion", "Lovable Cloud", "PostgreSQL", "Supabase Auth", "Supabase Realtime", "React Query", "React Router v7", "Shadcn/UI", "Lucide Icons", "Zustand (Carrinho)", "Recharts (Gráficos)", "Mapbox GL", "Mermaid.js"].map((t) => (
              <BadgeItem key={t} printMode={printMode}>{t}</BadgeItem>
            ))}
          </div>

          <h4 className={`font-semibold mb-2 ${headingColor}`}>Arquitetura:</h4>
          <ul className={`list-disc list-inside space-y-1 ${listColor}`}>
            <li>Frontend: SPA React com roteamento client-side e lazy loading</li>
            <li>Backend: Lovable Cloud (Supabase) com Edge Functions</li>
            <li>Database: PostgreSQL com RLS (Row Level Security)</li>
            <li>Storage: Supabase Storage para arquivos, anexos e imagens de produtos</li>
            <li>Realtime: WebSocket para chat e notificações</li>
            <li>Estado local: Zustand com persistência em localStorage para carrinho</li>
            <li>Integrações: WhatsApp (pedidos), ViaCEP (endereços), Mapbox (cobertura)</li>
          </ul>
        </SectionBlock>

        <hr className={cx(printMode, "border-border my-4", "border-slate-200 my-6")} />

        {/* ── AUTENTICAÇÃO ─────────────────── */}
        <SectionBlock printMode={printMode}>
          <SectionTitle printMode={printMode}>
            <Shield className="h-5 w-5" />
            AUTENTICAÇÃO E RBAC
          </SectionTitle>

          <h4 className={`font-semibold mb-2 ${headingColor}`}>Sistema de Autenticação:</h4>
          <ul className={`list-disc list-inside mb-4 space-y-1 ${listColor}`}>
            <li>Autenticação via Supabase Auth (email/senha)</li>
            <li>Sessões gerenciadas automaticamente com JWT</li>
            <li>Rotas protegidas via ProtectedRoute component</li>
            <li>Roles armazenadas em tabela separada (user_roles) para segurança</li>
          </ul>

          <h4 className={`font-semibold mb-2 ${headingColor}`}>Níveis de Acesso (RBAC):</h4>
          <div className="overflow-x-auto">
            <table className={cx(printMode, "w-full text-sm border", "w-full text-sm border border-slate-300")}>
              <thead className={cx(printMode, "bg-muted", "bg-slate-100")}>
                <tr>
                  <th className={cx(printMode, "p-2 text-left border", "p-2 text-left border border-slate-300 text-slate-900")}>Role</th>
                  <th className={cx(printMode, "p-2 text-left border", "p-2 text-left border border-slate-300 text-slate-900")}>Rotas</th>
                  <th className={cx(printMode, "p-2 text-left border", "p-2 text-left border border-slate-300 text-slate-900")}>Permissões</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={cx(printMode, "p-2 border", "p-2 border border-slate-300")}><BadgeItem printMode={printMode}>franqueado</BadgeItem></td>
                  <td className={cx(printMode, "p-2 border font-mono text-xs", "p-2 border border-slate-300 font-mono text-xs")}>/franqueado/*</td>
                  <td className={cx(printMode, "p-2 border", "p-2 border border-slate-300")}>Acesso ao painel de franqueado e loja</td>
                </tr>
                <tr>
                  <td className={cx(printMode, "p-2 border", "p-2 border border-slate-300")}><BadgeItem printMode={printMode}>suporte</BadgeItem></td>
                  <td className={cx(printMode, "p-2 border font-mono text-xs", "p-2 border border-slate-300 font-mono text-xs")}>/admin/* + /franqueado/*</td>
                  <td className={cx(printMode, "p-2 border", "p-2 border border-slate-300")}>Acesso admin e franqueado para suporte</td>
                </tr>
                <tr>
                  <td className={cx(printMode, "p-2 border", "p-2 border border-slate-300")}><BadgeItem printMode={printMode}>admin</BadgeItem></td>
                  <td className={cx(printMode, "p-2 border font-mono text-xs", "p-2 border border-slate-300 font-mono text-xs")}>/admin/* + /franqueado/*</td>
                  <td className={cx(printMode, "p-2 border", "p-2 border border-slate-300")}>Acesso total ao sistema</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4 className={`font-semibold mt-4 mb-2 ${headingColor}`}>Funções de Segurança (SECURITY DEFINER):</h4>
          <ul className={`list-disc list-inside space-y-1 ${listColor}`}>
            <li><code className={cx(printMode, "text-xs bg-muted px-1 rounded", "text-xs bg-slate-100 px-1 rounded")}>has_role(user_id, role)</code> — Verifica se usuário possui determinada role</li>
            <li><code className={cx(printMode, "text-xs bg-muted px-1 rounded", "text-xs bg-slate-100 px-1 rounded")}>is_franchisor_admin(user_id)</code> — Verifica se é admin ou suporte</li>
            <li><code className={cx(printMode, "text-xs bg-muted px-1 rounded", "text-xs bg-slate-100 px-1 rounded")}>get_user_unit_id(user_id)</code> — Retorna o unit_id do franqueado</li>
          </ul>
        </SectionBlock>

        <hr className={cx(printMode, "border-border my-4", "border-slate-200 my-6")} />

        {/* ── PAINEL FRANQUEADO ─────────────── */}
        <SectionBlock printMode={printMode}>
          <SectionTitle printMode={printMode}>
            <Users className="h-5 w-5" />
            PAINEL DO FRANQUEADO
          </SectionTitle>

          <h4 className={`font-semibold mb-2 ${headingColor}`}>Rotas Disponíveis:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
            {["/franqueado", "/franqueado/enviar", "/franqueado/arquivos", "/franqueado/arquivos/:id", "/franqueado/loja", "/franqueado/loja/carrinho", "/franqueado/loja/checkout", "/franqueado/loja/pedidos", "/franqueado/loja/pedidos/:id", "/franqueado/atualizacoes", "/franqueado/tutoriais", "/franqueado/materiais", "/franqueado/mensagens", "/franqueado/relatorios", "/franqueado/suporte", "/franqueado/perfil", "/franqueado/cursos"].map((r) => (
              <BadgeItem key={r} printMode={printMode} variant="secondary">{r}</BadgeItem>
            ))}
          </div>

          <h4 className={`font-semibold mb-2 ${headingColor}`}>Funcionalidades Principais:</h4>
          <div className="space-y-3">
            <FeatureItem printMode={printMode} title="Home" description="Dashboard com estatísticas, arquivos recentes com ação rápida, atalhos e banner carousel" />
            <FeatureItem printMode={printMode} title="Enviar Arquivo" description="Seleção/cadastro de cliente, serviços por categoria, upload de arquivo ECU com validações" />
            <FeatureItem printMode={printMode} title="Meus Arquivos" description="Lista paginada com filtros por status, busca por nome, detalhes com timeline" />
            <FeatureItem printMode={printMode} title="Loja Promax" description="Catálogo de produtos com busca e filtros, cards com imagem/preço/promoção, carrinho local (Zustand)" />
            <FeatureItem printMode={printMode} title="Checkout" description="Multi-etapa: Revisão → Entrega (ViaCEP) → Pagamento (7 métodos) → Confirmação e envio via WhatsApp" />
            <FeatureItem printMode={printMode} title="Meus Pedidos" description="Lista de pedidos com badges de status, filtros por período e status" />
            <FeatureItem printMode={printMode} title="Detalhe do Pedido" description="Timeline visual de pagamento e logística, badges de status, endereço, pagamento, itens, histórico" />
            <FeatureItem printMode={printMode} title="Solicitar Correção" description="Formulário com motivo obrigatório, anexo opcional, cria ticket e conversa de suporte" />
            <FeatureItem printMode={printMode} title="Relatórios" description="Faturamento por período com gráficos por categoria de serviço" />
            <FeatureItem printMode={printMode} title="Suporte" description="Chat em tempo real via Realtime, histórico de conversas, WhatsApp/telefone/email" />
            <FeatureItem printMode={printMode} title="Perfil" description="Dados pessoais, endereço de entrega padrão, equipamentos, contrato" />
          </div>
        </SectionBlock>

        <hr className={cx(printMode, "border-border my-4", "border-slate-200 my-6")} />

        {/* ── LOJA PROMAX ──────────────────── */}
        <SectionBlock printMode={printMode}>
          <SectionTitle printMode={printMode}>
            <Store className="h-5 w-5" />
            LOJA PROMAX
          </SectionTitle>

          <h4 className={`font-semibold mb-2 ${headingColor}`}>Visão Geral:</h4>
          <p className={`text-sm mb-4 ${subtextColor}`}>
            A Loja Promax é o módulo de e-commerce B2B integrado ao sistema, permitindo que franqueados
            comprem peças e acessórios diretamente pela plataforma com confirmação via WhatsApp.
          </p>

          <h4 className={`font-semibold mb-2 ${headingColor}`}>Carrinho de Compras:</h4>
          <ul className={`list-disc list-inside space-y-1 mb-4 ${listColor}`}>
            <li>Estado gerenciado por Zustand (useCartStore)</li>
            <li>Persistência em localStorage (chave: promax-cart)</li>
            <li>Interface CartItem: id, name, sku, price, quantity, image, category</li>
            <li>Operações: addItem, removeItem, updateQuantity, clearCart, getTotal</li>
          </ul>

          <h4 className={`font-semibold mb-2 ${headingColor}`}>Checkout Multi-etapa:</h4>
          <FlowSteps printMode={printMode} steps={[
            { label: "1. Revisão" },
            { label: "2. Entrega (ViaCEP)" },
            { label: "3. Pagamento" },
            { label: "4. Confirmação" },
            { label: "WhatsApp", secondary: true },
          ]} />

          <h4 className={`font-semibold mt-4 mb-2 ${headingColor}`}>Formas de Pagamento:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {["PIX", "Boleto", "Cartão de Crédito", "Cartão de Débito", "Transferência", "A Prazo", "Pagamento na Entrega"].map((p) => (
              <BadgeItem key={p} printMode={printMode}>{p}</BadgeItem>
            ))}
          </div>

          <h4 className={`font-semibold mb-2 ${headingColor}`}>Gestão de Status (Admin):</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <InfoCard printMode={printMode}>
              <h5 className={`font-semibold text-sm mb-2 ${headingColor}`}>💳 Status de Pagamento</h5>
              <div className={`space-y-1 text-sm ${subtextColor}`}>
                {["Pendente", "Aguardando Comprovante", "Aprovado", "Recusado", "Estornado"].map((s) => (
                  <div key={s} className="flex items-center gap-2"><div className="w-2 h-2 bg-amber-400 rounded-full" />{s}</div>
                ))}
              </div>
            </InfoCard>
            <InfoCard printMode={printMode}>
              <h5 className={`font-semibold text-sm mb-2 ${headingColor}`}>📦 Status de Logística</h5>
              <div className={`space-y-1 text-sm ${subtextColor}`}>
                {["Pedido Realizado", "Em Separação", "Em Preparação", "Enviado", "Em Trânsito", "Entregue", "Cancelado"].map((s) => (
                  <div key={s} className="flex items-center gap-2"><div className={cx(printMode, "w-2 h-2 bg-primary rounded-full", "w-2 h-2 bg-blue-500 rounded-full")} />{s}</div>
                ))}
              </div>
            </InfoCard>
          </div>

          <h4 className={`font-semibold mt-4 mb-2 ${headingColor}`}>Componentes da Loja:</h4>
          <div className="space-y-3">
            <FeatureItem printMode={printMode} title="ProductCard" description="Card com imagem, nome, preço, promoção, badge de categoria e botão de adicionar" />
            <FeatureItem printMode={printMode} title="CartDrawer" description="Drawer lateral com itens do carrinho, quantidades e resumo" />
            <FeatureItem printMode={printMode} title="DeliveryAddressForm" description="Formulário de endereço com integração ViaCEP e botão 'Usar endereço do cadastro'" />
            <FeatureItem printMode={printMode} title="PaymentMethodForm" description="Seletor de forma de pagamento com observação opcional" />
            <FeatureItem printMode={printMode} title="OrderTimeline" description="Timeline visual com ícones e estados (concluído/atual/aguardando/interrompido)" />
            <FeatureItem printMode={printMode} title="OrderTimelineFromHistory" description="Timeline baseada no histórico real de order_status_history com data/hora" />
            <FeatureItem printMode={printMode} title="AdminOrderStatusPanel" description="Painel admin com selects de pagamento e logística, observação interna e histórico" />
            <FeatureItem printMode={printMode} title="OrderStatusBadges" description="Badges visuais de payment_status e fulfillment_status" />
          </div>

          <h4 className={`font-semibold mt-4 mb-2 ${headingColor}`}>Dashboard de Inteligência Comercial (Admin):</h4>
          <div className="space-y-3">
            <FeatureItem printMode={printMode} title="StoreSummaryCards" description="Faturamento total, pedidos totais, ticket médio, itens vendidos" />
            <FeatureItem printMode={printMode} title="TopProductsCard" description="Top 10 produtos por quantidade vendida e por faturamento" />
            <FeatureItem printMode={printMode} title="TopBuyingUnitsCard" description="Top 10 unidades que mais compram (pedidos, valor, ticket médio, itens)" />
            <FeatureItem printMode={printMode} title="MonthlyStoreSalesChart" description="Gráfico Recharts com faturamento e pedidos mensais" />
            <FeatureItem printMode={printMode} title="CategoryRankingCard" description="Ranking por categoria de produto (quantidade, faturamento, pedidos)" />
          </div>
        </SectionBlock>

        <hr className={cx(printMode, "border-border my-4", "border-slate-200 my-6")} />

        {/* ── PAINEL ADMIN ─────────────────── */}
        <SectionBlock printMode={printMode}>
          <SectionTitle printMode={printMode}>
            <Shield className="h-5 w-5" />
            PAINEL ADMINISTRATIVO
          </SectionTitle>

          <h4 className={`font-semibold mb-2 ${headingColor}`}>Rotas Disponíveis:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
            {["/admin", "/admin/arquivos", "/admin/arquivos/:id", "/admin/correcoes", "/admin/franqueados", "/admin/franqueados/:id", "/admin/importar", "/admin/cobertura", "/admin/clientes", "/admin/clientes/:id", "/admin/produtos", "/admin/compras", "/admin/compras/:id", "/admin/loja-dashboard", "/admin/areas", "/admin/banners", "/admin/mensagens", "/admin/suporte", "/admin/relatorios", "/admin/contratos", "/admin/configuracoes", "/admin/documentacao"].map((r) => (
              <BadgeItem key={r} printMode={printMode} variant="secondary">{r}</BadgeItem>
            ))}
          </div>

          <h4 className={`font-semibold mb-2 ${headingColor}`}>Funcionalidades Principais:</h4>
          <div className="space-y-3">
            <FeatureItem printMode={printMode} title="Dashboard" description="Alertas neon de prioridade, KPIs em cards, resumo de pendências, atividade recente" />
            <FeatureItem printMode={printMode} title="Gestão de Arquivos" description="Fila de processamento, detalhes com timeline, upload de arquivo modificado, status" />
            <FeatureItem printMode={printMode} title="Tickets de Correção" description="Lista com status, timeline visual, painel de chat integrado, resolução" />
            <FeatureItem printMode={printMode} title="Franqueados" description="CRUD completo, importação em massa, detalhe com contrato, receita, clientes, suporte" />
            <FeatureItem printMode={printMode} title="Clientes e Veículos" description="CRUD vinculado a unidades, histórico de serviços" />
            <FeatureItem printMode={printMode} title="Produtos" description="CRUD com imagens via Storage, importação/exportação em massa (.xlsx), categorias" />
            <FeatureItem printMode={printMode} title="Compras dos Franqueados" description="Lista de pedidos com badges duplos, detalhe com timeline, painel de status admin" />
            <FeatureItem printMode={printMode} title="Dashboard Loja Promax" description="Inteligência comercial com filtros por período: resumo, top produtos, top unidades, vendas mensais, categorias" />
            <FeatureItem printMode={printMode} title="Cobertura" description="Mapa interativo Mapbox com áreas de atuação e cidades" />
            <FeatureItem printMode={printMode} title="Contratos" description="Gestão de contratos com histórico, tipos e alertas de vencimento" />
            <FeatureItem printMode={printMode} title="Relatórios" description="Top 10 revendas, desempenho por categoria, exportação com conformidade LGPD" />
            <FeatureItem printMode={printMode} title="Suporte" description="Todas as conversas, filtros por status, chat em tempo real" />
            <FeatureItem printMode={printMode} title="Documentação" description="Esta página - documentação técnica completa com exportação PDF" />
          </div>
        </SectionBlock>

        <hr className={cx(printMode, "border-border my-4", "border-slate-200 my-6")} />

        {/* ── BANCO DE DADOS ───────────────── */}
        <SectionBlock printMode={printMode}>
          <SectionTitle printMode={printMode}>
            <Database className="h-5 w-5" />
            BANCO DE DADOS
          </SectionTitle>

          <h4 className={`font-semibold mb-2 ${headingColor}`}>Tabelas do Sistema:</h4>
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
              <InfoCard key={table.name} printMode={printMode}>
                <h5 className={`font-mono text-sm font-semibold mb-2 flex items-center gap-2 ${headingColor}`}>
                  <BadgeItem printMode={printMode}>Tabela</BadgeItem>
                  {table.name}
                </h5>
                <code className={`text-xs block whitespace-pre-wrap ${subtextColor}`}>{table.fields}</code>
              </InfoCard>
            ))}
          </div>

          <h4 className={`font-semibold mt-4 mb-2 ${headingColor}`}>Segurança (RLS):</h4>
          <ul className={`list-disc list-inside space-y-1 ${listColor}`}>
            <li>Franqueados só visualizam/modificam dados da própria unidade</li>
            <li>Pedidos visíveis apenas para o franqueado que criou ou admins</li>
            <li>Mensagens visíveis apenas para participantes da conversa</li>
            <li>Inserção validada por autenticação (auth.uid())</li>
            <li>Funções SECURITY DEFINER para evitar recursão em políticas RLS</li>
            <li>Admin/Suporte podem visualizar e gerenciar todos os dados</li>
          </ul>

          <h4 className={`font-semibold mt-4 mb-2 ${headingColor}`}>Storage Buckets:</h4>
          <ul className={`list-disc list-inside space-y-1 ${listColor}`}>
            <li><code className={cx(printMode, "text-xs bg-muted px-1 rounded", "text-xs bg-slate-100 px-1 rounded")}>received-files</code> — Arquivos ECU originais e modificados (privado)</li>
            <li><code className={cx(printMode, "text-xs bg-muted px-1 rounded", "text-xs bg-slate-100 px-1 rounded")}>correction-files</code> — Anexos de tickets de correção (privado)</li>
            <li><code className={cx(printMode, "text-xs bg-muted px-1 rounded", "text-xs bg-slate-100 px-1 rounded")}>product-images</code> — Imagens de produtos da loja (público)</li>
            <li><code className={cx(printMode, "text-xs bg-muted px-1 rounded", "text-xs bg-slate-100 px-1 rounded")}>support-attachments</code> — Anexos de conversas de suporte (privado)</li>
          </ul>

          <h4 className={`font-semibold mt-4 mb-2 ${headingColor}`}>Edge Functions:</h4>
          <ul className={`list-disc list-inside space-y-1 ${listColor}`}>
            <li><code className={cx(printMode, "text-xs bg-muted px-1 rounded", "text-xs bg-slate-100 px-1 rounded")}>get-mapbox-token</code> — Retorna token público do Mapbox para o mapa de cobertura</li>
            <li><code className={cx(printMode, "text-xs bg-muted px-1 rounded", "text-xs bg-slate-100 px-1 rounded")}>import-franchisees</code> — Importação em massa de franqueados via CSV</li>
            <li><code className={cx(printMode, "text-xs bg-muted px-1 rounded", "text-xs bg-slate-100 px-1 rounded")}>import-ibge-cities</code> — Importação de cidades do IBGE para referência</li>
            <li><code className={cx(printMode, "text-xs bg-muted px-1 rounded", "text-xs bg-slate-100 px-1 rounded")}>lookup-plate</code> — Consulta de placas de veículos com cache</li>
            <li><code className={cx(printMode, "text-xs bg-muted px-1 rounded", "text-xs bg-slate-100 px-1 rounded")}>export-products</code> — Exportação de produtos em formato Excel (.xlsx)</li>
            <li><code className={cx(printMode, "text-xs bg-muted px-1 rounded", "text-xs bg-slate-100 px-1 rounded")}>import-products</code> — Importação/atualização em massa de produtos via Excel (.xlsx)</li>
          </ul>
        </SectionBlock>

        <hr className={cx(printMode, "border-border my-4", "border-slate-200 my-6")} />

        {/* ── DESIGN SYSTEM ────────────────── */}
        <SectionBlock printMode={printMode}>
          <SectionTitle printMode={printMode}>
            <Palette className="h-5 w-5" />
            DESIGN SYSTEM
          </SectionTitle>

          <h4 className={`font-semibold mb-2 ${headingColor}`}>Tema Visual:</h4>
          <ul className={`list-disc list-inside space-y-1 mb-4 ${listColor}`}>
            <li>Dark Premium com suporte a Light mode</li>
            <li>Glassmorphism (backdrop-blur 12-20px)</li>
            <li>Gradientes em tons de azul marinho, índigo e grafite</li>
            <li>Cores semânticas via CSS variables HSL</li>
            <li>Textura grain em containers</li>
          </ul>

          <h4 className={`font-semibold mb-2 ${headingColor}`}>Componentes Base (Shadcn/UI):</h4>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
            {["Button", "Card", "Dialog", "Drawer", "Table", "Tabs", "Form", "Input", "Select", "Badge", "Toast/Sonner", "Sidebar", "Sheet", "Popover", "Command", "Separator", "ScrollArea", "Collapsible"].map((c) => (
              <BadgeItem key={c} printMode={printMode}>{c}</BadgeItem>
            ))}
          </div>

          <h4 className={`font-semibold mb-2 ${headingColor}`}>Efeitos Especiais:</h4>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {["Neon Pulse (Alertas)", "Glassmorphism", "Typing Animation", "Hover Scale", "Fade In/Out", "Slide Animations"].map((e) => (
              <BadgeItem key={e} printMode={printMode} variant="secondary">{e}</BadgeItem>
            ))}
          </div>

          <h4 className={`font-semibold mb-2 ${headingColor}`}>Componentes Customizados:</h4>
          <ul className={`list-disc list-inside space-y-1 ${listColor}`}>
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
        </SectionBlock>

        <hr className={cx(printMode, "border-border my-4", "border-slate-200 my-6")} />

        {/* ── FLUXOS DE TRABALHO ───────────── */}
        <SectionBlock printMode={printMode}>
          <SectionTitle printMode={printMode}>
            <GitBranch className="h-5 w-5" />
            FLUXOS DE TRABALHO
          </SectionTitle>

          <h4 className={`font-semibold mb-3 ${headingColor}`}>Fluxo de Envio de Arquivo:</h4>
          <div className="mb-6">
            <FlowSteps printMode={printMode} steps={[
              { label: "1. Seleciona Cliente" },
              { label: "2. Escolhe Serviços" },
              { label: "3. Upload ECU" },
              { label: "4. Status: Pendente" },
              { label: "5. Admin Processa", secondary: true },
              { label: "6. Status: Concluído", secondary: true },
              { label: "7. Download" },
            ]} />
          </div>

          <h4 className={`font-semibold mb-3 ${headingColor}`}>Fluxo de Pedido na Loja:</h4>
          <div className="mb-6">
            <FlowSteps printMode={printMode} steps={[
              { label: "1. Navega Catálogo" },
              { label: "2. Adiciona ao Carrinho" },
              { label: "3. Checkout (4 etapas)" },
              { label: "4. Cria Pedido (DB)" },
              { label: "5. WhatsApp", secondary: true },
              { label: "6. Visualiza Status" },
              { label: "7. Admin Gerencia", secondary: true },
              { label: "8. Entregue", secondary: true },
            ]} />
          </div>

          <h4 className={`font-semibold mb-3 ${headingColor}`}>Fluxo de Gestão de Status (Admin):</h4>
          <div className="mb-6">
            <FlowSteps printMode={printMode} steps={[
              { label: "1. Acessa Pedido", secondary: true },
              { label: "2. Altera Pagamento", secondary: true },
              { label: "3. Altera Logística", secondary: true },
              { label: "4. Observação Interna", secondary: true },
              { label: "5. Salva (Histórico)", secondary: true },
            ]} />
          </div>

          <h4 className={`font-semibold mb-3 ${headingColor}`}>Fluxo de Correção:</h4>
          <div className="mb-6">
            <FlowSteps printMode={printMode} steps={[
              { label: "1. Detalhes Arquivo" },
              { label: "2. Solicitar Correção" },
              { label: "3. Preenche Motivo" },
              { label: "4. Anexa Arquivo (opc)" },
              { label: "5. Ticket Criado", secondary: true },
              { label: "6. Admin Analisa", secondary: true },
              { label: "7. Resolve", secondary: true },
            ]} />
          </div>

          <h4 className={`font-semibold mb-3 ${headingColor}`}>Fluxo de Suporte:</h4>
          <FlowSteps printMode={printMode} steps={[
            { label: "1. Abre Conversa" },
            { label: "2. Escreve Mensagem" },
            { label: "3. Admin Recebe (Realtime)", secondary: true },
            { label: "4. Admin Responde", secondary: true },
            { label: "5. Franqueado Recebe (Realtime)" },
            { label: "6. Fecha Conversa", secondary: true },
          ]} />
        </SectionBlock>

        <hr className={cx(printMode, "border-border my-4", "border-slate-200 my-6")} />

        {/* ── REGRAS DE NEGÓCIO OFICIAIS ─── */}
        <SectionBlock printMode={printMode}>
          <SectionTitle printMode={printMode}>
            <BookOpen className="h-5 w-5" />
            REGRAS DE NEGÓCIO OFICIAIS
          </SectionTitle>
          <p className={`mb-6 ${subtextColor}`}>
            Esta seção é a fonte oficial de verdade sobre o comportamento do sistema. Cada módulo documenta criação, status, permissões, efeitos colaterais e visibilidade.
          </p>

          {/* ─── 1. Arquivos ECU ─── */}
          <div className="mb-8 break-inside-avoid">
            <h3 className={`text-base font-bold mb-3 ${headingColor}`}>1. Arquivos ECU (received_files)</h3>
            <InfoCard printMode={printMode}>
              <div className="space-y-3 text-sm">
                <div>
                  <strong className={headingColor}>Evento de criação:</strong>
                  <span className={` ${subtextColor}`}> Franqueado envia arquivo via /franqueado/enviar-arquivo. INSERT em received_files com status = "pending".</span>
                </div>
                <div>
                  <strong className={headingColor}>Responsável:</strong>
                  <span className={` ${subtextColor}`}> Franqueado autenticado (unit_id vinculado via get_user_unit_id).</span>
                </div>
                <div>
                  <strong className={headingColor}>Status oficiais:</strong>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {["pending", "em_analise", "processando", "concluido", "rejeitado", "correcao_solicitada"].map(s => (
                      <BadgeItem key={s} printMode={printMode}>{s}</BadgeItem>
                    ))}
                  </div>
                </div>
                <div>
                  <strong className={headingColor}>Quem altera status:</strong>
                  <span className={` ${subtextColor}`}> Admin e Suporte (has_role admin/suporte). Franqueado NÃO altera status diretamente.</span>
                </div>
                <div>
                  <strong className={headingColor}>Efeitos colaterais:</strong>
                  <ul className={`list-disc pl-5 space-y-1 ${listColor}`}>
                    <li><strong>pending → em_analise:</strong> INSERT file_status_history. Notificação browser para admin.</li>
                    <li><strong>processando → concluido:</strong> INSERT file_status_history. Upload arquivo modificado. Notificação franqueado.</li>
                    <li><strong>qualquer → rejeitado:</strong> INSERT file_status_history com observação obrigatória.</li>
                    <li><strong>correcao_solicitada:</strong> Gerado via correction_ticket. Cria ticket + conversa de suporte vinculada.</li>
                  </ul>
                </div>
                <div>
                  <strong className={headingColor}>Histórico:</strong>
                  <span className={` ${subtextColor}`}> Toda alteração → INSERT file_status_history (arquivo_id, status_anterior, status_novo, alterado_por, observacao).</span>
                </div>
                <div>
                  <strong className={headingColor}>Notificações:</strong>
                  <span className={` ${subtextColor}`}> Browser push quando arquivo concluído/rejeitado (franqueado). Novo pendente (admin).</span>
                </div>
                <div>
                  <strong className={headingColor}>Dashboard:</strong>
                  <span className={` ${subtextColor}`}> KPI pendentes (admin). Recentes (home franqueado).</span>
                </div>
                <div>
                  <strong className={headingColor}>Financeiro:</strong>
                  <span className={` ${subtextColor}`}> valor_brl registrado no arquivo, NÃO gera lançamento automático em financial_entries.</span>
                </div>
                <div>
                  <strong className={headingColor}>Visibilidade franqueado:</strong>
                  <span className={` ${subtextColor}`}> Apenas arquivos da sua unidade (RLS: unit_id = get_user_unit_id).</span>
                </div>
                <div>
                  <strong className={headingColor}>Visibilidade admin:</strong>
                  <span className={` ${subtextColor}`}> Todos os arquivos (RLS: is_franchisor_admin). Pode processar, aprovar, rejeitar.</span>
                </div>
              </div>
            </InfoCard>
          </div>

          {/* ─── 2. Pedidos da Loja Promax ─── */}
          <div className="mb-8 break-inside-avoid">
            <h3 className={`text-base font-bold mb-3 ${headingColor}`}>2. Pedidos da Loja Promax (orders)</h3>
            <InfoCard printMode={printMode}>
              <div className="space-y-3 text-sm">
                <div>
                  <strong className={headingColor}>Evento de criação:</strong>
                  <span className={` ${subtextColor}`}> Franqueado finaliza checkout → INSERT orders + order_items + order_status_history + financial_entries (2 lançamentos). WhatsApp aberto automaticamente.</span>
                </div>
                <div>
                  <strong className={headingColor}>Responsável:</strong>
                  <span className={` ${subtextColor}`}> Franqueado autenticado (franchise_profile_id via profiles_franchisees).</span>
                </div>
                <div>
                  <strong className={headingColor}>Status de pagamento (payment_status):</strong>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {["pendente", "aguardando_comprovante", "aprovado", "recusado", "estornado"].map(s => (
                      <BadgeItem key={s} printMode={printMode}>{s}</BadgeItem>
                    ))}
                  </div>
                </div>
                <div>
                  <strong className={headingColor}>Status de logística (fulfillment_status):</strong>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {["pedido_realizado", "em_separacao", "em_preparacao", "enviado", "em_transito", "entregue", "cancelado"].map(s => (
                      <BadgeItem key={s} printMode={printMode}>{s}</BadgeItem>
                    ))}
                  </div>
                </div>
                <div>
                  <strong className={headingColor}>Sincronização:</strong>
                  <span className={` ${subtextColor}`}> orders.status é sempre sincronizado com fulfillment_status pela camada de aplicação.</span>
                </div>
                <div>
                  <strong className={headingColor}>Quem altera status:</strong>
                  <span className={` ${subtextColor}`}> Somente Admin (is_franchisor_admin). Franqueado apenas visualiza.</span>
                </div>
                <div>
                  <strong className={headingColor}>Efeitos colaterais:</strong>
                  <ul className={`list-disc pl-5 space-y-1 ${listColor}`}>
                    <li><strong>Alteração payment_status:</strong> INSERT order_status_history com new_status = "pagamento:&#123;status&#125;".</li>
                    <li><strong>Alteração fulfillment_status:</strong> INSERT order_status_history + UPDATE orders.status.</li>
                    <li><strong>Ambos alterados:</strong> 2 registros distintos em order_status_history.</li>
                  </ul>
                </div>
                <div>
                  <strong className={headingColor}>Histórico:</strong>
                  <span className={` ${subtextColor}`}> INSERT order_status_history (order_id, previous_status, new_status, changed_by, internal_note). Formato: "pagamento:X" (pagamento) ou "X" (logística).</span>
                </div>
                <div>
                  <strong className={headingColor}>Dashboard:</strong>
                  <span className={` ${subtextColor}`}> Dashboard Promax: ranking categorias, top produtos, top unidades, vendas mensais, resumo financeiro.</span>
                </div>
                <div>
                  <strong className={headingColor}>Financeiro:</strong>
                  <span className={` ${subtextColor}`}> Criação: 2× financial_entries (franqueado/custo + matriz/receita). Cancelamento NÃO gera estorno automático.</span>
                </div>
                <div>
                  <strong className={headingColor}>Visibilidade franqueado:</strong>
                  <span className={` ${subtextColor}`}> Seus pedidos (RLS: franchise_profile_id). Timeline visual, itens, endereço, pagamento.</span>
                </div>
                <div>
                  <strong className={headingColor}>Visibilidade admin:</strong>
                  <span className={` ${subtextColor}`}> Todos os pedidos. Altera payment_status e fulfillment_status. Timeline + histórico + observações internas.</span>
                </div>
              </div>
            </InfoCard>
          </div>

          {/* ─── 3. Financeiro ─── */}
          <div className="mb-8 break-inside-avoid">
            <h3 className={`text-base font-bold mb-3 ${headingColor}`}>3. Financeiro (financial_entries)</h3>
            <InfoCard printMode={printMode}>
              <div className="space-y-3 text-sm">
                <div>
                  <strong className={headingColor}>Evento de criação:</strong>
                  <span className={` ${subtextColor}`}> Automático na criação de pedido Loja Promax. 2 registros: custo franqueado + receita matriz.</span>
                </div>
                <div>
                  <strong className={headingColor}>Responsável:</strong>
                  <span className={` ${subtextColor}`}> Sistema (orderService.ts), vinculado a franchise_profile_id e order_id.</span>
                </div>
                <div>
                  <strong className={headingColor}>Campos-chave:</strong>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {["scope (franqueado|matriz)", "entry_type (custo|receita)", "category", "competency_date", "amount"].map(s => (
                      <BadgeItem key={s} printMode={printMode}>{s}</BadgeItem>
                    ))}
                  </div>
                </div>
                <div>
                  <strong className={headingColor}>Quem altera:</strong>
                  <span className={` ${subtextColor}`}> Admin (is_franchisor_admin). Franqueado apenas visualiza. Registros tratados como imutáveis.</span>
                </div>
                <div>
                  <strong className={headingColor}>Efeitos colaterais:</strong>
                  <ul className={`list-disc pl-5 space-y-1 ${listColor}`}>
                    <li>Sem triggers ou cascatas. Cancelamento de pedido NÃO gera estorno automático.</li>
                    <li>allow_manual_credits no perfil permite créditos manuais (futuro).</li>
                  </ul>
                </div>
                <div>
                  <strong className={headingColor}>Dashboard:</strong>
                  <span className={` ${subtextColor}`}> Dashboard Promax (vendas mensais, resumo). Relatórios franqueado (faturamento por período).</span>
                </div>
                <div>
                  <strong className={headingColor}>Visibilidade franqueado:</strong>
                  <span className={` ${subtextColor}`}> Lançamentos do seu franchise_profile_id. Escopo visível: "franqueado".</span>
                </div>
                <div>
                  <strong className={headingColor}>Visibilidade admin:</strong>
                  <span className={` ${subtextColor}`}> Todos os lançamentos. Filtro por franqueado, período e categoria.</span>
                </div>
              </div>
            </InfoCard>
          </div>

          {/* ─── 4. Suporte e Correções ─── */}
          <div className="mb-8 break-inside-avoid">
            <h3 className={`text-base font-bold mb-3 ${headingColor}`}>4. Suporte e Correções</h3>
            <InfoCard printMode={printMode}>
              <div className="space-y-3 text-sm">
                <h4 className={`font-semibold ${headingColor}`}>4a. Conversas de Suporte (support_conversations)</h4>
                <div>
                  <strong className={headingColor}>Criação:</strong>
                  <span className={` ${subtextColor}`}> Franqueado abre conversa em /franqueado/suporte. INSERT support_conversations (status = "open").</span>
                </div>
                <div>
                  <strong className={headingColor}>Status:</strong>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {["open", "closed"].map(s => (
                      <BadgeItem key={s} printMode={printMode}>{s}</BadgeItem>
                    ))}
                  </div>
                </div>
                <div>
                  <strong className={headingColor}>Permissões:</strong>
                  <span className={` ${subtextColor}`}> Admin/Suporte fecham. Franqueado reabre enviando mensagem.</span>
                </div>
                <div>
                  <strong className={headingColor}>Efeitos:</strong>
                  <span className={` ${subtextColor}`}> Mensagens em tempo real (Supabase Realtime). Notificação browser + som (admin). updated_at atualizado a cada mensagem.</span>
                </div>
                <div>
                  <strong className={headingColor}>Visibilidade:</strong>
                  <span className={` ${subtextColor}`}> Franqueado: suas conversas (franqueado_id = auth.uid). Admin: todas (has_role admin/suporte).</span>
                </div>

                <hr className={cx(printMode, "border-border my-3", "border-slate-200 my-3")} />

                <h4 className={`font-semibold ${headingColor}`}>4b. Tickets de Correção (correction_tickets)</h4>
                <div>
                  <strong className={headingColor}>Criação:</strong>
                  <span className={` ${subtextColor}`}> Franqueado solicita correção de arquivo ECU. INSERT correction_tickets (status = "aberto"). Opcionalmente cria support_conversation vinculada.</span>
                </div>
                <div>
                  <strong className={headingColor}>Status:</strong>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {["aberto", "em_analise", "resolvido", "recusado"].map(s => (
                      <BadgeItem key={s} printMode={printMode}>{s}</BadgeItem>
                    ))}
                  </div>
                </div>
                <div>
                  <strong className={headingColor}>Permissões:</strong>
                  <span className={` ${subtextColor}`}> Admin/Suporte alteram status. Franqueado apenas cria e visualiza.</span>
                </div>
                <div>
                  <strong className={headingColor}>Efeitos:</strong>
                  <span className={` ${subtextColor}`}> Pode anexar arquivo (arquivo_anexo_url). Vínculo opcional com support_conversation. Sem lançamento financeiro.</span>
                </div>
                <div>
                  <strong className={headingColor}>Dashboard:</strong>
                  <span className={` ${subtextColor}`}> Contagem de tickets abertos no painel admin.</span>
                </div>
              </div>
            </InfoCard>
          </div>

          {/* ─── 5. Contratos ─── */}
          <div className="mb-8 break-inside-avoid">
            <h3 className={`text-base font-bold mb-3 ${headingColor}`}>5. Contratos (profiles_franchisees + contract_history)</h3>
            <InfoCard printMode={printMode}>
              <div className="space-y-3 text-sm">
                <div>
                  <strong className={headingColor}>Criação:</strong>
                  <span className={` ${subtextColor}`}> Franqueado cadastrado com contract_expiration_date padrão (CURRENT_DATE + 1 ano). Renovação → INSERT contract_history.</span>
                </div>
                <div>
                  <strong className={headingColor}>Responsável:</strong>
                  <span className={` ${subtextColor}`}> Admin cria franqueado e define data. Renovação exclusivamente pelo Admin via /admin/contratos.</span>
                </div>
                <div>
                  <strong className={headingColor}>Status derivados:</strong>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {["Ativo (> 30 dias)", "Expirando (≤ 30 dias)", "Expirado"].map(s => (
                      <BadgeItem key={s} printMode={printMode}>{s}</BadgeItem>
                    ))}
                  </div>
                </div>
                <div>
                  <strong className={headingColor}>Quem altera:</strong>
                  <span className={` ${subtextColor}`}> Admin (has_role admin/suporte). Franqueado NÃO renova.</span>
                </div>
                <div>
                  <strong className={headingColor}>Efeitos da expiração:</strong>
                  <ul className={`list-disc pl-5 space-y-1 ${listColor}`}>
                    <li><strong>Expirado:</strong> ContractBlockOverlay bloqueia envio/download de arquivos ECU.</li>
                    <li><strong>≤ 30 dias:</strong> ContractAlert "Faltam X dias" com urgência progressiva.</li>
                    <li><strong>≤ 15 dias:</strong> Barra de progresso com animação pulse vermelha.</li>
                    <li><strong>Renovação:</strong> UPDATE contract_expiration_date + INSERT contract_history.</li>
                  </ul>
                </div>
                <div>
                  <strong className={headingColor}>Histórico:</strong>
                  <span className={` ${subtextColor}`}> Cada renovação → contract_history (franqueado_id, start_date, end_date, contract_type, status, notes).</span>
                </div>
                <div>
                  <strong className={headingColor}>Notificações:</strong>
                  <span className={` ${subtextColor}`}> ContractAlert visual (sem push). Exibido a cada acesso do franqueado.</span>
                </div>
                <div>
                  <strong className={headingColor}>Dashboard:</strong>
                  <span className={` ${subtextColor}`}> /admin/contratos: lista com filtro Ativo/Expirando/Expirado.</span>
                </div>
                <div>
                  <strong className={headingColor}>Financeiro:</strong>
                  <span className={` ${subtextColor}`}> Nenhum lançamento automático. rental_value_brl é informativo.</span>
                </div>
                <div>
                  <strong className={headingColor}>Visibilidade franqueado:</strong>
                  <span className={` ${subtextColor}`}> Perfil: barra de progresso, botão renovação, histórico. Expirado bloqueia funcionalidades.</span>
                </div>
                <div>
                  <strong className={headingColor}>Visibilidade admin:</strong>
                  <span className={` ${subtextColor}`}> /admin/contratos: gestão centralizada, renovação, histórico, filtros por unidade/status.</span>
                </div>
              </div>
            </InfoCard>
          </div>
        </SectionBlock>

        {/* ── MODELO CANÔNICO DE DOMÍNIO ───────────────────────── */}
        <SectionBlock printMode={printMode}>
          <SectionTitle printMode={printMode}>
            <Database className="h-5 w-5" /> MODELO CANÔNICO DE DOMÍNIO
          </SectionTitle>
          <p className={`mb-6 ${subtextColor}`}>
            Referência definitiva de cada entidade do sistema: definição, responsabilidade, relacionamentos, tabela de origem, fluxos e visibilidade.
          </p>

          {/* 1. Usuário */}
          <div className="mb-6 break-inside-avoid">
            <h3 className={`text-lg font-bold mb-2 ${headingColor}`}>1. Usuário (auth.users)</h3>
            <InfoCard printMode={printMode}>
              <div className="space-y-2 text-sm">
                <div><strong className={headingColor}>Definição:</strong><span className={` ${subtextColor}`}> Registro de autenticação gerenciado pelo serviço de Auth. Representa uma credencial de acesso ao sistema.</span></div>
                <div><strong className={headingColor}>Responsabilidade:</strong><span className={` ${subtextColor}`}> Autenticação (login/logout), geração de JWT, recuperação de senha.</span></div>
                <div><strong className={headingColor}>Relacionamentos:</strong><span className={` ${subtextColor}`}> 1:N → user_roles (papéis), 1:1 → profiles_franchisees (via user_id), referenciado indiretamente por todas as entidades via auth.uid().</span></div>
                <div><strong className={headingColor}>Tabela:</strong><span className={` ${subtextColor}`}> auth.users (gerenciada pelo serviço de Auth — não editável diretamente).</span></div>
                <div><strong className={headingColor}>Fluxos:</strong><span className={` ${subtextColor}`}> Login, signup, reset de senha, verificação de e-mail.</span></div>
                <div><strong className={headingColor}>Visibilidade:</strong><span className={` ${subtextColor}`}> Interno ao sistema. Nenhuma tela expõe auth.users diretamente.</span></div>
              </div>
            </InfoCard>
          </div>

          {/* 2. Role */}
          <div className="mb-6 break-inside-avoid">
            <h3 className={`text-lg font-bold mb-2 ${headingColor}`}>2. Role (Papel do Usuário)</h3>
            <InfoCard printMode={printMode}>
              <div className="space-y-2 text-sm">
                <div><strong className={headingColor}>Definição:</strong><span className={` ${subtextColor}`}> Atribuição de permissão a um usuário. Enum: admin, suporte, franqueado.</span></div>
                <div><strong className={headingColor}>Responsabilidade:</strong><span className={` ${subtextColor}`}> Controlar acesso via RLS. Determina quais rotas, dados e ações o usuário pode executar.</span></div>
                <div><strong className={headingColor}>Relacionamentos:</strong><span className={` ${subtextColor}`}> N:1 → auth.users (user_id). Validado pela função has_role() e is_franchisor_admin().</span></div>
                <div><strong className={headingColor}>Tabela:</strong><span className={` ${subtextColor}`}> public.user_roles (id, user_id, role, created_at). Unique constraint em (user_id, role).</span></div>
                <div><strong className={headingColor}>Fluxos:</strong><span className={` ${subtextColor}`}> useAuth() no frontend, todas as RLS policies no banco.</span></div>
                <div><strong className={headingColor}>Visibilidade:</strong><span className={` ${subtextColor}`}> Admin: gerencia roles em /admin/franqueados/:id. Franqueado: apenas lê seu próprio role.</span></div>
              </div>
            </InfoCard>
          </div>

          {/* 3. Perfil do Franqueado */}
          <div className="mb-6 break-inside-avoid">
            <h3 className={`text-lg font-bold mb-2 ${headingColor}`}>3. Perfil do Franqueado</h3>
            <InfoCard printMode={printMode}>
              <div className="space-y-2 text-sm">
                <div><strong className={headingColor}>Definição:</strong><span className={` ${subtextColor}`}> Dados cadastrais, contratuais e operacionais de um franqueado. Criado automaticamente no primeiro acesso.</span></div>
                <div><strong className={headingColor}>Responsabilidade:</strong><span className={` ${subtextColor}`}> Armazenar dados pessoais, endereço, equipamentos (KESS/KTAG), tipo de contrato, áreas de atuação e endereço de entrega.</span></div>
                <div><strong className={headingColor}>Relacionamentos:</strong><span className={` ${subtextColor}`}> 1:1 → auth.users (user_id), 1:N → units (franchisee_id), 1:N → orders (franchise_profile_id), 1:N → financial_entries.</span></div>
                <div><strong className={headingColor}>Tabela:</strong><span className={` ${subtextColor}`}> public.profiles_franchisees. Colunas-chave: email, display_name, cpf, cnpj, contract_expiration_date, delivery_address (JSONB), service_areas (JSONB).</span></div>
                <div><strong className={headingColor}>Fluxos:</strong><span className={` ${subtextColor}`}> Perfil (/franqueado/perfil), Checkout (preenchimento automático de endereço), Importação em massa, Detalhes admin.</span></div>
                <div><strong className={headingColor}>Visibilidade:</strong><span className={` ${subtextColor}`}> Franqueado: lê/edita seu próprio perfil. Admin: lê/edita todos via /admin/franqueados/:id.</span></div>
              </div>
            </InfoCard>
          </div>

          {/* 4. Unidade */}
          <div className="mb-6 break-inside-avoid">
            <h3 className={`text-lg font-bold mb-2 ${headingColor}`}>4. Unidade</h3>
            <InfoCard printMode={printMode}>
              <div className="space-y-2 text-sm">
                <div><strong className={headingColor}>Definição:</strong><span className={` ${subtextColor}`}> Ponto de operação de um franqueado. Representa uma filial ou local de atendimento.</span></div>
                <div><strong className={headingColor}>Responsabilidade:</strong><span className={` ${subtextColor}`}> Isolamento multi-tenant. Todas as entidades operacionais (clientes, veículos, serviços, arquivos) são vinculadas a uma unit_id.</span></div>
                <div><strong className={headingColor}>Relacionamentos:</strong><span className={` ${subtextColor}`}> N:1 → profiles_franchisees (franchisee_id), 1:N → customers, vehicles, services, received_files, orders.</span></div>
                <div><strong className={headingColor}>Tabela:</strong><span className={` ${subtextColor}`}> public.units (id, name, city, state, country, franchisee_id, is_active). Função get_user_unit_id() resolve unit do usuário logado.</span></div>
                <div><strong className={headingColor}>Fluxos:</strong><span className={` ${subtextColor}`}> Filtro de dados em todas as telas, RLS via get_user_unit_id(), gestão em /admin/franqueados.</span></div>
                <div><strong className={headingColor}>Visibilidade:</strong><span className={` ${subtextColor}`}> Franqueado: vê apenas sua unidade. Admin: vê e gerencia todas.</span></div>
              </div>
            </InfoCard>
          </div>

          {/* 5. Cliente */}
          <div className="mb-6 break-inside-avoid">
            <h3 className={`text-lg font-bold mb-2 ${headingColor}`}>5. Cliente</h3>
            <InfoCard printMode={printMode}>
              <div className="space-y-2 text-sm">
                <div><strong className={headingColor}>Definição:</strong><span className={` ${subtextColor}`}> Pessoa física ou jurídica atendida por uma unidade franqueada.</span></div>
                <div><strong className={headingColor}>Responsabilidade:</strong><span className={` ${subtextColor}`}> Centralizar dados de contato, documentos (CPF/CNPJ) e histórico de serviços e veículos.</span></div>
                <div><strong className={headingColor}>Relacionamentos:</strong><span className={` ${subtextColor}`}> N:1 → units (unit_id), 1:N → vehicles, 1:N → services, 1:N → received_files (customer_id).</span></div>
                <div><strong className={headingColor}>Tabela:</strong><span className={` ${subtextColor}`}> public.customers (full_name, cpf, cnpj, email, phone, active_city, address_state, unit_id).</span></div>
                <div><strong className={headingColor}>Fluxos:</strong><span className={` ${subtextColor}`}> Cadastro via NovoClienteDrawer, listagem /admin/clientes, detalhes /admin/clientes/:id, envio de arquivos ECU, exportação CSV com LGPD.</span></div>
                <div><strong className={headingColor}>Visibilidade:</strong><span className={` ${subtextColor}`}> Franqueado: apenas clientes da sua unidade. Admin: todos os clientes com filtros por unidade/cidade/estado.</span></div>
              </div>
            </InfoCard>
          </div>

          {/* 6. Veículo */}
          <div className="mb-6 break-inside-avoid">
            <h3 className={`text-lg font-bold mb-2 ${headingColor}`}>6. Veículo</h3>
            <InfoCard printMode={printMode}>
              <div className="space-y-2 text-sm">
                <div><strong className={headingColor}>Definição:</strong><span className={` ${subtextColor}`}> Veículo associado a um cliente, identificado por placa.</span></div>
                <div><strong className={headingColor}>Responsabilidade:</strong><span className={` ${subtextColor}`}> Vincular serviços e arquivos ECU a um veículo específico. Armazenar dados técnicos (marca, modelo, ano, motor).</span></div>
                <div><strong className={headingColor}>Relacionamentos:</strong><span className={` ${subtextColor}`}> N:1 → customers (customer_id), N:1 → units (unit_id), 1:N → services, 1:N → received_files (vehicle_id).</span></div>
                <div><strong className={headingColor}>Tabela:</strong><span className={` ${subtextColor}`}> public.vehicles (plate, brand, model, year, category, engine, customer_id, unit_id).</span></div>
                <div><strong className={headingColor}>Fluxos:</strong><span className={` ${subtextColor}`}> Cadastro automático via lookup de placa, detalhes do cliente, envio de arquivo ECU.</span></div>
                <div><strong className={headingColor}>Visibilidade:</strong><span className={` ${subtextColor}`}> Franqueado: veículos da sua unidade. Admin: todos.</span></div>
              </div>
            </InfoCard>
          </div>

          {/* 7. Arquivo ECU */}
          <div className="mb-6 break-inside-avoid">
            <h3 className={`text-lg font-bold mb-2 ${headingColor}`}>7. Arquivo ECU</h3>
            <InfoCard printMode={printMode}>
              <div className="space-y-2 text-sm">
                <div><strong className={headingColor}>Definição:</strong><span className={` ${subtextColor}`}> Arquivo de calibração de ECU enviado por um franqueado para processamento pela matriz.</span></div>
                <div><strong className={headingColor}>Responsabilidade:</strong><span className={` ${subtextColor}`}> Rastrear o ciclo de vida do arquivo: envio → processamento → entrega. Armazena original e modificado no Storage.</span></div>
                <div><strong className={headingColor}>Relacionamentos:</strong><span className={` ${subtextColor}`}> N:1 → units (unit_id), N:1 → customers (customer_id), N:1 → vehicles (vehicle_id), 1:N → file_status_history, 1:N → correction_tickets.</span></div>
                <div><strong className={headingColor}>Tabela:</strong><span className={` ${subtextColor}`}> public.received_files. Status: pending → in_progress → completed / rejected. Campos: placa, servico, categorias, valor_brl, arquivo_original_url, arquivo_modificado_url.</span></div>
                <div><strong className={headingColor}>Fluxos:</strong><span className={` ${subtextColor}`}> Envio (/franqueado/enviar-arquivo), gestão (/admin/arquivos), detalhes, correções, notificações de status.</span></div>
                <div><strong className={headingColor}>Visibilidade:</strong><span className={` ${subtextColor}`}> Franqueado: arquivos da sua unidade. Admin: todos, com filtros e ações de status.</span></div>
              </div>
            </InfoCard>
          </div>

          {/* 8. Pedido da Loja */}
          <div className="mb-6 break-inside-avoid">
            <h3 className={`text-lg font-bold mb-2 ${headingColor}`}>8. Pedido da Loja Promax</h3>
            <InfoCard printMode={printMode}>
              <div className="space-y-2 text-sm">
                <div><strong className={headingColor}>Definição:</strong><span className={` ${subtextColor}`}> Solicitação de compra de peças/acessórios feita por um franqueado na Loja Promax.</span></div>
                <div><strong className={headingColor}>Responsabilidade:</strong><span className={` ${subtextColor}`}> Controlar ciclo de compra com dois eixos independentes: pagamento (payment_status) e logística (fulfillment_status). Gerar snapshot de endereço e itens.</span></div>
                <div><strong className={headingColor}>Relacionamentos:</strong><span className={` ${subtextColor}`}> N:1 → profiles_franchisees (franchise_profile_id), N:1 → units (unit_id), 1:N → order_items, 1:N → order_status_history, 1:N → financial_entries.</span></div>
                <div><strong className={headingColor}>Tabela:</strong><span className={` ${subtextColor}`}> public.orders. Campos: order_number, payment_status, fulfillment_status, payment_method, payment_note, delivery_address (JSONB), total_amount.</span></div>
                <div><strong className={headingColor}>Fluxos:</strong><span className={` ${subtextColor}`}> Checkout → WhatsApp → status (/franqueado/pedidos/:id), gestão admin (/admin/compras/:id), timeline, badges, dashboard.</span></div>
                <div><strong className={headingColor}>Visibilidade:</strong><span className={` ${subtextColor}`}> Franqueado: seus pedidos. Admin: todos, com painel de alteração de status.</span></div>
              </div>
            </InfoCard>
          </div>

          {/* 9. Item do Pedido */}
          <div className="mb-6 break-inside-avoid">
            <h3 className={`text-lg font-bold mb-2 ${headingColor}`}>9. Item do Pedido</h3>
            <InfoCard printMode={printMode}>
              <div className="space-y-2 text-sm">
                <div><strong className={headingColor}>Definição:</strong><span className={` ${subtextColor}`}> Linha individual de produto dentro de um pedido. Contém snapshot imutável do produto no momento da compra.</span></div>
                <div><strong className={headingColor}>Responsabilidade:</strong><span className={` ${subtextColor}`}> Preservar dados históricos (nome, SKU, preço unitário) independente de alterações futuras no catálogo.</span></div>
                <div><strong className={headingColor}>Relacionamentos:</strong><span className={` ${subtextColor}`}> N:1 → orders (order_id), N:1 → products (product_id, referência fraca — produto pode ser removido).</span></div>
                <div><strong className={headingColor}>Tabela:</strong><span className={` ${subtextColor}`}> public.order_items (product_name, product_sku, unit_price, quantity, line_total, product_snapshot JSONB).</span></div>
                <div><strong className={headingColor}>Fluxos:</strong><span className={` ${subtextColor}`}> Criado em createOrderFromCart(), exibido em detalhes do pedido (franqueado e admin).</span></div>
                <div><strong className={headingColor}>Visibilidade:</strong><span className={` ${subtextColor}`}> Franqueado: itens dos seus pedidos. Admin: todos.</span></div>
              </div>
            </InfoCard>
          </div>

          {/* 10. Lançamento Financeiro */}
          <div className="mb-6 break-inside-avoid">
            <h3 className={`text-lg font-bold mb-2 ${headingColor}`}>10. Lançamento Financeiro</h3>
            <InfoCard printMode={printMode}>
              <div className="space-y-2 text-sm">
                <div><strong className={headingColor}>Definição:</strong><span className={` ${subtextColor}`}> Registro contábil vinculado a um pedido ou operação. Dupla entrada: custo (franqueado) + receita (matriz).</span></div>
                <div><strong className={headingColor}>Responsabilidade:</strong><span className={` ${subtextColor}`}> Alimentar relatórios financeiros, dashboards e visão consolidada de receita/custo por período.</span></div>
                <div><strong className={headingColor}>Relacionamentos:</strong><span className={` ${subtextColor}`}> N:1 → profiles_franchisees (franchise_profile_id), N:1 → orders (order_id). Scope: "franqueado" ou "matriz".</span></div>
                <div><strong className={headingColor}>Tabela:</strong><span className={` ${subtextColor}`}> public.financial_entries (scope, entry_type, category, amount, competency_date, description).</span></div>
                <div><strong className={headingColor}>Fluxos:</strong><span className={` ${subtextColor}`}> Criado automaticamente em createOrderFromCart(). Consultado em /admin/relatorios e /franqueado/relatorios.</span></div>
                <div><strong className={headingColor}>Visibilidade:</strong><span className={` ${subtextColor}`}> Franqueado: seus lançamentos (scope=franqueado). Admin: todos (ambos os scopes).</span></div>
              </div>
            </InfoCard>
          </div>

          {/* 11. Ticket de Correção */}
          <div className="mb-6 break-inside-avoid">
            <h3 className={`text-lg font-bold mb-2 ${headingColor}`}>11. Ticket de Correção</h3>
            <InfoCard printMode={printMode}>
              <div className="space-y-2 text-sm">
                <div><strong className={headingColor}>Definição:</strong><span className={` ${subtextColor}`}> Solicitação de correção de um arquivo ECU já processado. Vinculado a um received_file e opcionalmente a uma conversa de suporte.</span></div>
                <div><strong className={headingColor}>Responsabilidade:</strong><span className={` ${subtextColor}`}> Rastrear motivo, anexo alternativo e status da correção (aberto → em_andamento → resolvido / recusado).</span></div>
                <div><strong className={headingColor}>Relacionamentos:</strong><span className={` ${subtextColor}`}> N:1 → received_files (arquivo_id, referência textual), N:1 → support_conversations (conversation_id), franqueado_id = auth.uid().</span></div>
                <div><strong className={headingColor}>Tabela:</strong><span className={` ${subtextColor}`}> public.correction_tickets (arquivo_id, motivo, arquivo_anexo_url, status, conversation_id).</span></div>
                <div><strong className={headingColor}>Fluxos:</strong><span className={` ${subtextColor}`}> Abertura pelo franqueado via detalhes do arquivo, gestão em /admin/correcoes, timeline no ticket.</span></div>
                <div><strong className={headingColor}>Visibilidade:</strong><span className={` ${subtextColor}`}> Franqueado: seus tickets. Admin/Suporte: todos.</span></div>
              </div>
            </InfoCard>
          </div>

          {/* 12. Conversa de Suporte */}
          <div className="mb-6 break-inside-avoid">
            <h3 className={`text-lg font-bold mb-2 ${headingColor}`}>12. Conversa de Suporte</h3>
            <InfoCard printMode={printMode}>
              <div className="space-y-2 text-sm">
                <div><strong className={headingColor}>Definição:</strong><span className={` ${subtextColor}`}> Canal de comunicação entre franqueado e equipe de suporte/admin. Suporta anexos e realtime.</span></div>
                <div><strong className={headingColor}>Responsabilidade:</strong><span className={` ${subtextColor}`}> Gerenciar tópicos de suporte com status (open → closed), mensagens ordenadas e anexos.</span></div>
                <div><strong className={headingColor}>Relacionamentos:</strong><span className={` ${subtextColor}`}> 1:N → support_messages (conversation_id), N:1 → auth.users (franqueado_id). Referenciado por correction_tickets.</span></div>
                <div><strong className={headingColor}>Tabela:</strong><span className={` ${subtextColor}`}> public.support_conversations (subject, status, franqueado_id, attachment_url) + public.support_messages (content, sender_id, sender_type).</span></div>
                <div><strong className={headingColor}>Fluxos:</strong><span className={` ${subtextColor}`}> /franqueado/suporte (abertura e chat), /admin/suporte (gestão e resposta), Realtime WebSocket para mensagens.</span></div>
                <div><strong className={headingColor}>Visibilidade:</strong><span className={` ${subtextColor}`}> Franqueado: suas conversas. Admin/Suporte: todas.</span></div>
              </div>
            </InfoCard>
          </div>

          {/* 13. Contrato */}
          <div className="mb-6 break-inside-avoid">
            <h3 className={`text-lg font-bold mb-2 ${headingColor}`}>13. Contrato</h3>
            <InfoCard printMode={printMode}>
              <div className="space-y-2 text-sm">
                <div><strong className={headingColor}>Definição:</strong><span className={` ${subtextColor}`}> Registro do vínculo contratual entre franqueado e matriz. O contrato ativo fica em profiles_franchisees; renovações e histórico em contract_history.</span></div>
                <div><strong className={headingColor}>Responsabilidade:</strong><span className={` ${subtextColor}`}> Controlar validade do acesso do franqueado. Contrato expirado bloqueia funcionalidades via ContractBlockOverlay.</span></div>
                <div><strong className={headingColor}>Relacionamentos:</strong><span className={` ${subtextColor}`}> profiles_franchisees.contract_expiration_date (ativo), contract_history (franqueado_id) para histórico de renovações.</span></div>
                <div><strong className={headingColor}>Tabela:</strong><span className={` ${subtextColor}`}> public.contract_history (start_date, end_date, contract_type, status, notes, franqueado_id).</span></div>
                <div><strong className={headingColor}>Fluxos:</strong><span className={` ${subtextColor}`}> useContractStatus() verifica validade, /admin/contratos para gestão, alerta visual no layout do franqueado.</span></div>
                <div><strong className={headingColor}>Visibilidade:</strong><span className={` ${subtextColor}`}> Franqueado: vê status e progresso do seu contrato. Admin: gestão completa com filtros e renovação.</span></div>
              </div>
            </InfoCard>
          </div>
        </SectionBlock>

        {/* ── ESTADOS E TRANSIÇÕES ───────────────────────── */}
        <SectionBlock printMode={printMode}>
          <SectionTitle printMode={printMode}>
            <GitBranch className="h-5 w-5" /> ESTADOS E TRANSIÇÕES
          </SectionTitle>
          <p className={`mb-6 ${subtextColor}`}>
            Referência oficial de todos os status do sistema, transições permitidas, responsáveis e efeitos colaterais de cada mudança de estado.
          </p>

          {/* ─── 1. Arquivos ECU ─── */}
          <div className="mb-8 break-inside-avoid">
            <h3 className={`text-lg font-bold mb-3 ${headingColor}`}>1. Status de Arquivos ECU (received_files.status)</h3>
            <div className="overflow-x-auto">
              <table className={`w-full text-xs border-collapse ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>
                <thead>
                  <tr className={printMode ? "bg-slate-100" : "bg-slate-800"}>
                    {["Status técnico", "Label", "Descrição", "Quem altera", "Transições permitidas", "Bloqueios", "Efeitos colaterais"].map(h => (
                      <th key={h} className={`p-2 text-left font-semibold ${printMode ? "border border-slate-300 text-slate-900" : "border border-slate-700 text-white"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={subtextColor}>
                  {[
                    ["pending", "Pendente", "Arquivo enviado, aguardando processamento.", "Sistema (automático)", "→ in_progress", "Não pode ir direto para completed", "Insere file_status_history. Notificação no dashboard admin. Contabiliza arquivo pendente."],
                    ["in_progress", "Em Processamento", "Arquivo sendo trabalhado pela equipe técnica.", "Admin / Suporte", "→ completed, → rejected", "Não pode voltar para pending", "Insere file_status_history. Atualiza contadores do dashboard."],
                    ["completed", "Concluído", "Arquivo processado e disponível para download.", "Admin / Suporte", "→ in_progress (reprocessamento)", "Não pode ir para pending", "Insere file_status_history. arquivo_modificado_url preenchido. Notificação para franqueado. Incrementa total de serviços do dashboard."],
                    ["rejected", "Rejeitado", "Arquivo recusado por problemas técnicos.", "Admin / Suporte", "→ in_progress (revisão)", "Não pode ir para completed diretamente", "Insere file_status_history com observação obrigatória. Franqueado pode abrir correction_ticket."],
                  ].map(([status, label, desc, who, allowed, blocked, effects]) => (
                    <tr key={status} className={printMode ? "border border-slate-300" : "border border-slate-700"}>
                      <td className={`p-2 font-mono font-bold ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{status}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{label}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{desc}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{who}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{allowed}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{blocked}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{effects}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <InfoCard printMode={printMode}>
              <div className="space-y-1 text-sm">
                <div><strong className={headingColor}>Timeline:</strong><span className={` ${subtextColor}`}> Cada transição gera entrada em file_status_history com alterado_por, status_anterior, status_novo, observacao e timestamp.</span></div>
                <div><strong className={headingColor}>Dashboard:</strong><span className={` ${subtextColor}`}> Contadores de pendentes/em progresso/concluídos atualizados em tempo real.</span></div>
                <div><strong className={headingColor}>Notificações:</strong><span className={` ${subtextColor}`}> Mudança para completed dispara notificação visual + sonora para o franqueado.</span></div>
              </div>
            </InfoCard>
          </div>

          {/* ─── 2. Pagamento da Loja ─── */}
          <div className="mb-8 break-inside-avoid">
            <h3 className={`text-lg font-bold mb-3 ${headingColor}`}>2. Status de Pagamento (orders.payment_status)</h3>
            <div className="overflow-x-auto">
              <table className={`w-full text-xs border-collapse ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>
                <thead>
                  <tr className={printMode ? "bg-slate-100" : "bg-slate-800"}>
                    {["Status técnico", "Label", "Descrição", "Quem altera", "Transições permitidas", "Bloqueios", "Efeitos colaterais"].map(h => (
                      <th key={h} className={`p-2 text-left font-semibold ${printMode ? "border border-slate-300 text-slate-900" : "border border-slate-700 text-white"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={subtextColor}>
                  {[
                    ["pendente", "Pendente", "Pagamento não realizado.", "Sistema (automático na criação)", "→ aguardando_comprovante, → aprovado, → recusado", "Não pode ir para reembolsado", "Registro em order_status_history com status_type implícito."],
                    ["aguardando_comprovante", "Aguardando Comprovante", "Esperando franqueado enviar comprovante.", "Admin", "→ aprovado, → recusado", "Não pode voltar para pendente", "Insere order_status_history."],
                    ["aprovado", "Aprovado", "Pagamento confirmado.", "Admin", "→ reembolsado", "Estado final (exceto reembolso)", "Insere order_status_history. Pode liberar separação logística."],
                    ["recusado", "Recusado", "Pagamento não aceito.", "Admin", "→ pendente, → aguardando_comprovante", "Não pode ir para aprovado diretamente", "Insere order_status_history com observação."],
                    ["reembolsado", "Reembolsado", "Valor devolvido ao franqueado.", "Admin", "Nenhuma (estado terminal)", "Estado final absoluto", "Insere order_status_history. Pode gerar lançamento financeiro de estorno."],
                  ].map(([status, label, desc, who, allowed, blocked, effects]) => (
                    <tr key={status} className={printMode ? "border border-slate-300" : "border border-slate-700"}>
                      <td className={`p-2 font-mono font-bold ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{status}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{label}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{desc}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{who}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{allowed}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{blocked}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{effects}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <InfoCard printMode={printMode}>
              <div className="space-y-1 text-sm">
                <div><strong className={headingColor}>Timeline:</strong><span className={` ${subtextColor}`}> Cada alteração gera entrada em order_status_history. Exibida na timeline do pedido com ícone de pagamento.</span></div>
                <div><strong className={headingColor}>Dashboard:</strong><span className={` ${subtextColor}`}> Contagem de pedidos por status de pagamento no painel admin.</span></div>
                <div><strong className={headingColor}>Badges:</strong><span className={` ${subtextColor}`}> OrderStatusBadges exibe badge colorido (amarelo=pendente, azul=aguardando, verde=aprovado, vermelho=recusado, roxo=reembolsado).</span></div>
              </div>
            </InfoCard>
          </div>

          {/* ─── 3. Logística da Loja ─── */}
          <div className="mb-8 break-inside-avoid">
            <h3 className={`text-lg font-bold mb-3 ${headingColor}`}>3. Status de Logística (orders.fulfillment_status)</h3>
            <div className="overflow-x-auto">
              <table className={`w-full text-xs border-collapse ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>
                <thead>
                  <tr className={printMode ? "bg-slate-100" : "bg-slate-800"}>
                    {["Status técnico", "Label", "Descrição", "Quem altera", "Transições permitidas", "Bloqueios", "Efeitos colaterais"].map(h => (
                      <th key={h} className={`p-2 text-left font-semibold ${printMode ? "border border-slate-300 text-slate-900" : "border border-slate-700 text-white"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={subtextColor}>
                  {[
                    ["pedido_realizado", "Pedido Realizado", "Pedido criado pelo franqueado.", "Sistema (automático)", "→ em_separacao", "Início do fluxo", "orders.status sincronizado. Entrada em order_status_history. Lançamentos financeiros criados."],
                    ["em_separacao", "Em Separação", "Itens sendo coletados no estoque.", "Admin", "→ em_preparacao, → cancelado", "Não pode voltar a pedido_realizado", "Insere order_status_history. orders.status = em_separacao."],
                    ["em_preparacao", "Em Preparação", "Pedido sendo embalado para envio.", "Admin", "→ enviado, → cancelado", "Sequencial — não pula etapas", "Insere order_status_history. orders.status sincronizado."],
                    ["enviado", "Enviado", "Pedido despachado para transportadora.", "Admin", "→ em_transito", "Não pode cancelar após envio", "Insere order_status_history."],
                    ["em_transito", "Em Trânsito", "Pedido em rota de entrega.", "Admin", "→ entregue", "Sequencial", "Insere order_status_history."],
                    ["entregue", "Entregue", "Pedido recebido pelo franqueado.", "Admin", "Nenhuma (estado terminal)", "Estado final", "Insere order_status_history. orders.status = entregue."],
                    ["cancelado", "Cancelado", "Pedido cancelado antes do envio.", "Admin", "Nenhuma (estado terminal)", "Só permitido antes de enviado", "Insere order_status_history com observação. orders.status = cancelado. Pode requerer estorno financeiro."],
                  ].map(([status, label, desc, who, allowed, blocked, effects]) => (
                    <tr key={status} className={printMode ? "border border-slate-300" : "border border-slate-700"}>
                      <td className={`p-2 font-mono font-bold ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{status}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{label}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{desc}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{who}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{allowed}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{blocked}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{effects}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <InfoCard printMode={printMode}>
              <div className="space-y-1 text-sm">
                <div><strong className={headingColor}>Sincronização:</strong><span className={` ${subtextColor}`}> orders.status é sempre mantido em sincronia com fulfillment_status pela camada de aplicação (updateOrderAdminStatuses).</span></div>
                <div><strong className={headingColor}>Timeline:</strong><span className={` ${subtextColor}`}> OrderTimeline exibe progresso visual com ícones (Package, Truck, CheckCircle). OrderTimelineFromHistory mostra histórico real com datas.</span></div>
                <div><strong className={headingColor}>Dashboard:</strong><span className={` ${subtextColor}`}> OrderStatusBadges no admin. Contagem por status em /admin/compras.</span></div>
              </div>
            </InfoCard>
          </div>

          {/* ─── 4. Tickets de Correção ─── */}
          <div className="mb-8 break-inside-avoid">
            <h3 className={`text-lg font-bold mb-3 ${headingColor}`}>4. Status de Tickets de Correção (correction_tickets.status)</h3>
            <div className="overflow-x-auto">
              <table className={`w-full text-xs border-collapse ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>
                <thead>
                  <tr className={printMode ? "bg-slate-100" : "bg-slate-800"}>
                    {["Status técnico", "Label", "Descrição", "Quem altera", "Transições permitidas", "Bloqueios", "Efeitos colaterais"].map(h => (
                      <th key={h} className={`p-2 text-left font-semibold ${printMode ? "border border-slate-300 text-slate-900" : "border border-slate-700 text-white"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={subtextColor}>
                  {[
                    ["aberto", "Aberto", "Ticket criado pelo franqueado.", "Sistema (automático)", "→ em_andamento", "Não pode ir direto para resolvido", "Cria conversa de suporte vinculada (opcional). Contabiliza no dashboard admin."],
                    ["em_andamento", "Em Andamento", "Equipe técnica analisando a solicitação.", "Admin / Suporte", "→ resolvido, → recusado", "Não pode voltar para aberto", "Atualiza updated_at. Pode gerar mensagens na conversa vinculada."],
                    ["resolvido", "Resolvido", "Correção aplicada e arquivo re-enviado.", "Admin / Suporte", "Nenhuma (estado terminal)", "Estado final", "Pode atualizar received_file vinculado. Notificação para franqueado."],
                    ["recusado", "Recusado", "Solicitação não procede.", "Admin / Suporte", "Nenhuma (estado terminal)", "Estado final", "Observação obrigatória. Franqueado pode abrir novo ticket se necessário."],
                  ].map(([status, label, desc, who, allowed, blocked, effects]) => (
                    <tr key={status} className={printMode ? "border border-slate-300" : "border border-slate-700"}>
                      <td className={`p-2 font-mono font-bold ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{status}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{label}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{desc}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{who}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{allowed}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{blocked}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{effects}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <InfoCard printMode={printMode}>
              <div className="space-y-1 text-sm">
                <div><strong className={headingColor}>Timeline:</strong><span className={` ${subtextColor}`}> TicketTimeline exibe progresso visual com ícones e cores por status.</span></div>
                <div><strong className={headingColor}>Histórico:</strong><span className={` ${subtextColor}`}> updated_at atualizado a cada transição. Conversa de suporte vinculada registra interações.</span></div>
              </div>
            </InfoCard>
          </div>

          {/* ─── 5. Conversas de Suporte ─── */}
          <div className="mb-8 break-inside-avoid">
            <h3 className={`text-lg font-bold mb-3 ${headingColor}`}>5. Status de Conversas de Suporte (support_conversations.status)</h3>
            <div className="overflow-x-auto">
              <table className={`w-full text-xs border-collapse ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>
                <thead>
                  <tr className={printMode ? "bg-slate-100" : "bg-slate-800"}>
                    {["Status técnico", "Label", "Descrição", "Quem altera", "Transições permitidas", "Bloqueios", "Efeitos colaterais"].map(h => (
                      <th key={h} className={`p-2 text-left font-semibold ${printMode ? "border border-slate-300 text-slate-900" : "border border-slate-700 text-white"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={subtextColor}>
                  {[
                    ["open", "Aberto", "Conversa ativa aguardando ou em atendimento.", "Sistema (automático na criação)", "→ closed", "—", "Trigger atualiza updated_at a cada nova mensagem. Realtime WebSocket ativo. Contabiliza no badge do admin."],
                    ["closed", "Fechado", "Conversa encerrada.", "Admin / Suporte", "→ open (reabrir)", "—", "Desativa notificações. Franqueado pode reabrir se necessário."],
                  ].map(([status, label, desc, who, allowed, blocked, effects]) => (
                    <tr key={status} className={printMode ? "border border-slate-300" : "border border-slate-700"}>
                      <td className={`p-2 font-mono font-bold ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{status}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{label}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{desc}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{who}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{allowed}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{blocked}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{effects}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <InfoCard printMode={printMode}>
              <div className="space-y-1 text-sm">
                <div><strong className={headingColor}>Realtime:</strong><span className={` ${subtextColor}`}> Mensagens novas disparam Realtime WebSocket. Trigger update_support_conversation_updated_at() atualiza timestamp da conversa.</span></div>
                <div><strong className={headingColor}>Dashboard:</strong><span className={` ${subtextColor}`}> /admin/suporte lista conversas abertas com prioridade. Notificação sonora + visual para novas mensagens.</span></div>
              </div>
            </InfoCard>
          </div>

          {/* ─── 6. Contratos ─── */}
          <div className="mb-8 break-inside-avoid">
            <h3 className={`text-lg font-bold mb-3 ${headingColor}`}>6. Status de Contratos (contract_history.status + profiles_franchisees.contract_expiration_date)</h3>
            <div className="overflow-x-auto">
              <table className={`w-full text-xs border-collapse ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>
                <thead>
                  <tr className={printMode ? "bg-slate-100" : "bg-slate-800"}>
                    {["Status técnico", "Label", "Descrição", "Quem altera", "Transições permitidas", "Bloqueios", "Efeitos colaterais"].map(h => (
                      <th key={h} className={`p-2 text-left font-semibold ${printMode ? "border border-slate-300 text-slate-900" : "border border-slate-700 text-white"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={subtextColor}>
                  {[
                    ["active", "Ativo", "Contrato vigente, todas as funcionalidades liberadas.", "Admin (ao criar/renovar)", "→ expiring (automático), → expired (automático), → cancelled", "—", "Franqueado tem acesso total ao sistema."],
                    ["expiring", "Expirando", "Faltam ≤ 30 dias para vencimento (cálculo em runtime).", "Sistema (useContractStatus)", "→ expired (automático)", "Não é um status persistido — calculado em tempo real", "ContractAlert exibe aviso. Barra de progresso muda para amarelo/vermelho. Botão Renovar destacado."],
                    ["expired", "Expirado", "contract_expiration_date < hoje.", "Sistema (automático)", "→ active (após renovação pelo admin)", "Bloqueia envios e downloads", "ContractBlockOverlay impede ações. Franqueado vê overlay de bloqueio. Admin pode renovar em /admin/contratos."],
                    ["cancelled", "Cancelado", "Contrato encerrado manualmente.", "Admin", "→ active (novo contrato)", "Estado terminal (exceto novo contrato)", "Registro em contract_history. Bloqueio total de funcionalidades."],
                  ].map(([status, label, desc, who, allowed, blocked, effects]) => (
                    <tr key={status} className={printMode ? "border border-slate-300" : "border border-slate-700"}>
                      <td className={`p-2 font-mono font-bold ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{status}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{label}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{desc}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{who}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{allowed}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{blocked}</td>
                      <td className={`p-2 ${printMode ? "border border-slate-300" : "border border-slate-700"}`}>{effects}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <InfoCard printMode={printMode}>
              <div className="space-y-1 text-sm">
                <div><strong className={headingColor}>Histórico:</strong><span className={` ${subtextColor}`}> Cada renovação gera registro em contract_history com start_date, end_date, contract_type, status e notes.</span></div>
                <div><strong className={headingColor}>Dashboard:</strong><span className={` ${subtextColor}`}> /admin/contratos exibe filtros por Ativo/Expirando/Expirado. Contadores atualizados em tempo real.</span></div>
                <div><strong className={headingColor}>Notificações:</strong><span className={` ${subtextColor}`}> ContractAlert no layout do franqueado. Animação pulse se &lt; 15 dias. Barra de progresso verde → amarelo → vermelho.</span></div>
              </div>
            </InfoCard>
          </div>
        </SectionBlock>

        {/* ── FOOTER ───────────────────────── */}
        <div className={`mt-8 pt-6 border-t text-center text-sm ${cx(printMode, "border-border text-muted-foreground", "border-slate-200 text-slate-500")}`}>
          <p>© {new Date().getFullYear()} Injediesel - Todos os direitos reservados</p>
          <p className="mt-1">Documento gerado automaticamente pelo sistema</p>
          <p className="mt-2 text-xs">Versão 3.3 - Atualizado em {currentDate}</p>
        </div>
      </div>
    </div>
  );
}
