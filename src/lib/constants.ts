export const APP_NAME = "NextSignal";
export const APP_TAGLINE = "Live prediction-market intelligence";
export const APP_DESCRIPTION =
  "Calibration, bias, drift, and mispricing signals across Polymarket, Kalshi, and Metaculus.";

export const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/events", label: "Events" },
  { href: "/calibration", label: "Calibration" },
  { href: "/alerts", label: "Alerts" },
  { href: "/api", label: "API" },
  { href: "/about", label: "About" },
];

export const SOURCE_COLORS: Record<string, string> = {
  polymarket: "#22d3ee",
  kalshi: "#3b82f6",
  metaculus: "#10b981",
  unknown: "#94a3b8",
};

export const SIGNAL_COLOR: Record<string, string> = {
  neutral: "hsl(var(--signal-neutral))",
  underpriced: "hsl(var(--signal-positive))",
  overconfident: "hsl(var(--signal-warning))",
  divergent: "hsl(var(--signal-warning))",
  drifting: "hsl(var(--signal-warning))",
  flagged: "hsl(var(--signal-danger))",
};

export const SEVERITY_COLOR: Record<string, string> = {
  low: "hsl(var(--signal-neutral))",
  medium: "hsl(var(--signal-warning))",
  high: "hsl(var(--signal-warning))",
  critical: "hsl(var(--signal-danger))",
};

export const CATEGORIES = [
  "politics",
  "economics",
  "crypto",
  "sports",
  "geopolitics",
  "technology",
  "other",
];

export const STATUSES = ["active", "resolved", "closed"];
