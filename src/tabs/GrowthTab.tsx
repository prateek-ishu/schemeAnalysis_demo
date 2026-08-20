import { Gauge, HBarList, oppTone, ScoreMeter, useGrow } from "../components/charts";
import { MetricLabel } from "../components/InfoTip";
import { LockIcon, SproutIcon } from "../components/icons";
import { Delta, SectionCard, Tag } from "../components/ui";
import { fundApi } from "../data/api";
import { fmtCr, fmtNum, useFetch, useReveal } from "../lib";

const TIPS = {
  score:
    "A 0–10 gauge of how much valuation headroom the portfolio has: PEG 40%, PE 20%, PB 20%, AUM 20%. Higher means cheaper growth and more room to run.",
  peg: "Price/earnings divided by expected earnings growth. Below 1.0 suggests growth that the market hasn't fully priced in yet.",
  pe: "Price paid for every ₹1 of portfolio earnings. Lower than the market means cheaper on an earnings basis.",
  pb: "Price relative to the book value of holdings. Lower means paying less for each ₹1 of underlying net assets.",
  aum: "Fund size. Smaller funds can enter and exit positions more easily; very large AUM can be a drag on flexibility.",
  holdings:
    "Where the money actually sits today. This is a point-in-time snapshot of the portfolio, refreshed monthly — it deliberately ignores the analysis window.",
  sectors: "How the fund's assets are split across sectors right now. Concentration here tells you what the manager is betting on.",
  top5: "The five largest stock positions by share of net assets, with today's price move.",
};

export default function GrowthTab({ schemeId, globalTick }: { schemeId: string; globalTick: number }) {
  const [ref, inView] = useReveal<HTMLDivElement>();
  const grown = useGrow();
  // NOTE: no `period` dependency — this tab is a point-in-time snapshot.
  const growth = useFetch(() => fundApi.getGrowthSnapshot(schemeId), [schemeId, globalTick]);
  const d = growth.data;

  return (
    <div ref={ref} className={`reveal ${inView ? "in" : ""} space-y-5`}>
      <div className="grid gap-5 lg:grid-cols-5">
        {/* opportunity gauge */}
        <SectionCard
          className="lg:col-span-2"
          title="Growth Opportunity Score"
          tip={TIPS.score}
          icon={<SproutIcon size={16} />}
          aside={
            <Tag tone="sky">
              <LockIcon size={11} /> snapshot · window-proof
            </Tag>
          }
          status={growth.status}
          error={growth.error}
          onRetry={growth.retry}
          data={growth.data}
          emptyTitle="Snapshot not published"
          emptyHint="The vendor has not released this month's growth snapshot yet. Nothing to show until the next publish cycle."
          skeletonRows={5}
          footnote={
            d && (
              <>
                Score = 40% PEG + 20% PE + 20% PB + 20% AUM, each normalised 0–10 · portfolio as of <strong>{d.asOf}</strong> · switching
                the 3Y–10Y window above leaves this tab untouched by design.
              </>
            )
          }
        >
          {d && (
            <div className="flex flex-col items-center">
              <Gauge
                score={d.scores.fund}
                color={oppTone(d.scores.fund)}
                size={190}
                caption={d.scores.fund >= 6.6 ? "Attractive headroom" : d.scores.fund >= 3.4 ? "Fair value zone" : "Rich valuations"}
              />
              <div className="mt-5 w-full space-y-3">
                <ScoreMeter score={d.sub.peg.fund} color="var(--mint)" label={`PEG · weight 40%`} />
                <ScoreMeter score={d.sub.pe.fund} color="var(--mint)" label={`PE · weight 20%`} />
                <ScoreMeter score={d.sub.pb.fund} color="var(--mint)" label={`PB · weight 20%`} />
                <ScoreMeter score={d.sub.aum.fund} color="var(--mint)" label={`AUM headroom · weight 20%`} />
              </div>
            </div>
          )}
        </SectionCard>

        {/* valuation comparison */}
        <SectionCard
          className="lg:col-span-3"
          title="Valuation vs Market"
          tip="Raw valuation readings for the fund's portfolio, its benchmark and the broad market, with the weight each one carries in the opportunity score."
          status={growth.status}
          error={growth.error}
          onRetry={growth.retry}
          data={growth.data}
          emptyTitle="No valuation data"
          emptyHint="The snapshot payload arrived empty. Try the refetch button in the demo panel."
          skeletonRows={6}
        >
          {d && (
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                {(["fund", "benchmark", "bse500"] as const).map((k) => (
                  <div key={k} className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--bg2)] px-3 py-1.5">
                    <span className="text-[11.5px] font-semibold text-[var(--ink2)]">
                      {k === "fund" ? "Fund" : k === "benchmark" ? "Benchmark" : "BSE 500"}
                    </span>
                    <span className="mono text-[16px] font-bold" style={{ color: oppTone(d.scores[k]) }}>
                      {d.scores[k].toFixed(1)}
                    </span>
                  </div>
                ))}
                <span className="text-[11px] text-[var(--ink3)]">/ 10 opportunity</span>
              </div>
              <div className="-mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
                <table className="data-table min-w-[560px]">
                  <caption className="sr-only">PEG, PE, PB and AUM for fund, benchmark and BSE 500 with weights</caption>
                  <thead>
                    <tr>
                      <th scope="col">Metric</th>
                      <th scope="col">Weight</th>
                      <th scope="col">Fund</th>
                      <th scope="col">Benchmark</th>
                      <th scope="col">BSE 500</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <MetricLabel tip={TIPS.peg}>PEG Ratio</MetricLabel>
                      </td>
                      <td className="text-[var(--ink3)]">40%</td>
                      <td className="text-[var(--mint)]">{fmtNum(d.raw.peg.fund ?? NaN)}</td>
                      <td className="text-[var(--ink2)]">{fmtNum(d.raw.peg.benchmark ?? NaN)}</td>
                      <td className="text-[var(--ink2)]">{fmtNum(d.raw.peg.bse500 ?? NaN)}</td>
                    </tr>
                    <tr>
                      <td>
                        <MetricLabel tip={TIPS.pe}>Price / Earnings</MetricLabel>
                      </td>
                      <td className="text-[var(--ink3)]">20%</td>
                      <td className="text-[var(--mint)]">{fmtNum(d.raw.pe.fund ?? NaN, 1)}×</td>
                      <td className="text-[var(--ink2)]">{fmtNum(d.raw.pe.benchmark ?? NaN, 1)}×</td>
                      <td className="text-[var(--ink2)]">{fmtNum(d.raw.pe.bse500 ?? NaN, 1)}×</td>
                    </tr>
                    <tr>
                      <td>
                        <MetricLabel tip={TIPS.pb}>Price / Book</MetricLabel>
                      </td>
                      <td className="text-[var(--ink3)]">20%</td>
                      <td className="text-[var(--mint)]">{fmtNum(d.raw.pb.fund ?? NaN, 1)}×</td>
                      <td className="text-[var(--ink2)]">{fmtNum(d.raw.pb.benchmark ?? NaN, 1)}×</td>
                      <td className="text-[var(--ink2)]">{fmtNum(d.raw.pb.bse500 ?? NaN, 1)}×</td>
                    </tr>
                    <tr>
                      <td>
                        <MetricLabel tip={TIPS.aum}>AUM</MetricLabel>
                      </td>
                      <td className="text-[var(--ink3)]">20%</td>
                      <td>{d.raw.aumCr.fund !== null ? fmtCr(d.raw.aumCr.fund) : "—"}</td>
                      <td className="text-[var(--ink3)]">index · n/a</td>
                      <td className="text-[var(--ink3)]">index · n/a</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="m-0 mt-3 text-[11.5px] leading-relaxed text-[var(--ink3)]">
                Indices carry no AUM, so their size score uses a neutral breadth proxy (5.0/10). Fund PEG below 1.0 — growth is priced in
                with room to spare.
              </p>
            </div>
          )}
        </SectionCard>
      </div>

      {/* current holdings — point in time */}
      <SectionCard
        title="Current Holding"
        tip={TIPS.holdings}
        icon={<LockIcon size={15} />}
        aside={d && <Tag tone="muted">as of {d.asOf}</Tag>}
        status={growth.status}
        error={growth.error}
        onRetry={growth.retry}
        data={growth.data}
        emptyTitle="Portfolio snapshot missing"
        emptyHint="The monthly holdings disclosure has not arrived from the vendor. The rest of the tab works off the last published file."
        skeletonRows={8}
      >
        {d && (
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h4 className="mb-3 mt-0 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[var(--ink3)]">
                <MetricLabel tip={TIPS.sectors}>Sector allocation</MetricLabel>
              </h4>
              <HBarList items={d.sectors} animateKey={d.asOf} />
            </div>
            <div>
              <h4 className="mb-3 mt-0 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[var(--ink3)]">
                <MetricLabel tip={TIPS.top5}>Top 5 holdings</MetricLabel>
              </h4>
              <ul className="m-0 list-none space-y-2 p-0">
                {d.topHoldings.map((h, i) => (
                  <li
                    key={h.name}
                    className="group flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--bg2)] px-3.5 py-2.5 transition-all hover:border-[var(--line2)] hover:bg-[#152019]"
                  >
                    <span className="mono w-5 text-center text-[13px] font-bold text-[var(--ink3)]">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-[var(--ink)]">{h.name}</span>
                      <span className="mt-1 block h-1 overflow-hidden rounded-full bg-[#1a2620]">
                        <span
                          className="block h-full rounded-full bg-[linear-gradient(90deg,var(--mint),var(--sky))]"
                          style={{ width: grown ? `${(h.pctAum / d.topHoldings[0].pctAum) * 100}%` : "0%", transition: "width 0.8s ease", transitionDelay: `${i * 70}ms` }}
                        />
                      </span>
                    </span>
                    <span className="mono text-[13px] font-bold text-[var(--ink)]">{h.pctAum.toFixed(1)}%</span>
                    <Delta value={h.dayChangePct} />
                  </li>
                ))}
              </ul>
              <p className="m-0 mt-3 text-[11.5px] leading-relaxed text-[var(--ink3)]">
                Top 5 = {fmtNum(d.topHoldings.reduce((s, h) => s + h.pctAum, 0), 1)}% of net assets · day moves as of market close.
              </p>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
