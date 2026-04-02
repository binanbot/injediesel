import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, ArrowRight } from "lucide-react";
import { VariationBadge } from "./CeoKpiCard";
import type { CompanyComparison } from "@/services/ceoDashboardService";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface CeoCompanyTableProps {
  comparisons: CompanyComparison[];
  isLoading?: boolean;
}

export function CeoCompanyTable({ comparisons, isLoading }: CeoCompanyTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Building2 className="h-5 w-5 text-emerald-400" />
          Comparativo de Empresas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : comparisons.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma empresa encontrada
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-3 px-2 font-medium">Empresa</th>
                  <th className="text-right py-3 px-2 font-medium">Unid.</th>
                  <th className="text-right py-3 px-2 font-medium">Faturamento</th>
                  <th className="text-right py-3 px-2 font-medium">Pedidos</th>
                  <th className="text-right py-3 px-2 font-medium">Arquivos</th>
                  <th className="text-right py-3 px-2 font-medium">Margem</th>
                  <th className="text-right py-3 px-2 font-medium">Crescimento</th>
                  <th className="text-center py-3 px-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="py-3 px-2">
                      <div>
                        <p className="font-medium text-foreground">{c.name}</p>
                        {c.brand_name && (
                          <p className="text-xs text-muted-foreground">
                            {c.brand_name}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="text-right py-3 px-2 text-muted-foreground">
                      {c.units}
                    </td>
                    <td className="text-right py-3 px-2 font-medium text-emerald-400">
                      {fmt(c.revenue)}
                    </td>
                    <td className="text-right py-3 px-2 text-muted-foreground">
                      {c.orders}
                    </td>
                    <td className="text-right py-3 px-2 text-muted-foreground">
                      {c.files}
                    </td>
                    <td className="text-right py-3 px-2">
                      <span
                        className={
                          c.margin_percent >= 30
                            ? "text-emerald-400"
                            : c.margin_percent >= 15
                            ? "text-amber-400"
                            : "text-destructive"
                        }
                      >
                        {c.margin_percent.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-right py-3 px-2">
                      {c.growth_percent !== null ? (
                        <VariationBadge value={c.growth_percent} />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="text-center py-3 px-2">
                      <Link to={`/ceo/empresas/${c.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
