import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
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

const paymentStatusLabels: Record<string, string> = {
  pendente: "Pendente",
  pago: "Pago",
  cancelado: "Cancelado",
};

export default function ComprasFranqueados() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  // Fetch orders with unit info
  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          units (
            name,
            city,
            state
          )
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data.map((order: any) => ({
        ...order,
        unit: order.units,
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
      // Status filter
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }

      // Unit filter
      if (unitFilter !== "all" && order.unit_id !== unitFilter) {
        return false;
      }

      // Date range filter
      if (dateRange.from) {
        const orderDate = new Date(order.created_at);
        if (orderDate < dateRange.from) return false;
      }
      if (dateRange.to) {
        const orderDate = new Date(order.created_at);
        const endOfDay = new Date(dateRange.to);
        endOfDay.setHours(23, 59, 59, 999);
        if (orderDate > endOfDay) return false;
      }

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesId = order.id.toLowerCase().includes(search);
        const matchesUnit = order.unit?.name?.toLowerCase().includes(search);
        return matchesId || matchesUnit;
      }

      return true;
    });
  }, [orders, statusFilter, unitFilter, dateRange, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    if (!filteredOrders) return { total: 0, pending: 0, paid: 0, revenue: 0 };
    
    return {
      total: filteredOrders.length,
      pending: filteredOrders.filter((o) => o.status === "pending").length,
      paid: filteredOrders.filter((o) => o.status === "paid").length,
      revenue: filteredOrders
        .filter((o) => o.payment_status === "pago")
        .reduce((sum, o) => sum + o.total_amount, 0),
    };
  }, [filteredOrders]);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  // Export to CSV
  const exportCSV = async () => {
    if (!filteredOrders.length) {
      toast.error("Nenhum pedido para exportar");
      return;
    }

    // Fetch order items for export
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
      
      csvRows.push([
        order.order_number,
        order.unit?.name || "",
        order.unit?.city || "",
        order.unit?.state || "",
        statusConfig[order.status]?.label || order.status,
        order.total_amount.toFixed(2).replace(".", ","),
        paymentStatusLabels[order.payment_status] || order.payment_status,
        formatDate(order.created_at),
        itemsStr,
      ].join(";"));
    });

    const csv = csvRows.join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `pedidos_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    
    toast.success("Relatório exportado com sucesso!");
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setUnitFilter("all");
    setDateRange({});
  };

  const hasFilters = searchTerm || statusFilter !== "all" || unitFilter !== "all" || dateRange.from || dateRange.to;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Compras dos Franqueados</h1>
          <p className="text-muted-foreground">
            Gerencie todos os pedidos da loja Promax
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={exportCSV}>
              Exportar CSV
            </DropdownMenuItem>
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
              <Clock className="h-5 w-5 text-warning" />
              <span className="text-2xl font-bold">{stats.pending}</span>
            </div>
            <p className="text-sm text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="text-2xl font-bold">{stats.paid}</span>
            </div>
            <p className="text-sm text-muted-foreground">Pagos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">
              {formatPrice(stats.revenue)}
            </div>
            <p className="text-sm text-muted-foreground">Receita (pagos)</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por pedido ou unidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Unit Filter */}
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

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.entries(statusConfig).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full lg:w-auto justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM")} - {format(dateRange.to, "dd/MM")}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy")
                    )
                  ) : (
                    "Período"
                  )}
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
                Limpar
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
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const status = statusConfig[order.status] || statusConfig.pending;
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
                        <TableCell className="text-right font-semibold">
                          {formatPrice(order.total_amount)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {paymentStatusLabels[order.payment_status] || order.payment_status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("gap-1", status.className)}>
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
