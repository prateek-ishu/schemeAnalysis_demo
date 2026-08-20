/**
 * Data contracts for the Scheme Analysis page.
 * These mirror the payload shapes a fund-analytics vendor (Morningstar /
 * Value Research style) would return. The UI never computes risk or rolling
 * statistics itself — everything arrives pre-computed per period.
 */

/** Master analysis window — drives Quartile, Trailing/Benchmark/BSE 500, Risk Matrix, Risk-Adjusted. */
export type MasterPeriod = "3Y" | "5Y" | "7Y" | "10Y";

/** Rolling-return lookback — owned by the Returns tab, independent of the master window. */
export type RollingWindow = "1Y" | "3Y" | "5Y" | "10Y";

/** Point horizons shown as rows in the returns table. */
export type Horizon = "1Y" | "3Y" | "5Y" | "7Y" | "10Y";

export interface NavPoint {
  date: string; // ISO
  value: number; // adjusted NAV
}

export interface SchemeHeader {
  schemeId: string;
  name: string;
  plan: string; // "Direct Plan — Growth"
  category: string;
  aumCr: number; // ₹ crore
  benchmark: string;
  bse500: string;
  nav: number;
  navChangePct: number; // day change
  navDate: string;
  inception: string;
  expenseRatioPct: number;
  exitLoad: string;
  high52w: number;
  low52w: number;
  navSeries: NavPoint[]; // vendor-supplied 26-week series for the masthead chart
  currentQuartile: 1 | 2 | 3 | 4;
}

export interface QuartileInfo {
  quartile: 1 | 2 | 3 | 4;
  rank: number;
  peers: number;
  percentile: number; // 0–100, lower = better
  fundReturnPct: number; // annualised over the window
  medianReturnPct: number; // category median
  bestPeerReturnPct: number;
}

export interface HorizonRow {
  horizon: Horizon;
  trailingPct: number | null; // null when horizon > analysis window
  benchmarkPct: number | null;
  bse500Pct: number | null;
}

export interface ReturnsBundle {
  period: MasterPeriod;
  asOf: string;
  quartile: QuartileInfo;
  horizons: HorizonRow[];
}

export interface RollingPoint {
  date: string;
  valuePct: number;
}

export interface RollingBundle {
  window: RollingWindow;
  avgPct: number; // mean of all rolling windows of this length
  currentPct: number; // most recent window
  minPct: number;
  maxPct: number;
  pctPositive: number; // share of rolling windows that were positive
  history: RollingPoint[];
  /** Average rolling return measured over each point horizon (vendor pre-computed). */
  byHorizon: { horizon: Horizon; avgPct: number }[];
}

export interface EntityRiskMetrics {
  stdDevPct: number;
  beta: number; // fund vs benchmark · benchmark vs BSE 500 · BSE 500 = 1.00
  upCapture: number;
  downCapture: number;
}

export interface RiskSubScores {
  stdDev: number; // 0–10 normalised
  beta: number;
  capture: number;
}

export interface EntityRiskScore {
  entity: "Fund" | "Benchmark" | "BSE 500";
  sub: RiskSubScores;
  total: number; // 0–10 weighted
}

export interface RiskBundle {
  period: MasterPeriod;
  asOf: string;
  weights: { stdDev: number; beta: number; capture: number };
  metrics: { fund: EntityRiskMetrics; benchmark: EntityRiskMetrics; bse500: EntityRiskMetrics };
  scores: EntityRiskScore[];
}

export interface RiskAdjustedMetric {
  key: "ir" | "sharpe" | "sortino" | "alpha" | "active";
  label: string;
  unit: "ratio" | "pct";
  fund: number;
  categoryAvg: number;
  domain: [number, number]; // vendor-suggested display scale
  betterWhen: "high" | "low";
}

export interface RiskAdjustedBundle {
  period: MasterPeriod;
  asOf: string;
  riskFreeRatePct: number;
  metrics: RiskAdjustedMetric[];
}

export interface ValuationTriple {
  fund: number | null;
  benchmark: number | null;
  bse500: number | null;
}

export interface GrowthSubScores {
  peg: { fund: number; benchmark: number; bse500: number };
  pe: { fund: number; benchmark: number; bse500: number };
  pb: { fund: number; benchmark: number; bse500: number };
  aum: { fund: number; benchmark: number; bse500: number };
}

export interface GrowthBundle {
  asOf: string;
  pointInTime: true; // this snapshot ignores the master window by design
  weights: { peg: number; pe: number; pb: number; aum: number };
  raw: { peg: ValuationTriple; pe: ValuationTriple; pb: ValuationTriple; aumCr: ValuationTriple };
  sub: GrowthSubScores;
  scores: { fund: number; benchmark: number; bse500: number };
  sectors: { name: string; pct: number }[];
  topHoldings: { name: string; pctAum: number; dayChangePct: number }[];
}

export interface TickerItem {
  label: string;
  value: number;
  changePct: number;
}

/**
 * THE SEAM — the page talks only to this interface.
 * Swap `mockFundApi` for a REST/GraphQL client with the same shapes
 * (see src/data/api.ts) and nothing else changes.
 */
export interface FundDataApi {
  getSchemeHeader(schemeId: string): Promise<SchemeHeader | null>;
  getReturns(schemeId: string, period: MasterPeriod): Promise<ReturnsBundle | null>;
  getRolling(schemeId: string, window: RollingWindow): Promise<RollingBundle | null>;
  getRiskMatrix(schemeId: string, period: MasterPeriod): Promise<RiskBundle | null>;
  getRiskAdjusted(schemeId: string, period: MasterPeriod): Promise<RiskAdjustedBundle | null>;
  getGrowthSnapshot(schemeId: string): Promise<GrowthBundle | null>;
}
