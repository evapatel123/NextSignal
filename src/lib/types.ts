export type SignalLabel =
  | "neutral"
  | "underpriced"
  | "overconfident"
  | "divergent"
  | "drifting";

export type Severity = "low" | "medium" | "high" | "critical";

export interface SourceOut {
  id: string;
  name: string;
  display_name: string;
  status: string;
  last_sync_at: string | null;
}

export interface SourcesResponse {
  sources: SourceOut[];
}

export interface EventSummary {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  source: string;
  source_display: string;
  current_probability: number;
  adjusted_probability: number;
  edge_score: number;
  divergence_score: number;
  drift_score: number;
  signal_label: SignalLabel | string;
  resolution_date: string | null;
  volume: number;
  liquidity: number;
}

export interface EventDetail extends EventSummary {
  description: string;
  url: string;
  signal_explanation: string;
  brier_score: number;
  calibration_error: number;
  outcome: number | null;
}

export interface OddsPoint {
  timestamp: string;
  probability: number;
  source: string;
}

export interface PlatformQuote {
  source: string;
  source_display: string;
  probability: number;
  last_updated: string;
  volume: number;
}

export interface EventDetailResponse {
  event: EventDetail;
  history: OddsPoint[];
  platforms: PlatformQuote[];
  related_events: EventSummary[];
}

export interface EventListResponse {
  items: EventSummary[];
  page: number;
  limit: number;
  total: number;
}

export interface SummaryMetrics {
  total_events: number;
  active_events: number;
  resolved_events: number;
  flagged_events: number;
  avg_brier_score: number;
  avg_calibration_error: number;
  avg_drift: number;
  avg_divergence: number;
  sources: number;
}

export interface SegmentScore {
  label: string;
  sample_size: number;
  brier_score: number;
  calibration_error: number;
  bias: number;
}

export interface BucketScore {
  bucket: string;
  predicted: number;
  observed: number;
  sample_size: number;
}

export interface CalibrationSummary {
  sample_size: number;
  brier_score: number;
  calibration_error: number;
  bias: number;
  curve: BucketScore[];
}

export interface CalibrationResponse {
  overall: CalibrationSummary;
  by_source: SegmentScore[];
  by_category: SegmentScore[];
  buckets: BucketScore[];
}

export interface AlertItem {
  id: string;
  event_id: string;
  event_title: string;
  event_slug: string;
  source: string;
  category: string;
  alert_type: string;
  severity: Severity | string;
  score: number;
  reason: string;
  edge_score: number;
  drift_score: number;
  divergence_score: number;
  current_probability: number;
  adjusted_probability: number;
  created_at: string;
}

export interface AlertsResponse {
  items: AlertItem[];
  generated_at: string;
}

export interface InsightItem {
  id: string;
  icon: string;
  title: string;
  body: string;
  metric: string;
  tone: "positive" | "warning" | "danger" | "neutral";
}

export interface HealthResponse {
  status: string;
  db: string;
  data_mode: "live" | "demo";
  last_sync_at: string | null;
  version: string;
}

export interface DashboardFilters {
  source?: string;
  category?: string;
  status?: string;
  search?: string;
}
