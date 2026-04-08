/**
 * commercialEligibilityService.ts
 *
 * ════════════════════════════════════════════════════════════════
 * CAMADA CENTRAL DE ELEGIBILIDADE COMERCIAL
 * ════════════════════════════════════════════════════════════════
 *
 * Este serviço é a FONTE ÚNICA DE VERDADE sobre quais registros
 * alimentam cada métrica comercial (meta, ranking, comissão,
 * fechamento, atribuição).
 *
 * ─── FONTES COMERCIAIS ───────────────────────────────────────
 *
 * | Fonte            | Tabela           | Coluna Receita    | Entra em Comissão | Entra em Meta | Entra em Ranking |
 * |------------------|------------------|-------------------|-------------------|---------------|------------------|
 * | Pedidos (peças)  | orders           | total_amount      | ✅ Sim            | ✅ Sim        | ✅ Sim           |
 * | Arquivos ECU     | received_files   | valor_brl         | ✅ Sim            | ✅ Sim        | ✅ Sim           |
 * | Serviços         | services         | amount_brl        | ⏳ Futuro¹        | ⏳ Futuro¹    | ⏳ Futuro¹       |
 *
 * ¹ services.amount_brl NÃO entra hoje em comissão/meta/ranking.
 *   Na operação atual, serviços ECU são registrados como received_files.
 *   A flag SERVICES_ELIGIBLE controla a ativação futura sem refatoração.
 *
 * ─── CAMPOS-CHAVE ────────────────────────────────────────────
 *
 * | Campo                  | Tabelas                          | Significado                                       |
 * |------------------------|----------------------------------|---------------------------------------------------|
 * | seller_profile_id      | orders, received_files, services | Vendedor que recebe crédito comercial              |
 * | operator_user_id       | orders, received_files, services | Quem registrou/operou (rastreabilidade)             |
 * | primary_seller_id      | customers                        | Vendedor dono da carteira do cliente               |
 * | sale_channel           | orders, received_files, services | Canal real da venda (whatsapp/telefone/balcao)     |
 * | allowed_sales_channels | seller_profiles                  | Canais que o vendedor está autorizado a usar        |
 *
 * ─── CONCEITOS ───────────────────────────────────────────────
 *
 * • VENDA PRÓPRIA: operator_user_id === user_id do seller_profile
 * • ATRIBUIÇÃO A TERCEIRO: operator_user_id !== user_id do seller_profile
 * • NA CARTEIRA: seller_profile_id === primary_seller_id do customer
 * • FORA DA CARTEIRA: seller_profile_id !== primary_seller_id do customer
 * • SEM CARTEIRA: customer.primary_seller_id é null
 *
 * ─── REGRAS DE EXCLUSÃO ─────────────────────────────────────
 *
 * • Pedidos com status "cancelado" ou "reembolsado" são excluídos de TUDO
 * • Vendedores com commission_enabled=false são excluídos de comissão
 * • Vendedores com target_enabled=false são excluídos de metas
 * • Vendedores com is_active=false são excluídos de tudo
 *
 * ════════════════════════════════════════════════════════════════
 */

import { supabase } from "@/integrations/supabase/client";

// ─── Feature flag: quando true, services.amount_brl entra em comissão/meta/ranking
export const SERVICES_ELIGIBLE = false;

// ─── Types ───────────────────────────────────────────────────

export type CommercialSource = "order" | "file" | "service";

export interface CommercialItem {
  id: string;
  source: CommercialSource;
  seller_profile_id: string | null;
  operator_user_id: string | null;
  customer_id: string | null;
  sale_channel: string | null;
  amount: number;
}

export interface EligibilityResult {
  entersCommission: boolean;
  entersTarget: boolean;
  entersRanking: boolean;
  reason?: string;
}

// ─── Core eligibility check ──────────────────────────────────

/**
 * Determines if a commercial item is eligible for each metric.
 * This is the SINGLE source of truth — all services must defer to this.
 */
export function checkEligibility(item: CommercialItem): EligibilityResult {
  // Services are gated by feature flag
  if (item.source === "service" && !SERVICES_ELIGIBLE) {
    return {
      entersCommission: false,
      entersTarget: false,
      entersRanking: false,
      reason: "services_not_eligible",
    };
  }

  // Must have a seller to count commercially
  if (!item.seller_profile_id) {
    return {
      entersCommission: false,
      entersTarget: false,
      entersRanking: false,
      reason: "no_seller_assigned",
    };
  }

  return {
    entersCommission: true,
    entersTarget: true,
    entersRanking: true,
  };
}

// ─── Seller validation ──────────────────────────────────────

export interface SellerValidation {
  valid: boolean;
  reason?: string;
}

/**
 * Validates that a seller_profile_id is eligible for commercial attribution.
 * Checks: exists, active, same company, commercial access.
 */
export async function validateSellerForAttribution(
  sellerProfileId: string,
  companyId: string
): Promise<SellerValidation> {
  const { data: seller } = await supabase
    .from("seller_profiles")
    .select(`
      id, is_active,
      employee_profiles!seller_profiles_employee_profile_id_fkey (
        company_id, is_active
      )
    `)
    .eq("id", sellerProfileId)
    .single();

  if (!seller) {
    return { valid: false, reason: "seller_not_found" };
  }

  if (!seller.is_active) {
    return { valid: false, reason: "seller_inactive" };
  }

  const ep = (seller as any).employee_profiles;
  if (!ep?.is_active) {
    return { valid: false, reason: "employee_inactive" };
  }

  if (ep.company_id !== companyId) {
    return { valid: false, reason: "company_mismatch" };
  }

  return { valid: true };
}

/**
 * Validates that a sale_channel is allowed for the given seller.
 */
export async function validateChannelForSeller(
  sellerProfileId: string,
  channel: string
): Promise<SellerValidation> {
  const { data: seller } = await supabase
    .from("seller_profiles")
    .select("allowed_sales_channels")
    .eq("id", sellerProfileId)
    .single();

  if (!seller) {
    return { valid: false, reason: "seller_not_found" };
  }

  const allowed: string[] = (seller as any).allowed_sales_channels || ["whatsapp", "telefone", "balcao"];
  if (!allowed.includes(channel)) {
    return { valid: false, reason: `channel_not_allowed: ${channel}` };
  }

  return { valid: true };
}

// ─── Wallet analysis ─────────────────────────────────────────

export type WalletStatus = "in_wallet" | "out_of_wallet" | "no_wallet";

/**
 * Determines wallet adherence for a sale.
 */
export function getWalletStatus(
  sellerProfileId: string | null,
  customerPrimarySellerId: string | null
): WalletStatus {
  if (!customerPrimarySellerId) return "no_wallet";
  if (sellerProfileId === customerPrimarySellerId) return "in_wallet";
  return "out_of_wallet";
}

// ─── Attribution analysis ────────────────────────────────────

/**
 * Determines if a sale is self-attributed or third-party.
 */
export function isThirdPartyAttribution(
  operatorUserId: string | null,
  sellerUserId: string | null
): boolean {
  if (!operatorUserId || !sellerUserId) return false;
  return operatorUserId !== sellerUserId;
}

// ─── Excluded order statuses ─────────────────────────────────

/** Orders with these statuses are excluded from ALL commercial metrics */
export const EXCLUDED_ORDER_STATUSES = ["cancelado", "reembolsado"] as const;

/** Supabase filter string for excluding cancelled/refunded orders */
export const EXCLUDED_STATUS_FILTER = '("cancelado","reembolsado")';
