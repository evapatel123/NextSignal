export const qk = {
  health: ["health"] as const,
  sources: ["sources"] as const,
  summary: ["summary"] as const,
  insights: ["insights"] as const,
  calibration: ["calibration"] as const,
  events: (params?: Record<string, any>) => ["events", params || {}] as const,
  event: (id: string) => ["event", id] as const,
  alerts: (params?: Record<string, any>) => ["alerts", params || {}] as const,
};
