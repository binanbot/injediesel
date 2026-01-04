import { FileText, ExternalLink, Map, Users, Shield, Database, Network, GitBranch, Workflow } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { MermaidDiagram } from "@/components/MermaidDiagram";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";

// Mermaid diagram definitions
const ARCHITECTURE_DIAGRAM = `
flowchart TB
    subgraph Frontend["🖥️ Frontend (React + Vite)"]
        UI[UI Components]
        Router[React Router v7]
        State[React Query]
        Auth[Auth Context]
    end
    
    subgraph Backend["☁️ Lovable Cloud (Supabase)"]
        AuthService[Auth Service]
        Database[(PostgreSQL)]
        Storage[Storage Buckets]
        Realtime[Realtime WebSocket]
    end
    
    UI --> Router
    Router --> State
    State --> Auth
    Auth --> AuthService
    State --> Database
    UI --> Storage
    Realtime --> UI
    
    style Frontend fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Backend fill:#1e293b,stroke:#f97316,color:#fff
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
    AUTH_USERS ||--o{ SUPPORT_CONVERSATIONS : creates
    AUTH_USERS ||--o{ CORRECTION_TICKETS : creates
    SUPPORT_CONVERSATIONS ||--o{ SUPPORT_MESSAGES : contains
    CORRECTION_TICKETS ||--o| SUPPORT_CONVERSATIONS : links
    
    USER_ROLES {
        uuid id PK
        uuid user_id FK
        enum role
        timestamp created_at
    }
    
    SUPPORT_CONVERSATIONS {
        uuid id PK
        uuid franqueado_id FK
        text subject
        text status
        text attachment_url
        timestamp created_at
    }
    
    SUPPORT_MESSAGES {
        uuid id PK
        uuid conversation_id FK
        uuid sender_id
        text sender_type
        text content
        timestamp created_at
    }
    
    CORRECTION_TICKETS {
        uuid id PK
        text arquivo_id
        uuid franqueado_id FK
        text motivo
        text status
        uuid conversation_id FK
        timestamp created_at
    }
`;

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Section({ title, icon, isOpen, onToggle, children }: SectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="font-semibold text-lg">{title}</h3>
        </div>
        {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-4 pb-2 px-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function DocumentacaoPublica() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    diagramas: true,
    mapa: true,
    visao: true,
    auth: false,
    franqueado: false,
    admin: false,
    banco: false,
    tecnologias: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const expandAll = () => {
    const allOpen = Object.keys(openSections).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    setOpenSections(allOpen);
  };

  const currentDate = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">INJEDIESEL</h1>
              <p className="text-xs text-muted-foreground">Documentação Técnica</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={expandAll}>
              Expandir Tudo
            </Button>
            <Link to="/login">
              <Button size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Acessar Sistema
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Card>
          <CardHeader className="text-center border-b">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="h-7 w-7 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-3xl">SISTEMA INJEDIESEL</CardTitle>
            <p className="text-muted-foreground text-lg">
              Sistema de Gestão de Arquivos ECU para Franqueados
            </p>
            <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
              <Badge variant="secondary">Versão 2.0</Badge>
              <span>•</span>
              <span>{currentDate}</span>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="space-y-4">
              
              {/* VISÃO GERAL */}
              <Section
                title="VISÃO GERAL"
                icon={<GitBranch className="h-5 w-5" />}
                isOpen={openSections.visao}
                onToggle={() => toggleSection("visao")}
              >
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <p className="text-muted-foreground leading-relaxed">
                    O <strong>Sistema INJEDIESEL</strong> é uma plataforma SaaS B2B desenvolvida para a gestão completa 
                    de arquivos ECU entre franqueados e a franqueadora. O sistema oferece funcionalidades de envio, 
                    processamento, acompanhamento e suporte em tempo real.
                  </p>
                  
                  <div className="grid md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-500">React 18</div>
                      <div className="text-sm text-muted-foreground">Frontend Framework</div>
                    </div>
                    <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-orange-500">Supabase</div>
                      <div className="text-sm text-muted-foreground">Backend & Database</div>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-500">Realtime</div>
                      <div className="text-sm text-muted-foreground">Live Updates</div>
                    </div>
                  </div>
                </div>
              </Section>

              <Separator />

              {/* DIAGRAMAS DE ARQUITETURA */}
              <Section
                title="DIAGRAMAS DE ARQUITETURA"
                icon={<Network className="h-5 w-5" />}
                isOpen={openSections.diagramas}
                onToggle={() => toggleSection("diagramas")}
              >
                <div className="space-y-8">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Badge variant="outline">1</Badge>
                      Arquitetura Geral do Sistema
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Visão geral da estrutura frontend/backend e suas conexões.
                    </p>
                    <MermaidDiagram chart={ARCHITECTURE_DIAGRAM} id="pub-architecture" />
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Badge variant="outline">2</Badge>
                      Fluxo de Dados - Autenticação e Envio de Arquivo
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Sequência de operações desde o login até o processamento de arquivos.
                    </p>
                    <MermaidDiagram chart={DATA_FLOW_DIAGRAM} id="pub-dataflow" />
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Badge variant="outline">3</Badge>
                      Fluxo de Suporte em Tempo Real
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Comunicação bidirecional entre franqueados e administradores via Realtime.
                    </p>
                    <MermaidDiagram chart={SUPPORT_FLOW_DIAGRAM} id="pub-support" />
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Badge variant="outline">4</Badge>
                      Modelo de Dados (ER Diagram)
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Relacionamentos entre as tabelas do banco de dados PostgreSQL.
                    </p>
                    <MermaidDiagram chart={DATABASE_DIAGRAM} id="pub-database" />
                  </div>
                </div>
              </Section>

              <Separator />

              {/* MAPA MENTAL DO SISTEMA */}
              <Section
                title="MAPA DO SISTEMA"
                icon={<Map className="h-5 w-5" />}
                isOpen={openSections.mapa}
                onToggle={() => toggleSection("mapa")}
              >
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
                          "Materiais & Tutoriais",
                          "Atualizações (Notificações)",
                          "Mensagens (Comunicados)",
                          "Relatórios (Faturamento)",
                          "Suporte (Chat + Tickets)",
                          "Perfil (Configurações)"
                        ].map((item, i) => (
                          <div key={i} className="flex items-center gap-2">
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
                          "Franqueados (Gestão de Usuários)",
                          "Áreas (Regiões)",
                          "Banners (Marketing)",
                          "Mensagens (Comunicados)",
                          "Suporte (Tickets + Chat)",
                          "Relatórios (Analytics)",
                          "Configurações",
                          "Documentação"
                        ].map((item, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-400 rounded-full" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Conexão Central */}
                  <div className="mt-6 text-center">
                    <div className="inline-flex items-center gap-4 bg-background/80 px-6 py-3 rounded-full border">
                      <Database className="h-5 w-5 text-green-500" />
                      <span className="font-medium">Lovable Cloud (PostgreSQL + Auth + Storage + Realtime)</span>
                    </div>
                  </div>
                </div>
              </Section>

              <Separator />

              {/* JORNADA DO FRANQUEADO */}
              <Section
                title="JORNADA DO FRANQUEADO"
                icon={<Users className="h-5 w-5" />}
                isOpen={openSections.franqueado}
                onToggle={() => toggleSection("franqueado")}
              >
                <div className="space-y-4">
                  {[
                    { step: 1, title: "LOGIN", desc: "Acessa o sistema com email/senha", route: "/login" },
                    { step: 2, title: "HOME", desc: "Visualiza dashboard e arquivos recentes", route: "/franqueado" },
                    { step: 3, title: "ENVIAR ARQUIVO", desc: "Upload de arquivo ECU com cliente e serviços", route: "/franqueado/enviar" },
                    { step: 4, title: "ACOMPANHAR", desc: "Monitora status do processamento", route: "/franqueado/arquivos" },
                    { step: 5, title: "SOLICITAR CORREÇÃO", desc: "Abre ticket de correção se necessário", route: "/franqueado/arquivos/:id" },
                    { step: 6, title: "SUPORTE", desc: "Chat em tempo real com administração", route: "/franqueado/suporte" },
                    { step: 7, title: "DOWNLOAD", desc: "Baixa arquivo processado", route: "/franqueado/arquivos/:id" },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-4 p-3 bg-muted/30 rounded-lg">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold shrink-0">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{item.title}</div>
                        <div className="text-sm text-muted-foreground">{item.desc}</div>
                      </div>
                      <Badge variant="outline" className="shrink-0">{item.route}</Badge>
                    </div>
                  ))}
                </div>
              </Section>

              <Separator />

              {/* JORNADA DO ADMIN */}
              <Section
                title="JORNADA DO ADMINISTRADOR"
                icon={<Shield className="h-5 w-5" />}
                isOpen={openSections.admin}
                onToggle={() => toggleSection("admin")}
              >
                <div className="space-y-4">
                  {[
                    { step: 1, title: "LOGIN", desc: "Acessa com credenciais de admin", route: "/login" },
                    { step: 2, title: "DASHBOARD", desc: "Visualiza KPIs e alertas do sistema", route: "/admin" },
                    { step: 3, title: "PROCESSAR ARQUIVOS", desc: "Analisa e processa arquivos recebidos", route: "/admin/arquivos" },
                    { step: 4, title: "CORREÇÕES", desc: "Gerencia tickets de correção", route: "/admin/correcoes" },
                    { step: 5, title: "SUPORTE", desc: "Responde tickets e chat em tempo real", route: "/admin/suporte" },
                    { step: 6, title: "FRANQUEADOS", desc: "Gerencia usuários e permissões", route: "/admin/franqueados" },
                    { step: 7, title: "RELATÓRIOS", desc: "Análise de dados e faturamento", route: "/admin/relatorios" },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-4 p-3 bg-muted/30 rounded-lg">
                      <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold shrink-0">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{item.title}</div>
                        <div className="text-sm text-muted-foreground">{item.desc}</div>
                      </div>
                      <Badge variant="outline" className="shrink-0">{item.route}</Badge>
                    </div>
                  ))}
                </div>
              </Section>

              <Separator />

              {/* BANCO DE DADOS */}
              <Section
                title="BANCO DE DADOS"
                icon={<Database className="h-5 w-5" />}
                isOpen={openSections.banco}
                onToggle={() => toggleSection("banco")}
              >
                <div className="space-y-4">
                  {[
                    { name: "user_roles", desc: "Controle de papéis (admin, suporte, franqueado)", cols: "id, user_id, role, created_at" },
                    { name: "support_conversations", desc: "Tickets de suporte", cols: "id, franqueado_id, subject, status, attachment_url, created_at" },
                    { name: "support_messages", desc: "Mensagens do chat de suporte", cols: "id, conversation_id, sender_id, sender_type, content, created_at" },
                    { name: "correction_tickets", desc: "Solicitações de correção de arquivos", cols: "id, arquivo_id, franqueado_id, motivo, status, conversation_id, created_at" },
                  ].map((table) => (
                    <div key={table.name} className="p-4 bg-muted/30 rounded-lg border">
                      <div className="font-mono font-semibold text-green-500">{table.name}</div>
                      <div className="text-sm text-muted-foreground mt-1">{table.desc}</div>
                      <div className="text-xs font-mono text-muted-foreground/70 mt-2">{table.cols}</div>
                    </div>
                  ))}
                </div>
              </Section>

              <Separator />

              {/* TECNOLOGIAS */}
              <Section
                title="STACK TECNOLÓGICO"
                icon={<Workflow className="h-5 w-5" />}
                isOpen={openSections.tecnologias}
                onToggle={() => toggleSection("tecnologias")}
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold mb-2">Frontend</h4>
                    <div className="flex flex-wrap gap-2">
                      {["React 18", "TypeScript", "Vite", "Tailwind CSS", "Framer Motion", "React Query", "React Router v7"].map(t => (
                        <Badge key={t} variant="secondary">{t}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold mb-2">Backend</h4>
                    <div className="flex flex-wrap gap-2">
                      {["Supabase", "PostgreSQL", "RLS Policies", "Realtime", "Storage", "Edge Functions"].map(t => (
                        <Badge key={t} variant="secondary">{t}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold mb-2">UI Components</h4>
                    <div className="flex flex-wrap gap-2">
                      {["Shadcn/UI", "Radix UI", "Lucide Icons", "Recharts", "Sonner"].map(t => (
                        <Badge key={t} variant="secondary">{t}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold mb-2">Autenticação</h4>
                    <div className="flex flex-wrap gap-2">
                      {["Supabase Auth", "JWT", "RBAC", "Session Management"].map(t => (
                        <Badge key={t} variant="secondary">{t}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>

            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} INJEDIESEL. Documentação gerada automaticamente.</p>
          <p className="mt-1">
            <Link to="/login" className="text-primary hover:underline">
              Acessar o Sistema →
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
