import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Upload,
  Download,
  FileCheck,
  Clock,
  AlertTriangle,
  ArrowRight,
  FileText,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const stats = [
  { label: "Arquivos Enviados", value: "24", icon: Upload, color: "text-primary" },
  { label: "Concluídos", value: "18", icon: CheckCircle2, color: "text-success" },
  { label: "Em Processamento", value: "4", icon: Clock, color: "text-warning" },
  { label: "Downloads Disponíveis", value: "6", icon: Download, color: "text-info" },
];

const recentFiles = [
  {
    id: 1,
    placa: "ABC-1234",
    marca: "Volvo",
    modelo: "FH 540",
    servico: "Stage 1",
    status: "completed",
    data: "28/12/2024",
  },
  {
    id: 2,
    placa: "DEF-5678",
    marca: "Scania",
    modelo: "R 450",
    servico: "DPF Off",
    status: "processing",
    data: "28/12/2024",
  },
  {
    id: 3,
    placa: "GHI-9012",
    marca: "Mercedes",
    modelo: "Actros",
    servico: "EGR Off",
    status: "completed",
    data: "27/12/2024",
  },
  {
    id: 4,
    placa: "JKL-3456",
    marca: "DAF",
    modelo: "XF 105",
    servico: "AdBlue Off",
    status: "cancelled",
    data: "27/12/2024",
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
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Página Inicial</h1>
          <p className="text-muted-foreground">Bem-vindo de volta! Aqui está um resumo da sua conta.</p>
        </div>
        <Link to="/franqueado/enviar">
          <Button variant="hero">
            <Upload className="h-4 w-4" />
            Enviar Arquivo
          </Button>
        </Link>
      </div>

      {/* Contract Alert */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl bg-warning/10 border border-warning/20 flex items-start gap-3"
      >
        <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-warning">Contrato próximo do vencimento</p>
          <p className="text-sm text-muted-foreground">
            Seu contrato vence em 15 dias. Renove agora para continuar utilizando o sistema.
          </p>
        </div>
        <Link to="/franqueado/perfil">
          <Button variant="warning" size="sm">
            Renovar
          </Button>
        </Link>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-secondary ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
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
                <tr className="border-b border-border">
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
                  <tr key={file.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4 font-medium">{file.placa}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {file.marca} {file.modelo}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{file.servico}</td>
                    <td className="py-3 px-4">{getStatusBadge(file.status)}</td>
                    <td className="py-3 px-4 text-muted-foreground">{file.data}</td>
                    <td className="py-3 px-4 text-right">
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
          <Card className="hover:border-primary/50 transition-all cursor-pointer group">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <Download className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium">Atualizações</p>
                  <p className="text-sm text-muted-foreground">3 novas disponíveis</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/franqueado/tutoriais">
          <Card className="hover:border-primary/50 transition-all cursor-pointer group">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-info/10 text-info group-hover:bg-info/20 transition-colors">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium">Tutoriais</p>
                  <p className="text-sm text-muted-foreground">Aprenda a usar o sistema</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/franqueado/mensagens">
          <Card className="hover:border-primary/50 transition-all cursor-pointer group">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-success/10 text-success group-hover:bg-success/20 transition-colors">
                  <FileCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium">Mensagens</p>
                  <p className="text-sm text-muted-foreground">2 não lidas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
