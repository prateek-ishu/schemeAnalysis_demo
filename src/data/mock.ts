import type {
  GrowthBundle,
  Horizon,
  MasterPeriod,
  NavPoint,
  ReturnsBundle,
  RiskAdjustedBundle,
  RiskBundle,
  RollingBundle,
  RollingWindow,
  SchemeHeader,
  TickerItem,
} from "../types";

export const SCHEME_ID = "MER-FLEXI-019";

/* ------------------------------------------------------------------ */
/* deterministic pseudo-series (stands in for vendor chart endpoints)  */
/* ------------------------------------------------------------------ */
const wave = (i: number, seed: number, amp: number, base: number) =>
  base + amp * Math.sin(i * 0.7 + seed) + amp * 0.45 * Math.sin(i * 0.23 + seed * 2.1);

const navSeries = (): NavPoint[] => {
  const out: NavPoint[] = [];
  const start = new Date("2025-08-08");
  for (let i = 0; i < 26; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    out.push({ date: d.toISOString().slice(0, 10), value: +(162 + i * 1.02 + wave(i, 1.7, 2.6, 0)).toFixed(2) });
  }
  return out;
};

const rollingHistory = (window: RollingWindow, base: number, amp: number): { date: string; valuePct: number }[] => {
  const points = window === "1Y" ? 24 : window === "3Y" ? 20 : 16;
  const stepMonths = window === "1Y" ? 1 : window === "3Y" ? 2 : 3;
  const out: { date: string; valuePct: number }[] = [];
  const start = new Date("2022-02-01");
  for (let i = 0; i < points; i++) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i * stepMonths);
    out.push({ date: d.toISOString().slice(0, 10), valuePct: +wave(i, window.length * 1.3, amp, base).toFixed(2) });
  }
  return out;
};

/* ------------------------------------------------------------------ */
/* scheme header                                                       */
/* ------------------------------------------------------------------ */
export const schemeHeader: SchemeHeader = {
  schemeId: SCHEME_ID,
  name: "Meridian Flexi Cap Fund",
  plan: "Direct Plan · Growth",
  category: "Flexi Cap Fund",
  aumCr: 48260.4,
  benchmark: "NIFTY 500 TRI",
  bse500: "S&P BSE 500 TRI",
  nav: 187.42,
  navChangePct: 0.84,
  navDate: "05 Feb 2026",
  inception: "14 Aug 2009",
  expenseRatioPct: 0.62,
  exitLoad: "1.00% if redeemed ≤ 365 days",
  high52w: 192.18,
  low52w: 138.05,
  navSeries: navSeries(),
  currentQuartile: 1,
};

/* ------------------------------------------------------------------ */
/* returns per master period                                           */
/* ------------------------------------------------------------------ */
const HORIZONS: Horizon[] = ["1Y", "3Y", "5Y", "7Y", "10Y"];
const horizonYears: Record<Horizon, number> = { "1Y": 1, "3Y": 3, "5Y": 5, "7Y": 7, "10Y": 10 };

interface PeriodReturnsSeed {
  rank: number;
  peers: number;
  percentile: number;
  median: number;
  best: number;
  fund: Record<Horizon, number>; // fund trailing CAGR per horizon
  spreadBench: Record<Horizon, number>; // fund minus benchmark
  spread500: number; // benchmark minus BSE 500, roughly flat
}

const returnsSeed: Record<MasterPeriod, PeriodReturnsSeed> = {
  "3Y": {
    rank: 2, peers: 35, percentile: 6, median: 14.8, best: 24.1,
    fund: { "1Y": 18.4, "3Y": 21.4, "5Y": 19.2, "7Y": 17.9, "10Y": 17.1 },
    spreadBench: { "1Y": 2.6, "3Y": 3.1, "5Y": 2.4, "7Y": 2.2, "10Y": 2.0 },
    spread500: 0.4,
  },
  "5Y": {
    rank: 3, peers: 33, percentile: 9, median: 15.6, best: 23.4,
    fund: { "1Y": 18.4, "3Y": 20.9, "5Y": 19.8, "7Y": 18.2, "10Y": 17.4 },
    spreadBench: { "1Y": 2.6, "3Y": 2.8, "5Y": 2.9, "7Y": 2.5, "10Y": 2.3 },
    spread500: 0.5,
  },
  "7Y": {
    rank: 4, peers: 28, percentile: 12, median: 14.2, best: 22.6,
    fund: { "1Y": 18.4, "3Y": 20.4, "5Y": 19.3, "7Y": 18.6, "10Y": 17.6 },
    spreadBench: { "1Y": 2.6, "3Y": 2.5, "5Y": 2.6, "7Y": 3.0, "10Y": 2.5 },
    spread500: 0.4,
  },
  "10Y": {
    rank: 3, peers: 21, percentile: 11, median: 13.9, best: 21.8,
    fund: { "1Y": 18.4, "3Y": 20.1, "5Y": 19.0, "7Y": 18.3, "10Y": 17.9 },
    spreadBench: { "1Y": 2.6, "3Y": 2.4, "5Y": 2.5, "7Y": 2.7, "10Y": 3.2 },
    spread500: 0.5,
  },
};

export const returnsByPeriod: Record<MasterPeriod, ReturnsBundle> = Object.fromEntries(
  (Object.keys(returnsSeed) as MasterPeriod[]).map((p) => {
    const s = returnsSeed[p];
    return [
      p,
      {
        period: p,
        asOf: "05 Feb 2026",
        quartile: {
          quartile: 1,
          rank: s.rank,
          peers: s.peers,
          percentile: s.percentile,
          fundReturnPct: s.fund[p],
          medianReturnPct: s.median,
          bestPeerReturnPct: s.best,
        },
        horizons: HORIZONS.map((h) => {
          const valid = horizonYears[h] <= horizonYears[p];
          const bench = +(s.fund[h] - s.spreadBench[h]).toFixed(2);
          return {
            horizon: h,
            trailingPct: valid ? s.fund[h] : null,
            benchmarkPct: valid ? bench : null,
            bse500Pct: valid ? +(bench - s.spread500).toFixed(2) : null,
          };
        }),
      } satisfies ReturnsBundle,
    ];
  })
) as Record<MasterPeriod, ReturnsBundle>;

/* ------------------------------------------------------------------ */
/* rolling returns per window (independent of the master period)       */
/* ------------------------------------------------------------------ */
const rollingSeed: Record<RollingWindow, { avg: number; amp: number; byHorizon: Record<Horizon, number> }> = {
  "1Y": { avg: 16.8, amp: 7.5, byHorizon: { "1Y": 17.2, "3Y": 16.4, "5Y": 16.1, "7Y": 15.8, "10Y": 15.6 } },
  "3Y": { avg: 17.6, amp: 4.2, byHorizon: { "1Y": 18.1, "3Y": 17.9, "5Y": 17.4, "7Y": 17.1, "10Y": 16.9 } },
  "5Y": { avg: 17.1, amp: 2.6, byHorizon: { "1Y": 17.6, "3Y": 17.4, "5Y": 17.0, "7Y": 16.8, "10Y": 16.6 } },
  "10Y": { avg: 16.4, amp: 1.4, byHorizon: { "1Y": 16.9, "3Y": 16.7, "5Y": 16.5, "7Y": 16.3, "10Y": 16.2 } },
};

export const rollingByWindow: Record<RollingWindow, RollingBundle> = Object.fromEntries(
  (Object.keys(rollingSeed) as RollingWindow[]).map((w) => {
    const s = rollingSeed[w];
    const history = rollingHistory(w, s.avg, s.amp);
    const vals = history.map((h) => h.valuePct);
    return [
      w,
      {
        window: w,
        avgPct: s.avg,
        currentPct: vals[vals.length - 1],
        minPct: Math.min(...vals),
        maxPct: Math.max(...vals),
        pctPositive: +(100 * vals.filter((v) => v > 0).length / vals.length).toFixed(0),
        history,
        byHorizon: HORIZONS.map((h) => ({ horizon: h, avgPct: s.byHorizon[h] })),
      } satisfies RollingBundle,
    ];
  })
) as Record<RollingWindow, RollingBundle>;

/* ------------------------------------------------------------------ */
/* risk matrix per master period                                       */
/* ------------------------------------------------------------------ */
const riskSeed: Record<
  MasterPeriod,
  {
    fund: { std: number; beta: number; up: number; down: number };
    bench: { std: number; beta: number; up: number; down: number };
    bse: { std: number };
  }
> = {
  "3Y": { fund: { std: 13.4, beta: 1.08, up: 112, down: 96 }, bench: { std: 12.2, beta: 0.97, up: 101, down: 99 }, bse: { std: 12.6 } },
  "5Y": { fund: { std: 14.1, beta: 1.05, up: 109, down: 94 }, bench: { std: 12.8, beta: 0.98, up: 100, down: 98 }, bse: { std: 13.3 } },
  "7Y": { fund: { std: 13.7, beta: 1.02, up: 107, down: 95 }, bench: { std: 12.4, beta: 0.99, up: 100, down: 99 }, bse: { std: 12.9 } },
  "10Y": { fund: { std: 13.9, beta: 0.98, up: 105, down: 93 }, bench: { std: 12.7, beta: 0.99, up: 101, down: 100 }, bse: { std: 13.2 } },
};

/** normalisers the vendor would run server-side — mirrored here so mock totals are internally consistent */
const normStd = (v: number) => Math.min(10, Math.max(0, (v / 22) * 10)); // 22% σ ≈ 10/10
const normBeta = (v: number) => Math.min(10, Math.max(0, (v / 1.5) * 10)); // β 1.5 ≈ 10/10
const normCapture = (down: number) => Math.min(10, Math.max(0, (down / 130) * 10)); // down-capture 130 ≈ 10/10
const W = { stdDev: 0.4, beta: 0.4, capture: 0.2 };
const r1 = (v: number) => +v.toFixed(1);

export const riskByPeriod: Record<MasterPeriod, RiskBundle> = Object.fromEntries(
  (Object.keys(riskSeed) as MasterPeriod[]).map((p) => {
    const s = riskSeed[p];
    const fundSub = { stdDev: r1(normStd(s.fund.std)), beta: r1(normBeta(s.fund.beta)), capture: r1(normCapture(s.fund.down)) };
    const benchSub = { stdDev: r1(normStd(s.bench.std)), beta: r1(normBeta(s.bench.beta)), capture: r1(normCapture(s.bench.down)) };
    const bseSub = { stdDev: r1(normStd(s.bse.std)), beta: r1(normBeta(1)), capture: r1(normCapture(100)) };
    const total = (sub: { stdDev: number; beta: number; capture: number }) =>
      r1(sub.stdDev * W.stdDev + sub.beta * W.beta + sub.capture * W.capture);
    return [
      p,
      {
        period: p,
        asOf: "05 Feb 2026",
        weights: W,
        metrics: {
          fund: { stdDevPct: s.fund.std, beta: s.fund.beta, upCapture: s.fund.up, downCapture: s.fund.down },
          benchmark: { stdDevPct: s.bench.std, beta: s.bench.beta, upCapture: s.bench.up, downCapture: s.bench.down },
          bse500: { stdDevPct: s.bse.std, beta: 1.0, upCapture: 100, downCapture: 100 },
        },
        scores: [
          { entity: "Fund", sub: fundSub, total: total(fundSub) },
          { entity: "Benchmark", sub: benchSub, total: total(benchSub) },
          { entity: "BSE 500", sub: bseSub, total: total(bseSub) },
        ],
      } satisfies RiskBundle,
    ];
  })
) as Record<MasterPeriod, RiskBundle>;

/* ------------------------------------------------------------------ */
/* risk-adjusted per master period                                     */
/* ------------------------------------------------------------------ */
const raSeed: Record<
  MasterPeriod,
  { ir: [number, number]; sharpe: [number, number]; sortino: [number, number]; alpha: [number, number]; active: [number, number] }
> = {
  // [fund, category average]
  "3Y": { ir: [0.92, 0.31], sharpe: [1.31, 0.92], sortino: [1.88, 1.24], alpha: [3.8, 0.9], active: [4.9, 1.4] },
  "5Y": { ir: [0.86, 0.28], sharpe: [1.24, 0.89], sortino: [1.78, 1.21], alpha: [3.4, 0.8], active: [4.6, 1.2] },
  "7Y": { ir: [0.79, 0.25], sharpe: [1.18, 0.86], sortino: [1.69, 1.18], alpha: [3.1, 0.7], active: [4.3, 1.1] },
  "10Y": { ir: [0.83, 0.27], sharpe: [1.21, 0.88], sortino: [1.73, 1.2], alpha: [3.6, 0.8], active: [4.8, 1.3] },
};

export const riskAdjustedByPeriod: Record<MasterPeriod, RiskAdjustedBundle> = Object.fromEntries(
  (Object.keys(raSeed) as MasterPeriod[]).map((p) => {
    const s = raSeed[p];
    return [
      p,
      {
        period: p,
        asOf: "05 Feb 2026",
        riskFreeRatePct: 6.6,
        metrics: [
          { key: "ir", label: "Information Ratio", unit: "ratio", fund: s.ir[0], categoryAvg: s.ir[1], domain: [-0.2, 1.2], betterWhen: "high" },
          { key: "sharpe", label: "Sharpe Ratio", unit: "ratio", fund: s.sharpe[0], categoryAvg: s.sharpe[1], domain: [0, 1.6], betterWhen: "high" },
          { key: "sortino", label: "Sortino Ratio", unit: "ratio", fund: s.sortino[0], categoryAvg: s.sortino[1], domain: [0, 2.2], betterWhen: "high" },
          { key: "alpha", label: "Jenson's Alpha", unit: "pct", fund: s.alpha[0], categoryAvg: s.alpha[1], domain: [-1, 5], betterWhen: "high" },
          { key: "active", label: "Active Return", unit: "pct", fund: s.active[0], categoryAvg: s.active[1], domain: [-1, 6], betterWhen: "high" },
        ],
      } satisfies RiskAdjustedBundle,
    ];
  })
) as Record<MasterPeriod, RiskAdjustedBundle>;

/* ------------------------------------------------------------------ */
/* growth snapshot — point in time, ignores the master window          */
/* ------------------------------------------------------------------ */
const gw = { peg: 0.4, pe: 0.2, pb: 0.2, aum: 0.2 };
const gsub = {
  peg: { fund: 8.4, benchmark: 5.6, bse500: 5.0 },
  pe: { fund: 7.8, benchmark: 5.9, bse500: 5.3 },
  pb: { fund: 7.1, benchmark: 5.7, bse500: 5.1 },
  aum: { fund: 6.8, benchmark: 5.0, bse500: 5.0 },
};
const composite = (k: "fund" | "benchmark" | "bse500") =>
  r1(gsub.peg[k] * gw.peg + gsub.pe[k] * gw.pe + gsub.pb[k] * gw.pb + gsub.aum[k] * gw.aum);

export const growthSnapshot: GrowthBundle = {
  asOf: "31 Jan 2026",
  pointInTime: true,
  weights: gw,
  raw: {
    peg: { fund: 0.82, benchmark: 1.18, bse500: 1.26 },
    pe: { fund: 21.6, benchmark: 24.9, bse500: 25.8 },
    pb: { fund: 3.2, benchmark: 4.0, bse500: 4.2 },
    aumCr: { fund: 48260.4, benchmark: null, bse500: null },
  },
  sub: gsub,
  scores: { fund: composite("fund"), benchmark: composite("benchmark"), bse500: composite("bse500") },
  sectors: [
    { name: "Financials", pct: 23.8 },
    { name: "Information Technology", pct: 14.2 },
    { name: "Consumer", pct: 11.6 },
    { name: "Automobile", pct: 9.8 },
    { name: "Healthcare", pct: 8.4 },
    { name: "Industrials", pct: 7.6 },
    { name: "Energy", pct: 5.9 },
    { name: "Telecom", pct: 4.2 },
    { name: "Others", pct: 14.5 },
  ],
  topHoldings: [
    { name: "HDFC Bank", pctAum: 8.1, dayChangePct: 1.2 },
    { name: "Reliance Industries", pctAum: 7.4, dayChangePct: 0.6 },
    { name: "ICICI Bank", pctAum: 6.8, dayChangePct: 1.8 },
    { name: "Tata Consultancy Services", pctAum: 5.9, dayChangePct: -0.4 },
    { name: "Infosys", pctAum: 5.2, dayChangePct: 0.9 },
  ],
};

/* ------------------------------------------------------------------ */
/* market tape                                                         */
/* ------------------------------------------------------------------ */
export const ticker: TickerItem[] = [
  { label: "NIFTY 50", value: 25439.62, changePct: 0.62 },
  { label: "SENSEX", value: 83918.45, changePct: 0.54 },
  { label: "BSE 500", value: 37206.11, changePct: 0.71 },
  { label: "NIFTY MIDCAP", value: 58312.9, changePct: 0.94 },
  { label: "NIFTY BANK", value: 57104.3, changePct: 1.08 },
  { label: "INDIA VIX", value: 12.42, changePct: -3.18 },
  { label: "USD/INR", value: 86.34, changePct: -0.11 },
];
