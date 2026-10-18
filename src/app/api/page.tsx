"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, PlayCircle, Send } from "lucide-react";

import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiEndpointCard } from "@/components/api-endpoint-card";

const BASE = "/api/backend";

const ENDPOINTS = [
  {
    method: "GET" as const,
    path: `${BASE}/health`,
    summary: "Service health and sync status",
    description: "Returns DB connectivity and the timestamp of the last ingestion job.",
    curl: `curl ${BASE}/health`,
    response: `{
  "status": "ok",
  "db": "connected",
  "last_sync_at": "2026-04-17T12:00:00Z",
  "version": "0.1.0"
}`,
  },
  {
    method: "GET" as const,
    path: `${BASE}/events`,
    summary: "List normalized events",
    description:
      "Paginated list of prediction-market events. Supports filtering by source, category, status, search, minimum edge, and drift.",
    curl: `curl '${BASE}/events?limit=5&category=economics&sort_by=edge_score'`,
    response: `{
  "items": [
    {
      "id": "evt_polymarket_pm-2026-btc-100k-q3",
      "title": "Will Bitcoin close above $120,000 by September 30, 2026?",
      "current_probability": 0.41,
      "adjusted_probability": 0.36,
      "edge_score": 0.32,
      "divergence_score": 0.27,
      "drift_score": 0.61,
      "signal_label": "drifting",
      "source": "polymarket",
      "category": "crypto",
      "status": "active"
    }
  ],
  "page": 1,
  "limit": 5,
  "total": 18
}`,
  },
  {
    method: "GET" as const,
    path: `${BASE}/events/{event_id}`,
    summary: "Event detail with history and platforms",
    description:
      "Full event record, time-series odds history, cross-platform quotes, and related events.",
    curl: `curl ${BASE}/events/evt_polymarket_pm-2026-fed-cut-q2`,
    response: `{
  "event": { "id": "evt_...", "signal_label": "overconfident", "signal_explanation": "..." },
  "history": [
    { "timestamp": "2026-04-01T18:00:00Z", "probability": 0.58, "source": "polymarket" }
  ],
  "platforms": [
    { "source": "polymarket", "probability": 0.62 },
    { "source": "kalshi",     "probability": 0.58 },
    { "source": "metaculus",  "probability": 0.60 }
  ],
  "related_events": [ ... ]
}`,
  },
  {
    method: "GET" as const,
    path: `${BASE}/events/{event_id}/history`,
    summary: "Time-series odds for a single event",
    description: "Returns the raw snapshot history used to compute drift and calibration.",
    curl: `curl ${BASE}/events/evt_.../history`,
    response: `{
  "event_id": "evt_...",
  "points": [
    { "timestamp": "2026-04-01T18:00:00Z", "probability": 0.54, "source": "polymarket" }
  ]
}`,
  },
  {
    method: "GET" as const,
    path: `${BASE}/metrics/summary`,
    summary: "Dashboard summary metrics",
    description: "Total events, active events, average Brier, flagged counts, and more.",
    curl: `curl ${BASE}/metrics/summary`,
    response: `{
  "total_events": 48,
  "active_events": 36,
  "resolved_events": 12,
  "flagged_events": 9,
  "avg_brier_score": 0.18,
  "avg_calibration_error": 0.04
}`,
  },
  {
    method: "GET" as const,
    path: `${BASE}/metrics/calibration`,
    summary: "Calibration and bias analytics",
    description:
      "Reliability curve, bucket scores, and per-source/category Brier and bias aggregates.",
    curl: `curl ${BASE}/metrics/calibration`,
    response: `{
  "overall": { "sample_size": 5, "brier_score": 0.144, "bias": 0.011 },
  "by_source": [
    { "label": "polymarket", "brier_score": 0.118, "bias": 0.075 }
  ],
  "buckets": [ { "bucket": "60-70%", "predicted": 0.65, "observed": 0.71 } ]
}`,
  },
  {
    method: "GET" as const,
    path: `${BASE}/alerts`,
    summary: "Ranked mispricing and divergence alerts",
    description: "Supports filtering by severity, source, and category.",
    curl: `curl '${BASE}/alerts?severity=high&limit=5'`,
    response: `{
  "items": [
    {
      "event_title": "Will Bitcoin close above $120,000 by Sept 30, 2026?",
      "severity": "critical",
      "score": 0.32,
      "reason": "Odds have moved sharply in a short window..."
    }
  ],
  "generated_at": "2026-04-17T12:00:00Z"
}`,
  },
  {
    method: "GET" as const,
    path: `${BASE}/sources`,
    summary: "List tracked data sources",
    description: "Current sync status and last sync timestamp for each supported platform.",
    curl: `curl ${BASE}/sources`,
    response: `{
  "sources": [
    { "name": "polymarket", "status": "ok", "last_sync_at": "..." },
    { "name": "kalshi",     "status": "ok", "last_sync_at": "..." },
    { "name": "metaculus",  "status": "ok", "last_sync_at": "..." }
  ]
}`,
  },
  {
    method: "POST" as const,
    path: `${BASE}/admin/sync`,
    summary: "Trigger a fresh sync",
    description:
      "Re-runs the ingestion pipeline and recomputes all metrics. Safe to call during the demo.",
    curl: `curl -X POST ${BASE}/admin/sync -H 'content-type: application/json' -d '{"force":true}'`,
    response: `{
  "started": true,
  "job_id": "sync_8f2e10c1a4",
  "events_processed": 48,
  "sources_synced": 3
}`,
  },
];

export default function ApiReferencePage() {
  return (
    <div className="container pt-6 pb-10 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-cyan-300" /> API Reference
        </h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
          No authentication required for the demo. All endpoints return JSON and respect the same
          filter params as the UI. The full backend schema mirrors the SQLAlchemy models on the
          server.
        </p>
      </div>

      <TryItPanel />

      <div className="grid gap-4">
        {ENDPOINTS.map((e) => (
          <ApiEndpointCard key={e.path + e.method} {...e} />
        ))}
      </div>
    </div>
  );
}

function TryItPanel() {
  const [path, setPath] = useState("/metrics/summary");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const url = `${BASE}${path.startsWith("/") ? path : "/" + path}`;
      const res = await fetch(url);
      const text = await res.text();
      try {
        setResult(JSON.stringify(JSON.parse(text), null, 2));
      } catch {
        setResult(text);
      }
    } catch (err: any) {
      setResult(`Error: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="h-4 w-4 text-fuchsia-300" /> Try it
        </CardTitle>
        <CardDescription>
          Hit the live backend directly from the browser. No auth, no setup — just pick an endpoint.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <div className="flex items-center rounded-md border border-border/60 bg-background/40 px-2 text-xs text-muted-foreground font-mono">
            {BASE}
          </div>
          <Input value={path} onChange={(e) => setPath(e.target.value)} className="flex-1 font-mono text-xs" />
          <Button onClick={run} disabled={loading}>
            <Send className="h-3.5 w-3.5" />
            {loading ? "Running" : "Send"}
          </Button>
        </div>
        {result && (
          <pre className="max-h-[360px] overflow-auto rounded-lg border border-border/50 bg-background/80 p-4 text-xs font-mono scrollbar-thin">
            {result}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}
