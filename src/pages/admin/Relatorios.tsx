import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  LineChart,
  Line,
} from "recharts";

const arquivosPorUnidade = [
  { nome: "São Paulo - Centro", arquivos: 45 },
  { nome: "Rio de Janeiro", arquivos: 38 },
  { nome: "Belo Horizonte", arquivos: 32 },
  { nome: "Curitiba", arquivos: 28 },
  { nome: "Porto Alegre", arquivos: 24 },
  { nome: "Campinas", arquivos: 20 },
  { nome: "Santos", arquivos: 18 },
  { nome: "Florianópolis", arquivos: 15 },
];

const statusPedidos = [
  { name: "Concluído", value: 280, color: "hsl(142, 76%, 36%)" },
  { name: "Processando", value: 25, color: "hsl(38, 92%, 50%)" },
  { name: "Cancelado", value: 15, color: "hsl(0, 72%, 51%)" },
  { name: "Pendente", value: 4, color: "hsl(199, 89%, 48%)" },
];

const atuacaoPorArea = [
  { area: "Sul", cidades: 37 },
  { area: "Sudeste", cidades: 85 },
  { area: "Centro-Oeste", cidades: 12 },
  { area: "Nordeste", cidades: 15 },
  { area: "Norte", cidades: 7 },
];

const evolucaoMensal = [
  { mes: "Jan", arquivos: 120, receita: 45000 },
  { mes: "Fev", arquivos: 145, receita: 52000 },
  { mes: "Mar", arquivos: 160, receita: 58000 },
  { mes: "Abr", arquivos: 180, receita: 65000 },
  { mes: "Mai", arquivos: 210, receita: 72000 },
  { mes: "Jun", arquivos: 230, receita: 78000 },
  { mes: "Jul", arquivos: 250, receita: 85000 },
  { mes: "Ago", arquivos: 280, receita: 92000 },
  { mes: "Set", arquivos: 295, receita: 98000 },
  { mes: "Out", arquivos: 310, receita: 105000 },
  { mes: "Nov", arquivos: 318, receita: 110000 },
  { mes: "Dez", arquivos: 324, receita: 115000 },
];

export default function AdminRelatorios() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">Análise detalhada do desempenho do sistema.</p>
        </div>
        <Select defaultValue="2024">
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2023">2023</SelectItem>
            <SelectItem value="2022">2022</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Evolution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Evolução Anual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolucaoMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 15%, 18%)" />
                <XAxis dataKey="mes" stroke="hsl(230, 10%, 55%)" />
                <YAxis yAxisId="left" stroke="hsl(230, 10%, 55%)" />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(230, 10%, 55%)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(230, 15%, 8%)",
                    border: "1px solid hsl(230, 15%, 18%)",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="arquivos"
                  stroke="hsl(217, 91%, 60%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(217, 91%, 60%)" }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="receita"
                  stroke="hsl(142, 76%, 36%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(142, 76%, 36%)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-8 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-sm text-muted-foreground">Arquivos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-sm text-muted-foreground">Receita (R$)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Files by Unit */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Arquivos por Unidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={arquivosPorUnidade} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 15%, 18%)" />
                  <XAxis type="number" stroke="hsl(230, 10%, 55%)" />
                  <YAxis dataKey="nome" type="category" stroke="hsl(230, 10%, 55%)" width={120} fontSize={12} />
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

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status dos Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center">
              <ResponsiveContainer width="50%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPedidos}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusPedidos.map((entry, index) => (
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
                {statusPedidos.map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-muted-foreground flex-1">{item.name}</span>
                    <span className="font-medium">{item.value}</span>
                    <span className="text-sm text-muted-foreground">
                      ({Math.round((item.value / 324) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coverage by Region */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Atuação por Região</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={atuacaoPorArea}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 15%, 18%)" />
                <XAxis dataKey="area" stroke="hsl(230, 10%, 55%)" />
                <YAxis stroke="hsl(230, 10%, 55%)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(230, 15%, 8%)",
                    border: "1px solid hsl(230, 15%, 18%)",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="cidades" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]}>
                  {atuacaoPorArea.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`hsl(217, 91%, ${60 - index * 8}%)`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
