import { useCallback, useEffect, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import DemoPanel from "./components/DemoPanel";
import { ScaleIcon, ShieldIcon, SproutIcon, TrendIcon } from "./components/icons";
import SchemeHeader from "./components/SchemeHeader";
import TopBar from "./components/TopBar";
import { ErrorState, Segmented } from "./components/ui";
import { fundApi, REFETCH_EVENT } from "./data/api";
import { SCHEME_ID } from "./data/mock";
import { cls, useFetch } from "./lib";
import type { MasterPeriod } from "./types";
import GrowthTab from "./tabs/GrowthTab";
import ReturnsTab from "./tabs/ReturnsTab";
import RiskAdjustedTab from "./tabs/RiskAdjustedTab";
import RiskTab from "./tabs/RiskTab";

type TabId = "returns" | "risk" | "riskAdj" | "growth";

const PERIODS: { value: MasterPeriod; label: string }[] = [
  { value: "3Y", label: "3Y" },
  { value: "5Y", label: "5Y" },
  { value: "7Y", label: "7Y" },
  { value: "10Y", label: "10Y" },
];

const TABS: { id: TabId; label: string; icon: ReactNode; hint: string }[] = [
  { id: "returns", label: "Returns", icon: <TrendIcon size={14} />, hint: "Quartile ranking & return series" },
  { id: "risk", label: "Risk Matrix", icon: <ShieldIcon size={14} />, hint: "σ · β · capture → 0–10 score" },
  { id: "riskAdj", label: "Risk-Adjusted", icon: <ScaleIcon size={14} />, hint: "IR · Sharpe · Sortino · α" },
  { id: "growth", label: "Growth Opportunity", icon: <SproutIcon size={14} />, hint: "PEG · PE · PB · AUM snapshot" },
];

export default function App() {
  const [period, setPeriod] = useState<MasterPeriod>("5Y");
  const [activeTab, setActiveTab] = useState<TabId>("returns");
  const [opened, setOpened] = useState<Set<TabId>>(() => new Set(["returns"]));
  const [globalTick, setGlobalTick] = useState(0);

  const header = useFetch(() => fundApi.getSchemeHeader(SCHEME_ID), [globalTick]);

  useEffect(() => {
    const onRefetch = () => setGlobalTick((t) => t + 1);
    window.addEventListener(REFETCH_EVENT, onRefetch);
    return () => window.removeEventListener(REFETCH_EVENT, onRefetch);
  }, []);

  const selectTab = useCallback((id: TabId) => {
    setActiveTab(id);
    setOpened((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  const onTabKey = (e: ReactKeyboardEvent) => {
    const idx = TABS.findIndex((t) => t.id === activeTab);
    let next: number | null = null;
    if (e.key === "ArrowRight") next = (idx + 1) % TABS.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TABS.length - 1;
    if (next !== null) {
      e.preventDefault();
      selectTab(TABS[next].id);
      document.getElementById(`tab-${TABS[next].id}`)?.focus();
    }
  };

  return (
    <div id="top" className="min-h-screen">
      {/* ambient layers */}
      <div className="ambient" aria-hidden="true">
        <span className="glow-drift" style={{ top: -180, left: -120, width: 480, height: 480, background: "rgba(67,217,163,0.09)" }} />
        <span
          className="glow-drift"
          style={{ bottom: -200, right: -140, width: 520, height: 520, background: "rgba(240,180,92,0.07)", animationDelay: "-13s" }}
        />
      </div>

      <TopBar />

      {/* ---------- scheme masthead ---------- */}
      {header.status === "loading" ? (
        <div className="mx-auto max-w-[1200px] px-4 pb-7 pt-8 sm:px-6" aria-busy="true">
          <div className="skel h-4 w-52" />
          <div className="skel mt-4 h-12 w-[min(560px,90%)]" />
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skel h-12" />
            ))}
          </div>
        </div>
      ) : header.status === "error" ? (
        <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
          <ErrorState message={header.error ?? "Scheme header failed."} onRetry={header.retry} />
        </div>
      ) : header.data ? (
        <SchemeHeader data={header.data} />
      ) : (
        <div className="mx-auto max-w-[1200px] px-4 py-8 text-center text-[var(--ink3)] sm:px-6">
          Scheme not found in the vendor catalogue.
        </div>
      )}

      {/* ---------- sticky master filter + tabs ---------- */}
      <div className="sticky top-0 z-40 border-y border-[var(--line)] bg-[rgba(12,18,15,0.88)] shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="eyebrow hidden !text-[9.5px] md:block">Analysis window</span>
            <Segmented ariaLabel="Master analysis window — re-renders quartile, returns, risk matrix and risk-adjusted sections" options={PERIODS} value={period} onChange={setPeriod} />
          </div>
          <div role="tablist" aria-label="Scheme analysis sections" className="order-3 -mx-4 flex w-[calc(100%+2rem)] gap-1 overflow-x-auto px-4 pb-0.5 sm:order-none sm:mx-0 sm:w-auto sm:flex-1 sm:justify-end sm:overflow-visible sm:px-0" onKeyDown={onTabKey}>
            {TABS.map((t) => {
              const active = t.id === activeTab;
              const locked = t.id === "growth";
              return (
                <button
                  key={t.id}
                  id={`tab-${t.id}`}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls={`panel-${t.id}`}
                  tabIndex={active ? 0 : -1}
                  title={locked ? `${t.label} — point-in-time snapshot, ignores the window` : t.hint}
                  onClick={() => selectTab(t.id)}
                  className={cls(
                    "relative flex flex-none items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-all",
                    active ? "text-[var(--ink)]" : "text-[var(--ink3)] hover:text-[var(--ink2)]"
                  )}
                >
                  <span className={cls("transition-colors", active ? "text-[var(--mint)]" : "")}>{t.icon}</span>
                  {t.label}
                  {locked && <span className="text-[var(--sky)] opacity-80" aria-hidden="true">·</span>}
                  <span
                    aria-hidden="true"
                    className={cls(
                      "absolute inset-x-2.5 -bottom-[11px] h-[2.5px] rounded-full transition-all duration-300",
                      active ? "bg-[var(--mint)] opacity-100 shadow-[0_0_10px_rgba(67,217,163,0.7)]" : "opacity-0"
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ---------- window status line ---------- */}
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-4 gap-y-1 px-4 pt-5 sm:px-6" aria-live="polite">
        <p className="m-0 text-[12.5px] text-[var(--ink3)]">
          Viewing <strong className="mono text-[var(--mint)]">{period}</strong> analysis — quartile, trailing/benchmark/BSE 500 returns,
          risk matrix and risk-adjusted metrics all refetch together.
        </p>
        <span className="mono ml-auto hidden text-[10.5px] tracking-[0.14em] text-[var(--ink3)] sm:block">
          FEED · PRE-COMPUTED METRICS v2.4
        </span>
      </div>

      {/* ---------- tab panels ---------- */}
      <main className="mx-auto max-w-[1200px] px-4 pb-20 pt-4 sm:px-6">
        {opened.has("returns") && (
          <div role="tabpanel" id="panel-returns" aria-labelledby="tab-returns" tabIndex={0} hidden={activeTab !== "returns"} className="focus-visible:outline-offset-4">
            <ReturnsTab schemeId={SCHEME_ID} period={period} globalTick={globalTick} />
          </div>
        )}
        {opened.has("risk") && (
          <div role="tabpanel" id="panel-risk" aria-labelledby="tab-risk" tabIndex={0} hidden={activeTab !== "risk"} className="focus-visible:outline-offset-4">
            <RiskTab schemeId={SCHEME_ID} period={period} globalTick={globalTick} />
          </div>
        )}
        {opened.has("riskAdj") && (
          <div role="tabpanel" id="panel-riskAdj" aria-labelledby="tab-riskAdj" tabIndex={0} hidden={activeTab !== "riskAdj"} className="focus-visible:outline-offset-4">
            <RiskAdjustedTab schemeId={SCHEME_ID} period={period} globalTick={globalTick} />
          </div>
        )}
        {opened.has("growth") && (
          <div role="tabpanel" id="panel-growth" aria-labelledby="tab-growth" tabIndex={0} hidden={activeTab !== "growth"} className="focus-visible:outline-offset-4">
            <GrowthTab schemeId={SCHEME_ID} globalTick={globalTick} />
          </div>
        )}
      </main>

      {/* ---------- footer ---------- */}
      <footer className="border-t border-[var(--line)] bg-[rgba(12,18,15,0.7)]">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-6 text-[11.5px] text-[var(--ink3)] sm:px-6">
          <span className="mono tracking-[0.14em]">MERIDIAN MF · RESEARCH TERMINAL</span>
          <span>
            All statistics are vendor pre-computed per period — no NAV math runs in the browser. Prototype data; not investment advice.
          </span>
          <span className="mono ml-auto">SCHEME {SCHEME_ID}</span>
        </div>
      </footer>

      <DemoPanel />
    </div>
  );
}
