import { useEffect, useId, useState } from "react";
import { cls, useCountUp, useReducedMotion } from "../lib";

/** flips true one frame after mount — drives grow-in animations */
export function useGrow() {
  const reduced = useReducedMotion();
  const [grown, setGrown] = useState(reduced);
  useEffect(() => {
    if (reduced) return;
    const raf = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(raf);
  }, [reduced]);
  return grown;
}

/* ---------------- sparkline / area ---------------- */
export function Sparkline({
  points,
  height = 56,
  stroke = "var(--mint)",
  fill = true,
  strokeWidth = 1.8,
}: {
  points: number[];
  height?: number;
  stroke?: string;
  fill?: boolean;
  strokeWidth?: number;
}) {
  const gid = useId().replace(/[:]/g, "");
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const W = 100;
  const H = 40;
  const px = (i: number) => (i / (points.length - 1)) * W;
  const py = (v: number) => H - 4 - ((v - min) / span) * (H - 8);
  const line = points.map((v, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(2)},${py(v).toFixed(2)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height }} aria-hidden="true">
      {fill && (
        <>
          <defs>
            <linearGradient id={`g${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#g${gid})`} />
        </>
      )}
      <path d={line} fill="none" stroke={stroke} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" className="draw-path" style={{ ["--dash" as string]: 320 }} />
      <circle cx={px(points.length - 1)} cy={py(points[points.length - 1])} r="2.4" fill={stroke} />
    </svg>
  );
}

/* ---------------- quartile band ---------------- */
const Q_COLORS = ["var(--mint)", "var(--sky)", "var(--amber)", "var(--coral)"];
const Q_LABELS = ["Q1 · Top 25%", "Q2", "Q3", "Q4 · Bottom 25%"];

export function QuartileBand({ percentile, rank, peers }: { percentile: number; rank: number; peers: number }) {
  const left = Math.min(97, Math.max(3, percentile));
  return (
    <div>
      <div className="relative mb-6 mt-7">
        <div
          className="absolute -top-6 z-10 transition-[left] duration-700 ease-[cubic-bezier(0.5,1.3,0.4,1)]"
          style={{ left: `${left}%`, transform: "translateX(-50%)" }}
        >
          <span className="mono whitespace-nowrap rounded-md border border-[rgba(67,217,163,0.45)] bg-[#122019] px-2 py-0.5 text-[10.5px] font-semibold text-[var(--mint)] shadow-[0_4px_14px_rgba(0,0,0,0.4)]">
            Rank {rank}/{peers}
          </span>
        </div>
        <div
          className="absolute top-1/2 z-10 h-4 w-4 -translate-y-1/2 rotate-45 rounded-[4px] border-2 border-[#0c120f] bg-[var(--mint)] shadow-[0_0_16px_rgba(67,217,163,0.65)] transition-[left] duration-700 ease-[cubic-bezier(0.5,1.3,0.4,1)]"
          style={{ left: `${left}%`, marginLeft: -8 }}
        />
        <div className="flex h-2.5 overflow-hidden rounded-full ring-1 ring-[var(--line2)]">
          {Q_COLORS.map((c, i) => (
            <div key={i} className="flex-1" style={{ background: c, opacity: 0.42 }} />
          ))}
        </div>
      </div>
      <div className="flex text-[10px] font-semibold uppercase tracking-[0.1em]" aria-hidden="true">
        {Q_LABELS.map((l, i) => (
          <span key={l} className="flex-1" style={{ color: Q_COLORS[i], textAlign: i === 0 ? "left" : i === 3 ? "right" : "center", opacity: 0.85 }}>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------- 0–10 gauge ---------------- */
export function riskTone(score: number) {
  return score <= 3.4 ? "var(--mint)" : score <= 6.6 ? "var(--amber)" : "var(--coral)";
}
export function oppTone(score: number) {
  return score >= 6.6 ? "var(--mint)" : score >= 3.4 ? "var(--amber)" : "var(--coral)";
}

export function Gauge({
  score,
  color,
  size = 168,
  caption,
}: {
  score: number;
  color: string;
  size?: number;
  caption?: string;
}) {
  const R = 50;
  const C = Math.PI * R; // half circumference
  const progress = Math.min(10, Math.max(0, score)) / 10;
  const grown = useGrow();
  const shown = grown ? progress : 0;
  const animated = useCountUp(score);
  const angle = -90 + shown * 180; // needle sweeps from left (-90°) to right (+90°)
  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size }}>
      <svg viewBox="0 0 120 66" style={{ width: size }} aria-hidden="true">
        {[0, 2.5, 5, 7.5, 10].map((t) => {
          const a = Math.PI * (1 - t / 10);
          const x1 = 60 + Math.cos(a) * 57;
          const y1 = 60 - Math.sin(a) * 57;
          const x2 = 60 + Math.cos(a) * (t % 5 === 0 ? 52 : 54.5);
          const y2 = 60 - Math.sin(a) * (t % 5 === 0 ? 52 : 54.5);
          return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--line2)" strokeWidth="1.4" strokeLinecap="round" />;
        })}
        <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#1d2a23" strokeWidth="9" strokeLinecap="round" />
        <path
          d="M 10 60 A 50 50 0 0 1 110 60"
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - shown)}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.3,0.9,0.3,1), stroke 0.5s ease", filter: `drop-shadow(0 0 6px ${color}55)` }}
        />
        <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: "60px 60px", transition: "transform 0.9s cubic-bezier(0.3,0.9,0.3,1)" }}>
          <line x1="60" y1="60" x2="60" y2="20" stroke="var(--ink)" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="60" cy="60" r="3.4" fill="var(--ink)" />
        </g>
      </svg>
      <div className="pointer-events-none -mt-7 text-center">
        <div className="mono text-[30px] font-bold leading-none" style={{ color }}>
          {animated.toFixed(1)}
        </div>
        <div className="mono text-[11px] text-[var(--ink3)]">/ 10</div>
      </div>
      {caption && <div className="mt-1.5 text-center text-[11.5px] font-medium text-[var(--ink2)]">{caption}</div>}
    </div>
  );
}

/* ---------------- horizontal 0–10 meter ---------------- */
export function ScoreMeter({ score, color, label }: { score: number; color: string; label: string }) {
  const grown = useGrow();
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[12px] font-medium text-[var(--ink2)]">{label}</span>
        <span className="mono text-[13px] font-bold" style={{ color }}>
          {score.toFixed(1)}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#1a2620]">
        <div
          className="h-full rounded-full"
          style={{ width: grown ? `${score * 10}%` : "0%", background: color, boxShadow: `0 0 8px ${color}66`, transition: "width 0.9s cubic-bezier(0.3,0.9,0.3,1)" }}
        />
      </div>
    </div>
  );
}

/* ---------------- fund vs category diverging row ---------------- */
export function DivergingRow({
  fund,
  categoryAvg,
  domain,
  unit,
}: {
  fund: number;
  categoryAvg: number;
  domain: [number, number];
  unit: "ratio" | "pct";
}) {
  const [min, max] = domain;
  const pos = (v: number) => Math.min(98, Math.max(2, ((v - min) / (max - min)) * 100));
  const zero = min < 0 && max > 0 ? pos(0) : null;
  const fundPct = pos(fund);
  const catPct = pos(categoryAvg);
  const better = fund >= categoryAvg;
  const color = better ? "var(--mint)" : "var(--coral)";
  const fmt = (v: number) => (unit === "pct" ? `${v.toFixed(2)}%` : v.toFixed(2));
  return (
    <div className="relative h-8">
      {zero !== null && <div className="absolute top-1 h-6 w-px bg-[var(--line2)]" style={{ left: `${zero}%` }} />}
      <div className="absolute left-0 right-0 top-1/2 h-[5px] -translate-y-1/2 rounded-full bg-[#1a2620]" />
      <div
        className="absolute top-1/2 h-[5px] -translate-y-1/2 rounded-full"
        style={{
          left: `${Math.min(fundPct, catPct)}%`,
          width: `${Math.abs(fundPct - catPct)}%`,
          background: color,
          opacity: 0.55,
          transition: "left 0.7s ease, width 0.7s ease",
        }}
      />
      {/* category avg — hollow */}
      <div
        className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--ink3)] bg-[var(--panel)]"
        style={{ left: `${catPct}%`, transition: "left 0.7s ease" }}
        title={`Category average ${fmt(categoryAvg)}`}
      />
      {/* fund — filled */}
      <div
        className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0c120f]"
        style={{ left: `${fundPct}%`, background: color, boxShadow: `0 0 12px ${color}88`, transition: "left 0.7s ease, background 0.4s ease" }}
        title={`Fund ${fmt(fund)}`}
      />
    </div>
  );
}

/* ---------------- animated horizontal bars (sectors) ---------------- */
export function HBarList({ items, animateKey }: { items: { name: string; pct: number }[]; animateKey: string }) {
  const max = Math.max(...items.map((i) => i.pct));
  const grown = useGrow();
  return (
    <ul className="m-0 list-none space-y-2.5 p-0" key={animateKey}>
      {items.map((it, i) => (
        <li key={it.name} className="grid grid-cols-[130px_1fr_52px] items-center gap-3 sm:grid-cols-[160px_1fr_56px]">
          <span className="truncate text-[12.5px] text-[var(--ink2)]">{it.name}</span>
          <span className="h-2 overflow-hidden rounded-full bg-[#1a2620]">
            <span
              className="block h-full rounded-full"
              style={{
                width: grown ? `${(it.pct / max) * 100}%` : "0%",
                background: `linear-gradient(90deg, rgba(67,217,163,${0.9 - i * 0.07}), rgba(91,192,232,${0.75 - i * 0.05}))`,
                transition: "width 0.8s cubic-bezier(0.3,0.9,0.3,1)",
                transitionDelay: `${i * 55}ms`,
              }}
            />
          </span>
          <span className="mono text-right text-[12px] font-semibold text-[var(--ink)]">{it.pct.toFixed(1)}%</span>
        </li>
      ))}
    </ul>
  );
}

/* ---------------- 52-week range ---------------- */
export function RangeBar({ low, high, value }: { low: number; high: number; value: number }) {
  const pct = Math.min(100, Math.max(0, ((value - low) / (high - low)) * 100));
  return (
    <div>
      <div className="relative h-1.5 rounded-full bg-[linear-gradient(90deg,rgba(240,120,102,0.7),rgba(240,180,92,0.7),rgba(67,217,163,0.8))]">
        <span
          className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-[#0c120f] bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-[left] duration-700"
          style={{ left: `${pct}%`, marginLeft: -7 }}
        />
      </div>
      <div className="mono mt-1.5 flex justify-between text-[10.5px] text-[var(--ink3)]">
        <span>₹{low.toFixed(2)}</span>
        <span>52-wk range</span>
        <span>₹{high.toFixed(2)}</span>
      </div>
    </div>
  );
}

export function LegendDot({ color, label, hollow = false }: { color: string; label: string; hollow?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[var(--ink3)]">
      <span
        className={cls("inline-block h-2.5 w-2.5 rounded-full", hollow && "bg-[var(--panel)]")}
        style={hollow ? { border: `2px solid ${color}` } : { background: color }}
      />
      {label}
    </span>
  );
}
