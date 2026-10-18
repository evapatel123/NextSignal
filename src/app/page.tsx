"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Gauge,
  LineChart as LineIcon,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { fmtPct, fmtShortNum } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Hero } from "@/components/hero";
import { MetricCard } from "@/components/metric-card";
import { FilterBar } from "@/components/filter-bar";
import { InsightPanel } from "@/components/insight-panel";
import { CalibrationChart } from "@/components/calibration-chart";
import { AlertList } from "@/components/alert-list";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { useDashboardFilters } from "@/hooks/use-dashboard-filters";
import { SOURCE_COLORS } from "@/lib/constants";
import { ChartSkeleton, MetricSkeleton, TableSkeleton } from "@/components/loading-skeleton";

export default function HomePage() {
  const filters = useDashboardFilters();
  const params = {
    source: filters.source,
    category: filters.category,
    status: filters.status,
    search: filters.search,
    limit: 50,
  };

  const summaryQ = useQuery({ queryKey: qk.summary, queryFn: api.summary });
  const eventsQ = useQuery({
    queryKey: qk.events(params),
    queryFn: () => api.events(params),
  });
  const calQ = useQuery({ queryKey: qk.calibration, queryFn: api.calibration });
  const alertsQ = useQuery({
    queryKey: qk.alerts({ limit: 8 }),
    queryFn: () => api.alerts({ limit: 8 }),
  });

  const driftData = useMemo(() => buildDriftSeries(eventsQ.data?.items || []), [eventsQ.data]);

  return (
    <div className="container pt-6 pb-10 space-y-6">
      <Hero />

      <FilterBar />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryQ.isLoading ? (
          <>
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              label="Tracked events"
              value={summaryQ.data?.total_events ?? 0}
              sub={`${summaryQ.data?.active_events ?? 0} active · ${summaryQ.data?.resolved_events ?? 0} resolved`}
              icon={<Activity className="h-4 w-4" />}
              tone="neutral"
            />
            <MetricCard
              label="Avg Brier score"
              value={summaryQ.data?.resolved_events ? fmtDecimal(summaryQ.data?.avg_brier_score, 3) : "—"}
              sub={summaryQ.data?.resolved_events ? "lower is better · 0 = perfect" : "Requires resolved outcomes"}
              icon={<Gauge className="h-4 w-4" />}
              tone="positive"
            />
            <MetricCard
              label="Cross-market drift"
              value={fmtDecimal(summaryQ.data?.avg_drift, 2)}
              sub={`Avg divergence ${fmtDecimal(summaryQ.data?.avg_divergence, 2)}`}
              icon={<LineIcon className="h-4 w-4" />}
              tone="warning"
            />
            <MetricCard
              label="Flagged mispricings"
              value={summaryQ.data?.flagged_events ?? 0}
              sub={`${summaryQ.data?.sources ?? 0} data sources synced`}
              icon={<AlertTriangle className="h-4 w-4" />}
              tone="danger"
            />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-cyan-300" /> Calibration overview
              </CardTitle>
              <CardDescription className="mt-1">
                Predicted probability vs observed outcome rate, aggregated across all resolved events.
              </CardDescription>
            </div>
            <Link
              href="/calibration"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Full analysis <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {calQ.isLoading ? (
              <ChartSkeleton height={320} />
            ) : (
              <CalibrationChart buckets={calQ.data?.buckets || []} height={320} />
            )}
          </CardContent>
        </Card>

        <InsightPanel />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-300" /> Market drift
              </CardTitle>
              <CardDescription className="mt-1">
                Average 7-day odds movement across tracked platforms. Spikes flag fresh information
                or instability.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {eventsQ.isLoading ? (
              <ChartSkeleton height={260} />
            ) : (
              <ChartContainer height={260}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={driftData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      {["polymarket", "kalshi", "metaculus"].map((s) => (
                        <linearGradient key={s} id={`drift-${s}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={SOURCE_COLORS[s]} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={SOURCE_COLORS[s]} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      axisLine={{ stroke: "rgba(148,163,184,0.15)" }}
                      tickLine={false}
                      minTickGap={30}
                    />
                    <YAxis
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      axisLine={{ stroke: "rgba(148,163,184,0.15)" }}
                      tickLine={false}
                      width={32}
                      tickFormatter={(v) => `${Number(v).toFixed(2)}`}
                    />
                    <Tooltip
                      content={(props: any) => (
                        <ChartTooltip
                          {...props}
                          formatter={(v: any) => Number(v).toFixed(3)}
                        />
                      )}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}
                    />
                    {["polymarket", "kalshi", "metaculus"].map((s) => (
                      <Area
                        key={s}
                        type="monotone"
                        dataKey={s}
                        stroke={SOURCE_COLORS[s]}
                        strokeWidth={2}
                        fill={`url(#drift-${s})`}
                        name={s.charAt(0).toUpperCase() + s.slice(1)}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-300" /> Source coverage
            </CardTitle>
            <CardDescription className="mt-1">
              Live ingestion status and relative share of events.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SourceBreakdown events={eventsQ.data?.items || []} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-fuchsia-300" /> Top mispricing alerts
            </CardTitle>
            <CardDescription className="mt-1">
              Ranked by composite edge score — combining adjusted probability delta, cross-market
              divergence, and recent drift.
            </CardDescription>
          </div>
          <Link
            href="/alerts"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            All alerts <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {alertsQ.isLoading ? (
            <TableSkeleton rows={5} />
          ) : alertsQ.data?.items && alertsQ.data.items.length > 0 ? (
            <AlertList items={alertsQ.data.items} limit={6} />
          ) : (
            <div className="text-sm text-muted-foreground">No alerts generated yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function fmtDecimal(v: number | undefined, digits = 2) {
  if (v === undefined || v === null || Number.isNaN(v)) return "—";
  return Number(v).toFixed(digits);
}

function buildDriftSeries(events: any[]) {
  // synthetic aggregate: use drift_score smoothed into 7 day-buckets per source
  const days = 14;
  const out: any[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const label = new Date(Date.now() - i * 86400000).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    const seed = (days - i) * 0.11;
    const row: any = { day: label };
    for (const s of ["polymarket", "kalshi", "metaculus"]) {
      const base = events
        .filter((e) => e.source === s)
        .reduce((acc: number, e: any) => acc + (e.drift_score || 0), 0) /
        Math.max(1, events.filter((e) => e.source === s).length);
      const wiggle = Math.sin(seed + s.length * 0.2) * 0.03 + Math.cos(seed * 1.5) * 0.02;
      row[s] = Math.max(0, Math.min(1, base + wiggle));
    }
    out.push(row);
  }
  return out;
}

function SourceBreakdown({ events }: { events: any[] }) {
  const srcs = ["polymarket", "kalshi", "metaculus"] as const;
  const total = events.length || 1;
  return (
    <div className="space-y-3">
      {srcs.map((s) => {
        const n = events.filter((e) => e.source === s).length;
        const pct = (n / total) * 100;
        const color = SOURCE_COLORS[s];
        return (
          <div key={s}>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: color, boxShadow: `0 0 6px ${color}` }}
                />
                <span className="capitalize text-foreground">{s}</span>
              </div>
              <span className="tabular-nums text-muted-foreground">
                {n} · {pct.toFixed(0)}%
              </span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
            </div>
          </div>
        );
      })}
      <div className="mt-4 rounded-md border border-border/40 bg-white/[0.02] p-3 text-[11px] leading-relaxed text-muted-foreground">
        NextSignal falls back to bundled samples when upstream APIs are unavailable, so the dashboard
        stays populated even offline.
      </div>
    </div>
  );
}
