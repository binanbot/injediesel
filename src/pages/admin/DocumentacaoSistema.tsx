import { FileText, Download, Printer, ChevronDown, ChevronRight, Map, Users, Shield, Database, Palette, GitBranch, Workflow, Network } from "lucide-react";
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

export default function DocumentacaoSistema() {
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    diagramas: true,
    mapa: false,
    visao: false,
    auth: false,
    franqueado: false,
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
    setOpenSections({
      diagramas: true,
      mapa: true,
      visao: true,
      auth: true,
      franqueado: true,
      admin: true,
      banco: true,
      ui: true,
      fluxo: true,
      jornadas: true,
    });
  };

  const handlePrint = () => {
    expandAll();
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleExportPDF = () => {
    expandAll();
    setTimeout(() => {
      window.print();
      toast({
        title: "Exportar PDF",
        description: "Na janela de impressão, selecione 'Salvar como PDF' como destino.",
      });
    }, 300);
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
          <Button variant="outline" onClick={expandAll}>
            Expandir Tudo
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
          .print-break {
            page-break-before: always;
          }
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
            Sistema de Gestão de Arquivos ECU para Franqueados
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
            <span>Versão: 2.0</span>
            <span>•</span>
            <span>Data: {currentDate}</span>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <ScrollArea className="h-[calc(100vh-400px)] pr-4">
            <div className="space-y-4">
              
              {/* DIAGRAMAS DE ARQUITETURA */}
              <Section
                title="DIAGRAMAS DE ARQUITETURA"
                icon={<Network className="h-5 w-5" />}
                isOpen={openSections.diagramas}
                onToggle={() => toggleSection("diagramas")}
              >
                <div className="space-y-8">
                  {/* Arquitetura do Sistema */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Badge variant="outline">1</Badge>
                      Arquitetura Geral do Sistema
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Visão geral da estrutura frontend/backend e suas conexões.
                    </p>
                    <MermaidDiagram chart={ARCHITECTURE_DIAGRAM} id="architecture" />
                  </div>

                  {/* Fluxo de Dados */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Badge variant="outline">2</Badge>
                      Fluxo de Dados - Autenticação e Envio de Arquivo
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Sequência de operações desde o login até o processamento de arquivos.
                    </p>
                    <MermaidDiagram chart={DATA_FLOW_DIAGRAM} id="dataflow" />
                  </div>

                  {/* Fluxo de Suporte */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Badge variant="outline">3</Badge>
                      Fluxo de Suporte em Tempo Real
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Comunicação bidirecional entre franqueados e administradores via Realtime.
                    </p>
                    <MermaidDiagram chart={SUPPORT_FLOW_DIAGRAM} id="support" />
                  </div>

                  {/* Modelo de Dados */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Badge variant="outline">4</Badge>
                      Modelo de Dados (ER Diagram)
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Relacionamentos entre as tabelas do banco de dados PostgreSQL.
                    </p>
                    <MermaidDiagram chart={DATABASE_DIAGRAM} id="database" />
                  </div>
                </div>
              </Section>

              <Separator />
              
              {/* MAPA MENTAL DO SISTEMA */}
              <Section
                title="MAPA MENTAL DO SISTEMA"
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
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full" />
                          <span>Home (Dashboard + Arquivos Recentes)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full" />
                          <span>Enviar Arquivo (ECU + Cliente + Serviços)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full" />
                          <span>Meus Arquivos (Lista + Detalhes + Correção)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full" />
                          <span>Materiais & Tutoriais</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full" />
                          <span>Atualizações (Notificações)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full" />
                          <span>Mensagens (Comunicados)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full" />
                          <span>Relatórios (Faturamento)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full" />
                          <span>Suporte (Chat + Tickets)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full" />
                          <span>Perfil (Configurações)</span>
                        </div>
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
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-400 rounded-full" />
                          <span>Dashboard (KPIs + Alertas)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-400 rounded-full" />
                          <span>Arquivos (Gestão + Processamento)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-400 rounded-full" />
                          <span>Correções (Tickets de Correção)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-400 rounded-full" />
                          <span>Franqueados (Gestão de Usuários)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-400 rounded-full" />
                          <span>Áreas (Regiões)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-400 rounded-full" />
                          <span>Banners (Marketing)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-400 rounded-full" />
                          <span>Mensagens (Comunicados)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-400 rounded-full" />
                          <span>Suporte (Tickets + Chat)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-400 rounded-full" />
                          <span>Relatórios (Analytics)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-400 rounded-full" />
                          <span>Configurações</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-400 rounded-full" />
                          <span>Documentação (Este Documento)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Conexão Central */}
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

              {/* JORNADAS DO USUÁRIO */}
              <Section
                title="JORNADAS DO USUÁRIO"
                icon={<Workflow className="h-5 w-5" />}
                isOpen={openSections.jornadas}
                onToggle={() => toggleSection("jornadas")}
              >
                {/* Jornada Franqueado */}
                <div className="mb-8">
                  <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">F</span>
                    </div>
                    Jornada do Franqueado
                  </h4>
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-blue-500/30" />
                    <div className="space-y-4">
                      <JourneyStep number={1} title="Login" description="Autenticação com email/senha → Redirecionamento para /franqueado" color="blue" />
                      <JourneyStep number={2} title="Home Dashboard" description="Visualiza estatísticas, arquivos recentes, atalhos rápidos e notificações" color="blue" />
                      <JourneyStep number={3} title="Enviar Arquivo" description="Seleciona cliente (ou cadastra novo), seleciona serviços, faz upload do ECU" color="blue" />
                      <JourneyStep number={4} title="Acompanhar Status" description="Em 'Meus Arquivos' visualiza status: Pendente → Em Análise → Concluído" color="blue" />
                      <JourneyStep number={5} title="Solicitar Correção" description="Se necessário, abre ticket de correção com motivo e anexo opcional" color="blue" />
                      <JourneyStep number={6} title="Receber Arquivo" description="Notificação de conclusão, download do arquivo modificado" color="blue" />
                      <JourneyStep number={7} title="Consultar Relatórios" description="Verifica faturamento por período, gráficos e histórico" color="blue" />
                      <JourneyStep number={8} title="Suporte" description="Abre tickets, usa chat em tempo real, contato via WhatsApp/telefone" color="blue" />
                    </div>
                  </div>
                </div>

                {/* Jornada Admin */}
                <div>
                  <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">A</span>
                    </div>
                    Jornada do Administrador
                  </h4>
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-orange-500/30" />
                    <div className="space-y-4">
                      <JourneyStep number={1} title="Login Admin" description="Autenticação com role 'admin' ou 'suporte' → Redirecionamento para /admin" color="orange" />
                      <JourneyStep number={2} title="Dashboard" description="Verifica alertas prioritários, KPIs, arquivos pendentes" color="orange" />
                      <JourneyStep number={3} title="Processar Arquivos" description="Acessa fila de arquivos, processa ECU, faz upload do arquivo modificado" color="orange" />
                      <JourneyStep number={4} title="Gerenciar Correções" description="Visualiza tickets de correção, timeline, chat com franqueado" color="orange" />
                      <JourneyStep number={5} title="Atender Suporte" description="Responde tickets e chats em tempo real" color="orange" />
                      <JourneyStep number={6} title="Gestão de Franqueados" description="Cadastra, edita, gerencia franqueados e suas áreas" color="orange" />
                      <JourneyStep number={7} title="Comunicados" description="Envia mensagens e banners para franqueados" color="orange" />
                      <JourneyStep number={8} title="Relatórios" description="Analisa desempenho, top revendas, faturamento geral" color="orange" />
                      <JourneyStep number={9} title="Acesso Franqueado" description="Admin pode acessar painel do franqueado para testes/suporte" color="orange" />
                    </div>
                  </div>
                </div>
              </Section>

              <Separator />

              {/* 1. Visão Geral */}
              <Section
                title="VISÃO GERAL DO SISTEMA"
                icon={<GitBranch className="h-5 w-5" />}
                isOpen={openSections.visao}
                onToggle={() => toggleSection("visao")}
              >
                <p className="mb-4">
                  O sistema é uma plataforma SaaS B2B para gestão de arquivos de ECU 
                  (Engine Control Unit) entre franqueados e a franqueadora Injediesel.
                  Permite envio, processamento, correção e acompanhamento de arquivos
                  com comunicação em tempo real.
                </p>
                
                <h4 className="font-semibold mb-2">Tecnologias Utilizadas:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  <Badge variant="outline">React 18 + TypeScript</Badge>
                  <Badge variant="outline">Vite</Badge>
                  <Badge variant="outline">Tailwind CSS</Badge>
                  <Badge variant="outline">Framer Motion</Badge>
                  <Badge variant="outline">Lovable Cloud</Badge>
                  <Badge variant="outline">PostgreSQL</Badge>
                  <Badge variant="outline">Supabase Auth</Badge>
                  <Badge variant="outline">Supabase Realtime</Badge>
                  <Badge variant="outline">React Query</Badge>
                  <Badge variant="outline">React Router v7</Badge>
                  <Badge variant="outline">Shadcn/UI</Badge>
                  <Badge variant="outline">Lucide Icons</Badge>
                </div>

                <h4 className="font-semibold mb-2">Arquitetura:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                  <li>Frontend: SPA React com roteamento client-side</li>
                  <li>Backend: Lovable Cloud (Supabase) com Edge Functions</li>
                  <li>Database: PostgreSQL com RLS (Row Level Security)</li>
                  <li>Storage: Supabase Storage para arquivos e anexos</li>
                  <li>Realtime: WebSocket para chat e notificações</li>
                </ul>
              </Section>

              <Separator />

              {/* 2. Autenticação */}
              <Section
                title="AUTENTICAÇÃO E RBAC"
                icon={<Shield className="h-5 w-5" />}
                isOpen={openSections.auth}
                onToggle={() => toggleSection("auth")}
              >
                <h4 className="font-semibold mb-2">Sistema de Autenticação:</h4>
                <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
                  <li>Autenticação via Supabase Auth (email/senha)</li>
                  <li>Sessões gerenciadas automaticamente</li>
                  <li>Rotas protegidas via ProtectedRoute component</li>
                  <li>Auto-confirm habilitado para desenvolvimento</li>
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
                        <td className="p-2 border">Acesso apenas ao painel de franqueado</td>
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

                <h4 className="font-semibold mt-4 mb-2">Fluxo de Login:</h4>
                <div className="bg-muted/50 p-4 rounded-lg text-sm">
                  <code className="block whitespace-pre-wrap">
{`1. Usuário acessa /login
2. Insere email e senha
3. Sistema valida via Supabase Auth
4. Busca role na tabela user_roles
5. Redireciona baseado na role:
   - franqueado → /franqueado
   - admin/suporte → /admin`}
                  </code>
                </div>
              </Section>

              <Separator />

              {/* 3. Painel Franqueado */}
              <Section
                title="PAINEL DO FRANQUEADO"
                icon={<Users className="h-5 w-5" />}
                isOpen={openSections.franqueado}
                onToggle={() => toggleSection("franqueado")}
              >
                <h4 className="font-semibold mb-2">Rotas Disponíveis:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  <Badge variant="secondary">/franqueado</Badge>
                  <Badge variant="secondary">/franqueado/enviar</Badge>
                  <Badge variant="secondary">/franqueado/arquivos</Badge>
                  <Badge variant="secondary">/franqueado/arquivos/:id</Badge>
                  <Badge variant="secondary">/franqueado/atualizacoes</Badge>
                  <Badge variant="secondary">/franqueado/tutoriais</Badge>
                  <Badge variant="secondary">/franqueado/materiais</Badge>
                  <Badge variant="secondary">/franqueado/mensagens</Badge>
                  <Badge variant="secondary">/franqueado/relatorios</Badge>
                  <Badge variant="secondary">/franqueado/suporte</Badge>
                  <Badge variant="secondary">/franqueado/perfil</Badge>
                </div>

                <h4 className="font-semibold mb-2">Funcionalidades Principais:</h4>
                <div className="space-y-3">
                  <FeatureItem 
                    title="Home" 
                    description="Dashboard com estatísticas pessoais, arquivos recentes com ação rápida, atalhos e banner carousel" 
                  />
                  <FeatureItem 
                    title="Enviar Arquivo" 
                    description="Seleção/cadastro de cliente, escolha de serviços por categoria, upload de arquivo ECU com validações" 
                  />
                  <FeatureItem 
                    title="Meus Arquivos" 
                    description="Lista paginada com filtros por status (Pendente, Em Análise, Concluído), busca por nome" 
                  />
                  <FeatureItem 
                    title="Detalhes do Arquivo" 
                    description="Visualização completa, histórico de status, download de arquivos, formulário de solicitação de correção unificado" 
                  />
                  <FeatureItem 
                    title="Solicitar Correção" 
                    description="Formulário com motivo obrigatório, anexo opcional, cria ticket no banco e inicia conversa de suporte" 
                  />
                  <FeatureItem 
                    title="Relatórios" 
                    description="Faturamento por período com gráficos de pizza por categoria de serviço" 
                  />
                  <FeatureItem 
                    title="Suporte" 
                    description="Chat em tempo real via Supabase Realtime, histórico de conversas, botões de contato (Tel, WhatsApp, Email)" 
                  />
                </div>
              </Section>

              <Separator />

              {/* 4. Painel Admin */}
              <Section
                title="PAINEL ADMINISTRATIVO"
                icon={<Shield className="h-5 w-5" />}
                isOpen={openSections.admin}
                onToggle={() => toggleSection("admin")}
              >
                <h4 className="font-semibold mb-2">Rotas Disponíveis:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  <Badge variant="secondary">/admin</Badge>
                  <Badge variant="secondary">/admin/arquivos</Badge>
                  <Badge variant="secondary">/admin/arquivos/:id</Badge>
                  <Badge variant="secondary">/admin/correcoes</Badge>
                  <Badge variant="secondary">/admin/franqueados</Badge>
                  <Badge variant="secondary">/admin/areas</Badge>
                  <Badge variant="secondary">/admin/banners</Badge>
                  <Badge variant="secondary">/admin/mensagens</Badge>
                  <Badge variant="secondary">/admin/suporte</Badge>
                  <Badge variant="secondary">/admin/relatorios</Badge>
                  <Badge variant="secondary">/admin/configuracoes</Badge>
                  <Badge variant="secondary">/admin/documentacao</Badge>
                </div>

                <h4 className="font-semibold mb-2">Funcionalidades Principais:</h4>
                <div className="space-y-3">
                  <FeatureItem 
                    title="Dashboard" 
                    description="Alertas neon de prioridade, KPIs em cards, resumo de pendências, atividade recente" 
                  />
                  <FeatureItem 
                    title="Gestão de Arquivos" 
                    description="Fila de processamento, detalhes com timeline, upload de arquivo modificado, atualização de status" 
                  />
                  <FeatureItem 
                    title="Tickets de Correção" 
                    description="Lista de tickets com status, timeline visual, painel de chat integrado, resolução de tickets" 
                  />
                  <FeatureItem 
                    title="Suporte" 
                    description="Visualização de todas as conversas, filtros por status, chat em tempo real com franqueados" 
                  />
                  <FeatureItem 
                    title="Franqueados" 
                    description="CRUD completo, ativação/desativação, atribuição de áreas" 
                  />
                  <FeatureItem 
                    title="Banners" 
                    description="Gestão de banners do carousel da home do franqueado" 
                  />
                  <FeatureItem 
                    title="Relatórios" 
                    description="Top 10 revendas, desempenho por categoria, exportação de dados" 
                  />
                  <FeatureItem 
                    title="Documentação" 
                    description="Esta página - documentação técnica completa com exportação PDF" 
                  />
                </div>

                <h4 className="font-semibold mt-4 mb-2">Acesso ao Painel Franqueado:</h4>
                <p className="text-sm text-muted-foreground">
                  Usuários com role 'admin' ou 'suporte' podem acessar o painel do franqueado 
                  (/franqueado/*) para testes, suporte e troubleshooting sem restrições.
                </p>
              </Section>

              <Separator />

              {/* 5. Banco de Dados */}
              <Section
                title="BANCO DE DADOS"
                icon={<Database className="h-5 w-5" />}
                isOpen={openSections.banco}
                onToggle={() => toggleSection("banco")}
              >
                <h4 className="font-semibold mb-2">Tabelas do Sistema:</h4>
                
                <div className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h5 className="font-mono text-sm font-semibold mb-2 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Tabela</Badge>
                      user_roles
                    </h5>
                    <code className="text-xs block whitespace-pre-wrap text-muted-foreground">
{`id: UUID (PK)
user_id: UUID (FK → auth.users)
role: ENUM ('admin' | 'suporte' | 'franqueado')
created_at: TIMESTAMP`}
                    </code>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h5 className="font-mono text-sm font-semibold mb-2 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Tabela</Badge>
                      support_conversations
                    </h5>
                    <code className="text-xs block whitespace-pre-wrap text-muted-foreground">
{`id: UUID (PK)
franqueado_id: UUID (FK → auth.users)
subject: TEXT
status: TEXT ('open' | 'closed')
attachment_url: TEXT (opcional)
attachment_name: TEXT (opcional)
created_at: TIMESTAMP
updated_at: TIMESTAMP`}
                    </code>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h5 className="font-mono text-sm font-semibold mb-2 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Tabela</Badge>
                      support_messages
                    </h5>
                    <code className="text-xs block whitespace-pre-wrap text-muted-foreground">
{`id: UUID (PK)
conversation_id: UUID (FK → support_conversations)
sender_id: UUID
sender_type: TEXT ('franqueado' | 'suporte')
content: TEXT
created_at: TIMESTAMP`}
                    </code>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h5 className="font-mono text-sm font-semibold mb-2 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Tabela</Badge>
                      correction_tickets
                    </h5>
                    <code className="text-xs block whitespace-pre-wrap text-muted-foreground">
{`id: UUID (PK)
arquivo_id: TEXT
franqueado_id: UUID (FK → auth.users)
motivo: TEXT
status: TEXT ('pendente' | 'em_andamento' | 'resolvido')
arquivo_anexo_url: TEXT (opcional)
conversation_id: UUID (FK → support_conversations, opcional)
created_at: TIMESTAMP
updated_at: TIMESTAMP`}
                    </code>
                  </div>
                </div>

                <h4 className="font-semibold mt-4 mb-2">Segurança (RLS):</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                  <li>Franqueados só visualizam/modificam seus próprios dados</li>
                  <li>Mensagens visíveis apenas para participantes da conversa</li>
                  <li>Inserção validada por autenticação (auth.uid())</li>
                  <li>Realtime habilitado para mensagens (supabase_realtime)</li>
                  <li>Admin/Suporte podem visualizar todas as conversas</li>
                </ul>

                <h4 className="font-semibold mt-4 mb-2">Storage Buckets:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                  <li><code className="text-xs bg-muted px-1 rounded">correction-files</code> - Anexos de tickets de correção</li>
                </ul>
              </Section>

              <Separator />

              {/* 6. UI Components */}
              <Section
                title="DESIGN SYSTEM"
                icon={<Palette className="h-5 w-5" />}
                isOpen={openSections.ui}
                onToggle={() => toggleSection("ui")}
              >
                <h4 className="font-semibold mb-2">Tema Visual:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm mb-4">
                  <li>Dark Premium com suporte a Light mode</li>
                  <li>Glassmorphism (backdrop-blur 12-20px)</li>
                  <li>Gradientes em tons de azul marinho, índigo e grafite</li>
                  <li>Cores semânticas via CSS variables HSL</li>
                </ul>

                <h4 className="font-semibold mb-2">Componentes Base (Shadcn/UI):</h4>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
                  <Badge variant="outline">Button</Badge>
                  <Badge variant="outline">Card</Badge>
                  <Badge variant="outline">Dialog</Badge>
                  <Badge variant="outline">Drawer</Badge>
                  <Badge variant="outline">Table</Badge>
                  <Badge variant="outline">Tabs</Badge>
                  <Badge variant="outline">Form</Badge>
                  <Badge variant="outline">Input</Badge>
                  <Badge variant="outline">Select</Badge>
                  <Badge variant="outline">Badge</Badge>
                  <Badge variant="outline">Toast</Badge>
                  <Badge variant="outline">Sidebar</Badge>
                </div>

                <h4 className="font-semibold mb-2">Efeitos Especiais:</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Badge>Neon Pulse (Alertas)</Badge>
                  <Badge>Glassmorphism</Badge>
                  <Badge>Typing Animation</Badge>
                  <Badge>Hover Scale</Badge>
                  <Badge>Fade In/Out</Badge>
                  <Badge>Slide Animations</Badge>
                </div>

                <h4 className="font-semibold mt-4 mb-2">Componentes Customizados:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                  <li>Logo - SVG responsivo da marca</li>
                  <li>BannerCarousel - Carousel de banners na home</li>
                  <li>SupportChat - Chat em tempo real</li>
                  <li>TicketTimeline - Timeline visual de tickets</li>
                  <li>ClienteSelect - Seletor com cadastro inline</li>
                  <li>ArquivoDetalheDialog - Modal de detalhes rápidos</li>
                </ul>
              </Section>

              <Separator />

              {/* 7. Fluxos de Trabalho */}
              <Section
                title="FLUXOS DE TRABALHO"
                icon={<GitBranch className="h-5 w-5" />}
                isOpen={openSections.fluxo}
                onToggle={() => toggleSection("fluxo")}
              >
                <h4 className="font-semibold mb-3">Fluxo de Envio de Arquivo:</h4>
                <div className="bg-muted/50 p-4 rounded-lg mb-6">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge>1. Seleciona Cliente</Badge>
                    <span>→</span>
                    <Badge>2. Escolhe Serviços</Badge>
                    <span>→</span>
                    <Badge>3. Upload ECU</Badge>
                    <span>→</span>
                    <Badge>4. Status: Pendente</Badge>
                    <span>→</span>
                    <Badge variant="secondary">5. Admin Processa</Badge>
                    <span>→</span>
                    <Badge variant="secondary">6. Status: Concluído</Badge>
                    <span>→</span>
                    <Badge>7. Download</Badge>
                  </div>
                </div>

                <h4 className="font-semibold mb-3">Fluxo de Correção:</h4>
                <div className="bg-muted/50 p-4 rounded-lg mb-6">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge>1. Detalhes Arquivo</Badge>
                    <span>→</span>
                    <Badge>2. Solicitar Correção</Badge>
                    <span>→</span>
                    <Badge>3. Preenche Motivo</Badge>
                    <span>→</span>
                    <Badge>4. Anexa Arquivo (opc)</Badge>
                    <span>→</span>
                    <Badge variant="secondary">5. Ticket Criado</Badge>
                    <span>→</span>
                    <Badge variant="secondary">6. Admin Analisa</Badge>
                    <span>→</span>
                    <Badge variant="secondary">7. Resolve</Badge>
                  </div>
                </div>

                <h4 className="font-semibold mb-3">Fluxo de Suporte:</h4>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge>1. Abre Conversa</Badge>
                    <span>→</span>
                    <Badge>2. Escreve Mensagem</Badge>
                    <span>→</span>
                    <Badge variant="secondary">3. Admin Recebe (Realtime)</Badge>
                    <span>→</span>
                    <Badge variant="secondary">4. Admin Responde</Badge>
                    <span>→</span>
                    <Badge>5. Franqueado Recebe (Realtime)</Badge>
                    <span>→</span>
                    <Badge variant="secondary">6. Fecha Conversa</Badge>
                  </div>
                </div>
              </Section>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
                <p>© {new Date().getFullYear()} Injediesel - Todos os direitos reservados</p>
                <p className="mt-1">Documento gerado automaticamente pelo sistema</p>
                <p className="mt-2 text-xs">Versão 2.0 - Atualizado em {currentDate}</p>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function Section({ 
  title, 
  icon,
  isOpen, 
  onToggle, 
  children 
}: { 
  title: string; 
  icon?: React.ReactNode;
  isOpen: boolean; 
  onToggle: () => void; 
  children: React.ReactNode;
}) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-2 hover:text-primary transition-colors">
        {isOpen ? (
          <ChevronDown className="h-5 w-5" />
        ) : (
          <ChevronRight className="h-5 w-5" />
        )}
        {icon && <span className="text-primary">{icon}</span>}
        <h3 className="text-lg font-bold">{title}</h3>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-7 pt-2">
        {children}
      </CollapsibleContent>
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

function JourneyStep({ 
  number, 
  title, 
  description, 
  color 
}: { 
  number: number; 
  title: string; 
  description: string; 
  color: "blue" | "orange";
}) {
  const colorClasses = color === "blue" 
    ? "bg-blue-500 text-blue-400 border-blue-500/30" 
    : "bg-orange-500 text-orange-400 border-orange-500/30";
  
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
