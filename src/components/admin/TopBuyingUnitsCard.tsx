import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Store, Crown, Medal, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getTopBuyingUnits, type TopBuyingUnit } from "@/services/topBuyingUnitsService";

type Props = {
  dateRange: { from: Date; to: Date };
};

const getMedalIcon = (index: number) => {
  switch (index) {
    case 0:
      return <Crown className="h-5 w-5 text-yellow-500" />;
    case 1:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 2:
      return <Award className="h-5 w-5 text-amber-600" />;
    default:
      return (
        <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">
          {index + 1}
        </span>
      );
  }
};

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function TopBuyingUnitsCard({ dateRange }: Props) {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["top-buying-units", dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: () =>
      getTopBuyingUnits({
        startDate: format(dateRange.from, "yyyy-MM-dd"),
        endDate: format(dateRange.to, "yyyy-MM-dd"),
      }),
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Store className="h-5 w-5 animate-pulse" />
            <span>Carregando ranking de unidades...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          Top 10 Unidades — Compras na Loja Promax
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum dado encontrado no período selecionado.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => {
              const barPct = items[0]?.total_amount
                ? (item.total_amount / items[0].total_amount) * 100
                : 0;

              return (
                <motion.div
                  key={item.franchise_profile_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                    index === 0
                      ? "border-yellow-500/50 bg-yellow-500/10"
                      : index === 1
                      ? "border-gray-400/50 bg-gray-400/10"
                      : index === 2
                      ? "border-amber-600/50 bg-amber-600/10"
                      : "border-border/50 bg-secondary/20"
                  )}
                >
                  <div className="flex-shrink-0">{getMedalIcon(index)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.unit_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{item.display_name}</span>
                      <span>•</span>
                      <span>
                        {item.orders_count} pedido{item.orders_count !== 1 ? "s" : ""}
                      </span>
                      <span>•</span>
                      <span>{item.total_items} itens</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-success">{fmt(item.total_amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      Ticket: {fmt(item.average_ticket)}
                    </p>
                  </div>
                  <div className="hidden sm:block flex-shrink-0 w-20">
                    <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
