import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { CloseIcon, InfoGlyph } from "./icons";

interface InfoTipProps {
  /** Plain-language explanation, 1–2 sentences. */
  tip: string;
  label: string; // e.g. "About Sharpe Ratio" — read by screen readers
}

interface TipPos {
  top: number;
  left: number;
  below: boolean;
}

const TIP_W = 264;

/**
 * Dismissible, keyboard-friendly metric explainer.
 * Open with Enter/Space/click · close with Esc, the Dismiss button, clicking away, or scrolling.
 * Rendered with fixed positioning so it never gets clipped by scroll containers.
 */
export default function InfoTip({ tip, label }: InfoTipProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<TipPos | null>(null);
  const id = useId();
  const wrapRef = useRef<HTMLSpanElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const close = useCallback((refocus = false) => {
    setOpen(false);
    if (refocus) btnRef.current?.focus();
  }, []);

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const below = r.top < 200;
      const left = Math.min(Math.max(12, r.left + r.width / 2 - TIP_W / 2), window.innerWidth - TIP_W - 12);
      setPos({ top: below ? r.bottom + 8 : r.top - 8, left, below });
    }
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close(true);
      }
    };
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) close();
    };
    const onScroll = () => close();
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, close]);

  return (
    <span ref={wrapRef} className="relative inline-flex items-center">
      <button
        ref={btnRef}
        type="button"
        className="info-btn"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={toggle}
      >
        <InfoGlyph size={9} />
      </button>
      {open && pos && (
        <div
          id={id}
          role="tooltip"
          className="tip-pop"
          style={{
            top: pos.top,
            left: pos.left,
            transform: pos.below ? undefined : "translateY(-100%)",
          }}
        >
          <p className="m-0 text-[12.5px] leading-snug text-[var(--ink2)]">{tip}</p>
          <button
            type="button"
            onClick={() => close(true)}
            className="mt-2 inline-flex items-center gap-1 rounded-md border border-[var(--line2)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[var(--ink3)] transition-colors hover:border-[var(--mint)] hover:text-[var(--mint)]"
          >
            <CloseIcon size={9} /> Dismiss
          </button>
        </div>
      )}
    </span>
  );
}

/** Metric label + info button, the workhorse pair used across every section. */
export function MetricLabel({ children, tip, className = "" }: { children: ReactNode; tip: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span>{children}</span>
      <InfoTip tip={tip} label={`About ${typeof children === "string" ? children : "this metric"}`} />
    </span>
  );
}
