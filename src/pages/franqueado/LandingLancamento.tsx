import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Zap, Shield, BarChart3, Layers, FileCheck, Users, ShoppingCart, 
  Headphones, MapPin, TrendingUp, CheckCircle2, ArrowRight, 
  Lock, FileText, Database, ChevronDown, Sparkles, Clock, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Logo } from "@/components/Logo";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } }
};

// Section wrapper component
const Section = ({ 
  children, 
  className = "", 
  id 
}: { 
  children: React.ReactNode; 
  className?: string; 
  id?: string 
}) => (
  <section id={id} className={`py-16 md:py-24 px-4 md:px-8 ${className}`}>
    <div className="max-w-6xl mx-auto">
      {children}
    </div>
  </section>
);

// Section header component
const SectionHeader = ({ 
  title, 
  subtitle, 
  center = true 
}: { 
  title: string; 
  subtitle?: string; 
  center?: boolean 
}) => (
  <motion.div 
    className={`mb-12 ${center ? "text-center" : ""}`}
    variants={fadeInUp}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
  >
    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
      {title}
    </h2>
    {subtitle && (
      <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
        {subtitle}
      </p>
    )}
  </motion.div>
);

export default function LandingLancamento() {
  const navigate = useNavigate();

  const heroMetrics = [
    { label: "Fluxo com auditoria", value: "100%" },
    { label: "Ações em menos cliques", value: "↓ 50%" },
    { label: "Segurança por unidade", value: "RLS" }
  ];

  const novidades = [
    {
      icon: FileCheck,
      title: "Autopreenchimento por Placa + Termo de Responsabilidade",
      description: "Quando a placa é encontrada, os dados do veículo preenchem automaticamente. Se não for encontrada, o termo protege sua operação e formaliza a responsabilidade dos dados informados."
    },
    {
      icon: Users,
      title: "Clientes por Unidade com Histórico Completo",
      description: "Cada unidade tem seu próprio banco de clientes, sem vazamento entre unidades. A franqueadora enxerga tudo com filtros e auditoria."
    },
    {
      icon: ShoppingCart,
      title: "Loja Interna Promax com Carrinho e Checkout",
      description: "Compre produtos internos direto no sistema, com total automático e pagamento via Pix, cartão ou boleto (até 4x)."
    }
  ];

  const benefits = [
    {
      icon: Zap,
      title: "Operação mais rápida",
      description: "Atalhos, ações rápidas em tabelas e fluxos guiados para reduzir cliques e erros."
    },
    {
      icon: Clock,
      title: "Menos retrabalho",
      description: "Status claros, tempo parado visível e histórico completo por arquivo/cliente/veículo."
    },
    {
      icon: BarChart3,
      title: "Decisão baseada em dados",
      description: "KPIs, gráficos de desempenho e ranking de unidade para acompanhar evolução."
    },
    {
      icon: Layers,
      title: "Padronização premium",
      description: "Interface moderna e consistente, preparada para escala e novas automações."
    }
  ];

  const lojaHighlights = [
    "Catálogo padronizado e importável",
    "Carrinho com total automático",
    "Pagamento: Pix, Cartão, Boleto (até 4x)",
    "Admin: compras por unidade e exportações"
  ];

  const supportFeatures = [
    "Tickets com status e histórico",
    "Upload de evidências",
    "SLA visível (quando aplicável)",
    "Centralização de comunicação"
  ];

  const securityItems = [
    {
      icon: Database,
      title: "Isolamento por unidade (multi-tenant)",
      description: "Cada unidade só enxerga seus próprios clientes e pedidos. A franqueadora enxerga tudo com filtros e auditoria."
    },
    {
      icon: FileText,
      title: "Exportações com termo LGPD",
      description: "Exportar dados exige aceite do termo e gera log para rastreabilidade."
    },
    {
      icon: Lock,
      title: "Auditoria de ações críticas",
      description: "Consultas de placa, imports e exportações podem ser rastreadas por usuário e unidade."
    }
  ];

  const demographicFeatures = [
    "Cadastro de cidades atendidas por chips e validação BR/PY",
    "Busca por cidade: mostra unidade responsável ou indica disponibilidade",
    "Mapa interativo (fase seguinte) com áreas demarcadas por contrato"
  ];

  const performanceKPIs = [
    { label: "Arquivos concluídos (mês)", value: "127", trend: "+12%" },
    { label: "Tempo médio de resposta", value: "2.4h", trend: "-18%" },
    { label: "Taxa de correção", value: "8%", trend: "-3%" }
  ];

  const steps = [
    {
      number: "01",
      title: "Complete seu perfil e valide sua unidade",
      description: "Garanta que seus dados e permissões estão corretos."
    },
    {
      number: "02",
      title: "Envie seu primeiro arquivo com segurança",
      description: "Use placa quando aplicável e registre informações com rastreabilidade."
    },
    {
      number: "03",
      title: "Organize clientes e compras em um só lugar",
      description: "Cadastre clientes por unidade, acompanhe histórico e compre produtos internos."
    }
  ];

  const faqItems = [
    {
      q: "Essa página é pública?",
      a: "Não. Ela é restrita e exige login. Apenas franqueados autenticados podem acessar."
    },
    {
      q: "Como funciona a segurança entre unidades?",
      a: "Cada unidade visualiza apenas seus próprios dados (clientes, pedidos, históricos). A franqueadora tem visão global com filtros."
    },
    {
      q: "Posso exportar dados de clientes?",
      a: "Sim, mas a exportação exige aceite do termo LGPD e gera registro de auditoria."
    },
    {
      q: "A loja aceita quais pagamentos?",
      a: "Pix, cartão e boleto, com possibilidade de parcelamento em até 4x conforme configuração."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4 py-20 overflow-hidden">
        {/* Animated Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" 
        />
        <motion.div 
          animate={{ y: [-10, 10, -10] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 right-1/3 w-64 h-64 bg-primary/5 rounded-full blur-2xl" 
        />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black_40%,transparent_100%)]" />
        
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Badge with glow effect */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8"
          >
            <Badge variant="outline" className="px-4 py-2 text-sm border-primary/30 bg-primary/5 backdrop-blur-sm shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)]">
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="w-4 h-4 mr-2 text-primary" />
              </motion.div>
              LANÇAMENTO • Plataforma Injediesel
            </Badge>
          </motion.div>

          {/* Animated headline with blur reveal */}
          <motion.h1
            initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8 }}
            className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight"
          >
            Sua operação, agora em um{" "}
            <motion.span 
              className="text-primary inline-block"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5, type: "spring", stiffness: 200 }}
            >
              novo nível
            </motion.span>{" "}
            de controle,{" "}
            <motion.span 
              className="text-primary inline-block relative"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5, type: "spring", stiffness: 200 }}
            >
              segurança
              <motion.span 
                className="absolute -inset-2 bg-primary/10 rounded-lg -z-10"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, duration: 0.4 }}
              />
            </motion.span>{" "}
            e performance.
          </motion.h1>

          {/* Subtitle with staggered words */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto"
          >
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              Centralize arquivos, clientes, produtos e suporte em uma plataforma única —{" "}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-foreground/80"
            >
              com auditoria, demografia e indicadores em tempo real para acelerar sua unidade.
            </motion.span>
          </motion.p>

          {/* CTAs with hover glow */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                size="lg" 
                className="group px-8 relative overflow-hidden shadow-[0_0_30px_rgba(var(--primary-rgb),0.2)] hover:shadow-[0_0_40px_rgba(var(--primary-rgb),0.3)] transition-shadow"
                onClick={() => navigate("/login")}
              >
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.6 }}
                />
                Entrar no Painel
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                variant="outline" 
                size="lg"
                className="backdrop-blur-sm"
                onClick={() => document.getElementById("novidades")?.scrollIntoView({ behavior: "smooth" })}
              >
                Ver novidades do mês
                <motion.span
                  animate={{ y: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ChevronDown className="ml-2 w-4 h-4" />
                </motion.span>
              </Button>
            </motion.div>
          </motion.div>

          {/* Hero metrics with 3D card effect */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto perspective-1000">
            {heroMetrics.map((metric, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, scale: 0.8, rotateX: -15 }}
                animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                transition={{ delay: 0.5 + index * 0.15, duration: 0.6 }}
                whileHover={{ 
                  scale: 1.05, 
                  rotateY: 5,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
                }}
                className="glass-card p-4 rounded-xl text-center cursor-default transform-gpu"
              >
                <motion.div 
                  className="text-2xl font-bold text-primary mb-1"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.1, type: "spring", stiffness: 200 }}
                >
                  {metric.value}
                </motion.div>
                <div className="text-sm text-muted-foreground">{metric.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2"
          >
            <motion.div 
              className="w-1 h-2 bg-primary rounded-full"
              animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Novidades Section */}
      <Section id="novidades" className="bg-card/30">
        <SectionHeader 
          title="O que chegou com a nova plataforma"
          subtitle="Funcionalidades que transformam sua operação diária"
        />
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6"
        >
          {novidades.map((item, index) => (
            <motion.div key={index} variants={fadeInUp}>
              <Card className="h-full glass-card border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* Benefits Section */}
      <Section>
        <SectionHeader 
          title="Benefícios reais para o dia a dia da unidade"
          subtitle="Menos ruído. Mais previsibilidade. Mais controle."
        />
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {benefits.map((benefit, index) => (
            <motion.div key={index} variants={scaleIn}>
              <Card className="h-full group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border-border/50">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <benefit.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* Loja Section */}
      <Section className="bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Badge variant="outline" className="mb-4">Loja Interna</Badge>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Produtos internos: venda e reposição com controle
            </h2>
            <p className="text-muted-foreground mb-6">
              Catálogo Promax integrado com carrinho, checkout e histórico de compras.
            </p>
            <ul className="space-y-3 mb-8">
              {lojaHighlights.map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-foreground">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Button onClick={() => navigate("/franqueado/loja")} className="group">
              Acessar Loja
              <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
          
          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative"
          >
            <div className="glass-card rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
              <div className="relative grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-card/80 rounded-lg p-4 border border-border/50">
                    <ShoppingCart className="w-8 h-8 text-primary mb-2" />
                    <div className="text-2xl font-bold text-foreground">47</div>
                    <div className="text-xs text-muted-foreground">Produtos ativos</div>
                  </div>
                  <div className="bg-card/80 rounded-lg p-4 border border-border/50">
                    <TrendingUp className="w-8 h-8 text-success mb-2" />
                    <div className="text-2xl font-bold text-foreground">+23%</div>
                    <div className="text-xs text-muted-foreground">Vendas do mês</div>
                  </div>
                </div>
                <div className="bg-card/80 rounded-lg p-4 border border-border/50 flex flex-col justify-center">
                  <div className="text-sm text-muted-foreground mb-1">Total em pedidos</div>
                  <div className="text-3xl font-bold text-foreground">R$ 12.847</div>
                  <div className="text-xs text-success mt-1">↑ 18% vs mês anterior</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* Support Section */}
      <Section>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="order-2 lg:order-1"
          >
            <div className="glass-card rounded-2xl p-6 space-y-4">
              {/* Mock ticket */}
              <div className="bg-card/80 rounded-lg p-4 border border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" className="text-xs">Ticket #1247</Badge>
                  <Badge className="bg-warning/10 text-warning border-warning/20 text-xs">Em análise</Badge>
                </div>
                <div className="text-sm font-medium text-foreground mb-1">Dúvida sobre arquivo retornado</div>
                <div className="text-xs text-muted-foreground">Atualizado há 2 horas</div>
              </div>
              <div className="bg-card/80 rounded-lg p-4 border border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" className="text-xs">Ticket #1245</Badge>
                  <Badge className="bg-success/10 text-success border-success/20 text-xs">Resolvido</Badge>
                </div>
                <div className="text-sm font-medium text-foreground mb-1">Solicitação de material</div>
                <div className="text-xs text-muted-foreground">Resolvido em 4 horas</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="order-1 lg:order-2"
          >
            <Badge variant="outline" className="mb-4">Suporte</Badge>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Suporte evoluído, com rastreabilidade
            </h2>
            <p className="text-muted-foreground mb-6">
              Menos mensagens soltas. Mais previsibilidade de atendimento.
            </p>
            <ul className="space-y-3 mb-8">
              {supportFeatures.map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-foreground">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Button onClick={() => navigate("/franqueado/suporte")} className="group">
              Abrir um Ticket
              <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
        </div>
      </Section>

      {/* Security Section */}
      <Section className="bg-card/30">
        <SectionHeader 
          title="Segurança e garantias: seu dado protegido e auditável"
          subtitle="LGPD, isolamento por unidade e termos de responsabilidade onde faz sentido."
        />
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6"
        >
          {securityItems.map((item, index) => (
            <motion.div key={index} variants={fadeInUp}>
              <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* Demographic Control Section */}
      <Section>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Badge variant="outline" className="mb-4">Cobertura</Badge>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Controle demográfico e cobertura por cidade
            </h2>
            <p className="text-muted-foreground mb-6">
              Cidades atendidas por unidade e busca de disponibilidade para expansão.
            </p>
            <ul className="space-y-3 mb-8">
              {demographicFeatures.map((item, index) => (
                <li key={index} className="flex items-start gap-3 text-foreground">
                  <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {/* Map placeholder */}
            <div className="glass-card rounded-2xl p-6 aspect-[4/3] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
              <div className="relative text-center">
                <MapPin className="w-16 h-16 text-primary/30 mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">Mapa interativo</p>
                <Badge variant="outline" className="mt-2 text-xs">Em breve</Badge>
              </div>
              {/* Decorative dots */}
              <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-primary rounded-full animate-pulse" />
              <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-primary/60 rounded-full animate-pulse delay-100" />
              <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-primary/40 rounded-full animate-pulse delay-200" />
            </div>
          </motion.div>
        </div>
      </Section>

      {/* Performance Section */}
      <Section className="bg-gradient-to-br from-primary/5 via-background to-background">
        <SectionHeader 
          title="Desempenho em tempo real"
          subtitle="Acompanhe evolução com indicadores e ranking — sem achismo."
        />
        
        {/* KPIs */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid sm:grid-cols-3 gap-6 mb-12"
        >
          {performanceKPIs.map((kpi, index) => (
            <motion.div key={index} variants={scaleIn}>
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-foreground mb-1">{kpi.value}</div>
                  <div className="text-sm text-muted-foreground mb-2">{kpi.label}</div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${kpi.trend.startsWith('+') ? 'text-success border-success/30' : kpi.trend.startsWith('-') && kpi.label.includes('correção') ? 'text-success border-success/30' : 'text-success border-success/30'}`}
                  >
                    {kpi.trend}
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Chart placeholder */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid lg:grid-cols-2 gap-6"
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Performance por semana</h3>
              <div className="h-48 flex items-end justify-between gap-2 px-4">
                {[65, 78, 82, 70, 88, 92, 85].map((height, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-primary/20 rounded-t transition-all hover:bg-primary/40"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-xs text-muted-foreground">S{i + 1}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Ranking de desempenho</h3>
              <div className="space-y-3">
                {[
                  { name: "São Paulo - Centro", score: 98, growth: "+5%" },
                  { name: "Curitiba - Norte", score: 94, growth: "+3%" },
                  { name: "Belo Horizonte", score: 91, growth: "+8%" },
                  { name: "Rio de Janeiro", score: 87, growth: "+2%" }
                ].map((unit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">{unit.name}</div>
                    </div>
                    <div className="text-sm font-bold text-foreground">{unit.score}</div>
                    <Badge variant="outline" className="text-xs text-success border-success/30">
                      {unit.growth}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border/50 text-center">
                <Badge variant="outline" className="text-xs">Dados ilustrativos • Em construção</Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </Section>

      {/* Get Started Section */}
      <Section>
        <SectionHeader 
          title="Comece em 3 passos"
          subtitle="Configure sua unidade e aproveite todos os recursos da plataforma."
        />
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8 mb-12"
        >
          {steps.map((step, index) => (
            <motion.div key={index} variants={fadeInUp} className="relative">
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-primary/30 to-transparent -z-10" />
              )}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 border-2 border-primary/20">
                  <span className="text-2xl font-bold text-primary">{step.number}</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
        <div className="text-center">
          <Button size="lg" onClick={() => navigate("/franqueado")} className="group px-8">
            Ir para o Dashboard
            <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </Section>

      {/* FAQ Section */}
      <Section className="bg-card/30">
        <SectionHeader 
          title="Perguntas frequentes"
        />
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqItems.map((item, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg px-6"
              >
                <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </Section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/50 bg-card/30">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo className="h-8 w-auto" />
          </div>
          <p className="text-sm text-muted-foreground text-center md:text-right">
            Injediesel • Plataforma interna para franqueados • Uso restrito e auditável
          </p>
        </div>
      </footer>
    </div>
  );
}
