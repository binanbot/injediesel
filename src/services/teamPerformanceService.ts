import type { SellerRankingRow } from "@/services/salesRankingService";

export type TeamSummary = {
  companyId: string;
  companyName: string;
  sellersCount: number;
  totalRevenue: number;
  avgRevenue: number;
  topPerformer: { name: string; revenue: number } | null;
  atRiskCount: number;
  concentrationPct: number; // % of revenue from top seller
  byMode: Record<string, { count: number; revenue: number }>;
};

export function buildTeamSummaries(ranking: SellerRankingRow[]): TeamSummary[] {
  const byCompany = new Map<string, SellerRankingRow[]>();
  for (const r of ranking) {
    const key = r.company_id || "unknown";
    if (!byCompany.has(key)) byCompany.set(key, []);
    byCompany.get(key)!.push(r);
  }

  const summaries: TeamSummary[] = [];

  for (const [companyId, sellers] of byCompany) {
    const sorted = [...sellers].sort((a, b) => b.total_revenue - a.total_revenue);
    const totalRevenue = sorted.reduce((s, r) => s + r.total_revenue, 0);
    const topSeller = sorted[0];
    const concentrationPct = totalRevenue > 0 && topSeller
      ? (topSeller.total_revenue / totalRevenue) * 100
      : 0;

    const atRiskCount = sorted.filter(
      (r) => r.target_value && r.target_value > 0 && (r.target_progress || 0) < 50
    ).length;

    const byMode: Record<string, { count: number; revenue: number }> = {};
    for (const r of sorted) {
      const mode = r.seller_mode || "other";
      if (!byMode[mode]) byMode[mode] = { count: 0, revenue: 0 };
      byMode[mode].count += 1;
      byMode[mode].revenue += r.total_revenue;
    }

    summaries.push({
      companyId,
      companyName: topSeller?.company_name || companyId,
      sellersCount: sorted.length,
      totalRevenue,
      avgRevenue: sorted.length > 0 ? totalRevenue / sorted.length : 0,
      topPerformer: topSeller
        ? { name: topSeller.seller_name, revenue: topSeller.total_revenue }
        : null,
      atRiskCount,
      concentrationPct,
      byMode,
    });
  }

  summaries.sort((a, b) => b.totalRevenue - a.totalRevenue);
  return summaries;
}
