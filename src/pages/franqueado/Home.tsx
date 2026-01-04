import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Upload,
  Download,
  FileCheck,
  Clock,
  ArrowRight,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BannerCarousel, Banner } from "@/components/BannerCarousel";
import { ArquivoDetalheDialog, ArquivoDetalhado } from "@/components/franqueado/ArquivoDetalheDialog";
import { ContractAlert } from "@/components/ContractAlert";
import { MetricTooltip, metricDefinitions } from "@/components/MetricTooltip";
import { TooltipProvider } from "@/components/ui/tooltip";

// Dados mockados dos banners - em produção viriam do banco de dados
const banners: Banner[] = [
  {
    id: "1",
    tipo: "imagem",
    url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=400&fit=crop",
    link: "https://example.com/promocao",
    titulo: "Promoção de Fim de Ano",
    ativo: true,
  },
  {
    id: "2",
    tipo: "imagem",
    url: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1200&h=400&fit=crop",
    link: "https://example.com/novidades",
    titulo: "Novidades no Sistema",
    ativo: true,
  },
];

const stats = [
  { label: "Arquivos Enviados", value: "24", icon: Upload, color: "text-primary", path: "/franqueado/arquivos", tooltip: metricDefinitions.arquivosEnviados },
  { label: "Concluídos", value: "18", icon: CheckCircle2, color: "text-success", path: "/franqueado/arquivos?status=completed", tooltip: metricDefinitions.arquivosConcluidos },
  { label: "Em Processamento", value: "4", icon: Clock, color: "text-warning", path: "/franqueado/arquivos?status=processing", tooltip: metricDefinitions.arquivosProcessando },
  { label: "Downloads Disponíveis", value: "6", icon: Download, color: "text-info", path: "/franqueado/arquivos?status=completed", tooltip: metricDefinitions.downloadsDisponiveis },
];

const recentFiles: ArquivoDetalhado[] = [
  {
    id: 1,
    placa: "ABC-1234",
    marca: "Volvo",
    modelo: "FH 540",
    ano: "2022",
    cambio: "Automático",
    combustivel: "Diesel",
    horasKm: "145.000 km",
    servico: "Stage 1",
    status: "completed",
    data: "28/12/2024",
    categoria: "Caminhão",
    valor: "R$ 1.500,00",
    cliente: {
      nome: "João da Silva",
      telefone: "(11) 99999-8888",
      email: "joao.silva@email.com",
      cidade: "São Paulo, SP",
      servicosAnteriores: 5,
    },
    observacoes: "Cliente solicita entrega urgente. Arquivo processado com sucesso.",
  },
  {
    id: 2,
    placa: "DEF-5678",
    marca: "Scania",
    modelo: "R 450",
    ano: "2021",
    cambio: "Manual",
    combustivel: "Diesel",
    horasKm: "89.500 km",
    servico: "DPF Off",
    status: "processing",
    data: "28/12/2024",
    categoria: "Caminhão",
    valor: "R$ 2.000,00",
    cliente: {
      nome: "Carlos Transportes LTDA",
      telefone: "(21) 98888-7777",
      email: "carlos@transportes.com",
      cidade: "Rio de Janeiro, RJ",
      servicosAnteriores: 12,
    },
  },
  {
    id: 3,
    placa: "GHI-9012",
    marca: "Mercedes",
    modelo: "Actros",
    ano: "2023",
    cambio: "Automático",
    combustivel: "Diesel",
    horasKm: "32.000 km",
    servico: "EGR Off",
    status: "completed",
    data: "27/12/2024",
    categoria: "Caminhão",
    valor: "R$ 1.800,00",
    cliente: {
      nome: "Pedro Santos",
      telefone: "(31) 97777-6666",
      email: "pedro.santos@gmail.com",
      cidade: "Belo Horizonte, MG",
      servicosAnteriores: 3,
    },
  },
  {
    id: 4,
    placa: "JKL-3456",
    marca: "DAF",
    modelo: "XF 105",
    ano: "2020",
    cambio: "Manual",
    combustivel: "Diesel",
    horasKm: "210.000 km",
    servico: "AdBlue Off",
    status: "cancelled",
    data: "27/12/2024",
    categoria: "Caminhão",
    valor: "R$ 1.200,00",
    cliente: {
      nome: "Maria Oliveira",
      telefone: "(41) 96666-5555",
      email: "maria.oliveira@hotmail.com",
      cidade: "Curitiba, PR",
      servicosAnteriores: 1,
    },
    observacoes: "Cancelado a pedido do cliente.",
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return <span className="status-badge status-completed">Concluído</span>;
    case "processing":
      return <span className="status-badge status-processing">Processando</span>;
    case "cancelled":
      return <span className="status-badge status-cancelled">Cancelado</span>;
    default:
      return <span className="status-badge status-pending">Pendente</span>;
  }
};

export default function FranqueadoHome() {
  const [selectedArquivo, setSelectedArquivo] = useState<ArquivoDetalhado | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleArquivoClick = (arquivo: ArquivoDetalhado) => {
    setSelectedArquivo(arquivo);
    setDialogOpen(true);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Dialog de Detalhes */}
        <ArquivoDetalheDialog
          arquivo={selectedArquivo}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />

        {/* Banner Carousel */}
        <BannerCarousel banners={banners} autoPlay interval={6000} />

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Página Inicial</h1>
            <p className="text-muted-foreground">Bem-vindo de volta! Aqui está um resumo da sua conta.</p>
          </div>
          <Link to="/franqueado/enviar">
            <Button variant="hero" size="lg">
              <Upload className="h-5 w-5" />
              Enviar Arquivo
            </Button>
          </Link>
        </div>

        {/* Contract Alert - usa dados do banco via hook */}
        <ContractAlert useHook />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={stat.path}>
                <Card className="glass-hover hover:border-primary/30 cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                          <MetricTooltip explanation={stat.tooltip} />
                        </div>
                        <p className="text-3xl font-bold mt-1 text-foreground">{stat.value}</p>
                      </div>
                      <div className={`p-3 rounded-xl bg-secondary/60 backdrop-blur-sm ${stat.color}`}>
                        <stat.icon className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

      {/* Recent Files */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Arquivos Recentes</CardTitle>
          <Link to="/franqueado/arquivos">
            <Button variant="ghost" size="sm">
              Ver todos
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Placa</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Veículo</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Serviço</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Data</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Ação</th>
                </tr>
              </thead>
              <tbody>
                {recentFiles.map((file) => (
                  <tr 
                    key={file.id} 
                    className="border-b border-border/20 hover:bg-secondary/30 transition-colors cursor-pointer"
                    onClick={() => handleArquivoClick(file)}
                  >
                    <td className="py-3 px-4 font-medium text-foreground">{file.placa}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {file.marca} {file.modelo}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{file.servico}</td>
                    <td className="py-3 px-4">{getStatusBadge(file.status)}</td>
                    <td className="py-3 px-4 text-muted-foreground">{file.data}</td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      {file.status === "completed" ? (
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" disabled>
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/franqueado/atualizacoes">
          <Card className="glass-hover cursor-pointer group hover:border-primary/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors border border-primary/20">
                  <Download className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Atualizações</p>
                  <p className="text-sm text-muted-foreground">3 novas disponíveis</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/franqueado/tutoriais">
          <Card className="glass-hover cursor-pointer group hover:border-info/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-info/10 text-info group-hover:bg-info/20 transition-colors border border-info/20">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Tutoriais</p>
                  <p className="text-sm text-muted-foreground">Aprenda a usar o sistema</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/franqueado/mensagens">
          <Card className="glass-hover cursor-pointer group hover:border-success/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-success/10 text-success group-hover:bg-success/20 transition-colors border border-success/20">
                  <FileCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Mensagens</p>
                  <p className="text-sm text-muted-foreground">2 não lidas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          </Link>
        </div>
      </div>
    </TooltipProvider>
  );
}
