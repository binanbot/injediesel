import { FileText, Download, Printer, ChevronDown, ChevronRight } from "lucide-react";
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

export default function DocumentacaoSistema() {
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    visao: true,
    auth: false,
    franqueado: false,
    admin: false,
    banco: false,
    ui: false,
    fluxo: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePrint = () => {
    // Expand all sections before printing
    setOpenSections({
      visao: true,
      auth: true,
      franqueado: true,
      admin: true,
      banco: true,
      ui: true,
      fluxo: true,
    });
    
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleExportPDF = () => {
    // Expand all sections before printing
    setOpenSections({
      visao: true,
      auth: true,
      franqueado: true,
      admin: true,
      banco: true,
      ui: true,
      fluxo: true,
    });
    
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
            Relatório completo de arquitetura e funcionalidades
          </p>
        </div>
        <div className="flex gap-2">
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
            <span>Versão: 1.0</span>
            <span>•</span>
            <span>Data: {currentDate}</span>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <ScrollArea className="h-[calc(100vh-400px)] pr-4">
            <div className="space-y-4">
              {/* 1. Visão Geral */}
              <Section
                title="1. VISÃO GERAL"
                isOpen={openSections.visao}
                onToggle={() => toggleSection("visao")}
              >
                <p className="mb-4">
                  O sistema é uma plataforma SaaS B2B para gestão de arquivos de ECU 
                  (Engine Control Unit) entre franqueados e a franqueadora Injediesel.
                </p>
                
                <h4 className="font-semibold mb-2">Tecnologias Utilizadas:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  <Badge variant="outline">React + TypeScript</Badge>
                  <Badge variant="outline">Vite</Badge>
                  <Badge variant="outline">Tailwind CSS</Badge>
                  <Badge variant="outline">Framer Motion</Badge>
                  <Badge variant="outline">Lovable Cloud</Badge>
                  <Badge variant="outline">PostgreSQL</Badge>
                  <Badge variant="outline">Supabase Auth</Badge>
                  <Badge variant="outline">Realtime</Badge>
                </div>
              </Section>

              <Separator />

              {/* 2. Autenticação */}
              <Section
                title="2. FLUXO DE AUTENTICAÇÃO"
                isOpen={openSections.auth}
                onToggle={() => toggleSection("auth")}
              >
                <h4 className="font-semibold mb-2">Página de Login (/login)</h4>
                <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
                  <li>Layout centralizado com efeito glassmorphism</li>
                  <li>Campos: E-mail e Senha</li>
                  <li>E-mails com "admin" → Painel Administrativo</li>
                  <li>Demais e-mails → Painel do Franqueado</li>
                </ul>

                <h4 className="font-semibold mb-2">Níveis de Acesso:</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left border">Nível</th>
                        <th className="p-2 text-left border">Rota Base</th>
                        <th className="p-2 text-left border">Descrição</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2 border">Franqueado</td>
                        <td className="p-2 border font-mono text-xs">/franqueado/*</td>
                        <td className="p-2 border">Usuário da rede de franquias</td>
                      </tr>
                      <tr>
                        <td className="p-2 border">Admin</td>
                        <td className="p-2 border font-mono text-xs">/admin/*</td>
                        <td className="p-2 border">Equipe administrativa</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Section>

              <Separator />

              {/* 3. Painel Franqueado */}
              <Section
                title="3. PAINEL DO FRANQUEADO"
                isOpen={openSections.franqueado}
                onToggle={() => toggleSection("franqueado")}
              >
                <h4 className="font-semibold mb-2">Menu de Navegação:</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                  {["Home", "Enviar Arquivo", "Meus Arquivos", "Materiais", "Tutoriais", 
                    "Atualizações", "Mensagens", "Relatórios", "Suporte", "Perfil"].map((item) => (
                    <Badge key={item} variant="secondary">{item}</Badge>
                  ))}
                </div>

                <h4 className="font-semibold mb-2">Funcionalidades:</h4>
                <div className="space-y-3">
                  <FeatureItem 
                    title="Home" 
                    description="Dashboard com estatísticas, atalhos e notificações" 
                  />
                  <FeatureItem 
                    title="Enviar Arquivo" 
                    description="Upload de ECU, seleção de cliente, categorias de serviço" 
                  />
                  <FeatureItem 
                    title="Meus Arquivos" 
                    description="Lista com status (Pendente, Em Análise, Concluído)" 
                  />
                  <FeatureItem 
                    title="Relatórios" 
                    description="Faturamento por período com gráficos de pizza" 
                  />
                  <FeatureItem 
                    title="Suporte" 
                    description="Botões neon (Tel, WhatsApp, E-mail), tickets e chat ao vivo" 
                  />
                </div>
              </Section>

              <Separator />

              {/* 4. Painel Admin */}
              <Section
                title="4. PAINEL ADMINISTRATIVO"
                isOpen={openSections.admin}
                onToggle={() => toggleSection("admin")}
              >
                <h4 className="font-semibold mb-2">Menu de Navegação:</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                  {["Dashboard", "Arquivos", "Franqueados", "Áreas", "Banners", 
                    "Mensagens", "Suporte", "Relatórios", "Configurações", "Documentação"].map((item) => (
                    <Badge key={item} variant="secondary">{item}</Badge>
                  ))}
                </div>

                <h4 className="font-semibold mb-2">Funcionalidades:</h4>
                <div className="space-y-3">
                  <FeatureItem 
                    title="Dashboard" 
                    description="Alertas de prioridade (banner neon), estatísticas gerais" 
                  />
                  <FeatureItem 
                    title="Gestão de Arquivos" 
                    description="Processar, aprovar e finalizar arquivos ECU" 
                  />
                  <FeatureItem 
                    title="Suporte" 
                    description="Tickets com prioridade, atribuição, timeline e histórico" 
                  />
                  <FeatureItem 
                    title="Relatórios" 
                    description="Top 10 revendas, desempenho por categoria de veículo" 
                  />
                </div>
              </Section>

              <Separator />

              {/* 5. Banco de Dados */}
              <Section
                title="5. BANCO DE DADOS"
                isOpen={openSections.banco}
                onToggle={() => toggleSection("banco")}
              >
                <h4 className="font-semibold mb-2">Tabelas do Sistema:</h4>
                
                <div className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h5 className="font-mono text-sm font-semibold mb-2">support_conversations</h5>
                    <code className="text-xs block whitespace-pre-wrap text-muted-foreground">
{`id: UUID (PK)
franqueado_id: UUID (FK → auth.users)
subject: TEXT
status: TEXT ('open' | 'closed')
created_at: TIMESTAMP
updated_at: TIMESTAMP`}
                    </code>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h5 className="font-mono text-sm font-semibold mb-2">support_messages</h5>
                    <code className="text-xs block whitespace-pre-wrap text-muted-foreground">
{`id: UUID (PK)
conversation_id: UUID (FK)
sender_id: UUID
sender_type: TEXT ('franqueado' | 'suporte')
content: TEXT
created_at: TIMESTAMP`}
                    </code>
                  </div>
                </div>

                <h4 className="font-semibold mt-4 mb-2">Segurança (RLS):</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                  <li>Franqueados só visualizam suas próprias conversas</li>
                  <li>Mensagens visíveis apenas para participantes</li>
                  <li>Inserção validada por autenticação</li>
                  <li>Realtime habilitado para mensagens</li>
                </ul>
              </Section>

              <Separator />

              {/* 6. UI Components */}
              <Section
                title="6. COMPONENTES DE UI"
                isOpen={openSections.ui}
                onToggle={() => toggleSection("ui")}
              >
                <h4 className="font-semibold mb-2">Design System:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm mb-4">
                  <li>Tema Dark/Light mode</li>
                  <li>Cores semânticas via CSS variables</li>
                  <li>Animações: Fade, Scale, Slide, Pulse</li>
                </ul>

                <h4 className="font-semibold mb-2">Efeitos Especiais:</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Badge>Neon Pulse</Badge>
                  <Badge>Glassmorphism</Badge>
                  <Badge>Typing Animation</Badge>
                  <Badge>Hover Scale</Badge>
                </div>
              </Section>

              <Separator />

              {/* 7. Fluxo de Trabalho */}
              <Section
                title="7. FLUXO DE TRABALHO"
                isOpen={openSections.fluxo}
                onToggle={() => toggleSection("fluxo")}
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Franqueado:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Login → Painel Home</li>
                      <li>Cadastrar Cliente (se necessário)</li>
                      <li>Enviar Arquivo ECU</li>
                      <li>Acompanhar Status</li>
                      <li>Receber Notificação</li>
                      <li>Baixar Arquivo Modificado</li>
                      <li>Consultar Faturamento</li>
                      <li>Suporte via Chat/Ticket</li>
                    </ol>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Administrador:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Login → Dashboard Admin</li>
                      <li>Verificar Alertas</li>
                      <li>Acessar Arquivos Pendentes</li>
                      <li>Processar Arquivo</li>
                      <li>Upload Arquivo Modificado</li>
                      <li>Atualizar Status</li>
                      <li>Gerenciar Tickets</li>
                      <li>Gerar Relatórios</li>
                    </ol>
                  </div>
                </div>
              </Section>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
                <p>© {new Date().getFullYear()} Injediesel - Todos os direitos reservados</p>
                <p className="mt-1">Documento gerado automaticamente pelo sistema</p>
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
  isOpen, 
  onToggle, 
  children 
}: { 
  title: string; 
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
