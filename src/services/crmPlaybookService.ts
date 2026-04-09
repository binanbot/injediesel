/**
 * crmPlaybookService.ts
 * Commercial playbook: standardized stages, reasons, temperatures,
 * contact results, origins, and per-company configuration.
 */

import type { CrmConfig } from "./crmAutomationService";

// ─── Loss Reasons ────────────────────────────────────────────

export const LOSS_REASONS = [
  { value: "preco", label: "Preço" },
  { value: "concorrente", label: "Concorrente" },
  { value: "sem_necessidade", label: "Sem necessidade no momento" },
  { value: "prazo", label: "Prazo de entrega" },
  { value: "qualidade", label: "Qualidade insatisfatória" },
  { value: "sem_retorno", label: "Sem retorno do cliente" },
  { value: "mudou_fornecedor", label: "Mudou de fornecedor" },
  { value: "outro", label: "Outro" },
] as const;

// ─── Reactivation Reasons ────────────────────────────────────

export const REACTIVATION_REASONS = [
  { value: "campanha", label: "Campanha comercial" },
  { value: "novo_produto", label: "Novo produto/serviço" },
  { value: "revisao_preco", label: "Revisão de preço" },
  { value: "contato_periodico", label: "Contato periódico" },
  { value: "indicacao", label: "Indicação" },
  { value: "outro", label: "Outro" },
] as const;

// ─── No-Interest Reasons ─────────────────────────────────────

export const NO_INTEREST_REASONS = [
  { value: "sem_demanda", label: "Sem demanda atual" },
  { value: "orcamento", label: "Sem orçamento" },
  { value: "satisfeito_concorrente", label: "Satisfeito com concorrente" },
  { value: "nao_atende", label: "Produto não atende" },
  { value: "outro", label: "Outro" },
] as const;

// ─── Contact Results ─────────────────────────────────────────

export const CONTACT_RESULTS = [
  { value: "atendido", label: "Atendido" },
  { value: "nao_atendeu", label: "Não atendeu" },
  { value: "retornar", label: "Retornar depois" },
  { value: "interessado", label: "Interessado" },
  { value: "sem_interesse", label: "Sem interesse" },
  { value: "agendou_visita", label: "Agendou visita/reunião" },
  { value: "fechou_venda", label: "Fechou venda" },
  { value: "pediu_proposta", label: "Pediu proposta" },
] as const;

// ─── Contact Origins ─────────────────────────────────────────

export const CONTACT_ORIGINS = [
  { value: "indicacao", label: "Indicação" },
  { value: "prospeccao", label: "Prospecção ativa" },
  { value: "inbound", label: "Inbound / Site" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "telefone", label: "Telefone" },
  { value: "balcao", label: "Balcão" },
  { value: "rede_social", label: "Rede social" },
  { value: "evento", label: "Evento / Feira" },
  { value: "reativacao", label: "Reativação" },
  { value: "outro", label: "Outro" },
] as const;

// ─── Opportunity Temperatures ────────────────────────────────

export const OPPORTUNITY_TEMPERATURES = [
  { value: "quente", label: "Quente", color: "text-red-500", bg: "bg-red-500/10" },
  { value: "morna", label: "Morna", color: "text-amber-500", bg: "bg-amber-500/10" },
  { value: "fria", label: "Fria", color: "text-blue-400", bg: "bg-blue-400/10" },
] as const;

export type OpportunityTemperature = (typeof OPPORTUNITY_TEMPERATURES)[number]["value"];

// ─── Commercial Stage Pipeline ───────────────────────────────

export interface PlaybookStage {
  value: string;
  label: string;
  order: number;
  sla_hours: number; // default SLA in hours for this stage
  allowed_next: string[]; // allowed transitions forward
  allowed_prev: string[]; // allowed regressions
  is_closed: boolean;
}

export const PLAYBOOK_STAGES: PlaybookStage[] = [
  {
    value: "lead",
    label: "Lead",
    order: 1,
    sla_hours: 24,
    allowed_next: ["em_contato"],
    allowed_prev: [],
    is_closed: false,
  },
  {
    value: "em_contato",
    label: "Em contato",
    order: 2,
    sla_hours: 48,
    allowed_next: ["proposta", "negociacao"],
    allowed_prev: ["lead"],
    is_closed: false,
  },
  {
    value: "proposta",
    label: "Proposta",
    order: 3,
    sla_hours: 72,
    allowed_next: ["negociacao", "fechado_ganho", "fechado_perdido"],
    allowed_prev: ["em_contato"],
    is_closed: false,
  },
  {
    value: "negociacao",
    label: "Negociação",
    order: 4,
    sla_hours: 96,
    allowed_next: ["fechado_ganho", "fechado_perdido"],
    allowed_prev: ["proposta", "em_contato"],
    is_closed: false,
  },
  {
    value: "fechado_ganho",
    label: "Fechado (ganho)",
    order: 5,
    sla_hours: 0,
    allowed_next: [],
    allowed_prev: [],
    is_closed: true,
  },
  {
    value: "fechado_perdido",
    label: "Fechado (perdido)",
    order: 6,
    sla_hours: 0,
    allowed_next: ["lead"], // allow reopen
    allowed_prev: [],
    is_closed: true,
  },
];

// ─── Transition Validation ───────────────────────────────────

export function isTransitionAllowed(fromStage: string, toStage: string): boolean {
  const stage = PLAYBOOK_STAGES.find((s) => s.value === fromStage);
  if (!stage) return false;
  return stage.allowed_next.includes(toStage) || stage.allowed_prev.includes(toStage);
}

export function getStageByValue(value: string): PlaybookStage | undefined {
  return PLAYBOOK_STAGES.find((s) => s.value === value);
}

export function getStageLabel(value: string): string {
  return PLAYBOOK_STAGES.find((s) => s.value === value)?.label || value;
}

export function getStageOrder(value: string): number {
  return PLAYBOOK_STAGES.find((s) => s.value === value)?.order || 0;
}

// ─── Temperature helpers ─────────────────────────────────────

export function getTemperatureLabel(value: string): string {
  return OPPORTUNITY_TEMPERATURES.find((t) => t.value === value)?.label || value;
}

export function getTemperatureColor(value: string): string {
  return OPPORTUNITY_TEMPERATURES.find((t) => t.value === value)?.color || "text-muted-foreground";
}

export function getTemperatureBg(value: string): string {
  return OPPORTUNITY_TEMPERATURES.find((t) => t.value === value)?.bg || "bg-muted/10";
}

// ─── Loss Reason helpers ─────────────────────────────────────

export function getLossReasonLabel(value: string): string {
  return LOSS_REASONS.find((r) => r.value === value)?.label || value;
}

export function getContactResultLabel(value: string): string {
  return CONTACT_RESULTS.find((r) => r.value === value)?.label || value;
}

export function getContactOriginLabel(value: string): string {
  return CONTACT_ORIGINS.find((o) => o.value === value)?.label || value;
}

// ─── Stage Metrics (time per stage) ──────────────────────────

export interface StageMetric {
  stage: string;
  label: string;
  count: number;
  avg_hours: number | null;
  stale_count: number; // over SLA
  total_value: number;
}

export function calcStageMetrics(
  opportunities: Array<{
    stage: string;
    estimated_value: number;
    updated_at: string;
    created_at: string;
  }>,
  config?: CrmConfig
): StageMetric[] {
  const now = Date.now();
  const hourMs = 1000 * 60 * 60;

  return PLAYBOOK_STAGES.filter((s) => !s.is_closed).map((stage) => {
    const items = opportunities.filter((o) => o.stage === stage.value);
    const hours = items.map(
      (o) => (now - new Date(o.updated_at).getTime()) / hourMs
    );
    const avgHours =
      hours.length > 0 ? hours.reduce((s, h) => s + h, 0) / hours.length : null;
    const staleThreshold = stage.sla_hours || 48;
    const staleCount = hours.filter((h) => h > staleThreshold).length;
    const totalValue = items.reduce((s, o) => s + Number(o.estimated_value), 0);

    return {
      stage: stage.value,
      label: stage.label,
      count: items.length,
      avg_hours: avgHours,
      stale_count: staleCount,
      total_value: totalValue,
    };
  });
}

// ─── Playbook Config (per-company via settings) ──────────────

export interface PlaybookConfig {
  enabled_stages: string[];
  custom_loss_reasons: Array<{ value: string; label: string }>;
  custom_origins: Array<{ value: string; label: string }>;
  stage_sla_overrides: Record<string, number>; // stage -> hours
}

const PLAYBOOK_CONFIG_DEFAULTS: PlaybookConfig = {
  enabled_stages: PLAYBOOK_STAGES.map((s) => s.value),
  custom_loss_reasons: [],
  custom_origins: [],
  stage_sla_overrides: {},
};

export function getPlaybookConfig(
  settings: Record<string, any> | null | undefined
): PlaybookConfig {
  const raw = settings?.playbook_config || {};
  return {
    enabled_stages:
      Array.isArray(raw.enabled_stages) && raw.enabled_stages.length > 0
        ? raw.enabled_stages
        : PLAYBOOK_CONFIG_DEFAULTS.enabled_stages,
    custom_loss_reasons: Array.isArray(raw.custom_loss_reasons)
      ? raw.custom_loss_reasons
      : PLAYBOOK_CONFIG_DEFAULTS.custom_loss_reasons,
    custom_origins: Array.isArray(raw.custom_origins)
      ? raw.custom_origins
      : PLAYBOOK_CONFIG_DEFAULTS.custom_origins,
    stage_sla_overrides:
      raw.stage_sla_overrides && typeof raw.stage_sla_overrides === "object"
        ? raw.stage_sla_overrides
        : PLAYBOOK_CONFIG_DEFAULTS.stage_sla_overrides,
  };
}

/** Merge default + custom options for selects */
export function getMergedLossReasons(
  config: PlaybookConfig
): Array<{ value: string; label: string }> {
  const customs = config.custom_loss_reasons.filter(
    (c) => !LOSS_REASONS.some((r) => r.value === c.value)
  );
  return [...LOSS_REASONS, ...customs];
}

export function getMergedOrigins(
  config: PlaybookConfig
): Array<{ value: string; label: string }> {
  const customs = config.custom_origins.filter(
    (c) => !CONTACT_ORIGINS.some((o) => o.value === c.value)
  );
  return [...CONTACT_ORIGINS, ...customs];
}

export function getEnabledStages(
  config: PlaybookConfig
): PlaybookStage[] {
  return PLAYBOOK_STAGES.filter((s) =>
    config.enabled_stages.includes(s.value)
  );
}
