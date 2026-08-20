import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size = 16) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const TrendIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M3 17.5 8.5 11l3.5 3.5L20.5 5" />
    <path d="M15 5h5.5V10.5" />
    <path d="M3 21h18" opacity=".45" />
  </svg>
);

export const ShieldIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 3 5 5.6v6c0 4.4 3 7.6 7 9.4 4-1.8 7-5 7-9.4v-6L12 3Z" />
    <path d="M8.6 12l2.3 2.3 4.5-4.6" />
  </svg>
);

export const ScaleIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 4v16M7 20h10" />
    <path d="M12 6.5 6 8m6-1.5L18 8" />
    <path d="M3.5 13.5 6 8l2.5 5.5a2.9 2.9 0 0 1-5 0ZM15.5 13.5 18 8l2.5 5.5a2.9 2.9 0 0 1-5 0Z" />
  </svg>
);

export const SproutIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 21v-8" />
    <path d="M12 13c0-3.8 2.8-6.5 7-6.5 0 4.3-2.7 7-7 6.5Z" />
    <path d="M12 10.5C12 7.5 9.8 5 5.5 5 5.5 8.8 8 11 12 10.5Z" />
    <path d="M6 21h12" opacity=".45" />
  </svg>
);

export const InfoGlyph = ({ size, ...p }: P) => (
  <svg width={size ?? 10} height={size ?? 10} viewBox="0 0 12 12" fill="currentColor" {...p}>
    <circle cx="6" cy="2.6" r="1.15" />
    <rect x="5" y="4.8" width="2" height="5.4" rx="1" />
  </svg>
);

export const CloseIcon = ({ size, ...p }: P) => (
  <svg {...base(size ?? 12)} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const RefreshIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M20 12a8 8 0 1 1-2.34-5.66" />
    <path d="M20 3v4h-4" />
  </svg>
);

export const GearIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.8v2.6M12 18.6v2.6M4.5 7.5l2.2 1.3M17.3 15.2l2.2 1.3M2.8 12h2.6M18.6 12h2.6M4.5 16.5l2.2-1.3M17.3 8.8l2.2-1.3" />
  </svg>
);

export const LockIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    <circle cx="12" cy="15.2" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);

export const MedalIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="14.5" r="5" />
    <path d="m9.5 13.8 1.8 1.8 3.4-3.4" />
    <path d="M8.5 10 5 3h5l2 4 2-4h5l-3.5 7" />
  </svg>
);

export const PulseIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M2.5 12h4l2.5-6.5L13.5 18l2.5-6h5.5" />
  </svg>
);

export const DiamondIcon = ({ size, ...p }: P) => (
  <svg width={size ?? 10} height={size ?? 10} viewBox="0 0 10 10" fill="currentColor" {...p}>
    <rect x="1.8" y="1.8" width="6.4" height="6.4" rx="1" transform="rotate(45 5 5)" />
  </svg>
);
