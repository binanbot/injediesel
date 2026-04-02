import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Zap, Shield, BarChart3, FileCheck, Users, ArrowRight, 
  CheckCircle2, ChevronDown, Cpu, Wrench, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/Logo";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } }
};

const Section = ({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) => (
  <section id={id} className={`py-16 md:py-24 px-4 md:px-8 ${className}`}>
    <div className="max-w-6xl mx-auto">{children}</div>
  </section>
);

const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <motion.div className="mb-12 text-center" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">{title}</h2>
    {subtitle && <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{subtitle}</p>}
  </motion.div>
);

export default function LandingPromax() {
  const navigate = useNavigate();

  const heroMetrics = [
    { label: "Gestão centralizada", value: "100%" },
    { label: "Equipamento próprio", value: "EVOPRO" },
    { label: "Segurança por unidade", value: "RLS" }
  ];

  const features = [
    {
      icon: Cpu,
      title: "Equipamento EVOPRO Integrado",
      description: "Gestão completa do seu equipamento proprietário com rastreio de seriais, validades e manutenção."
    },
    {
      icon: FileCheck,
      title: "Arquivos com Rastreabilidade Total",
      description: "Envie e receba arquivos de ECU com histórico completo, status em tempo real e auditoria."
    },
    {
      icon: Users,
      title: "Clientes por Unidade",
      description: "Cada unidade gerencia seus próprios clientes com isolamento total de dados."
    }
  ];

  const benefits = [
    { icon: Zap, title: "Operação ágil", description: "Fluxos otimizados para reduzir cliques e acelerar entregas." },
    { icon: Shield, title: "Segurança total", description: "Isolamento por unidade e conformidade com LGPD." },
    { icon: BarChart3, title: "Dados em tempo real", description: "KPIs e relatórios para decisões baseadas em dados." },
    { icon: Target, title: "Controle preciso", description: "Gerencie unidades, estoque e pedidos em um só lugar." }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black_40%,transparent_100%)]" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -30, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], scale: { type: "spring", stiffness: 200, damping: 15 } }}
            className="mb-8"
          >
            <motion.div
              animate={{ boxShadow: ["0 0 20px rgba(193,13,25,0.2)", "0 0 40px rgba(193,13,25,0.3)", "0 0 20px rgba(193,13,25,0.2)"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="inline-block p-4 rounded-2xl bg-background/50 backdrop-blur-sm border border-primary/20"
            >
              <Logo size="lg" className="h-12 md:h-16" />
            </motion.div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8 }}
            className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight"
          >
            Reprogramação ECU com{" "}
            <motion.span className="text-primary inline-block" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, type: "spring", stiffness: 200 }}>
              tecnologia própria
            </motion.span>{" "}
            e{" "}
            <motion.span className="text-primary inline-block" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, type: "spring", stiffness: 200 }}>
              controle total
            </motion.span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto"
          >
            Plataforma exclusiva PROMAX TUNER — gerencie arquivos, clientes, equipamentos EVOPRO e operações em uma única plataforma segura.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                size="lg"
                className="group px-8 relative overflow-hidden shadow-[0_0_30px_rgba(193,13,25,0.2)] hover:shadow-[0_0_40px_rgba(193,13,25,0.3)] transition-shadow"
                onClick={() => navigate("/login")}
              >
                Entrar no Painel
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                size="lg"
                className="backdrop-blur-sm"
                onClick={() => document.getElementById("recursos")?.scrollIntoView({ behavior: "smooth" })}
              >
                Ver recursos
                <motion.span animate={{ y: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <ChevronDown className="ml-2 w-4 h-4" />
                </motion.span>
              </Button>
            </motion.div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {heroMetrics.map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.15, duration: 0.6 }}
                whileHover={{ scale: 1.05 }}
                className="glass-card p-4 rounded-xl text-center"
              >
                <div className="text-2xl font-bold text-primary mb-1">{metric.value}</div>
                <div className="text-sm text-muted-foreground">{metric.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

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

      {/* Features */}
      <Section id="recursos" className="bg-card/30">
        <SectionHeader title="Recursos da plataforma" subtitle="Tudo que você precisa para operar com eficiência e segurança." />
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-3 gap-6">
          {features.map((item, index) => (
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

      {/* Benefits */}
      <Section>
        <SectionHeader title="Benefícios para sua operação" subtitle="Menos ruído. Mais controle. Mais resultados." />
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* CTA */}
      <Section className="bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="text-center">
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <Wrench className="w-16 h-16 text-primary/30 mx-auto mb-6" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Pronto para começar?</h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Acesse o painel PROMAX TUNER e gerencie sua operação de reprogramação ECU com segurança e eficiência.
            </p>
            <Button size="lg" onClick={() => navigate("/login")} className="group px-8">
              Acessar Painel
              <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
        </div>
      </Section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/50 bg-card/30">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo className="h-8 w-auto" />
          </div>
          <p className="text-sm text-muted-foreground text-center md:text-right">
            PROMAX TUNER • Plataforma interna para representantes • Uso restrito e auditável
          </p>
        </div>
      </footer>
    </div>
  );
}
