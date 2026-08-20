import { ticker } from "../data/mock";
import { fmtNum } from "../lib";
import { DiamondIcon } from "./icons";

function TapeItem({ label, value, changePct }: { label: string; value: number; changePct: number }) {
  const up = changePct >= 0;
  const isVix = label.includes("VIX");
  const good = isVix ? !up : up;
  return (
    <span className="mono inline-flex items-center gap-2 whitespace-nowrap text-[11.5px]">
      <span className="font-semibold tracking-[0.08em] text-[var(--ink3)]">{label}</span>
      <span className="font-semibold text-[var(--ink)]">{fmtNum(value)}</span>
      <span className={good ? "text-[var(--mint)]" : "text-[var(--coral)]"}>
        {up ? "▲" : "▼"} {Math.abs(changePct).toFixed(2)}%
      </span>
    </span>
  );
}

export default function TopBar() {
  return (
    <div className="border-b border-[var(--line)] bg-[rgba(12,18,15,0.85)]">
      <div className="mx-auto flex max-w-[1200px] items-center gap-5 px-4 py-2.5 sm:px-6">
        <a href="#top" className="flex flex-none items-center gap-2.5 no-underline">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[linear-gradient(140deg,var(--mint),#1e8f68)] text-[#08130e]">
            <DiamondIcon size={13} />
          </span>
          <span className="leading-none">
            <span className="font-display block text-[15px] font-extrabold tracking-tight text-[var(--ink)]">Meridian MF</span>
            <span className="eyebrow block !text-[8.5px] !tracking-[0.3em]">Research Terminal</span>
          </span>
        </a>

        <div className="marquee min-w-0 flex-1" aria-label="Market tape">
          <div className="marquee-track py-0.5">
            {[0, 1].map((dup) => (
              <span key={dup} className="flex gap-[34px]" aria-hidden={dup === 1}>
                {ticker.map((t) => (
                  <TapeItem key={`${dup}-${t.label}`} {...t} />
                ))}
              </span>
            ))}
          </div>
        </div>

        <span className="hidden flex-none items-center gap-2 sm:inline-flex">
          <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-[var(--mint)]" />
          <span className="mono text-[10.5px] font-semibold tracking-[0.18em] text-[var(--ink3)]">LIVE · NSE</span>
        </span>
      </div>
    </div>
  );
}
