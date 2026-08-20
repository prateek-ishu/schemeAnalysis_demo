import type { ReactNode } from "react";
import type { SchemeHeader as THeader } from "../types";
import { fmtCr, fmtPct, useReveal } from "../lib";
import { RangeBar, Sparkline } from "./charts";
import { MedalIcon } from "./icons";
import { Delta, Tag } from "./ui";

function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="eyebrow !text-[9.5px]">{label}</div>
      <div className="mono mt-1 truncate text-[15px] font-semibold text-[var(--ink)]">{value}</div>
      {sub && <div className="mt-0.5 text-[11.5px] text-[var(--ink3)]">{sub}</div>}
    </div>
  );
}

export default function SchemeHeader({ data }: { data: THeader }) {
  const [ref, inView] = useReveal<HTMLDivElement>();
  const q = data.currentQuartile;
  return (
    <div ref={ref} className={`reveal ${inView ? "in" : ""}`}>
      <div className="mx-auto grid max-w-[1200px] gap-6 px-4 pb-7 pt-8 sm:px-6 lg:grid-cols-[1fr_340px] lg:items-end">
        {/* masthead */}
        <div>
          <div className="eyebrow mb-2.5">Equity · {data.category} · Open-ended</div>
          <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
            <h1 className="font-display m-0 text-[clamp(28px,4.2vw,46px)] font-extrabold leading-[1.04] tracking-[-0.02em]">
              {data.name}
            </h1>
            <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg border border-[rgba(67,217,163,0.45)] bg-[rgba(67,217,163,0.12)] px-2.5 py-1 font-mono text-[11px] font-bold tracking-[0.12em] text-[var(--mint)]">
              <MedalIcon size={13} /> Q{q} · TOP QUARTILE
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="chip">{data.plan}</span>
            <span className="chip">{data.category}</span>
            <span className="chip mono">ISIN MER019DG</span>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="AUM" value={fmtCr(data.aumCr)} />
            <Stat label="Benchmark" value={<span className="text-[13px]">{data.benchmark}</span>} sub={`vs ${data.bse500}`} />
            <Stat label="Inception" value={<span className="text-[13px]">{data.inception}</span>} />
            <Stat label="Expense ratio" value={`${data.expenseRatioPct.toFixed(2)}%`} />
            <Stat label="Exit load" value={<span className="text-[12px]">{data.exitLoad}</span>} />
            <Stat label="NAV date" value={<span className="text-[13px]">{data.navDate}</span>} />
          </dl>
        </div>

        {/* live NAV card */}
        <aside className="card card-hover p-4" aria-label="Latest NAV">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="eyebrow !text-[9.5px]">NAV · {data.plan.split("·")[1]?.trim() ?? "Growth"}</div>
              <div className="mt-1 flex items-baseline gap-2.5">
                <span className="mono text-[30px] font-bold leading-none text-[var(--ink)]">₹{data.nav.toFixed(2)}</span>
                <Delta value={data.navChangePct} />
              </div>
            </div>
            <Tag tone={data.navChangePct >= 0 ? "mint" : "coral"}>{fmtPct(data.navChangePct, 2, true)} day</Tag>
          </div>
          <div className="mt-3">
            <Sparkline points={data.navSeries.map((p) => p.value)} height={54} />
          </div>
          <div className="mt-3">
            <RangeBar low={data.low52w} high={data.high52w} value={data.nav} />
          </div>
        </aside>
      </div>
    </div>
  );
}
