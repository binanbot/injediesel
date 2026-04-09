/**
 * WalletProfitabilityPanel — Per-seller wallet ROI and cost analysis
 * Used in /admin/crm, /master/rentabilidade
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Users, TrendingUp, DollarSign, AlertTriangle } from "lucide-react";
import {
  fetchWalletProfitability,
  type WalletProfitability,
} from "@/services/walletProfitabilityService";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface WalletProfitabilityPanelProps {
  companyId: string;
}

export function WalletProfitabilityPanel({ companyId }: WalletProfitabilityPanelProps) {
  const { data: wallets = [], isLoading } = useQuery({
    queryKey: ["wallet-profitability", companyId],
    queryFn: () => fetchWalletProfitability(companyId),
    enabled: !!companyId,
  });

  const totalRevenue = wallets.reduce((s, w) => s + w.wallet_revenue, 0);
  const totalCost = wallets.reduce((s, w) => s + w.employee_cost, 0);
  const totalCustomers = wallets.reduce((s, w) => s + w.total_customers, 0);
  const atRiskTotal = wallets.reduce((s, w) => s + w.at_risk_customers, 0);

  return (
    <div className="space-y-4">
      {/* KPI summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="glass-card">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Users className="h-4 w-4" /> Clientes em Carteira
            </div>
            <p className="text-xl font-bold">{totalCustomers}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" /> Receita Total
            </div>
            <p className="text-xl font-bold">{fmt(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" /> Custo Vendedores
            </div>
            <p className="text-xl font-bold">{fmt(totalCost)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <AlertTriangle className="h-4 w-4" /> Em Risco
            </div>
            <p className="text-xl font-bold text-amber-400">{atRiskTotal}</p>
          </CardContent>
        </Card>
      </div>

      {/* Wallet ranking table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Rentabilidade por Carteira
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead className="text-right">Clientes</TableHead>
                <TableHead className="text-right">Em Risco</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-right">Margem</TableHead>
                <TableHead className="text-right">ROI</TableHead>
                <TableHead className="text-right">Atividades</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : wallets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    Nenhum vendedor com carteira ativa
                  </TableCell>
                </TableRow>
              ) : (
                wallets.map((w, i) => (
                  <TableRow key={w.seller_profile_id}>
                    <TableCell className="font-medium">{i + 1}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{w.display_name}</p>
                        {w.department_name && (
                          <p className="text-xs text-muted-foreground">{w.department_name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{w.total_customers}</TableCell>
                    <TableCell className="text-right">
                      {w.at_risk_customers > 0 ? (
                        <Badge variant="warning" className="text-xs">{w.at_risk_customers}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{fmt(w.wallet_revenue)}</TableCell>
                    <TableCell className="text-right">{fmt(w.employee_cost)}</TableCell>
                    <TableCell className={`text-right font-medium ${w.wallet_margin < 0 ? "text-destructive" : "text-success"}`}>
                      {fmt(w.wallet_margin)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={w.wallet_roi >= 200 ? "success" : w.wallet_roi >= 100 ? "warning" : "destructive"}
                        className="text-xs"
                      >
                        {w.wallet_roi.toFixed(0)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-xs">
                        {w.completed_activities}/{w.total_activities}
                        {w.overdue_activities > 0 && (
                          <span className="text-destructive ml-1">({w.overdue_activities} atr.)</span>
                        )}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
