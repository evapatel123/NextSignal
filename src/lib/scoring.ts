// Frontend mirror of backend scoring helpers, used for static visualization.

export function brierScore(predicted: number, outcome: 0 | 1): number {
  return (predicted - outcome) ** 2;
}

export function severityFromEdge(edge: number): "low" | "medium" | "high" | "critical" {
  if (edge >= 0.65) return "critical";
  if (edge >= 0.45) return "high";
  if (edge >= 0.25) return "medium";
  return "low";
}

export function deltaPct(adjusted: number, market: number): number {
  return (adjusted - market) * 100;
}
