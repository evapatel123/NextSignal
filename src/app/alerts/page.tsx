"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { fmtRelative } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertList } from "@/components/alert-list";
import { MethodologyCallout } from "@/components/methodology-callout";
import { TableSkeleton } from "@/components/loading-skeleton";
import { cn } from "@/lib/utils";

const SEVERITIES = ["critical", "high", "medium", "low"] as const;

export default function AlertsPage() {
  const [severity, setSeverity] = useState<string | undefined>(undefined);
  const { data, isLoading, refetch } = useQuery({
    queryKey: qk.alerts({ severity }),
    queryFn: () => api.alerts({ severity }),
  });

  return (
    <div className="container pt-6 pb-10 space-y-5">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mispricing Alerts</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Events where the calibrated signal disagrees with raw market odds, platforms differ, or
            odds have moved unusually fast. Ranked by composite severity.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Generated {fmtRelative(data?.generated_at)}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-muted-foreground mr-1">Severity</span>
        <SeverityChip
          label="All"
          active={!severity}
          onClick={() => setSeverity(undefined)}
        />
        {SEVERITIES.map((s) => (
          <SeverityChip
            key={s}
            label={s}
            active={severity === s}
            onClick={() => setSeverity(s)}
            tone={s === "critical" ? "danger" : s === "high" || s === "medium" ? "warning" : "neutral"}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-300" /> Ranked alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableSkeleton rows={6} />
            ) : data && data.items.length > 0 ? (
              <AlertList items={data.items} />
            ) : (
              <div className="text-sm text-muted-foreground">
                No alerts match this severity. Try a different filter or refresh.
              </div>
            )}
          </CardContent>
        </Card>
        <div className="space-y-3">
          <MethodologyCallout title="Composite score">
            55% |adjusted − market| + 25% cross-market divergence + 20% recent drift. Scores above
            0.25 trigger alerts.
          </MethodologyCallout>
          <MethodologyCallout title="Severity thresholds">
            Low &lt; 0.25 · medium 0.25-0.45 · high 0.45-0.65 · critical ≥ 0.65.
          </MethodologyCallout>
          <MethodologyCallout title="Why flagged?">
            Every row has a human-readable reason combining delta, drift, divergence, and the
            category’s historical bias.
          </MethodologyCallout>
        </div>
      </div>
    </div>
  );
}

function SeverityChip({
  label,
  active,
  onClick,
  tone = "neutral",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  tone?: "neutral" | "warning" | "danger";
}) {
  const base = "inline-flex items-center rounded-full border px-3 py-1 text-xs uppercase tracking-[0.16em] transition";
  const toneCls = {
    neutral: "border-cyan-400/20 bg-cyan-400/5 text-cyan-200 hover:bg-cyan-400/10",
    warning: "border-amber-400/20 bg-amber-400/5 text-amber-200 hover:bg-amber-400/10",
    danger: "border-rose-400/20 bg-rose-400/5 text-rose-200 hover:bg-rose-400/10",
  }[tone];
  return (
    <button
      onClick={onClick}
      className={cn(base, toneCls, active && "ring-1 ring-primary/40 bg-white/[0.06]")}
    >
      {label}
    </button>
  );
}
