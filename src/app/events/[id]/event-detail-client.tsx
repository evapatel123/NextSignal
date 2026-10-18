"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpRight,
  Clock,
  Copy,
  GitCompareArrows,
  Info,
  Layers,
  LineChart as LineIcon,
  Lightbulb,
  Scale,
  Share2,
} from "lucide-react";

import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { fmtDate, fmtPct, fmtShortNum, fmtSigned } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventSummaryCard } from "@/components/event-summary-card";
import { ProbabilityChart } from "@/components/probability-chart";
import { DivergenceChart } from "@/components/divergence-chart";
import { SignalGauge } from "@/components/signal-gauge";
import { SourceBadge } from "@/components/source-badge";
import { SignalChip } from "@/components/status-chip";
import { ChartSkeleton, MetricSkeleton } from "@/components/loading-skeleton";

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const query = useQuery({
    queryKey: qk.event(id),
    queryFn: () => api.event(id),
    enabled: Boolean(id),
  });

  const data = query.data;

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="container pt-5 pb-10">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Button>
        <Button variant="outline" size="sm" onClick={handleShare}>
          <Share2 className="h-3.5 w-3.5" /> Copy link
        </Button>
      </div>

      {query.isLoading || !data ? (
        <div className="space-y-4">
          <MetricSkeleton />
          <ChartSkeleton height={320} />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <EventSummaryCard event={data.event} />

            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <LineIcon className="h-4 w-4 text-cyan-300" /> Odds history
                  </CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {data.history.length} snapshots over the lifetime of the market. Dashed line shows
                    our calibrated estimate; faded line is today’s market quote.
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <ProbabilityChart
                  points={data.history}
                  adjusted={data.event.adjusted_probability}
                  market={data.event.current_probability}
                  height={340}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-fuchsia-300" /> Platform comparison
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Latest quotes from every platform tracking this event, alongside our adjusted
                  estimate.
                </p>
              </CardHeader>
              <CardContent>
                {data.platforms.length > 0 ? (
                  <DivergenceChart
                    platforms={data.platforms}
                    adjusted={data.event.adjusted_probability}
                    height={Math.max(160, 40 + data.platforms.length * 40)}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Only one platform currently tracks this event.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-300" /> Signal explanation
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Human-readable summary of why the engine flagged (or didn’t flag) this event.
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <SignalGauge
                    value={data.event.edge_score}
                    label="Edge score"
                    tone={
                      data.event.edge_score > 0.45
                        ? "danger"
                        : data.event.edge_score > 0.25
                          ? "warning"
                          : "neutral"
                    }
                  />
                  <div className="flex-1 space-y-3">
                    <SignalChip label={data.event.signal_label} />
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {data.event.signal_explanation}
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <Stat label="Drift" value={data.event.drift_score.toFixed(2)} />
                      <Stat label="Divergence" value={data.event.divergence_score.toFixed(2)} />
                      <Stat
                        label="Δ adj vs mkt"
                        value={`${fmtSigned((data.event.adjusted_probability - data.event.current_probability) * 100, 1)}%`}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-cyan-300" /> Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Row label="Resolution">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {fmtDate(data.event.resolution_date)}
                  </span>
                </Row>
                <Row label="Status">
                  <Badge variant="muted" className="capitalize">
                    {data.event.status}
                  </Badge>
                </Row>
                <Row label="Category">
                  <Badge variant="muted" className="capitalize">
                    {data.event.category}
                  </Badge>
                </Row>
                <Row label="Volume">${fmtShortNum(data.event.volume)}</Row>
                {data.event.liquidity > 0 && (
                  <Row label="Liquidity">${fmtShortNum(data.event.liquidity)}</Row>
                )}
                <Row label="Brier">{data.event.brier_score.toFixed(3)}</Row>
                <Row label="Calibration err">{data.event.calibration_error.toFixed(3)}</Row>
                {data.event.outcome !== null && (
                  <Row label="Outcome">
                    <Badge variant={data.event.outcome === 1 ? "success" : "danger"}>
                      {data.event.outcome === 1 ? "YES" : "NO"}
                    </Badge>
                  </Row>
                )}
                {data.event.url && (
                  <Link
                    href={data.event.url}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Open on {data.event.source_display} <ArrowUpRight className="h-3 w-3" />
                  </Link>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-emerald-300" /> Raw vs adjusted
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Row label="Market odds">{fmtPct(data.event.current_probability, 1)}</Row>
                <Row label="Adjusted">
                  <span className="text-fuchsia-300 font-medium">
                    {fmtPct(data.event.adjusted_probability, 1)}
                  </span>
                </Row>
                <Row label="Δ adjustment">
                  {fmtSigned((data.event.adjusted_probability - data.event.current_probability) * 100, 1)}%
                </Row>
                <p className="text-[11px] text-muted-foreground leading-relaxed pt-1 border-t border-border/40">
                  The adjustment combines historical category bias, source reliability, sample size,
                  and recent volatility — see the{" "}
                  <Link href="/about" className="underline hover:text-foreground">
                    methodology
                  </Link>
                  .
                </p>
              </CardContent>
            </Card>

            {data.related_events.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitCompareArrows className="h-4 w-4 text-cyan-300" /> Related events
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.related_events.slice(0, 5).map((r) => (
                    <Link
                      key={r.id}
                      href={`/events/${r.id}`}
                      className="block rounded-md border border-border/40 bg-white/[0.02] p-3 hover:bg-white/[0.05] transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm line-clamp-1">{r.title}</span>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {fmtPct(r.current_probability, 0)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <SourceBadge name={r.source} display={r.source_display} compact />
                        <span className="text-[11px] text-muted-foreground capitalize">
                          {r.category}
                        </span>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{children}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/40 bg-white/[0.02] py-2 text-center">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}
