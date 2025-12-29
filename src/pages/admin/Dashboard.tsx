import { motion } from "framer-motion";
import {
  Users,
  FileDown,
  TrendingUp,
  MapPin,
  ArrowUp,
  ArrowDown,
  FileCheck,
  Clock,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const stats = [
  { label: "Total Franqueados", value: "48", icon: Users, trend: "+3", trendUp: true },
  { label: "Arquivos Recebidos", value: "324", icon: FileDown, trend: "+28", trendUp: true },
  { label: "Taxa de Conclusão", value: "94%", icon: FileCheck, trend: "+2%", trendUp: true },
  { label: "Cidades Atendidas", value: "156", icon: MapPin, trend: "+5", trendUp: true },
];

const arquivosPorMes = [
  { mes: "Jul", arquivos: 180 },
  { mes: "Ago", arquivos: 220 },
  { mes: "Set", arquivos: 260 },
  { mes: "Out", arquivos: 290 },
  { mes: "Nov", arquivos: 310 },
  { mes: "Dez", arquivos: 324 },
];

const statusDistribuicao = [
  { name: "Concluído", value: 280, color: "hsl(142, 76%, 36%)" },
  { name: "Processando", value: 25, color: "hsl(38, 92%, 50%)" },
  { name: "Cancelado", value: 15, color: "hsl(0, 72%, 51%)" },
  { name: "Outros", value: 4, color: "hsl(217, 91%, 60%)" },
];

const topUnidades = [
  { nome: "São Paulo - Centro", arquivos: 45 },
  { nome: "Rio de Janeiro", arquivos: 38 },
  { nome: "Belo Horizonte", arquivos: 32 },
  { nome: "Curitiba", arquivos: 28 },
  { nome: "Porto Alegre", arquivos: 24 },
];

export default function AdminDashboard() {
  // Mock data - replace with real data from API
  const novosArquivos = 12;
  const novosSuporte = 5;
  const novasMensagens = 8;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do sistema Injediesel.</p>
      </div>

      {/* Alert: New Files */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-500/20 via-orange-500/10 to-orange-500/20 border border-orange-500/30 p-4"
      >
        <div className="absolute inset-0 bg-orange-500/5 animate-pulse" />
        <div className="absolute inset-0 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.3)] animate-pulse" />
        <div className="relative flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
            <FileDown className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-semibold text-orange-400">
              Você tem <span className="text-2xl font-bold">{novosArquivos}</span> novos arquivos
            </p>
            <p className="text-sm text-orange-300/70">Aguardando análise e resolução</p>
          </div>
        </div>
      </motion.div>

      {/* Alerts: Support & Messages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl bg-gradient-to-r from-amber-500/15 to-amber-500/5 border border-amber-500/20 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
            <p className="font-medium text-amber-400">
              Você tem <span className="text-xl font-bold">{novosSuporte}</span> novos suporte!
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl bg-gradient-to-r from-blue-500/15 to-blue-500/5 border border-blue-500/20 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
              <Users className="h-5 w-5" />
            </div>
            <p className="font-medium text-blue-400">
              Você tem <span className="text-xl font-bold">{novasMensagens}</span> mensagens
            </p>
          </div>
        </motion.div>
      </div>

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
                    <div className={`flex items-center gap-1 mt-1 text-sm ${stat.trendUp ? "text-success" : "text-destructive"}`}>
                      {stat.trendUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      {stat.trend}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Files Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Arquivos por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={arquivosPorMes}>
                  <defs>
                    <linearGradient id="colorArquivos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 15%, 18%)" />
                  <XAxis dataKey="mes" stroke="hsl(230, 10%, 55%)" />
                  <YAxis stroke="hsl(230, 10%, 55%)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(230, 15%, 8%)",
                      border: "1px solid hsl(230, 15%, 18%)",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="arquivos"
                    stroke="hsl(217, 91%, 60%)"
                    fillOpacity={1}
                    fill="url(#colorArquivos)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center">
              <ResponsiveContainer width="50%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribuicao}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusDistribuicao.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(230, 15%, 8%)",
                      border: "1px solid hsl(230, 15%, 18%)",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {statusDistribuicao.map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                    <span className="ml-auto font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Units */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Unidades - Arquivos Enviados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topUnidades} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 15%, 18%)" />
                <XAxis type="number" stroke="hsl(230, 10%, 55%)" />
                <YAxis dataKey="nome" type="category" stroke="hsl(230, 10%, 55%)" width={150} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(230, 15%, 8%)",
                    border: "1px solid hsl(230, 15%, 18%)",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="arquivos" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
