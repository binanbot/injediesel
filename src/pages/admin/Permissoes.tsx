import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  Plus,
  Pencil,
  Copy,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Users,
  Loader2,
  Briefcase,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import {
  fetchPermissionProfiles,
  upsertPermissionProfile,
} from "@/services/permissionService";
import { logAuditEvent } from "@/services/auditService";
import {
  FULL_ACCESS_MODULES,
  ALL_ACTIONS,
  type PermissionModule,
  type PermissionAction,
  type PermissionsMatrix,
  type PermissionProfile,
} from "@/types/permissions";

const MODULE_LABELS: Record<PermissionModule, string> = {
  usuarios: "Usuários",
  permissoes: "Permissões",
  clientes: "Clientes",
  veiculos: "Veículos",
  arquivos_ecu: "Arquivos ECU",
  servicos: "Serviços",
  pedidos: "Pedidos",
  financeiro: "Financeiro",
  suporte: "Suporte",
  mensagens: "Mensagens",
  relatorios: "Relatórios",
  dashboards: "Dashboards",
  metas: "Metas",
  rankings: "Rankings",
  catalogo: "Catálogo",
  loja: "Loja",
  marketing: "Marketing",
  vendas: "Vendas",
};

const ACTION_LABELS: Record<PermissionAction, string> = {
  view: "Ver",
  create: "Criar",
  edit: "Editar",
  delete: "Excluir",
  approve: "Aprovar",
  export: "Exportar",
  manage: "Gerenciar",
  assign_seller: "Atribuir vendedor",
};

export default function Permissoes() {
  const { company } = useCompany();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<PermissionProfile | null>(null);
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPermissions, setFormPermissions] = useState<PermissionsMatrix>({});
  const [expandedProfile, setExpandedProfile] = useState<string | null>(null);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["permission-profiles", company?.id],
    queryFn: () => fetchPermissionProfiles(company?.id),
    enabled: !!company?.id,
  });

  // Fetch job positions to show which cargo uses each profile
  const { data: positions = [] } = useQuery({
    queryKey: ["job-positions-for-profiles", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_positions")
        .select("id, title, default_permission_profile_id")
        .eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch employees linked to each profile (overrides + via position)
  const { data: employees = [] } = useQuery({
    queryKey: ["employees-for-profiles", company?.id],
    queryFn: async () => {
      let q = supabase
        .from("employee_profiles")
        .select("id, display_name, permission_profile_id, job_position_id, is_active")
        .eq("is_active", true);
      if (company?.id) q = q.eq("company_id", company.id);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!company?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!formName || !formSlug) throw new Error("Nome e slug são obrigatórios");
      await upsertPermissionProfile({
        id: editingProfile?.id,
        company_id: company?.id || null,
        name: formName,
        slug: formSlug,
        description: formDescription || undefined,
        permissions: formPermissions,
      });
      // Audit log
      const isClone = !editingProfile && formName.includes("(cópia)");
      await logAuditEvent({
        action: editingProfile ? "permission_profile.updated" : isClone ? "permission_profile.cloned" : "permission_profile.created",
        module: "permissoes",
        companyId: company?.id,
        targetType: "permission_profile",
        targetId: editingProfile?.id,
        details: { name: formName, slug: formSlug },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permission-profiles"] });
      toast.success(editingProfile ? "Perfil atualizado!" : "Perfil criado!");
      closeDialog();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const openCreate = () => {
    setEditingProfile(null);
    setFormName("");
    setFormSlug("");
    setFormDescription("");
    setFormPermissions({});
    setDialogOpen(true);
  };

  const openEdit = (p: PermissionProfile) => {
    setEditingProfile(p);
    setFormName(p.name);
    setFormSlug(p.slug);
    setFormDescription(p.description || "");
    setFormPermissions({ ...p.permissions });
    setDialogOpen(true);
  };

  const openClone = (p: PermissionProfile) => {
    setEditingProfile(null);
    setFormName(`${p.name} (cópia)`);
    setFormSlug(`${p.slug}-copy`);
    setFormDescription(p.description || "");
    setFormPermissions({ ...p.permissions });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingProfile(null);
  };

  const toggleAction = (module: PermissionModule, action: PermissionAction) => {
    setFormPermissions((prev) => {
      const current = prev[module] || [];
      const has = current.includes(action);
      const next = has ? current.filter((a) => a !== action) : [...current, action];
      return { ...prev, [module]: next };
    });
  };

  const toggleModule = (module: PermissionModule) => {
    setFormPermissions((prev) => {
      const current = prev[module] || [];
      const allSet = ALL_ACTIONS.every((a) => current.includes(a));
      return { ...prev, [module]: allSet ? [] : [...ALL_ACTIONS] };
    });
  };

  const getPositionsForProfile = (profileId: string) =>
    positions.filter((p) => p.default_permission_profile_id === profileId);

  // Employees directly assigned (override) or via position default
  const getEmployeesForProfile = (profileId: string) => {
    const positionIds = getPositionsForProfile(profileId).map((p) => p.id);
    return employees.filter(
      (e) =>
        e.permission_profile_id === profileId ||
        (positionIds.includes(e.job_position_id!) && !e.permission_profile_id)
    );
  };

  const countPermissions = (perms: PermissionsMatrix) =>
    Object.values(perms).reduce((s, acts) => s + (acts?.length || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Perfis de Permissão
          </h1>
          <p className="text-muted-foreground">
            Gerencie os perfis de acesso da empresa
          </p>
        </div>
        <PermissionGuard module="permissoes" action={["create", "manage"]}>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Perfil
          </Button>
        </PermissionGuard>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum perfil de permissão cadastrado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {profiles.map((profile) => {
            const linkedPositions = getPositionsForProfile(profile.id);
            const linkedEmployees = getEmployeesForProfile(profile.id);
            const overrideEmployees = employees.filter((e) => e.permission_profile_id === profile.id);
            const isExpanded = expandedProfile === profile.id;
            const permCount = countPermissions(profile.permissions);

            return (
              <Card key={profile.id}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-3 cursor-pointer flex-1"
                      onClick={() => setExpandedProfile(isExpanded ? null : profile.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{profile.name}</p>
                          {profile.is_system_default && (
                            <Badge variant="secondary" className="text-[10px]">
                              Sistema
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                          <span>{permCount} permissões</span>
                          {linkedPositions.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {linkedPositions.map((p) => p.title).join(", ")}
                            </span>
                          )}
                          {linkedEmployees.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {linkedEmployees.length} colaborador{linkedEmployees.length !== 1 ? "es" : ""}
                            </span>
                          )}
                          {overrideEmployees.length > 0 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/50">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    {overrideEmployees.length} override{overrideEmployees.length !== 1 ? "s" : ""}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">
                                    {overrideEmployees.map((e) => e.display_name || "Sem nome").join(", ")}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <PermissionGuard module="permissoes" action="edit">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(profile)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </PermissionGuard>
                      <PermissionGuard module="permissoes" action="create">
                        <Button size="sm" variant="ghost" onClick={() => openClone(profile)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </PermissionGuard>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-4">
                      {/* Linked employees list */}
                      {linkedEmployees.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Colaboradores com este perfil
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {linkedEmployees.map((emp) => (
                              <Badge
                                key={emp.id}
                                variant={emp.permission_profile_id === profile.id ? "default" : "secondary"}
                                className="text-[10px]"
                              >
                                {emp.display_name || "Sem nome"}
                                {emp.permission_profile_id === profile.id && (
                                  <span className="ml-1 opacity-70">(override)</span>
                                )}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <Separator />

                      {/* Permissions matrix */}
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-40">Módulo</TableHead>
                              {ALL_ACTIONS.map((a) => (
                                <TableHead key={a} className="text-center text-xs w-16">
                                  {ACTION_LABELS[a]}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {FULL_ACCESS_MODULES.map((mod) => {
                              const actions = profile.permissions[mod] || [];
                              return (
                                <TableRow key={mod}>
                                  <TableCell className="font-medium text-sm">
                                    {MODULE_LABELS[mod]}
                                  </TableCell>
                                  {ALL_ACTIONS.map((act) => (
                                    <TableCell key={act} className="text-center">
                                      {actions.includes(act) ? (
                                        <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                                      ) : (
                                        <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                                      )}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProfile ? "Editar Perfil" : "Novo Perfil de Permissão"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Vendedor ECU"
                />
              </div>
              <div>
                <Label>Slug</Label>
                <Input
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="Ex: vendedor-ecu"
                />
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Descrição do perfil..."
                rows={2}
              />
            </div>

            {/* Permissions Matrix */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Matriz de Permissões</Label>
              <div className="overflow-x-auto border rounded-xl">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-44">Módulo</TableHead>
                      {ALL_ACTIONS.map((a) => (
                        <TableHead key={a} className="text-center text-xs w-16">
                          {ACTION_LABELS[a]}
                        </TableHead>
                      ))}
                      <TableHead className="text-center text-xs w-16">Todos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {FULL_ACCESS_MODULES.map((mod) => {
                      const current = formPermissions[mod] || [];
                      const allSet = ALL_ACTIONS.every((a) => current.includes(a));

                      return (
                        <TableRow key={mod}>
                          <TableCell className="font-medium text-sm">
                            {MODULE_LABELS[mod]}
                          </TableCell>
                          {ALL_ACTIONS.map((act) => (
                            <TableCell key={act} className="text-center">
                              <Checkbox
                                checked={current.includes(act)}
                                onCheckedChange={() => toggleAction(mod, act)}
                              />
                            </TableCell>
                          ))}
                          <TableCell className="text-center">
                            <Checkbox
                              checked={allSet}
                              onCheckedChange={() => toggleModule(mod)}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingProfile ? "Salvar" : "Criar Perfil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
