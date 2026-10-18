"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3, Download, Gauge, Layers, Sparkles } from "lucide-react";

import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalibrationChart } from "@/components/calibration-chart";
import { BrierBreakdownChart } from "@/components/brier-breakdown-chart";
import { MethodologyCallout } from "@/components/methodology-callout";
import { MetricCard } from "@/components/metric-card";
import { ChartSkeleton, MetricSkeleton } from "@/components/loading-skeleton";
import type { SegmentScore } from "@/lib/types";

export default function CalibrationPage() {
  const q = useQuery({ queryKey: qk.calibration, queryFn: api.calibration });

  const handleCsv = () => {
    if (!q.data) return;
    const rows: string[] = ["scope,label,sample_size,brier_score,calibration_error,bias"];
    for (const s of q.data.by_source) rows.push(`source,${s.label},${s.sample_size},${s.brier_score},${s.calibration_error},${s.bias}`);
    for (const s of q.data.by_category) rows.push(`category,${s.label},${s.sample_size},${s.brier_score},${s.calibration_error},${s.bias}`);
    for (const b of q.data.buckets) rows.push(`bucket,${b.bucket},${b.sample_size},${Math.abs(b.predicted - b.observed).toFixed(4)},${Math.abs(b.predicted - b.observed).toFixed(4)},${(b.predicted - b.observed).toFixed(4)}`);
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nextsignal-calibration.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container pt-6 pb-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calibration &amp; Bias Explorer</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Empirical evidence on how well prediction markets are calibrated, where systematic bias
            hides, and how accuracy varies by platform and topic.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleCsv} disabled={!q.data}>
          <Download className="h-3.5 w-3.5" />
          Download CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {q.isLoading ? (
          <>
            <MetricSkeleton /> <MetricSkeleton /> <MetricSkeleton /> <MetricSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              label="Resolved sample"
              value={q.data?.overall.sample_size ?? 0}
              sub="events with known outcome"
              tone="neutral"
              icon={<Layers className="h-4 w-4" />}
            />
            <MetricCard
              label="Avg Brier"
              value={q.data && q.data.overall.sample_size > 0 ? q.data.overall.brier_score.toFixed(3) : "—"}
              sub={q.data?.overall.sample_size ? "0 = perfect · 0.25 = random" : "Requires resolved outcomes; none available yet"}
              tone="positive"
              icon={<Gauge className="h-4 w-4" />}
            />
            <MetricCard
              label="Calibration error"
              value={q.data && q.data.overall.sample_size > 0 ? q.data.overall.calibration_error.toFixed(3) : "—"}
              sub="|predicted − observed|"
              tone="warning"
              icon={<BarChart3 className="h-4 w-4" />}
            />
            <MetricCard
              label="Bias"
              value={`${q.data && q.data.overall.sample_size > 0 ? (q.data.overall.bias * 100).toFixed(1) : "—"}${q.data && q.data.overall.sample_size > 0 ? "%" : ""}`}
              sub="+ = over-predicts YES"
              tone={
                q.data && Math.abs(q.data.overall.bias) > 0.05 ? "warning" : "neutral"
              }
              icon={<Sparkles className="h-4 w-4" />}
            />
          </>
        )}
      </div>

      <Tabs defaultValue="overall">
        <TabsList>
          <TabsTrigger value="overall">Overall</TabsTrigger>
          <TabsTrigger value="source">By platform</TabsTrigger>
          <TabsTrigger value="category">By category</TabsTrigger>
          <TabsTrigger value="bucket">By bucket</TabsTrigger>
        </TabsList>

        <TabsContent value="overall">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Reliability diagram</CardTitle>
                <CardDescription>
                  Each point is a probability bucket; values close to the diagonal are well-calibrated.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {q.isLoading ? (
                  <ChartSkeleton height={340} />
                ) : (
                  <CalibrationChart buckets={q.data?.buckets || []} height={340} />
                )}
              </CardContent>
            </Card>
            <div className="space-y-3">
              <MethodologyCallout title="Brier score">
                Mean squared difference between predicted probability and binary outcome. Lower is
                better. A coin-flip baseline scores 0.25.
              </MethodologyCallout>
              <MethodologyCallout title="Calibration error">
                Absolute gap between market-implied probability and the observed frequency of YES
                outcomes. Zero means the market is perfectly calibrated on average.
              </MethodologyCallout>
              <MethodologyCallout title="Bias">
                Signed difference between predicted and realized rates. Positive means the market
                systematically overstates YES outcomes.
              </MethodologyCallout>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="source">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Brier and calibration by platform</CardTitle>
                <CardDescription>Scaled by 100 for visibility; shorter bars = better.</CardDescription>
              </CardHeader>
              <CardContent>
                {q.isLoading ? (
                  <ChartSkeleton height={260} />
                ) : (
                  <BrierBreakdownChart segments={q.data?.by_source || []} />
                )}
              </CardContent>
            </Card>
            <SegmentTable title="Platforms" segments={q.data?.by_source || []} />
          </div>
        </TabsContent>

        <TabsContent value="category">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Brier and calibration by category</CardTitle>
                <CardDescription>
                  Politics markets historically overestimate YES outcomes; crypto markets are the most
                  volatile.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {q.isLoading ? (
                  <ChartSkeleton height={260} />
                ) : (
                  <BrierBreakdownChart segments={q.data?.by_category || []} />
                )}
              </CardContent>
            </Card>
            <SegmentTable title="Categories" segments={q.data?.by_category || []} />
          </div>
        </TabsContent>

        <TabsContent value="bucket">
          <Card>
            <CardHeader>
              <CardTitle>Bucketed reliability</CardTitle>
              <CardDescription>
                Grouped predictions in 10-percentage-point buckets, showing predicted vs observed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border border-border/40">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/[0.02]">
                      <Th>Bucket</Th>
                      <Th className="text-right">Sample</Th>
                      <Th className="text-right">Predicted</Th>
                      <Th className="text-right">Observed</Th>
                      <Th className="text-right">Gap</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {q.data?.buckets.map((b) => {
                      const gap = b.predicted - b.observed;
                      return (
                        <tr key={b.bucket} className="border-t border-border/30">
                          <Td>{b.bucket}</Td>
                          <Td className="text-right tabular-nums">{b.sample_size}</Td>
                          <Td className="text-right tabular-nums">
                            {(b.predicted * 100).toFixed(1)}%
                          </Td>
                          <Td className="text-right tabular-nums">
                            {(b.observed * 100).toFixed(1)}%
                          </Td>
                          <Td
                            className={
                              "text-right tabular-nums " +
                              (Math.abs(gap) > 0.05
                                ? gap > 0
                                  ? "text-amber-300"
                                  : "text-emerald-300"
                                : "text-muted-foreground")
                            }
                          >
                            {gap > 0 ? "+" : ""}
                            {(gap * 100).toFixed(1)}%
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SegmentTable({ title, segments }: { title: string; segments: SegmentScore[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <Th>Label</Th>
              <Th className="text-right">n</Th>
              <Th className="text-right">Brier</Th>
              <Th className="text-right">Bias</Th>
            </tr>
          </thead>
          <tbody>
            {segments.map((s) => (
              <tr key={s.label} className="border-t border-border/30">
                <Td className="capitalize">{s.label}</Td>
                <Td className="text-right tabular-nums">{s.sample_size}</Td>
                <Td className="text-right tabular-nums">{s.brier_score.toFixed(3)}</Td>
                <Td
                  className={
                    "text-right tabular-nums " +
                    (Math.abs(s.bias) > 0.05
                      ? s.bias > 0
                        ? "text-amber-300"
                        : "text-emerald-300"
                      : "text-muted-foreground")
                  }
                >
                  {s.bias > 0 ? "+" : ""}
                  {(s.bias * 100).toFixed(1)}%
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-2 text-left text-[11px] uppercase tracking-wider text-muted-foreground ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 ${className}`}>{children}</td>;
}
