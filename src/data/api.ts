import type { FundDataApi } from "../types";
import {
  SCHEME_ID,
  growthSnapshot,
  returnsByPeriod,
  riskAdjustedByPeriod,
  riskByPeriod,
  rollingByWindow,
  schemeHeader,
} from "./mock";

/**
 * Network simulator — lets the prototype demonstrate every per-section state
 * (loading skeleton, vendor error + retry, empty payload) on demand.
 */
export const netSim = {
  delayMs: 600,
  /** 0 = healthy · 100 = every request fails */
  failRate: 0,
  /** resolve with an empty payload (null) to show empty states */
  empty: false,
};

const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

async function simulate<T>(payload: T, label: string): Promise<T | null> {
  await sleep(netSim.delayMs + Math.random() * 240);
  if (Math.random() * 100 < netSim.failRate) {
    throw new Error(`${label}: vendor feed unavailable (HTTP 503). The pre-computed metrics could not be fetched.`);
  }
  if (netSim.empty) return null;
  return payload;
}

const mockFundApi: FundDataApi = {
  getSchemeHeader: (schemeId) => simulate(schemeId === SCHEME_ID ? schemeHeader : null, "Scheme header"),
  getReturns: (_id, period) => simulate(returnsByPeriod[period], `Returns · ${period}`),
  getRolling: (_id, window) => simulate(rollingByWindow[window], `Rolling · ${window}`),
  getRiskMatrix: (_id, period) => simulate(riskByPeriod[period], `Risk matrix · ${period}`),
  getRiskAdjusted: (_id, period) => simulate(riskAdjustedByPeriod[period], `Risk-adjusted · ${period}`),
  getGrowthSnapshot: () => simulate(growthSnapshot, "Growth snapshot"),
};

/**
 * ───────────────────────────  DATA SEAM  ───────────────────────────
 * The whole page consumes `fundApi` through the `FundDataApi` interface.
 * To go live, replace this single line with a real client, e.g.
 *
 *   export const fundApi: FundDataApi = createRestFundApi({
 *     baseUrl: import.meta.env.VITE_FUND_ANALYTICS_URL,
 *   });
 *
 * — payload shapes are already typed in src/types.ts.
 * ────────────────────────────────────────────────────────────────────
 */
export const fundApi: FundDataApi = mockFundApi;

/** Broadcasts a refetch to every mounted section (used by the demo panel). */
export const REFETCH_EVENT = "meridian:refetch";
