import type { InsightItem } from "./types";

export const INSIGHT_ICON_MAP: Record<string, string> = {
  trophy: "Trophy",
  trend: "TrendingUp",
  diff: "GitCompareArrows",
  alert: "AlertTriangle",
  pulse: "Activity",
};

export function toneToColor(tone: InsightItem["tone"]): string {
  switch (tone) {
    case "positive":
      return "text-emerald-300";
    case "warning":
      return "text-amber-300";
    case "danger":
      return "text-rose-300";
    default:
      return "text-cyan-300";
  }
}

export function toneToRing(tone: InsightItem["tone"]): string {
  switch (tone) {
    case "positive":
      return "ring-emerald-400/30 bg-emerald-400/10";
    case "warning":
      return "ring-amber-400/30 bg-amber-400/10";
    case "danger":
      return "ring-rose-400/30 bg-rose-400/10";
    default:
      return "ring-cyan-400/30 bg-cyan-400/10";
  }
}
