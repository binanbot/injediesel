/**
 * crmPlaybookAnalyticsService.ts
 * Playbook-level analytics: conversion rates, loss reasons, pipeline quality,
 * temperature/origin breakdowns, and cross-company comparison data.
 */

import { supabase } from "@/integrations/supabase/client";
import {
  PLAYBOOK_STAGES,
  LOSS_REASONS,
  CONTACT_ORIGINS,
  OPPORTUNITY_TEMPERATURES,
  REACTIVATION_REASONS,
  getStageLabel,
  getLossReasonLabel,
  getContactOriginLabel,
  getTemperatureLabel,
  type PlaybookStage,
} from "./crmPlaybookService";

// ─── Types ───────────────────────────────────────────────────

export interface ConversionByDimension {
  dimension: string;
  label: string;
  total: number;
  won: number;
  lost: number;
  open: number;
  conversion_rate: number; // won / (won + lost) %
  avg_cycle_hours: number | null;
}

export interface LossReasonBreakdown {
  reason: string;
  label: string;
  count: number;
  percentage: number;
  total_value: number;
}

export interface ReactivationBreakdown {
  reason: string;
  label: string;
  count: number;
}

export interface PipelineQuality {
  stage: string;
  label: string;
  count: number;
  stale_count: number;
  no_followup_count: number;
  avg_hours: number | null;
  regressions: number;
  total_value: number;
}

export interface SellerConversion {
  seller_profile_id: string;
  total: number;
  won: number;
  lost: number;
  open: number;
  conversion_rate: number;
  avg_cycle_hours: number | null;
  stale_count: number;
}

export interface PlaybookAnalytics {
  // Conversion
  by_origin: ConversionByDimension[];
  by_temperature: ConversionByDimension[];
  by_seller: SellerConversion[];

  // Loss
  loss_reasons: LossReasonBreakdown[];
  total_lost: number;

  // Reactivation
  reactivation_reasons: ReactivationBreakdown[];

  // Pipeline quality
  pipeline_quality: PipelineQuality[];

  // Global metrics
  global_conversion_rate: number;
  avg_cycle_hours: number | null;
  total_opportunities: number;
  total_won: number;
  total_open: number;
}

// ─── Raw Opportunity type ────────────────────────────────────

interface RawOpp {
  id: string;
  stage: string;
  estimated_value: number;
  lost_reason: string | null;
  notes: string | null;
  sale_channel: string | null;
  seller_profile_id: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────

function extractPrefix(text: string | null, prefix: string): string | null {
  if (!text) return null;
  const lines = text.split("\n");
  for (const line of lines) {
    if (line.startsWith(prefix)) {
      return line.replace(prefix, "").trim();
    }
  }
  return null;
}

function cycleHours(opp: RawOpp): number | null {
  if (!opp.closed_at) return null;
  const h = (new Date(opp.closed_at).getTime() - new Date(opp.created_at).getTime()) / (1000 * 60 * 60);
  return h >= 0 && h < 8760 ? h : null; // cap at 1 year
}

function calcConversionForGroup(opps: RawOpp[]): Omit<ConversionByDimension, "dimension" | "label"> {
  const won = opps.filter(o => o.stage === "fechado_ganho").length;
  const lost = opps.filter(o => o.stage === "fechado_perdido").length;
  const open = opps.length - won - lost;
  const closed = won + lost;
  const cycles = opps.map(cycleHours).filter((h): h is number => h !== null);
  return {
    total: opps.length,
    won,
    lost,
    open,
    conversion_rate: closed > 0 ? (won / closed) * 100 : 0,
    avg_cycle_hours: cycles.length > 0 ? cycles.reduce((s, h) => s + h, 0) / cycles.length : null,
  };
}

// ─── Main Analytics Function ─────────────────────────────────

export async function calcPlaybookAnalytics(companyId: string): Promise<PlaybookAnalytics> {
  const [oppsRes, activitiesRes] = await Promise.all([
    supabase
      .from("crm_opportunities")
      .select("id, stage, estimated_value, lost_reason, notes, sale_channel, seller_profile_id, created_at, updated_at, closed_at")
      .eq("company_id", companyId),
    supabase
      .from("crm_activities")
      .select("id, customer_id, opportunity_id, activity_type, summary, created_at")
      .eq("company_id", companyId),
  ]);

  const opps: RawOpp[] = (oppsRes.data || []) as RawOpp[];
  const activities = activitiesRes.data || [];

  // ── By Origin ──────────────────────────────────────────────
  const originMap = new Map<string, RawOpp[]>();
  for (const opp of opps) {
    const origin = extractPrefix(opp.notes, "[ORIGEM]") || opp.sale_channel || "outro";
    if (!originMap.has(origin)) originMap.set(origin, []);
    originMap.get(origin)!.push(opp);
  }
  const by_origin: ConversionByDimension[] = Array.from(originMap.entries())
    .map(([dim, group]) => ({
      dimension: dim,
      label: getContactOriginLabel(dim),
      ...calcConversionForGroup(group),
    }))
    .sort((a, b) => b.total - a.total);

  // ── By Temperature ─────────────────────────────────────────
  const tempMap = new Map<string, RawOpp[]>();
  for (const opp of opps) {
    const temp = extractPrefix(opp.notes, "[TEMP]") || "fria";
    if (!tempMap.has(temp)) tempMap.set(temp, []);
    tempMap.get(temp)!.push(opp);
  }
  const by_temperature: ConversionByDimension[] = Array.from(tempMap.entries())
    .map(([dim, group]) => ({
      dimension: dim,
      label: getTemperatureLabel(dim),
      ...calcConversionForGroup(group),
    }))
    .sort((a, b) => b.conversion_rate - a.conversion_rate);

  // ── By Seller ──────────────────────────────────────────────
  const sellerMap = new Map<string, RawOpp[]>();
  for (const opp of opps) {
    const sid = opp.seller_profile_id || "__none__";
    if (!sellerMap.has(sid)) sellerMap.set(sid, []);
    sellerMap.get(sid)!.push(opp);
  }
  const now = Date.now();
  const hourMs = 1000 * 60 * 60;
  const by_seller: SellerConversion[] = Array.from(sellerMap.entries())
    .filter(([k]) => k !== "__none__")
    .map(([sid, group]) => {
      const stats = calcConversionForGroup(group);
      const stale = group.filter(o =>
        o.stage !== "fechado_ganho" && o.stage !== "fechado_perdido" &&
        (now - new Date(o.updated_at).getTime()) / hourMs > 360
      ).length;
      return {
        seller_profile_id: sid,
        ...stats,
        stale_count: stale,
      };
    })
    .sort((a, b) => b.conversion_rate - a.conversion_rate);

  // ── Loss Reasons ───────────────────────────────────────────
  const lostOpps = opps.filter(o => o.stage === "fechado_perdido");
  const lossMap = new Map<string, { count: number; value: number }>();
  for (const opp of lostOpps) {
    const reason = opp.lost_reason || "outro";
    const entry = lossMap.get(reason) || { count: 0, value: 0 };
    entry.count++;
    entry.value += Number(opp.estimated_value);
    lossMap.set(reason, entry);
  }
  const loss_reasons: LossReasonBreakdown[] = Array.from(lossMap.entries())
    .map(([reason, data]) => ({
      reason,
      label: getLossReasonLabel(reason),
      count: data.count,
      percentage: lostOpps.length > 0 ? (data.count / lostOpps.length) * 100 : 0,
      total_value: data.value,
    }))
    .sort((a, b) => b.count - a.count);

  // ── Reactivation Reasons ───────────────────────────────────
  const reactivationActs = activities.filter(a => a.activity_type === "reativacao");
  const reactMap = new Map<string, number>();
  for (const a of reactivationActs) {
    const reason = extractPrefix(a.summary, "[MOTIVO_REATIVACAO]") || "outro";
    reactMap.set(reason, (reactMap.get(reason) || 0) + 1);
  }
  const reactivation_reasons: ReactivationBreakdown[] = Array.from(reactMap.entries())
    .map(([reason, count]) => ({
      reason,
      label: REACTIVATION_REASONS.find(r => r.value === reason)?.label || reason,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // ── Pipeline Quality ───────────────────────────────────────
  const actByOpp = new Map<string, number>();
  for (const a of activities) {
    if (a.opportunity_id) {
      actByOpp.set(a.opportunity_id, (actByOpp.get(a.opportunity_id) || 0) + 1);
    }
  }

  const openStages = PLAYBOOK_STAGES.filter(s => !s.is_closed);
  const pipeline_quality: PipelineQuality[] = openStages.map(stage => {
    const stageOpps = opps.filter(o => o.stage === stage.value);
    const hours = stageOpps.map(o => (now - new Date(o.updated_at).getTime()) / hourMs);
    const avgH = hours.length > 0 ? hours.reduce((s, h) => s + h, 0) / hours.length : null;
    const staleThreshold = stage.sla_hours || 48;
    const staleCount = hours.filter(h => h > staleThreshold).length;
    const noFollowup = stageOpps.filter(o => (actByOpp.get(o.id) || 0) === 0).length;

    // Count regressions: opportunities currently in this stage that were previously in a later stage
    // (simplified: check if updated recently and stage order < previous implied order)
    const regressions = 0; // Would need history tracking for accurate count

    return {
      stage: stage.value,
      label: stage.label,
      count: stageOpps.length,
      stale_count: staleCount,
      no_followup_count: noFollowup,
      avg_hours: avgH,
      regressions,
      total_value: stageOpps.reduce((s, o) => s + Number(o.estimated_value), 0),
    };
  });

  // ── Global Metrics ─────────────────────────────────────────
  const totalWon = opps.filter(o => o.stage === "fechado_ganho").length;
  const totalLost = lostOpps.length;
  const totalClosed = totalWon + totalLost;
  const allCycles = opps.map(cycleHours).filter((h): h is number => h !== null);

  return {
    by_origin,
    by_temperature,
    by_seller,
    loss_reasons,
    total_lost: totalLost,
    reactivation_reasons,
    pipeline_quality,
    global_conversion_rate: totalClosed > 0 ? (totalWon / totalClosed) * 100 : 0,
    avg_cycle_hours: allCycles.length > 0 ? allCycles.reduce((s, h) => s + h, 0) / allCycles.length : null,
    total_opportunities: opps.length,
    total_won: totalWon,
    total_open: opps.length - totalWon - totalLost,
  };
}

// ─── Cross-company comparison ────────────────────────────────

export interface CompanyPlaybookSummary {
  company_id: string;
  company_name: string;
  total_opportunities: number;
  conversion_rate: number;
  avg_cycle_hours: number | null;
  total_lost: number;
  top_loss_reason: string | null;
  top_origin: string | null;
  pipeline_bottleneck: string | null;
}

export async function calcCrossCompanyPlaybook(): Promise<CompanyPlaybookSummary[]> {
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name")
    .eq("is_active", true);

  if (!companies?.length) return [];

  const results: CompanyPlaybookSummary[] = [];
  for (const company of companies) {
    const analytics = await calcPlaybookAnalytics(company.id);
    results.push({
      company_id: company.id,
      company_name: company.name,
      total_opportunities: analytics.total_opportunities,
      conversion_rate: analytics.global_conversion_rate,
      avg_cycle_hours: analytics.avg_cycle_hours,
      total_lost: analytics.total_lost,
      top_loss_reason: analytics.loss_reasons[0]?.label || null,
      top_origin: analytics.by_origin[0]?.label || null,
      pipeline_bottleneck: analytics.pipeline_quality
        .filter(p => p.count > 0)
        .sort((a, b) => (b.avg_hours || 0) - (a.avg_hours || 0))[0]?.label || null,
    });
  }

  return results;
}
