/**
 * Centralized formatters for the CEO executive panel.
 * Replaces local `fmt()` functions scattered across pages.
 */

export const fmtCurrency = (v: number): string =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtPercent = (v: number, decimals = 1): string =>
  `${v.toFixed(decimals)}%`;

export const fmtVariation = (v: number): string =>
  `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

export const fmtDelta = (v: number): string =>
  `${v >= 0 ? "+" : ""}${v.toFixed(1)}pp`;

export const fmtNumber = (v: number): string =>
  v.toLocaleString("pt-BR");
