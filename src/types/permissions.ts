/** All controllable modules in the system */
export type PermissionModule =
  | "usuarios"
  | "permissoes"
  | "clientes"
  | "veiculos"
  | "arquivos_ecu"
  | "servicos"
  | "pedidos"
  | "financeiro"
  | "suporte"
  | "mensagens"
  | "relatorios"
  | "dashboards"
  | "metas"
  | "rankings"
  | "catalogo"
  | "loja"
  | "marketing"
  | "vendas";

/** All possible actions within a module */
export type PermissionAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "approve"
  | "export"
  | "manage"
  | "assign_seller";

/** Permissions matrix: module → actions[] */
export type PermissionsMatrix = Partial<Record<PermissionModule, PermissionAction[]>>;

export interface PermissionProfile {
  id: string;
  company_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  permissions: PermissionsMatrix;
  is_system_default: boolean;
  is_active: boolean;
}

/** Full-access matrix used for admin/master/ceo roles */
export const FULL_ACCESS_MODULES: PermissionModule[] = [
  "usuarios", "permissoes", "clientes", "veiculos", "arquivos_ecu",
  "servicos", "pedidos", "financeiro", "suporte", "mensagens",
  "relatorios", "dashboards", "metas", "rankings", "catalogo", "loja", "marketing", "vendas",
];

export const ALL_ACTIONS: PermissionAction[] = [
  "view", "create", "edit", "delete", "approve", "export", "manage", "assign_seller",
];

export const FULL_ACCESS_MATRIX: PermissionsMatrix = Object.fromEntries(
  FULL_ACCESS_MODULES.map((m) => [m, [...ALL_ACTIONS]])
) as PermissionsMatrix;
