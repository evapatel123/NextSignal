import type {
  AlertsResponse,
  CalibrationResponse,
  EventDetailResponse,
  EventListResponse,
  HealthResponse,
  InsightItem,
  SourcesResponse,
  SummaryMetrics,
} from "./types";
import { mockApi } from "./mock-data";

const RAW_BASE = process.env.NEXT_PUBLIC_BACKEND_BASE || "/api/backend";

function buildUrl(path: string, params?: Record<string, string | number | undefined | null>): string {
  const url = new URL(`${RAW_BASE}${path}`, typeof window === "undefined" ? "http://localhost" : window.location.origin);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v));
      }
    }
  }
  return typeof window === "undefined" ? `${RAW_BASE}${path}${url.search}` : url.toString();
}

async function request<T>(path: string, params?: Record<string, any>): Promise<T> {
  const url = buildUrl(path, params);
  const res = await fetch(url, { headers: { "content-type": "application/json" } });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}): ${path}`);
  }
  return (await res.json()) as T;
}

async function postRequest<T>(path: string, body?: unknown): Promise<T> {
  const url = buildUrl(path);
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw new Error(`Request failed (${res.status}): ${path}`);
  return (await res.json()) as T;
}

async function withFallback<T>(promise: Promise<T>, fallback: () => Promise<T> | T): Promise<T> {
  try {
    return await promise;
  } catch (err) {
    // Live mode must never disguise a backend outage as real market intelligence.
    if (process.env.NEXT_PUBLIC_ALLOW_DEMO_FALLBACK === "true") {
      if (typeof window !== "undefined") console.warn("NextSignal API unavailable, using demo fixtures:", err);
      return await fallback();
    }
    throw err;
  }
}

export const api = {
  health: () => withFallback(request<HealthResponse>("/health"), mockApi.health),
  sources: () => withFallback(request<SourcesResponse>("/sources"), mockApi.sources),
  events: (params?: Record<string, any>) =>
    withFallback(request<EventListResponse>("/events", params), () => mockApi.events(params)),
  event: (id: string) =>
    withFallback(request<EventDetailResponse>(`/events/${id}`), () => mockApi.event(id)),
  summary: () => withFallback(request<SummaryMetrics>("/metrics/summary"), mockApi.summary),
  insights: () =>
    withFallback(request<{ items: InsightItem[] }>("/metrics/insights"), mockApi.insights),
  calibration: () =>
    withFallback(request<CalibrationResponse>("/metrics/calibration"), mockApi.calibration),
  alerts: (params?: Record<string, any>) =>
    withFallback(request<AlertsResponse>("/alerts", params), () => mockApi.alerts(params)),
  triggerSync: () =>
    withFallback(postRequest<{ started: boolean; job_id: string }>("/admin/sync", { force: true }), async () => ({
      started: true,
      job_id: "mock_job",
    })),
};
