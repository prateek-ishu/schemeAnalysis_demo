import { useEffect, useState } from "react";
import { netSim, REFETCH_EVENT } from "../data/api";
import { GearIcon, RefreshIcon } from "./icons";
import { Segmented } from "./ui";

/**
 * Prototype control surface — lets reviewers exercise every per-section
 * state (skeleton / vendor error + retry / empty payload) without touching code.
 */
export default function DemoPanel() {
  const [open, setOpen] = useState(false);
  const [delay, setDelay] = useState<"200" | "600" | "1500">("600");
  const [fail, setFail] = useState<"0" | "100">("0");
  const [empty, setEmpty] = useState<"off" | "on">("off");
  const [, force] = useState(0);

  useEffect(() => {
    netSim.delayMs = Number(delay);
    netSim.failRate = Number(fail);
    netSim.empty = empty === "on";
  }, [delay, fail, empty]);

  const replay = () => window.dispatchEvent(new CustomEvent(REFETCH_EVENT));

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="card w-[290px] p-4" role="region" aria-label="Demo network simulator">
          <p className="eyebrow m-0 mb-3 !text-[9px]">Demo · network simulator</p>
          <div className="space-y-3">
            <div>
              <div className="mb-1.5 text-[11px] font-semibold text-[var(--ink3)]">Latency</div>
              <Segmented
                dense
                ariaLabel="Simulated latency"
                options={[
                  { value: "200", label: "Fast" },
                  { value: "600", label: "Normal" },
                  { value: "1500", label: "Slow" },
                ]}
                value={delay}
                onChange={setDelay}
              />
            </div>
            <div>
              <div className="mb-1.5 text-[11px] font-semibold text-[var(--ink3)]">Vendor failures</div>
              <Segmented
                dense
                ariaLabel="Simulated failures"
                options={[
                  { value: "0", label: "Healthy" },
                  { value: "100", label: "Fail all" },
                ]}
                value={fail}
                onChange={setFail}
              />
            </div>
            <div>
              <div className="mb-1.5 text-[11px] font-semibold text-[var(--ink3)]">Payload</div>
              <Segmented
                dense
                ariaLabel="Simulated empty payload"
                options={[
                  { value: "off", label: "Normal" },
                  { value: "on", label: "Empty" },
                ]}
                value={empty}
                onChange={setEmpty}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                replay();
                force((x) => x + 1);
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[rgba(67,217,163,0.4)] bg-[rgba(67,217,163,0.08)] px-3 py-2 text-[12.5px] font-semibold text-[var(--mint)] transition-all hover:bg-[rgba(67,217,163,0.16)] active:scale-[0.98]"
            >
              <RefreshIcon size={13} /> Refetch every section
            </button>
            <p className="m-0 text-[10.5px] leading-relaxed text-[var(--ink3)]">
              Applies to the next request each section makes — switch the analysis window or hit refetch.
            </p>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close demo network simulator" : "Open demo network simulator"}
        className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--line2)] bg-[#161f19] px-4 font-mono text-[11px] font-semibold tracking-[0.14em] text-[var(--ink2)] shadow-[0_10px_28px_rgba(0,0,0,0.45)] transition-all hover:border-[var(--mint)] hover:text-[var(--mint)] active:scale-95"
      >
        <GearIcon size={14} className={open ? "spin-slow" : ""} />
        {open ? "CLOSE" : "DEMO FEED"}
      </button>
    </div>
  );
}
