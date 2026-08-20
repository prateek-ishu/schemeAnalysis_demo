import { useCallback, useEffect, useRef, useState } from "react";

/* ---------------- formatters ---------------- */
const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 0 });

export const fmtNum = (v: number, digits = 2) =>
  v.toLocaleString("en-IN", { maximumFractionDigits: digits, minimumFractionDigits: digits });

export const fmtCr = (v: number) => `₹${inr.format(Math.round(v * 10) / 10)} Cr`;

export const fmtPct = (v: number | null, digits = 2, signed = false) => {
  if (v === null || Number.isNaN(v)) return "—";
  const s = signed && v > 0 ? "+" : "";
  return `${s}${fmtNum(v, digits)}%`;
};

export const fmtRatio = (v: number, digits = 2) => fmtNum(v, digits);

export const cls = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

/* ---------------- hooks ---------------- */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export type FetchStatus = "loading" | "error" | "success";
export interface FetchState<T> {
  status: FetchStatus;
  data: T | null;
  error: string | null;
  retry: () => void;
}

/** Small fetch state machine with cancellation; `null` data = vendor returned empty. */
export function useFetch<T>(fetcher: () => Promise<T | null>, deps: unknown[]): FetchState<T> {
  const [state, setState] = useState<{ status: FetchStatus; data: T | null; error: string | null }>({
    status: "loading",
    data: null,
    error: null,
  });
  const [tick, setTick] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let alive = true;
    setState({ status: "loading", data: null, error: null });
    fetcherRef
      .current()
      .then((data) => alive && setState({ status: "success", data, error: null }))
      .catch((e: unknown) => alive && setState({ status: "error", data: null, error: e instanceof Error ? e.message : "Unknown error" }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const retry = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, retry };
}

/** IntersectionObserver reveal — returns [ref, inView]. */
export function useReveal<T extends HTMLElement>(threshold = 0.12) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        });
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

/** Eased count-up that respects prefers-reduced-motion. */
export function useCountUp(target: number, duration = 850) {
  const reduced = useReducedMotion();
  const [val, setVal] = useState(reduced ? target : 0);
  const fromRef = useRef(0);
  useEffect(() => {
    if (reduced) {
      setVal(target);
      return;
    }
    const from = fromRef.current;
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(step);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduced]);
  return val;
}
