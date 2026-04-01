import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ShoppingBag,
  Search,
  Filter,
  Download,
  ChevronRight,
  Clock,
  CheckCircle,
  Package,
  Loader2,
  Calendar,
  Building2,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getOrderStatus, orderStatusList } from "@/utils/orderStatus";

interface Order {
  id: string;
  order_number: string;
  unit_id: string | null;
  franchise_profile_id: string;
  status: string;
  total_amount: number;
  payment_status: string;
  items_count: number;
  created_at: string;
  unit?: {
    name: string;
    city: string | null;
    state: string | null;
  };
  profile?: {
    display_name: string | null;
    email: string;
  };
}

const paymentStatusLabels: Record<string, string> = {
  pendente: "Pendente",
  pago: "Pago",
  cancelado: "Cancelado",
};

export default function ComprasFranqueados() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [unitFilter, setUnitFilter] = useState(searchParams.get("unit") || "all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Fetch orders with unit + profile info
  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          units (name, city, state),
          profiles_franchisees!orders_franchise_profile_id_fkey (display_name, email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data.map((order: any) => ({
        ...order,
        unit: order.units,
        profile: order.profiles_franchisees,
      })) as Order[];
    },
  });

  // Fetch units for filter
  const { data: units } = useQuery({
    queryKey: ["units-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("units")
        .select("id, name, city, state")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Filter orders
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (unitFilter !== "all" && order.unit_id !== unitFilter) return false;

      if (dateRange.from) {
        if (new Date(order.created_at) < dateRange.from) return false;
      }
      if (dateRange.to) {
        const end = new Date(dateRange.to);
        end.setHours(23, 59, 59, 999);
        if (new Date(order.created_at) > end) return false;
      }

      if (debouncedSearch) {
        const s = debouncedSearch.toLowerCase();
        return (
          order.order_number.toLowerCase().includes(s) ||
          order.unit?.name?.toLowerCase().includes(s) ||
          order.profile?.display_name?.toLowerCase().includes(s) ||
          false
        );
      }
      return true;
    });
  }, [orders, statusFilter, unitFilter, dateRange, debouncedSearch]);

  // Stats
  const stats = useMemo(() => {
    if (!orders) return { total: 0, pending: 0, delivered: 0, revenue: 0 };
    return {
      total: orders.length,
      pending: orders.filter((o) =>
        ["pedido_realizado", "pagamento_pendente", "em_separacao", "em_preparacao"].includes(o.status)
      ).length,
      delivered: orders.filter((o) => o.status === "entregue").length,
      revenue: orders.reduce((sum, o) => sum + o.total_amount, 0),
    };
  }, [orders]);

  const formatPrice = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const formatDate = (d: string) =>
    format(new Date(d), "dd/MM/yyyy HH:mm", { locale: ptBR });

  // Export CSV
  const exportCSV = async () => {
    if (!filteredOrders.length) {
      toast.error("Nenhum pedido para exportar");
      return;
    }

    const orderIds = filteredOrders.map((o) => o.id);
    const { data: items } = await supabase
      .from("order_items")
      .select("*")
      .in("order_id", orderIds);

    const itemsByOrder = items?.reduce((acc: any, item: any) => {
      acc[item.order_id] = acc[item.order_id] || [];
      acc[item.order_id].push(item);
      return acc;
    }, {});

    const csvRows = [
      ["Pedido", "Unidade", "Cidade", "UF", "Status", "Total", "Pgto", "Data", "Itens"].join(";"),
    ];

    filteredOrders.forEach((order) => {
      const orderItems = itemsByOrder?.[order.id] || [];
      const itemsStr = orderItems.map((i: any) => `${i.quantity}x ${i.product_name}`).join(" | ");
      csvRows.push(
        [
          order.order_number,
          order.unit?.name || "",
          order.unit?.city || "",
          order.unit?.state || "",
          getOrderStatus(order.status).label,
          order.total_amount.toFixed(2).replace(".", ","),
          paymentStatusLabels[order.payment_status] || order.payment_status,
          formatDate(order.created_at),
          itemsStr,
        ].join(";")
      );
    });

    const csv = csvRows.join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `pedidos_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    toast.success("Relatório exportado com sucesso!");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setUnitFilter("all");
    setDateRange({});
    setSearchParams({}, { replace: true });
  };

  const hasFilters =
    searchTerm || statusFilter !== "all" || unitFilter !== "all" || dateRange.from || dateRange.to;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pedidos da Loja Promax</h1>
          <p className="text-muted-foreground">Gerencie todos os pedidos dos franqueados</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={exportCSV}>Exportar CSV</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
            <p className="text-sm text-muted-foreground">Total de pedidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold">{stats.pending}</span>
            </div>
            <p className="text-sm text-muted-foreground">Em andamento</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <span className="text-2xl font-bold">{stats.delivered}</span>
            </div>
            <p className="text-sm text-muted-foreground">Entregues</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{formatPrice(stats.revenue)}</div>
            <p className="text-sm text-muted-foreground">Faturamento total</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por pedido, unidade ou franqueado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={unitFilter} onValueChange={setUnitFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as unidades</SelectItem>
                {units?.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-44">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {orderStatusList.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full lg:w-auto justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  {dateRange.from
                    ? dateRange.to
                      ? `${format(dateRange.from, "dd/MM")} - ${format(dateRange.to, "dd/MM")}`
                      : format(dateRange.from, "dd/MM/yyyy")
                    : "Período"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            {hasFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" /> Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Pedidos
            {filteredOrders.length > 0 && (
              <Badge variant="secondary">{filteredOrders.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="font-medium">Nenhum pedido encontrado</p>
              <p className="text-sm text-muted-foreground">
                {hasFilters ? "Tente ajustar os filtros" : "Os pedidos aparecerão aqui"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead className="text-center">Itens</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const status = getOrderStatus(order.status);
                    const StatusIcon = status.icon;

                    return (
                      <TableRow
                        key={order.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/admin/compras/${order.id}`)}
                      >
                        <TableCell className="font-mono text-sm">
                          #{order.order_number}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.unit?.name || "—"}</p>
                            {order.unit?.city && (
                              <p className="text-xs text-muted-foreground">
                                {order.unit.city}, {order.unit.state}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{order.items_count}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatPrice(order.total_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("gap-1 border", status.badgeClass)}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(order.created_at)}
                        </TableCell>
                        <TableCell>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
