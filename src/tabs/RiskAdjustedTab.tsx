import { DivergingRow, LegendDot } from "../components/charts";
import { MetricLabel } from "../components/InfoTip";
import { ScaleIcon } from "../components/icons";
import { SectionCard, Tag } from "../components/ui";
import { fundApi } from "../data/api";
import { useFetch, useReveal } from "../lib";
import type { MasterPeriod, RiskAdjustedMetric } from "../types";

const TIPS: Record<RiskAdjustedMetric["key"], string> = {
  ir: "Extra return earned per unit of active risk taken against the benchmark. Above 0.5 is considered strong stock-picking.",
  sharpe: "Return earned per unit of total risk, over the risk-free rate. Higher means smoother compounding per unit of volatility.",
  sortino: "Like Sharpe, but only counts downside swings as risk — a fairer measure when upside is pleasantly bumpy.",
  alpha: "Annualised return added beyond what the fund's beta alone would predict. Positive alpha is the classic 'skill' signal.",
  active: "Simple fund return minus benchmark return over the window — the raw value added (or given up) by active management.",
};

const fmtVal = (m: RiskAdjustedMetric, v: number) => (m.unit === "pct" ? `${v >= 0 ? "" : "−"}${Math.abs(v).toFixed(2)}%` : v.toFixed(2));

export default function RiskAdjustedTab({ schemeId, period, globalTick }: { schemeId: string; period: MasterPeriod; globalTick: number }) {
  const [ref, inView] = useReveal<HTMLDivElement>();
  const ra = useFetch(() => fundApi.getRiskAdjusted(schemeId, period), [schemeId, period, globalTick]);
  const d = ra.data;
  const wins = d ? d.metrics.filter((m) => (m.betterWhen === "high" ? m.fund >= m.categoryAvg : m.fund <= m.categoryAvg)).length : 0;

  return (
    <div ref={ref} className={`reveal ${inView ? "in" : ""} space-y-5`}>
      <SectionCard
        title="Risk-Adjusted Return vs Category"
        tip="Each metric asks the same question differently: was the return worth the risk taken? The filled dot is this fund; the hollow dot is the Flexi Cap category average over the same window."
        icon={<ScaleIcon size={16} />}
        aside={
          d ? (
            <div className="flex items-center gap-3">
              <Tag tone="mint">{period} window</Tag>
              <Tag tone={wins >= 4 ? "mint" : wins >= 3 ? "amber" : "coral"}>
                beats category on {wins}/5
              </Tag>
            </div>
          ) : (
            <Tag tone="mint">{period} window</Tag>
          )
        }
        status={ra.status}
        error={ra.error}
        onRetry={ra.retry}
        data={ra.data}
        emptyTitle="Risk-adjusted feed empty"
        emptyHint="No risk-adjusted statistics were published by the vendor for this window yet."
        skeletonRows={7}
        footnote={
          d && (
            <>
              Risk-free rate used: {d.riskFreeRatePct.toFixed(1)}% (91-day T-bill) · figures as of {d.asOf} · scales are vendor-suggested
              display domains so fund and category stay comparable.
            </>
          )
        }
      >
        {d && (
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <LegendDot color="var(--mint)" label="Fund" />
              <LegendDot color="var(--ink3)" label="Category average" hollow />
              <span className="ml-auto hidden text-[11px] text-[var(--ink3)] sm:block">bar = fund's edge over the category</span>
            </div>
            <table className="w-full border-collapse">
              <caption className="sr-only">
                Information ratio, Sharpe, Sortino, Jenson's alpha and active return for the fund versus the category average over {period}
              </caption>
              <thead>
                <tr className="border-b border-[var(--line2)]">
                  <th scope="col" className="pb-2 text-left font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--ink3)]">
                    Metric
                  </th>
                  <th scope="col" className="pb-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--ink3)]">
                    <span className="sr-only">Position of fund vs category</span>
                  </th>
                  <th scope="col" className="pb-2 text-right font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--ink3)]">
                    Fund
                  </th>
                  <th scope="col" className="pb-2 text-right font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--ink3)]">
                    Cat. avg
                  </th>
                  <th scope="col" className="hidden pb-2 text-right font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--ink3)] sm:table-cell">
                    Verdict
                  </th>
                </tr>
              </thead>
              <tbody>
                {d.metrics.map((m) => {
                  const better = m.betterWhen === "high" ? m.fund >= m.categoryAvg : m.fund <= m.categoryAvg;
                  const diff = +(m.fund - m.categoryAvg).toFixed(2);
                  const color = better ? "var(--mint)" : "var(--coral)";
                  return (
                    <tr key={m.key} className="border-b border-[var(--line)] transition-colors last:border-0 hover:bg-[rgba(67,217,163,0.04)]">
                      <th scope="row" className="w-[168px] py-4 pr-3 text-left align-middle font-body text-[13px] font-semibold text-[var(--ink)]">
                        <MetricLabel tip={TIPS[m.key]}>{m.label}</MetricLabel>
                      </th>
                      <td className="px-2 py-4 align-middle">
                        <DivergingRow fund={m.fund} categoryAvg={m.categoryAvg} domain={m.domain} unit={m.unit} />
                      </td>
                      <td className="mono py-4 pl-2 text-right align-middle text-[14px] font-bold" style={{ color }}>
                        {fmtVal(m, m.fund)}
                      </td>
                      <td className="mono py-4 pl-3 text-right align-middle text-[13px] text-[var(--ink3)]">{fmtVal(m, m.categoryAvg)}</td>
                      <td className="hidden py-4 pl-3 text-right align-middle sm:table-cell">
                        <span
                          className="mono inline-block rounded-md px-2 py-1 text-[11px] font-bold"
                          style={{ color, background: better ? "rgba(67,217,163,0.1)" : "rgba(240,120,102,0.1)" }}
                        >
                          {diff >= 0 ? "+" : "−"}
                          {Math.abs(diff).toFixed(2)}
                          {m.unit === "pct" ? " pts" : ""}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
