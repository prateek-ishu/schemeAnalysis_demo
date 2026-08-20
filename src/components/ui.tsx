import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { cls, type FetchStatus } from "../lib";
import InfoTip from "./InfoTip";
import { CloseIcon, RefreshIcon } from "./icons";

/* ---------------- segmented control ---------------- */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  dense = false,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
  dense?: boolean;
}) {
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  const n = options.length;
  const onKey = (e: ReactKeyboardEvent) => {
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (idx + 1) % n;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (idx - 1 + n) % n;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    if (next !== null) {
      e.preventDefault();
      onChange(options[next].value);
      const btn = (e.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>(".seg-btn")[next];
      btn?.focus();
    }
  };
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cls("seg", dense ? "max-w-full" : "")} onKeyDown={onKey}>
      <span
        aria-hidden="true"
        className="seg-thumb"
        style={{ width: `calc(${100 / n}% - 8px)`, left: `calc(${(idx * 100) / n}% + 4px)` }}
      />
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            className={cls("seg-btn", dense && "px-2.5 py-1 text-[12px]")}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- chips & deltas ---------------- */
export function Delta({ value, suffix = "%", digits = 2 }: { value: number; suffix?: string; digits?: number }) {
  const pos = value >= 0;
  return (
    <span
      className={cls(
        "mono inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
        pos ? "bg-[rgba(67,217,163,0.12)] text-[var(--mint)]" : "bg-[rgba(240,120,102,0.12)] text-[var(--coral)]"
      )}
    >
      <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
        <path d={pos ? "M4 1 7.4 6.6H0.6Z" : "M4 7 0.6 1.4h6.8Z"} fill="currentColor" />
      </svg>
      {pos ? "+" : "−"}
      {Math.abs(value).toLocaleString("en-IN", { maximumFractionDigits: digits, minimumFractionDigits: digits })}
      {suffix}
    </span>
  );
}

export function Tag({ tone = "mint", children }: { tone?: "mint" | "sky" | "amber" | "coral" | "muted"; children: ReactNode }) {
  const map = {
    mint: "border-[rgba(67,217,163,0.4)] bg-[rgba(67,217,163,0.1)] text-[var(--mint)]",
    sky: "border-[rgba(91,192,232,0.4)] bg-[rgba(91,192,232,0.1)] text-[var(--sky)]",
    amber: "border-[rgba(240,180,92,0.4)] bg-[rgba(240,180,92,0.1)] text-[var(--amber)]",
    coral: "border-[rgba(240,120,102,0.4)] bg-[rgba(240,120,102,0.1)] text-[var(--coral)]",
    muted: "border-[var(--line2)] bg-transparent text-[var(--ink3)]",
  } as const;
  return (
    <span className={cls("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]", map[tone])}>
      {children}
    </span>
  );
}

/* ---------------- section states ---------------- */
export function SectionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-hidden="true" className="space-y-3 p-1">
      <div className="skel h-9 w-2/5" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skel h-7" style={{ width: `${92 - (i % 3) * 12}%` }} />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-[rgba(240,120,102,0.35)] bg-[rgba(240,120,102,0.06)] p-5">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(240,120,102,0.18)] text-[var(--coral)]">
          <CloseIcon size={11} />
        </span>
        <p className="m-0 font-display text-[15px] font-bold text-[var(--coral)]">Feed error</p>
      </div>
      <p className="m-0 text-[13px] leading-relaxed text-[var(--ink2)]">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--line2)] bg-[var(--panel2)] px-3.5 py-1.5 text-[12.5px] font-semibold text-[var(--ink)] transition-all hover:border-[var(--mint)] hover:text-[var(--mint)] active:scale-95"
      >
        <RefreshIcon size={13} /> Retry request
      </button>
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--line2)] bg-[rgba(15,23,18,0.5)] px-6 py-10 text-center">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--ink3)" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
        <ellipse cx="12" cy="6" rx="7.5" ry="3" />
        <path d="M4.5 6v12c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3V6" opacity=".7" />
        <path d="M4.5 12c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3" opacity=".4" />
      </svg>
      <p className="m-0 font-display text-[15px] font-bold text-[var(--ink)]">{title}</p>
      <p className="m-0 max-w-[42ch] text-[12.5px] leading-relaxed text-[var(--ink3)]">{hint}</p>
    </div>
  );
}

/* ---------------- section card ---------------- */
export interface SectionCardProps {
  title: string;
  tip?: string;
  icon?: ReactNode;
  aside?: ReactNode;
  status: FetchStatus;
  error?: string | null;
  onRetry?: () => void;
  data: unknown;
  emptyTitle: string;
  emptyHint: string;
  children: ReactNode;
  skeletonRows?: number;
  className?: string;
  footnote?: ReactNode;
}

export function SectionCard({
  title,
  tip,
  icon,
  aside,
  status,
  error,
  onRetry,
  data,
  emptyTitle,
  emptyHint,
  children,
  skeletonRows = 4,
  className = "",
  footnote,
}: SectionCardProps) {
  return (
    <section className={cls("card flex flex-col p-5 sm:p-6", className)} aria-busy={status === "loading"}>
      <header className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        {icon && (
          <span className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-[var(--line2)] bg-[var(--bg2)] text-[var(--mint)]">
            {icon}
          </span>
        )}
        <h3 className="m-0 font-display text-[17px] font-bold leading-tight">
          {title}
          {tip && (
            <span className="ml-2 inline-flex translate-y-[-1px]">
              <InfoTip tip={tip} label={`About ${title}`} />
            </span>
          )}
        </h3>
        {aside && <div className="ml-auto">{aside}</div>}
      </header>

      <div className="min-h-0 flex-1">
        {status === "loading" ? (
          <SectionSkeleton rows={skeletonRows} />
        ) : status === "error" ? (
          <ErrorState message={error ?? "Unexpected vendor error."} onRetry={onRetry ?? (() => undefined)} />
        ) : data === null || data === undefined ? (
          <EmptyState title={emptyTitle} hint={emptyHint} />
        ) : (
          children
        )}
      </div>

      {footnote && status === "success" && data != null && (
        <footer className="mt-4 border-t border-[var(--line)] pt-3 text-[11.5px] leading-relaxed text-[var(--ink3)]">{footnote}</footer>
      )}
    </section>
  );
}
