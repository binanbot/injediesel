import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Package, TrendingUp, Crown, Medal, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { getTopSellingProducts, type TopProductResult } from "@/services/topProductsService";

type ProductRankingProps = {
  dateRange: { from: Date; to: Date };
  franchiseProfileId?: string;
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

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ProductRanking({ dateRange, franchiseProfileId }: ProductRankingProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["product-ranking", dateRange.from.toISOString(), dateRange.to.toISOString(), franchiseProfileId],
    queryFn: () =>
      getTopSellingProducts({
        franchiseProfileId,
        startDate: format(dateRange.from, "yyyy-MM-dd"),
        endDate: format(dateRange.to, "yyyy-MM-dd"),
      }),
  });

  const byQuantity = data?.topByQuantity ?? [];
  const byRevenue = data?.topByRevenue ?? [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Package className="h-5 w-5 animate-pulse" />
            <span>Carregando ranking de produtos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderList = (items: TopProductResult[], highlight: "qty" | "revenue") => {
    if (items.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-8">
          Nenhum dado encontrado no período selecionado.
        </p>
      );
    }

    const maxVal = highlight === "qty" ? items[0]?.total_quantity : items[0]?.total_revenue;

    return (
      <div className="space-y-2">
        {items.map((product, index) => {
          const barValue = highlight === "qty" ? product.total_quantity : product.total_revenue;
          const barPct = maxVal ? (barValue / maxVal) * 100 : 0;

          return (
            <motion.div
              key={product.product_id || product.product_name}
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
                <p className="font-medium truncate">{product.product_name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  {product.product_sku && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {product.product_sku}
                    </Badge>
                  )}
                  <span>{product.order_count} pedido{product.order_count !== 1 ? "s" : ""}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold">
                  {highlight === "qty"
                    ? `${product.total_qty} un.`
                    : formatCurrency(product.total_revenue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {highlight === "qty"
                    ? formatCurrency(product.total_revenue)
                    : `${product.total_qty} un.`}
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
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Inteligência Comercial — Ranking de Produtos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="qty">
          <TabsList className="mb-4">
            <TabsTrigger value="qty">Top 10 — Quantidade</TabsTrigger>
            <TabsTrigger value="revenue">Top 10 — Faturamento</TabsTrigger>
          </TabsList>
          <TabsContent value="qty">{renderList(byQuantity, "qty")}</TabsContent>
          <TabsContent value="revenue">{renderList(byRevenue, "revenue")}</TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
