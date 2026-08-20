import { useMemo, useState } from "react";
import { LegendDot, QuartileBand, Sparkline } from "../components/charts";
import { MetricLabel } from "../components/InfoTip";
import { PulseIcon, TrendIcon } from "../components/icons";
import { Delta, SectionCard, Segmented, Tag } from "../components/ui";
import { fundApi } from "../data/api";
import { fmtNum, fmtPct, useCountUp, useFetch, useReveal, type FetchStatus } from "../lib";
import type { Horizon, MasterPeriod, RollingWindow } from "../types";

const TIPS = {
  quartile:
    "Where this fund sits against its category peers over the selected window. Q1 means it finished in the top 25% of all peer funds.",
  percentile: "The fund outperformed this percentage of category peers on annualised returns over the selected window.",
  peers: "Number of Flexi Cap funds with a complete track record across the full selected window.",
  median: "The middle return of the category — half of peer funds did better, half did worse.",
  rolling:
    "The average of every overlapping rolling window of this length, not just one start date. It smooths away the luck of timing.",
  trailing: "Point-to-point annualised return (CAGR) if you had invested exactly at the start of the horizon and held to today.",
  benchmark: "The NIFTY 500 TRI total return over the same horizon, with dividends reinvested.",
  bse500: "The S&P BSE 500 TRI return over the same horizon — the broad-market yardstick for Indian equity.",
  bestPeer: "The annualised return of the best-performing fund in the category over the selected window.",
};

const ROLLING_OPTIONS: { value: RollingWindow; label: string }[] = [
  { value: "1Y", label: "1Y" },
  { value: "3Y", label: "3Y" },
  { value: "5Y", label: "5Y" },
  { value: "10Y", label: "10Y" },
];

const horizonYears: Record<Horizon, number> = { "1Y": 1, "3Y": 3, "5Y": 5, "7Y": 7, "10Y": 10 };

function BigPct({ value, accent = "var(--mint)" }: { value: number; accent?: string }) {
  const v = useCountUp(value);
  return (
    <span className="mono text-[30px] font-bold leading-none sm:text-[34px]" style={{ color: accent }}>
      {v.toFixed(2)}%
    </span>
  );
}

export default function ReturnsTab({
  schemeId,
  period,
  globalTick,
}: {
  schemeId: string;
  period: MasterPeriod;
  globalTick: number;
}) {
  const [rollingWindow, setRollingWindow] = useState<RollingWindow>("3Y");
  const [ref, inView] = useReveal<HTMLDivElement>();

  // Driven by the MASTER window
  const returns = useFetch(() => fundApi.getReturns(schemeId, period), [schemeId, period, globalTick]);
  // Driven ONLY by its own rolling control
  const rolling = useFetch(() => fundApi.getRolling(schemeId, rollingWindow), [schemeId, rollingWindow, globalTick]);

  const rollingByHorizon = useMemo(
    () => new Map((rolling.data?.byHorizon ?? []).map((r) => [r.horizon, r.avgPct])),
    [rolling.data]
  );

  const tableStatus: FetchStatus =
    returns.status === "loading" || rolling.status === "loading"
      ? "loading"
      : returns.status === "error" || rolling.status === "error"
        ? "error"
        : "success";
  const tableError = returns.status === "error" ? returns.error : rolling.status === "error" ? rolling.error : null;
  const tableRetry = returns.status === "error" ? returns.retry : rolling.retry;
  const tableData = returns.status === "success" && rolling.status === "success" && returns.data && rolling.data ? returns.data : null;

  const q = returns.data?.quartile;

  return (
    <div ref={ref} className={`reveal ${inView ? "in" : ""} space-y-5`}>
      <div className="grid gap-5 lg:grid-cols-5">
        {/* ------- quartile ranking ------- */}
        <SectionCard
          className="lg:col-span-3"
          title="Quartile Ranking"
          tip={TIPS.quartile}
          icon={<TrendIcon size={16} />}
          aside={<Tag tone="mint">{period} window</Tag>}
          status={returns.status}
          error={returns.error}
          onRetry={returns.retry}
          data={returns.data}
          emptyTitle="No ranking for this window"
          emptyHint="The vendor has not published a category ranking for this analysis window yet. Try a shorter window or check back after the next publish cycle."
          skeletonRows={4}
          footnote={
            <>
              Source: vendor category rankings, annualised returns, {returns.data?.asOf}. Lower percentile = better rank · marker position
              animates to the fund's latest standing.
            </>
          }
        >
          {q && (
            <div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                <div>
                  <div className="eyebrow !text-[9.5px]">Fund return ({period})</div>
                  <div className="mt-1.5">
                    <BigPct value={q.fundReturnPct} />
                  </div>
                  <div className="mt-1.5">
                    <Delta value={q.fundReturnPct - q.medianReturnPct} /> <span className="text-[11px] text-[var(--ink3)]">vs median</span>
                  </div>
                </div>
                <div>
                  <div className="eyebrow !text-[9.5px]">
                    <MetricLabel tip={TIPS.percentile}>Percentile</MetricLabel>
                  </div>
                  <div className="mono mt-1.5 text-[22px] font-bold text-[var(--ink)]">{q.percentile}<span className="text-[13px] text-[var(--ink3)]">th</span></div>
                  <div className="mt-1 text-[11px] text-[var(--ink3)]">beats {100 - q.percentile}% of peers</div>
                </div>
                <div>
                  <div className="eyebrow !text-[9.5px]">
                    <MetricLabel tip={TIPS.peers}>Peers tracked</MetricLabel>
                  </div>
                  <div className="mono mt-1.5 text-[22px] font-bold text-[var(--ink)]">{q.rank}<span className="text-[13px] text-[var(--ink3)]"> / {q.peers}</span></div>
                  <div className="mt-1 text-[11px] text-[var(--ink3)]">rank in category</div>
                </div>
                <div>
                  <div className="eyebrow !text-[9.5px]">
                    <MetricLabel tip={TIPS.median}>Category median</MetricLabel>
                  </div>
                  <div className="mono mt-1.5 text-[22px] font-bold text-[var(--ink2)]">{fmtNum(q.medianReturnPct)}%</div>
                  <div className="mt-1 text-[11px] text-[var(--ink3)]">
                    <MetricLabel tip={TIPS.bestPeer}>best peer</MetricLabel>{" "}
                    <span className="mono">{fmtNum(q.bestPeerReturnPct)}%</span>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <QuartileBand percentile={q.percentile} rank={q.rank} peers={q.peers} />
              </div>
            </div>
          )}
        </SectionCard>

        {/* ------- rolling spotlight (own filter) ------- */}
        <SectionCard
          className="lg:col-span-2"
          title="Rolling Return"
          tip={TIPS.rolling}
          icon={<PulseIcon size={16} />}
          aside={
            <Segmented dense ariaLabel="Rolling return window — independent of the analysis window" options={ROLLING_OPTIONS} value={rollingWindow} onChange={setRollingWindow} />
          }
          status={rolling.status}
          error={rolling.error}
          onRetry={rolling.retry}
          data={rolling.data}
          emptyTitle="Rolling series unavailable"
          emptyHint="The vendor has not computed rolling averages for this lookback. Switch to a shorter rolling window."
          skeletonRows={5}
          footnote={
            <>
              <span className="mr-1 inline-flex items-center gap-1 text-[var(--amber)]">●</span>
              Uses its own {rollingWindow} filter — changing the {period} analysis window above does <strong>not</strong> re-render this block.
            </>
          }
        >
          {rolling.data && (
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <span className="mono text-[30px] font-bold leading-none text-[var(--amber)]">{fmtNum(rolling.data.currentPct)}%</span>
                  <span className="ml-2 text-[11.5px] text-[var(--ink3)]">latest {rollingWindow} rolling</span>
                </div>
                <Tag tone={rolling.data.currentPct >= rolling.data.avgPct ? "mint" : "amber"}>
                  avg {fmtNum(rolling.data.avgPct)}%
                </Tag>
              </div>
              <div className="mt-3">
                <Sparkline key={rollingWindow} points={rolling.data.history.map((h) => h.valuePct)} height={72} stroke="var(--amber)" />
              </div>
              <div className="mono mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="rounded-lg border border-[var(--line)] bg-[var(--bg2)] px-2 py-2">
                  <div className="text-[9px] uppercase tracking-[0.14em] text-[var(--ink3)]">Min</div>
                  <div className="mt-0.5 font-semibold text-[var(--coral)]">{fmtNum(rolling.data.minPct)}%</div>
                </div>
                <div className="rounded-lg border border-[var(--line)] bg-[var(--bg2)] px-2 py-2">
                  <div className="text-[9px] uppercase tracking-[0.14em] text-[var(--ink3)]">Max</div>
                  <div className="mt-0.5 font-semibold text-[var(--mint)]">{fmtNum(rolling.data.maxPct)}%</div>
                </div>
                <div className="rounded-lg border border-[var(--line)] bg-[var(--bg2)] px-2 py-2">
                  <div className="text-[9px] uppercase tracking-[0.14em] text-[var(--ink3)]">Positive</div>
                  <div className="mt-0.5 font-semibold text-[var(--ink)]">{rolling.data.pctPositive}%</div>
                </div>
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {/* ------- returns table ------- */}
      <SectionCard
        title="Return Series"
        tip="Annualised returns across point horizons. The highlighted row matches the analysis window; the amber tag marks the rolling lookback."
        status={tableStatus}
        error={tableError}
        onRetry={tableRetry}
        data={tableData}
        emptyTitle="Return series unavailable"
        emptyHint="No pre-computed return series arrived from the vendor for this combination of windows."
        skeletonRows={6}
        aside={
          <div className="flex items-center gap-3">
            <LegendDot color="var(--mint)" label="Fund" />
            <LegendDot color="var(--ink3)" label="—" hollow />
            <span className="text-[11.5px] text-[var(--ink3)]">shorter than window</span>
          </div>
        }
        footnote={
          <>
            Rolling column follows the <strong className="text-[var(--amber)]">{rollingWindow} rolling</strong> control · Trailing /
            Benchmark / BSE 500 columns follow the <strong className="text-[var(--mint)]">{period} analysis window</strong>. All figures
            annualised, vendor pre-computed — nothing is derived from raw NAV in the browser.
          </>
        }
      >
        {returns.data && rolling.data && (
          <div className="-mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
            <table className="data-table min-w-[640px]">
              <caption className="sr-only">
                Annualised rolling, trailing, benchmark and BSE 500 returns by horizon for the {period} analysis window
              </caption>
              <thead>
                <tr>
                  <th scope="col">Horizon</th>
                  <th scope="col">
                    <MetricLabel tip={TIPS.rolling}>Rolling {rollingWindow}</MetricLabel>
                  </th>
                  <th scope="col">
                    <MetricLabel tip={TIPS.trailing}>Trailing</MetricLabel>
                  </th>
                  <th scope="col">
                    <MetricLabel tip={TIPS.benchmark}>Benchmark</MetricLabel>
                  </th>
                  <th scope="col">
                    <MetricLabel tip={TIPS.bse500}>BSE 500</MetricLabel>
                  </th>
                </tr>
              </thead>
              <tbody>
                {returns.data.horizons.map((row) => {
                  const isWindow = row.horizon === period;
                  const isRolling = row.horizon === rollingWindow;
                  const spread =
                    row.trailingPct !== null && row.benchmarkPct !== null ? +(row.trailingPct - row.benchmarkPct).toFixed(2) : null;
                  return (
                    <tr key={row.horizon} className={isWindow ? "row-window" : undefined}>
                      <td>
                        <span className="inline-flex items-center gap-2">
                          <span className="mono text-[13px] font-bold text-[var(--ink)]">{row.horizon}</span>
                          {isWindow && <Tag tone="mint">window</Tag>}
                          {isRolling && <Tag tone="amber">rolling</Tag>}
                        </span>
                      </td>
                      <td className="text-[var(--amber)]">{fmtPct(rollingByHorizon.get(row.horizon) ?? null)}</td>
                      <td>
                        <span className="inline-flex items-center gap-2">
                          {fmtPct(row.trailingPct)}
                          {spread !== null && (
                            <span className={spread >= 0 ? "text-[10.5px] text-[var(--mint)]" : "text-[10.5px] text-[var(--coral)]"}>
                              {spread >= 0 ? "+" : ""}
                              {spread}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="text-[var(--ink2)]">{fmtPct(row.benchmarkPct)}</td>
                      <td className="text-[var(--ink2)]">{fmtPct(row.bse500Pct)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
      <span className="sr-only" aria-live="polite">
        Analysis window {period}, rolling window {rollingWindow}. Horizon {horizonYears[period]} year data highlighted.
      </span>
    </div>
  );
}
