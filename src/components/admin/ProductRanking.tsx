import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Package, TrendingUp, Crown, Medal, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type ProductRankingProps = {
  dateRange: { from: Date; to: Date };
  /** When set, filters to orders belonging to this franchise profile */
  franchiseProfileId?: string;
};

type RankedProduct = {
  product_id: string | null;
  product_name: string;
  product_sku: string | null;
  total_qty: number;
  total_revenue: number;
  order_count: number;
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
  const { data: rawItems, isLoading } = useQuery({
    queryKey: ["product-ranking", dateRange, franchiseProfileId],
    queryFn: async () => {
      let query = supabase
        .from("order_items")
        .select(`
          product_id,
          product_name,
          product_sku,
          quantity,
          line_total,
          order_id,
          orders!inner (
            id,
            status,
            created_at,
            franchise_profile_id
          )
        `)
        .not("orders.status", "in", '("cancelado","reembolsado")')
        .gte("orders.created_at", dateRange.from.toISOString())
        .lte("orders.created_at", dateRange.to.toISOString());

      if (franchiseProfileId) {
        query = query.eq("orders.franchise_profile_id", franchiseProfileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { byQuantity, byRevenue } = useMemo(() => {
    if (!rawItems) return { byQuantity: [], byRevenue: [] };

    const map = new Map<string, RankedProduct>();

    rawItems.forEach((item: any) => {
      const key = item.product_id || item.product_name;
      const existing = map.get(key);
      if (existing) {
        existing.total_qty += item.quantity;
        existing.total_revenue += Number(item.line_total);
        existing.order_count += 1;
      } else {
        map.set(key, {
          product_id: item.product_id,
          product_name: item.product_name,
          product_sku: item.product_sku,
          total_qty: item.quantity,
          total_revenue: Number(item.line_total),
          order_count: 1,
        });
      }
    });

    const all = Array.from(map.values());
    const byQuantity = [...all].sort((a, b) => b.total_qty - a.total_qty).slice(0, 10);
    const byRevenue = [...all].sort((a, b) => b.total_revenue - a.total_revenue).slice(0, 10);

    return { byQuantity, byRevenue };
  }, [rawItems]);

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

  const renderList = (items: RankedProduct[], highlight: "qty" | "revenue") => {
    if (items.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-8">
          Nenhum dado encontrado no período selecionado.
        </p>
      );
    }

    const maxVal = highlight === "qty" ? items[0]?.total_qty : items[0]?.total_revenue;

    return (
      <div className="space-y-2">
        {items.map((product, index) => {
          const barValue = highlight === "qty" ? product.total_qty : product.total_revenue;
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
