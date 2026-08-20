# Scheme Analysis — Mutual Fund Research Terminal

A working prototype of a fund scheme analysis page: pre-computed, vendor-shaped metrics with full loading / error / empty handling, accessible tooltips, and a sticky master period filter that drives every dependent section.

## What's on the page

- **Scheme masthead** — name, category, plan type, AUM, benchmark, quartile badge, live NAV card with sparkline + 52-week range.
- **Master filter (sticky)** — `3Y / 5Y / 7Y / 10Y` only. One change re-renders **Quartile Ranking, Trailing / Benchmark / BSE 500 returns, Risk Matrix, and Risk-Adjusted Return** together.
- **Returns tab** — Q1–Q4 ranking band (percentile, peer count, category median) + returns table. Rolling returns run their **own** `1Y / 3Y / 5Y / 10Y` filter, independent of the master window.
- **Risk Matrix tab** — Std. Deviation (40%) + Beta (40%) + Capture Ratio (20%) for Fund / Benchmark / BSE 500, rolled into weighted 0–10 risk scores with animated gauges.
- **Risk-Adjusted tab** — Information Ratio, Sharpe, Sortino, Jenson's Alpha, Active Return — fund vs category average with verdict chips.
- **Growth Opportunity tab** — PEG (40%) / PE (20%) / PB (20%) / AUM (20%) weighted 0–10 score, valuation table, and a **point-in-time** Current Holding block (sector allocation bars + top 5 holdings). Unaffected by the master filter by design.
- Every metric has a plain-language, dismissible info tooltip (Esc / × / click-away / scroll).

## Data layer & the swap-in seam

Nothing risk- or rolling-related is computed client-side — the UI consumes pre-computed payloads, exactly as a vendor API would return them.

| File | Purpose |
| --- | --- |
| `src/types.ts` | Vendor-shaped contracts (`FundDataApi`, `ReturnsBundle`, `RiskBundle`, `GrowthBundle`, …) |
| `src/data/mock.ts` | Deterministic mock dataset (4 periods × 4 sections, rolling history, growth snapshot) |
| `src/data/api.ts` | `fundApi` — the **only** seam. Swap `mockFundApi` for a REST/GraphQL client with the same shapes; nothing else changes. |

## Try the state machine

The floating **DEMO FEED** panel simulates the wire:

- **Latency** — Fast / Normal / Slow (skeletons)
- **Failures** — Healthy / Fail all (error state + retry per section)
- **Payload** — Normal / Empty (empty state per section)
- **Refetch every section** — replay the whole flow

## Run it

```bash
npm install
npm run dev        # local dev server
npm run build      # production build → dist/
```

Stack: React 18 · Vite · TypeScript · Tailwind CSS v4 (hand-rolled SVG charts, no chart library).

## Notes

- Mobile-responsive: tables become horizontally scrollable cards; the master filter stays pinned.
- Accessible: semantic tables, keyboard-navigable tabs & segmented controls (arrow keys), `aria` wiring on tooltips, `role="alert"` errors, `prefers-reduced-motion` respected.
- Deploy `dist/index.html` as a static SPA.
