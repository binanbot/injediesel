import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClipboardList, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAuditLogs, type AuditLogEntry } from "@/services/auditService";
import { useCompany } from "@/hooks/useCompany";
import { useLocation } from "react-router-dom";

const MODULE_LABELS: Record<string, string> = {
  permissoes: "Permissões",
  colaboradores: "Colaboradores",
  vendedores: "Vendedores",
  suporte: "Suporte",
  comercial: "Comercial",
  metas: "Metas",
  pedidos: "Pedidos",
  exportacoes: "Exportações",
  vendas: "Vendas",
  arquivos: "Arquivos ECU",
  servicos: "Serviços",
};

const ACTION_LABELS: Record<string, string> = {
  "permission_profile.created": "Perfil criado",
  "permission_profile.updated": "Perfil atualizado",
  "permission_profile.cloned": "Perfil clonado",
  "employee.created": "Colaborador criado",
  "employee.updated": "Colaborador atualizado",
  "employee.deactivated": "Colaborador desativado",
  "seller.activated": "Vendedor ativado",
  "seller.deactivated": "Vendedor desativado",
  "seller.commission_changed": "Comissão alterada",
  "seller.mode_changed": "Modalidade alterada",
  "seller.commercial_access_changed": "Acesso comercial alterado",
  "permission_override.set": "Override aplicado",
  "permission_override.removed": "Override removido",
  "ticket.status_changed": "Status do ticket alterado",
  "order.status_changed": "Status do pedido alterado",
  "order.payment_status_changed": "Pagamento alterado",
  "order.manual_sale_created": "Venda manual criada",
  "discount_policy.violated": "Violação de desconto",
  "sales_target.created": "Meta criada",
  "sales_target.updated": "Meta atualizada",
  "export.executed": "Exportação realizada",
  "customer.primary_seller_changed": "Carteira alterada",
  "file.attribution_set": "Atribuição de arquivo",
  "file.attribution_changed": "Atribuição de arquivo alterada",
  "service.attribution_set": "Atribuição de serviço",
  "service.attribution_changed": "Atribuição de serviço alterada",
};

const ACTION_COLORS: Record<string, string> = {
  created: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  updated: "bg-primary/10 text-primary border-primary/30",
  cloned: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  deactivated: "bg-destructive/10 text-destructive border-destructive/30",
  activated: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  violated: "bg-destructive/10 text-destructive border-destructive/30",
  set: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  removed: "bg-muted text-muted-foreground border-border",
  changed: "bg-primary/10 text-primary border-primary/30",
};

function getActionColor(action: string) {
  const suffix = action.split(".").pop() || "";
  return ACTION_COLORS[suffix] || "bg-muted text-muted-foreground border-border";
}

const PAGE_SIZE = 30;

export default function Auditoria() {
  const location = useLocation();
  const isMaster = location.pathname.startsWith("/master");
  const { company } = useCompany();

  const [moduleFilter, setModuleFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);

  const companyId = isMaster ? undefined : company?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", companyId, moduleFilter, page],
    queryFn: () =>
      getAuditLogs({
        companyId,
        module: moduleFilter !== "all" ? moduleFilter : undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }),
  });

  const logs = data?.data || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const filteredLogs = searchTerm
    ? logs.filter(
        (l) =>
          l.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (l.details && JSON.stringify(l.details).toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : logs;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-primary" />
          Trilha de Auditoria
        </h1>
        <p className="text-muted-foreground text-sm">
          Histórico de ações sensíveis no sistema
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por e-mail, ação ou detalhe..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={moduleFilter} onValueChange={(v) => { setModuleFilter(v); setPage(0); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Módulo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os módulos</SelectItem>
            {Object.entries(MODULE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Logs */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum evento de auditoria encontrado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map((log) => (
            <AuditLogRow key={log.id} log={log} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {totalCount} evento{totalCount !== 1 ? "s" : ""} • Página {page + 1} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AuditLogRow({ log }: { log: AuditLogEntry }) {
  const actionLabel = ACTION_LABELS[log.action] || log.action;
  const moduleLabel = MODULE_LABELS[log.module] || log.module;
  const colorClass = getActionColor(log.action);
  const details = log.details || {};
  const detailsStr = Object.entries(details)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
    .join(" • ");

  return (
    <Card className="hover:bg-muted/30 transition-colors">
      <CardContent className="py-3 px-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={`text-[10px] ${colorClass}`}>
                {actionLabel}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {moduleLabel}
              </Badge>
              {log.target_type && (
                <span className="text-[10px] text-muted-foreground">
                  {log.target_type}
                  {log.target_id ? ` #${log.target_id.slice(0, 8)}` : ""}
                </span>
              )}
            </div>
            {detailsStr && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {detailsStr}
              </p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-muted-foreground">
              {log.user_email || "Sistema"}
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              {format(new Date(log.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
