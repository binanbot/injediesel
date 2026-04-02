import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Zap, Shield, BarChart3, FileCheck, Users, ArrowRight,
  ChevronDown, Cpu, Wrench, Target, Lock, Gauge, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/Logo";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
};

const Section = ({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) => (
  <section id={id} className={`py-20 md:py-28 px-4 md:px-8 ${className}`}>
    <div className="max-w-6xl mx-auto">{children}</div>
  </section>
);

const SectionHeader = ({ title, subtitle, accent }: { title: string; subtitle?: string; accent?: string }) => (
  <motion.div className="mb-14 text-center" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
    {accent && <span className="text-xs font-bold tracking-[0.25em] uppercase text-primary mb-3 block">{accent}</span>}
    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">{title}</h2>
    {subtitle && <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">{subtitle}</p>}
  </motion.div>
);

export default function LandingPromax() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Cpu,
      title: "EVOPRO Integrado",
      description: "Gestão completa do equipamento proprietário com rastreio de seriais, validades e manutenção preventiva."
    },
    {
      icon: FileCheck,
      title: "Arquivos com Rastreabilidade",
      description: "Envie e receba arquivos de ECU com histórico completo, status em tempo real e auditoria."
    },
    {
      icon: Users,
      title: "Clientes por Unidade",
      description: "Cada unidade gerencia seus próprios clientes com isolamento total e conformidade LGPD."
    }
  ];

  const benefits = [
    { icon: Zap, title: "Operação ágil", description: "Fluxos otimizados para entregas rápidas." },
    { icon: Shield, title: "Segurança total", description: "Isolamento por unidade com RLS nativo." },
    { icon: BarChart3, title: "Dados em tempo real", description: "KPIs e relatórios para decisões precisas." },
    { icon: Target, title: "Controle unificado", description: "Unidades, estoque e pedidos num só lugar." }
  ];

  const evoproSpecs = [
    { icon: Gauge, label: "Performance", value: "Alta velocidade de leitura e escrita ECU" },
    { icon: Lock, label: "Segurança", value: "Criptografia e validação por serial único" },
    { icon: Layers, label: "Compatibilidade", value: "Suporte amplo a módulos e protocolos" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── HERO ── */}
      <section className="relative min-h-[92vh] flex items-center justify-center px-4 py-20 overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/6 via-background to-background" />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-1/5 w-[400px] h-[400px] bg-destructive/6 rounded-full blur-[100px]"
        />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,black_30%,transparent_100%)]" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, filter: "blur(12px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="mb-10"
          >
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 24px rgba(193,13,25,0.15)",
                  "0 0 48px rgba(193,13,25,0.25)",
                  "0 0 24px rgba(193,13,25,0.15)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="inline-block p-5 rounded-2xl bg-card/60 backdrop-blur-md border border-primary/15"
            >
              <Logo size="lg" className="h-14 md:h-20" />
            </motion.div>
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-primary/10 text-primary border border-primary/20">
              <Cpu className="h-3.5 w-3.5" />
              Equipamento EVOPRO
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-[1.1] tracking-tight"
          >
            Reprogramação ECU com{" "}
            <span className="text-primary">tecnologia própria</span>{" "}
            e{" "}
            <span className="text-primary">controle total</span>.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-base md:text-lg text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Plataforma exclusiva PROMAX TUNER — gerencie arquivos, clientes, equipamentos EVOPRO e toda a operação em uma plataforma segura e auditável.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="lg"
                className="group px-10 h-13 text-base font-semibold relative overflow-hidden shadow-[0_0_32px_rgba(193,13,25,0.2)] hover:shadow-[0_0_48px_rgba(193,13,25,0.3)] transition-shadow"
                onClick={() => navigate("/login?brand=promax-tuner")}
              >
                Entrar no Painel
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="outline"
                size="lg"
                className="backdrop-blur-sm h-13 text-base"
                onClick={() => document.getElementById("evopro")?.scrollIntoView({ behavior: "smooth" })}
              >
                Conheça o EVOPRO
                <motion.span animate={{ y: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <ChevronDown className="ml-2 w-4 h-4" />
                </motion.span>
              </Button>
            </motion.div>
          </motion.div>

          {/* Metrics strip */}
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
            {[
              { value: "100%", label: "Gestão centralizada" },
              { value: "EVOPRO", label: "Equipamento próprio" },
              { value: "RLS", label: "Segurança por unidade" },
            ].map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + i * 0.12 }}
                whileHover={{ scale: 1.05 }}
                className="p-3 rounded-xl bg-card/50 backdrop-blur-sm border border-border/40 text-center"
              >
                <div className="text-xl md:text-2xl font-bold text-primary mb-0.5">{m.value}</div>
                <div className="text-[11px] md:text-xs text-muted-foreground">{m.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-10 rounded-full border-2 border-muted-foreground/20 flex items-start justify-center p-2"
          >
            <motion.div
              className="w-1 h-2 bg-primary rounded-full"
              animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ── EVOPRO SHOWCASE ── */}
      <Section id="evopro" className="bg-card/20">
        <SectionHeader
          accent="Equipamento Proprietário"
          title="EVOPRO — tecnologia exclusiva PROMAX"
          subtitle="Desenvolvido para oferecer máxima performance, segurança e compatibilidade na reprogramação de ECU."
        />
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6"
        >
          {evoproSpecs.map((spec, i) => (
            <motion.div key={i} variants={scaleIn}>
              <Card className="h-full border-border/40 bg-card/60 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 group">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform border border-primary/10">
                    <spec.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-2">{spec.label}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{spec.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* ── FEATURES ── */}
      <Section id="recursos">
        <SectionHeader
          accent="Plataforma"
          title="Recursos da plataforma"
          subtitle="Tudo que você precisa para operar com eficiência, rastreabilidade e segurança."
        />
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-3 gap-6">
          {features.map((item, index) => (
            <motion.div key={index} variants={fadeInUp}>
              <Card className="h-full border-border/40 hover:border-primary/30 transition-colors bg-card/60 backdrop-blur-sm">
                <CardContent className="p-7">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 border border-primary/10">
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

      {/* ── BENEFITS ── */}
      <Section className="bg-card/20">
        <SectionHeader
          accent="Vantagens"
          title="Por que usar a PROMAX TUNER?"
          subtitle="Menos ruído. Mais controle. Mais resultados."
        />
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, i) => (
            <motion.div key={i} variants={scaleIn}>
              <Card className="h-full group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border-border/40 bg-card/60">
                <CardContent className="p-7 text-center">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform border border-primary/10">
                    <b.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* ── CTA FINAL ── */}
      <Section className="bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="text-center">
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <Wrench className="w-16 h-16 text-primary/25 mx-auto mb-6" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Pronto para começar?</h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed">
              Acesse o painel PROMAX TUNER e gerencie sua operação de reprogramação ECU com segurança e eficiência.
            </p>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="lg"
                onClick={() => navigate("/login?brand=promax-tuner")}
                className="group px-10 h-13 text-base font-semibold shadow-[0_0_24px_rgba(193,13,25,0.15)]"
              >
                Acessar Painel
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </Section>

      {/* ── FOOTER ── */}
      <footer className="py-8 px-4 border-t border-border/30 bg-card/20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo className="h-8 w-auto" />
          <p className="text-xs text-muted-foreground text-center md:text-right tracking-wide">
            PROMAX TUNER • Plataforma interna para representantes • Uso restrito e auditável
          </p>
        </div>
      </footer>
    </div>
  );
}
