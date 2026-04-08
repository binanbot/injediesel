import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth, isMasterLevel } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import {
  fetchEmployees,
  fetchDepartments,
  fetchJobPositions,
  toggleEmployeeActive,
  type EmployeeRow,
  type EmployeeFilters,
} from "@/services/employeeService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Users, Filter } from "lucide-react";
import { toast } from "sonner";
import { ColaboradorFormDialog } from "@/components/admin/ColaboradorFormDialog";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { supabase } from "@/integrations/supabase/client";

export default function Colaboradores() {
  const { userRole } = useAuth();
  const { company } = useCompany();
  const queryClient = useQueryClient();
  const isGlobal = isMasterLevel(userRole);

  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSeller, setFilterSeller] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRow | null>(null);

  // For global view, fetch all companies
  const { data: companies } = useQuery({
    queryKey: ["companies-list"],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("id, name").eq("is_active", true).order("name");
      return data || [];
    },
    enabled: isGlobal,
  });
  const [filterCompany, setFilterCompany] = useState<string>("all");

  const scopedCompanyId = isGlobal
    ? filterCompany !== "all" ? filterCompany : undefined
    : company?.id;

  const filters: EmployeeFilters = {
    companyId: scopedCompanyId,
    departmentId: filterDept !== "all" ? filterDept : undefined,
    isActive: filterStatus === "all" ? undefined : filterStatus === "active",
    isSeller: filterSeller === "all" ? undefined : filterSeller === "yes",
    search: search || undefined,
  };

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees", filters],
    queryFn: () => fetchEmployees(filters),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments", scopedCompanyId],
    queryFn: () => fetchDepartments(scopedCompanyId),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => toggleEmployeeActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Status atualizado");
    },
    onError: () => toast.error("Erro ao atualizar status"),
  });

  const sellerModeLabel: Record<string, string> = {
    ecu: "ECU/Mapa",
    parts: "Peças",
    both: "Misto",
  };

  const commissionLabel = (e: EmployeeRow) => {
    if (!e.seller_profile) return "—";
    const sp = e.seller_profile;
    if (sp.commission_type === "percentage") return `${sp.commission_value}%`;
    if (sp.commission_type === "fixed") return `R$ ${sp.commission_value.toFixed(2)}`;
    return "Escalonada";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Colaboradores
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isGlobal ? "Visão global de todas as empresas" : `Equipe da ${company?.brand_name || company?.name || "empresa"}`}
          </p>
        </div>
        <PermissionGuard module="usuarios" action={["create", "manage"]}>
          <Button onClick={() => { setEditingEmployee(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Colaborador
          </Button>
        </PermissionGuard>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, cargo, departamento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {isGlobal && companies && (
              <Select value={filterCompany} onValueChange={setFilterCompany}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas empresas</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos deptos</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterSeller} onValueChange={setFilterSeller}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Vendedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="yes">Vendedores</SelectItem>
                <SelectItem value="no">Não vendedores</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {employees.length} colaborador{employees.length !== 1 ? "es" : ""} encontrado{employees.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  {isGlobal && <TableHead>Empresa</TableHead>}
                  <TableHead>Departamento</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={isGlobal ? 8 : 7} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isGlobal ? 8 : 7} className="text-center py-8 text-muted-foreground">
                      Nenhum colaborador encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium">{emp.display_name || "—"}</TableCell>
                      {isGlobal && <TableCell>{emp.company_name || "—"}</TableCell>}
                      <TableCell>{emp.department_name || "—"}</TableCell>
                      <TableCell>{emp.position_title || "—"}</TableCell>
                      <TableCell>
                        {emp.seller_profile ? (
                          <Badge variant="secondary" className="text-xs">
                            {sellerModeLabel[emp.seller_profile.seller_mode] || emp.seller_profile.seller_mode}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{commissionLabel(emp)}</TableCell>
                      <TableCell>
                        <PermissionGuard module="usuarios" action="manage" fallback={
                          <Badge variant={emp.is_active ? "default" : "outline"} className="text-xs">
                            {emp.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        }>
                          <Switch
                            checked={emp.is_active}
                            onCheckedChange={(checked) => toggleMutation.mutate({ id: emp.id, isActive: checked })}
                          />
                        </PermissionGuard>
                      </TableCell>
                      <TableCell className="text-right">
                        <PermissionGuard module="usuarios" action={["edit", "manage"]}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setEditingEmployee(emp); setDialogOpen(true); }}
                          >
                            Editar
                          </Button>
                        </PermissionGuard>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ColaboradorFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employee={editingEmployee}
        defaultCompanyId={scopedCompanyId}
        isGlobal={isGlobal}
      />
    </div>
  );
}
