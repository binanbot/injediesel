import { useState } from "react";
import {
  BookOpen, Users, LayoutDashboard, FileDown, ShoppingCart, BarChart3,
  TrendingUp, Wallet, Shield, Headphones, ChevronDown, ChevronRight,
  Monitor, UserCircle, Upload, Package, ClipboardList, Settings,
  Target, MessageSquare, HelpCircle, ArrowRight, CheckCircle2, AlertCircle,
  Briefcase, PieChart, Layers, Eye, Pencil, Truck, Star, Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/* ────────────────────── helpers ────────────────────── */

function Section({ id, icon: Icon, title, children }: { id: string; icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function InfoCard({ icon: Icon, title, description, badges }: { icon: React.ElementType; title: string; description: string; badges?: string[] }) {
  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardContent className="pt-5 pb-4 px-5 space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0"><Icon className="h-4 w-4" /></div>
          <h4 className="font-semibold text-sm text-foreground">{title}</h4>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        {badges && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {badges.map(b => <Badge key={b} variant="secondary" className="text-xs">{b}</Badge>)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StepFlow({ steps }: { steps: { label: string; detail?: string }[] }) {
  return (
    <div className="flex flex-col gap-1 pl-1">
      {steps.map((s, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <span className="w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
            {i < steps.length - 1 && <div className="w-px h-4 bg-border" />}
          </div>
          <div className="pb-2">
            <p className="text-sm font-medium text-foreground">{s.label}</p>
            {s.detail && <p className="text-xs text-muted-foreground">{s.detail}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function Collapsible({ title, children, defaultOpen }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="border rounded-lg">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors">
        <span>{title}</span>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}

/* ────────────────────── nav items ────────────────────── */

const navSections = [
  { id: "visao-geral", label: "Visão Geral", icon: BookOpen },
  { id: "perfis", label: "Perfis e Acessos", icon: Users },
  { id: "navegacao", label: "Como Navegar", icon: Monitor },
  { id: "fluxos", label: "Fluxos Principais", icon: ArrowRight },
  { id: "comercial", label: "Camada Comercial", icon: TrendingUp },
  { id: "crm", label: "CRM", icon: Target },
  { id: "financeiro", label: "Financeiro e Rentabilidade", icon: Wallet },
  { id: "master-ceo", label: "Master e CEO", icon: PieChart },
  { id: "faq", label: "Dúvidas Comuns", icon: HelpCircle },
];

/* ────────────────────── page component ────────────────────── */

export default function GuiaSistema() {
  return (
    <div className="flex gap-6 max-w-7xl mx-auto">
      {/* Sidebar nav */}
      <nav className="hidden lg:flex flex-col gap-1 w-56 shrink-0 sticky top-6 self-start">
        <p className="text-xs uppercase text-muted-foreground font-semibold mb-2 px-2">Seções</p>
        {navSections.map(s => (
          <a key={s.id} href={`#${s.id}`} className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
            <s.icon className="h-3.5 w-3.5" /> {s.label}
          </a>
        ))}
      </nav>

      {/* Content */}
      <div className="flex-1 space-y-12 pb-20">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline">Guia do Sistema</Badge>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Tutorial Completo do Sistema</h1>
          <p className="text-muted-foreground max-w-2xl">
            Guia prático para entender e utilizar todas as funcionalidades do sistema.
            Ideal para onboarding, consulta rápida e treinamento.
          </p>
        </div>

        <Separator />

        {/* ─── 1. VISÃO GERAL ─── */}
        <Section id="visao-geral" icon={BookOpen} title="Visão Geral">
          <Card className="mb-6">
            <CardContent className="pt-5 space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Este é um sistema multiempresa para gestão de <strong>arquivos de ECU</strong>, 
                vendas, clientes, CRM e operações financeiras. Atende simultaneamente as marcas 
                <strong> Injediesel</strong> e <strong>PROMAX TUNER</strong>, cada uma com branding, 
                módulos e configurações independentes.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                O acesso é separado por <strong>painéis</strong> que se adaptam automaticamente 
                ao tipo de usuário e à empresa a que ele pertence.
              </p>
            </CardContent>
          </Card>

          <h3 className="text-lg font-semibold text-foreground mb-4">Painéis do Sistema</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <InfoCard icon={UserCircle} title="Painel do Franqueado" description="Área operacional onde o franqueado envia arquivos, acompanha status, faz compras na loja, gerencia clientes e abre suporte." badges={["Envio ECU", "Loja", "Suporte"]} />
            <InfoCard icon={Settings} title="Painel Administrativo" description="Gestão da operação da empresa: franqueados, arquivos, vendas, CRM, financeiro, colaboradores e permissões." badges={["Gestão", "Vendas", "Financeiro"]} />
            <InfoCard icon={Layers} title="Painel Master" description="Visão operacional do grupo com comparativo entre empresas. Gestão de custos, rentabilidade e inteligência comercial." badges={["Multi-empresa", "Custos", "Rentabilidade"]} />
            <InfoCard icon={PieChart} title="Painel CEO" description="Visão executiva e estratégica com KPIs consolidados, market share, metas/OKRs e projeções de crescimento." badges={["Estratégico", "KPIs", "Projeções"]} />
          </div>

          <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Empresas suportadas</p>
                <p className="text-sm text-muted-foreground">
                  <strong>Injediesel</strong> — Foco em reprogramação de ECU automotiva com rede de franqueados em todo Brasil.<br />
                  <strong>PROMAX TUNER</strong> — Marca técnica com equipamento proprietário EVOPRO e identidade visual dark/técnica.
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* ─── 2. PERFIS E ACESSOS ─── */}
        <Section id="perfis" icon={Users} title="Perfis e Acessos">
          <p className="text-sm text-muted-foreground mb-6">
            Cada usuário possui um perfil que define o que ele pode ver e fazer no sistema.
            O acesso é automaticamente ajustado pela empresa e pelo painel.
          </p>
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Franqueado</CardTitle>
                  <Badge variant="secondary">Operacional</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p><strong>O que faz:</strong> Envia arquivos de ECU, acompanha status, faz compras na loja, gerencia seus clientes e veículos, abre chamados de suporte.</p>
                <p><strong>O que vê:</strong> Apenas seus próprios dados — arquivos, pedidos, clientes e histórico da sua unidade.</p>
                <p><strong>O que não faz:</strong> Não acessa dados de outros franqueados, não altera configurações da empresa, não visualiza painéis financeiros ou de gestão.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Admin / Suporte</CardTitle>
                  <Badge>Gestão</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p><strong>O que faz:</strong> Gerencia franqueados, processa arquivos, controla vendas, produtos, colaboradores e permissões. O Suporte foca no atendimento (tickets e correções).</p>
                <p><strong>O que vê:</strong> Todos os dados operacionais da empresa — franqueados, clientes, pedidos, financeiro e auditoria.</p>
                <p><strong>O que não faz:</strong> Não acessa dados de outras empresas. Não tem visão executiva consolidada do grupo.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Admin Empresa / Suporte Empresa</CardTitle>
                  <Badge variant="outline">Empresa Específica</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p><strong>O que faz:</strong> As mesmas funções de Admin/Suporte, mas vinculado exclusivamente a uma empresa (ex: só PROMAX TUNER).</p>
                <p><strong>O que vê:</strong> Apenas dados da sua empresa — franqueados, vendas e operações dentro do escopo da empresa.</p>
                <p><strong>Diferença principal:</strong> Isolamento total — não enxerga dados de outras marcas do grupo.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Master Admin</CardTitle>
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200">Global</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p><strong>O que faz:</strong> Gerencia todas as empresas e operações do grupo. Acessa custos, rentabilidade e inteligência comercial comparativa.</p>
                <p><strong>O que vê:</strong> Visão completa de todas as empresas simultaneamente.</p>
                <p><strong>Painel:</strong> /master — focado em operação do grupo e comparativos.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">CEO</CardTitle>
                  <Badge className="bg-violet-100 text-violet-800 border-violet-200">Executivo</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p><strong>O que faz:</strong> Acompanha KPIs estratégicos, market share, metas/OKRs, receita e crescimento do grupo.</p>
                <p><strong>O que vê:</strong> Dashboards executivos consolidados com tendências, projeções e alertas inteligentes.</p>
                <p><strong>Painel:</strong> /ceo — visão estratégica e de alto nível, sem operação do dia a dia.</p>
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* ─── 3. COMO NAVEGAR ─── */}
        <Section id="navegacao" icon={Monitor} title="Como Navegar">
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <InfoCard icon={LayoutDashboard} title="Sidebar / Menu Lateral" description="O menu lateral é o principal ponto de navegação. Ele mostra apenas os itens que você tem permissão para acessar. Use-o para navegar entre módulos." />
            <InfoCard icon={Eye} title="Cards de KPI" description="Os cards coloridos no topo das páginas mostram métricas rápidas. Muitos são clicáveis e funcionam como atalhos para listagens filtradas." />
            <InfoCard icon={BarChart3} title="Gráficos e Tabelas" description="Tabelas mostram dados detalhados com busca e filtros. Gráficos de linha/barra mostram tendências ao longo do tempo." />
            <InfoCard icon={Shield} title="Badges de Status" description="Badges coloridos indicam o estado de um item: Processando (azul), Concluído (verde), Cancelado (vermelho), Pendente (amarelo)." />
          </div>

          <div className="p-4 rounded-lg bg-muted/50 border">
            <p className="text-sm font-medium text-foreground mb-2">💡 Dica de navegação</p>
            <p className="text-sm text-muted-foreground">
              <strong>Filtros</strong> ficam no topo das listagens — use-os para encontrar rapidamente o que precisa.
              <strong> Tooltips</strong> aparecem ao passar o mouse sobre KPIs e mostram a definição técnica de cada métrica.
              O <strong>menu hambúrguer</strong> (☰) abre a sidebar em dispositivos móveis.
            </p>
          </div>
        </Section>

        {/* ─── 4. FLUXOS PRINCIPAIS ─── */}
        <Section id="fluxos" icon={ArrowRight} title="Fluxos Principais">
          <div className="space-y-4">
            <Collapsible title="📤 Envio de Arquivo ECU" defaultOpen>
              <StepFlow steps={[
                { label: "Franqueado acessa 'Enviar Arquivo'", detail: "Informa a placa do veículo para consulta automática" },
                { label: "Sistema consulta os dados do veículo", detail: "Preenche automaticamente marca, modelo e ano" },
                { label: "Franqueado seleciona os serviços desejados", detail: "Escolhe entre as opções disponíveis (ex: Stage 1, DPF Off...)" },
                { label: "Anexa o arquivo original da ECU", detail: "Faz upload do arquivo lido pelo equipamento" },
                { label: "Arquivo é recebido e entra na fila", detail: "Status: 'Recebido' → 'Em processamento' → 'Concluído'" },
                { label: "Franqueado baixa o arquivo processado", detail: "Disponível na página de detalhes do arquivo" },
              ]} />
            </Collapsible>

            <Collapsible title="🔄 Correção de Arquivo">
              <StepFlow steps={[
                { label: "Franqueado identifica um problema no arquivo" },
                { label: "Abre uma solicitação de correção na página do arquivo" },
                { label: "Descreve o problema e pode anexar evidências" },
                { label: "Suporte analisa e envia arquivo corrigido" },
                { label: "Status atualiza para 'Correção Concluída'" },
              ]} />
            </Collapsible>

            <Collapsible title="🛒 Loja / Compra de Produtos">
              <StepFlow steps={[
                { label: "Franqueado acessa a Loja", detail: "Navega pelos produtos disponíveis com preços e promoções" },
                { label: "Adiciona itens ao carrinho" },
                { label: "Vai ao Checkout", detail: "Revisa itens, seleciona endereço de entrega e forma de pagamento" },
                { label: "Confirma o pedido" },
                { label: "Acompanha pelo 'Meus Pedidos'", detail: "Status: Pendente → Confirmado → Enviado → Entregue" },
              ]} />
            </Collapsible>

            <Collapsible title="👥 Clientes e Veículos">
              <StepFlow steps={[
                { label: "Franqueado cadastra um cliente", detail: "Nome, CPF/CNPJ, telefone, e-mail, endereço" },
                { label: "Vincula veículos ao cliente", detail: "Placa, marca, modelo, ano e dados da ECU" },
                { label: "Ao enviar um arquivo, seleciona o cliente e veículo" },
                { label: "Histórico completo fica disponível no perfil do cliente" },
              ]} />
            </Collapsible>

            <Collapsible title="💰 Venda Manual">
              <StepFlow steps={[
                { label: "Operador acessa 'Venda Manual' no painel admin" },
                { label: "Seleciona o franqueado/cliente", detail: "Pode criar novo cliente se necessário" },
                { label: "Adiciona produtos e/ou serviços ao pedido" },
                { label: "Define canal de venda, vendedor responsável e pagamento" },
                { label: "Confirma a venda — pedido é registrado com atribuição comercial" },
              ]} />
            </Collapsible>

            <Collapsible title="📊 Dashboards Executivos">
              <StepFlow steps={[
                { label: "CEO acessa o painel executivo" },
                { label: "Visualiza KPIs consolidados do grupo", detail: "Faturamento, margem, ativação, custo" },
                { label: "Compara empresas lado a lado" },
                { label: "Navega para Receita, Market Share, Metas ou Comercial", detail: "Cada seção tem drill-down por empresa" },
                { label: "Analisa tendências e projeções", detail: "Gráficos de evolução, variação MoM e alertas" },
              ]} />
            </Collapsible>
          </div>
        </Section>

        {/* ─── 5. CAMADA COMERCIAL ─── */}
        <Section id="comercial" icon={TrendingUp} title="Camada Comercial">
          <p className="text-sm text-muted-foreground mb-6">
            O sistema separa claramente quem <strong>opera</strong> a venda de quem <strong>recebe o crédito comercial</strong>.
            Isso permite rastreabilidade total e comissões justas.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <InfoCard icon={UserCircle} title="Vendedor Responsável" description="O colaborador que detém a carteira do cliente e recebe o crédito pela venda. Aparece como 'seller_profile_id'." />
            <InfoCard icon={Pencil} title="Operador" description="Quem registrou a venda no sistema. Pode ser diferente do vendedor. Aparece como 'operator_user_id'." />
            <InfoCard icon={Briefcase} title="Carteira do Cliente" description="Cada cliente tem um vendedor principal (primary_seller_id). Vendas para esse cliente são atribuídas ao vendedor da carteira." />
            <InfoCard icon={Truck} title="Canal de Venda" description="Indica como a venda foi feita: Balcão, Telefone ou ambos. Cada vendedor tem canais permitidos (allowed_sales_channels)." />
          </div>

          <Card className="mb-4">
            <CardContent className="pt-5">
              <h4 className="font-semibold text-sm text-foreground mb-3">Venda Própria vs Atribuída</h4>
              <div className="grid sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                  <p className="font-medium text-green-700 dark:text-green-400 mb-1">Venda Própria</p>
                  <p>Operador e vendedor responsável são a mesma pessoa. O vendedor atende, registra e recebe o crédito.</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <p className="font-medium text-blue-700 dark:text-blue-400 mb-1">Venda Atribuída</p>
                  <p>Operador registra a venda, mas o crédito vai para outro vendedor (o responsável pela carteira do cliente).</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <InfoCard icon={Target} title="Meta" description="Valor mensal definido por empresa para cada vendedor atingir." />
            <InfoCard icon={Star} title="Ranking" description="Classificação dos vendedores por desempenho: % atingimento da meta." />
            <InfoCard icon={Wallet} title="Comissão" description="Percentual ou valor fixo sobre vendas, calculado no fechamento mensal." />
            <InfoCard icon={ClipboardList} title="Fechamento" description="Período mensal onde vendas são consolidadas, comissões calculadas e aprovadas." />
          </div>
        </Section>

        {/* ─── 6. CRM ─── */}
        <Section id="crm" icon={Target} title="CRM">
          <p className="text-sm text-muted-foreground mb-6">
            O CRM organiza o relacionamento comercial com os clientes,
            desde a prospecção até o pós-venda.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoCard icon={Briefcase} title="Carteira" description="Visão geral dos clientes por vendedor. Mostra status da carteira: ativo, inativo, novo." />
            <InfoCard icon={MessageSquare} title="Atividades" description="Registro de interações com o cliente: ligações, visitas, e-mails, reuniões." />
            <InfoCard icon={Layers} title="Funil" description="Pipeline de oportunidades com estágios: Prospecção → Qualificação → Proposta → Negociação → Fechado." />
            <InfoCard icon={CheckCircle2} title="Tarefas" description="Ações programadas como follow-ups, envio de propostas e retornos." />
            <InfoCard icon={BarChart3} title="Agenda" description="Visão das atividades agendadas por dia/semana para organização comercial." />
            <InfoCard icon={Zap} title="Reativação" description="Identificação de clientes inativos com potencial de retorno. Ações sugeridas automaticamente." />
          </div>
        </Section>

        {/* ─── 7. FINANCEIRO E RENTABILIDADE ─── */}
        <Section id="financeiro" icon={Wallet} title="Financeiro e Rentabilidade">
          <div className="space-y-4">
            <Collapsible title="Lançamentos Financeiros" defaultOpen>
              <p className="text-sm text-muted-foreground mb-3">
                Todo valor que entra ou sai passa pelos <strong>lançamentos financeiros</strong>. Cada lançamento tem:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                <li><strong>Tipo:</strong> Receita ou Despesa</li>
                <li><strong>Categoria:</strong> Serviço, Produto, Comissão, Operacional etc.</li>
                <li><strong>Competência:</strong> Mês de referência do lançamento</li>
                <li><strong>Status:</strong> Pendente → Aprovado → Pago</li>
              </ul>
            </Collapsible>

            <Collapsible title="Custos de Colaboradores">
              <p className="text-sm text-muted-foreground">
                Cada colaborador pode ter custos cadastrados (salário, benefícios, comissão).
                Esses valores alimentam os cálculos de <strong>rentabilidade por colaborador</strong>,
                permitindo entender quanto cada pessoa custa vs quanto gera de receita.
              </p>
            </Collapsible>

            <Collapsible title="Custos Operacionais">
              <p className="text-sm text-muted-foreground">
                Despesas gerais da empresa: aluguel, ferramentas, licenças, marketing.
                Alimentam a rentabilidade da empresa como um todo.
              </p>
            </Collapsible>

            <Collapsible title="Fechamento Mensal">
              <p className="text-sm text-muted-foreground">
                Ao final de cada mês, o gestor pode fechar o período financeiro.
                Isso consolida todos os lançamentos, calcula comissões, gera o relatório do período
                e bloqueia edição retroativa.
              </p>
            </Collapsible>

            <Collapsible title="Rentabilidade">
              <p className="text-sm text-muted-foreground">
                A rentabilidade cruza receita com custos para gerar métricas como:
                <strong> Margem %</strong>, <strong>ROI por colaborador</strong>, <strong>Custo/Receita</strong>.
                Disponível nos painéis Master e CEO com drill-down por empresa e equipe.
              </p>
            </Collapsible>
          </div>
        </Section>

        {/* ─── 8. MASTER E CEO ─── */}
        <Section id="master-ceo" icon={PieChart} title="Master e CEO">
          <div className="grid sm:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Painel Master</CardTitle>
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200">Operacional</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                <p>Focado na <strong>gestão operacional do grupo</strong>. O Master gerencia o dia a dia de todas as empresas.</p>
                <ul className="space-y-1.5 list-disc pl-5">
                  <li>Dashboard consolidado por empresa</li>
                  <li>Custos de colaboradores e operacionais</li>
                  <li>Rentabilidade por equipe e empresa</li>
                  <li>Inteligência CRM comparativa</li>
                  <li>Drill-down por empresa individual</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Painel CEO</CardTitle>
                  <Badge className="bg-violet-100 text-violet-800 border-violet-200">Estratégico</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                <p>Focado na <strong>visão estratégica e executiva</strong>. O CEO acompanha indicadores de alto nível sem se envolver na operação.</p>
                <ul className="space-y-1.5 list-disc pl-5">
                  <li>KPIs consolidados com variação MoM</li>
                  <li>Receita e Crescimento</li>
                  <li>Market Share entre empresas</li>
                  <li>Metas e OKRs</li>
                  <li>Inteligência Comercial com projeções</li>
                  <li>Rentabilidade executiva</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 p-4 rounded-lg bg-muted/50 border">
            <p className="text-sm font-medium text-foreground mb-1">Diferença principal</p>
            <p className="text-sm text-muted-foreground">
              O <strong>Master</strong> é "mãos na massa" — configura, ajusta e opera.
              O <strong>CEO</strong> é "visão de helicóptero" — analisa, decide e direciona.
              Ambos têm acesso global, mas com foco diferente.
            </p>
          </div>
        </Section>

        {/* ─── 9. FAQ ─── */}
        <Section id="faq" icon={HelpCircle} title="Dúvidas Comuns">
          <div className="space-y-3">
            <Collapsible title="Como sei qual painel estou usando?">
              <p className="text-sm text-muted-foreground">
                O sistema direciona você automaticamente para o painel correto ao fazer login.
                A sidebar lateral e o badge no topo indicam em qual contexto você está (Franqueado, Admin, Master ou CEO).
              </p>
            </Collapsible>

            <Collapsible title="Posso acessar o painel de outra empresa?">
              <p className="text-sm text-muted-foreground">
                Não. Cada empresa tem seu acesso isolado. Admin e Suporte veem apenas dados da sua empresa.
                Apenas Master Admin e CEO podem navegar entre empresas.
              </p>
            </Collapsible>

            <Collapsible title="Meu contrato venceu. O que acontece?">
              <p className="text-sm text-muted-foreground">
                Franqueados com contrato vencido veem um alerta no painel e ficam impedidos de enviar novos arquivos
                ou fazer downloads. Compras na loja também são bloqueadas. Procure o administrador para renovação.
              </p>
            </Collapsible>

            <Collapsible title="Como funciona o suporte?">
              <p className="text-sm text-muted-foreground">
                Franqueados podem abrir tickets pelo menu "Suporte". As conversas funcionam como um chat em tempo real.
                O time de suporte recebe notificações sonoras e visuais de novas mensagens.
              </p>
            </Collapsible>

            <Collapsible title="O que é uma 'correção' de arquivo?">
              <p className="text-sm text-muted-foreground">
                Se o arquivo processado apresentar algum problema, o franqueado pode solicitar uma correção.
                Ele descreve o problema, pode anexar evidências, e o suporte refaz o processamento.
              </p>
            </Collapsible>

            <Collapsible title="O que são permissões granulares?">
              <p className="text-sm text-muted-foreground">
                Além do perfil (admin, suporte etc.), o sistema possui permissões finas por módulo.
                Um administrador pode configurar exatamente o que cada colaborador pode fazer:
                visualizar, criar, editar, excluir, exportar, aprovar ou gerenciar cada módulo do sistema.
              </p>
            </Collapsible>

            <Collapsible title="Como funciona o isolamento entre Injediesel e PROMAX?">
              <p className="text-sm text-muted-foreground">
                Cada empresa tem seus próprios dados, franqueados, produtos e configurações.
                Um admin da Injediesel não consegue ver dados da PROMAX TUNER, e vice-versa.
                O isolamento é aplicado em todos os níveis: banco de dados, interface e menus.
              </p>
            </Collapsible>

            <Collapsible title="O que significam os badges coloridos nos KPIs?">
              <p className="text-sm text-muted-foreground">
                Verde indica tendência positiva (crescimento, aumento). Vermelho indica tendência negativa
                (queda, redução). Amarelo/laranja indica atenção. Passe o mouse sobre qualquer KPI para ver
                a definição completa da métrica.
              </p>
            </Collapsible>
          </div>
        </Section>
      </div>
    </div>
  );
}
