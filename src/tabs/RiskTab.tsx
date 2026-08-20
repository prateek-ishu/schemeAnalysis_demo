import { Gauge, riskTone, ScoreMeter } from "../components/charts";
import { MetricLabel } from "../components/InfoTip";
import { ShieldIcon } from "../components/icons";
import { SectionCard, Tag } from "../components/ui";
import { fundApi } from "../data/api";
import { fmtNum, useFetch, useReveal } from "../lib";
import type { MasterPeriod } from "../types";

const TIPS = {
  score:
    "One number that blends volatility (40%), market sensitivity (40%) and fall-capture (20%) into a 0–10 dial. Higher means a riskier ride.",
  std: "How sharply monthly returns swing around their average, annualised. Higher = a bumpier ride in both directions.",
  beta: "Sensitivity to the reference index. A beta of 1.08 has historically moved 8% more than the index, up or down.",
  capture:
    "Up-capture above 100 means the fund joined more of the rally than its reference; down-capture below 100 means it fell less during drops.",
  weights: "How much each ingredient contributes to the final 0–10 risk score.",
};

const riskWord = (s: number) => (s <= 3.4 ? "Conservative" : s <= 5 ? "Moderate" : s <= 6.6 ? "Elevated" : "Aggressive");

export default function RiskTab({ schemeId, period, globalTick }: { schemeId: string; period: MasterPeriod; globalTick: number }) {
  const [ref, inView] = useReveal<HTMLDivElement>();
  const risk = useFetch(() => fundApi.getRiskMatrix(schemeId, period), [schemeId, period, globalTick]);
  const d = risk.data;
  const fundScore = d?.scores.find((s) => s.entity === "Fund");

  return (
    <div ref={ref} className={`reveal ${inView ? "in" : ""} space-y-5`}>
      <div className="grid gap-5 lg:grid-cols-5">
        {/* hero gauge */}
        <SectionCard
          className="lg:col-span-2"
          title="Fund Risk Score"
          tip={TIPS.score}
          icon={<ShieldIcon size={16} />}
          aside={<Tag tone="mint">{period} window</Tag>}
          status={risk.status}
          error={risk.error}
          onRetry={risk.retry}
          data={risk.data}
          emptyTitle="Risk feed empty"
          emptyHint="The vendor returned no risk statistics for this window. Switch windows or retry in a moment."
          skeletonRows={5}
          footnote={
            d && (
              <>
                Score = {d.weights.stdDev * 100}% × σ + {d.weights.beta * 100}% × β + {d.weights.capture * 100}% × down-capture,
                each normalised to 0–10 by the vendor. {riskWord(fundScore?.total ?? 0)} profile for the {period} window · as of {d.asOf}.
              </>
            )
          }
        >
          {d && fundScore && (
            <div className="flex flex-col items-center">
              <Gauge score={fundScore.total} color={riskTone(fundScore.total)} size={190} caption={`${riskWord(fundScore.total)} risk · lower is calmer`} />
              <div className="mt-5 w-full space-y-3">
                <ScoreMeter score={fundScore.sub.stdDev} color="var(--sky)" label="Volatility contribution (σ)" />
                <ScoreMeter score={fundScore.sub.beta} color="var(--amber)" label="Market sensitivity (β)" />
                <ScoreMeter score={fundScore.sub.capture} color="var(--coral)" label="Fall capture" />
              </div>
            </div>
          )}
        </SectionCard>

        {/* entity comparison */}
        <SectionCard
          className="lg:col-span-3"
          title="Against Benchmark & BSE 500"
          tip="The same 0–10 recipe applied to the fund, its benchmark and the broad market, so you can see whether the extra risk lives inside the fund."
          status={risk.status}
          error={risk.error}
          onRetry={risk.retry}
          data={risk.data}
          emptyTitle="Comparison unavailable"
          emptyHint="No comparative risk scores arrived from the vendor for this window."
          skeletonRows={6}
        >
          {d && (
            <div>
              <div className="flex flex-wrap items-end justify-around gap-6">
                {d.scores.map((s) => (
                  <Gauge key={s.entity} score={s.total} color={riskTone(s.total)} size={138} caption={s.entity} />
                ))}
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {d.scores.map((s) => {
                  const diff = +(s.total - (d.scores[0]?.total ?? 0)).toFixed(1);
                  return (
                    <div key={s.entity} className="rounded-xl border border-[var(--line)] bg-[var(--bg2)] p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-semibold text-[var(--ink2)]">{s.entity}</span>
                        <span className="mono text-[15px] font-bold" style={{ color: riskTone(s.total) }}>
                          {s.total.toFixed(1)}
                        </span>
                      </div>
                      <p className="m-0 mt-1.5 text-[11.5px] leading-relaxed text-[var(--ink3)]">
                        {s.entity === "Fund"
                          ? `${riskWord(s.total)} risk profile over ${period}.`
                          : diff >= 0
                            ? `${diff.toFixed(1)} pts riskier than the fund.`
                            : `${Math.abs(diff).toFixed(1)} pts calmer than the fund.`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {/* raw metrics table */}
      <SectionCard
        title="Risk Ingredients"
        tip={TIPS.weights}
        status={risk.status}
        error={risk.error}
        onRetry={risk.retry}
        data={risk.data}
        emptyTitle="No risk ingredients"
        emptyHint="The vendor feed returned an empty payload for this window."
        skeletonRows={4}
      >
        {d && (
          <div className="-mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
            <table className="data-table min-w-[680px]">
              <caption className="sr-only">
                Standard deviation, beta and capture ratios for fund, benchmark and BSE 500 with weights and normalised sub-scores over {period}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Metric</th>
                  <th scope="col">Weight</th>
                  <th scope="col">Fund</th>
                  <th scope="col">Benchmark</th>
                  <th scope="col">BSE 500</th>
                  <th scope="col">Fund sub-score</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <MetricLabel tip={TIPS.std}>Std. Deviation</MetricLabel>
                  </td>
                  <td className="text-[var(--ink3)]">{Math.round(d.weights.stdDev * 100)}%</td>
                  <td>{fmtNum(d.metrics.fund.stdDevPct, 1)}%</td>
                  <td className="text-[var(--ink2)]">{fmtNum(d.metrics.benchmark.stdDevPct, 1)}%</td>
                  <td className="text-[var(--ink2)]">{fmtNum(d.metrics.bse500.stdDevPct, 1)}%</td>
                  <td>
                    <span className="mono rounded-md bg-[rgba(91,192,232,0.12)] px-2 py-0.5 text-[12px] font-bold text-[var(--sky)]">
                      {fundScore?.sub.stdDev.toFixed(1)}/10
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <MetricLabel tip={TIPS.beta}>Beta</MetricLabel>
                  </td>
                  <td className="text-[var(--ink3)]">{Math.round(d.weights.beta * 100)}%</td>
                  <td>{fmtNum(d.metrics.fund.beta)}</td>
                  <td className="text-[var(--ink2)]">{fmtNum(d.metrics.benchmark.beta)}</td>
                  <td className="text-[var(--ink2)]">{fmtNum(d.metrics.bse500.beta)}</td>
                  <td>
                    <span className="mono rounded-md bg-[rgba(240,180,92,0.12)] px-2 py-0.5 text-[12px] font-bold text-[var(--amber)]">
                      {fundScore?.sub.beta.toFixed(1)}/10
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <MetricLabel tip={TIPS.capture}>Capture Ratio</MetricLabel>
                  </td>
                  <td className="text-[var(--ink3)]">{Math.round(d.weights.capture * 100)}%</td>
                  <td>
                    <span className="text-[var(--mint)]">▲ {fmtNum(d.metrics.fund.upCapture, 0)}</span>
                    <span className="mx-1.5 text-[var(--ink3)]">/</span>
                    <span className="text-[var(--coral)]">▼ {fmtNum(d.metrics.fund.downCapture, 0)}</span>
                  </td>
                  <td className="text-[var(--ink2)]">
                    ▲ {fmtNum(d.metrics.benchmark.upCapture, 0)} / ▼ {fmtNum(d.metrics.benchmark.downCapture, 0)}
                  </td>
                  <td className="text-[var(--ink2)]">▲ 100 / ▼ 100</td>
                  <td>
                    <span className="mono rounded-md bg-[rgba(240,120,102,0.12)] px-2 py-0.5 text-[12px] font-bold text-[var(--coral)]">
                      {fundScore?.sub.capture.toFixed(1)}/10
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
