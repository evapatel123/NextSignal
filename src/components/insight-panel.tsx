"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, GitCompareArrows, Sparkles, TrendingUp, Trophy } from "lucide-react";

import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { toneToColor, toneToRing } from "@/lib/insights";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const ICONS: Record<string, React.ComponentType<any>> = {
  trophy: Trophy,
  trend: TrendingUp,
  diff: GitCompareArrows,
  alert: AlertTriangle,
  pulse: Activity,
};

export function InsightPanel() {
  const { data, isLoading } = useQuery({ queryKey: qk.insights, queryFn: api.insights });

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-300" /> Today’s Insights
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Auto-generated narrative from the calibration engine.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && (
          <>
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </>
        )}
        {data?.items?.map((i) => {
          const Icon = ICONS[i.icon] || Sparkles;
          return (
            <div
              key={i.id}
              className={cn("flex gap-3 rounded-lg p-3 ring-1", toneToRing(i.tone))}
            >
              <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white/[0.04]", toneToColor(i.tone))}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium leading-tight truncate">{i.title}</div>
                  <span
                    className={cn(
                      "shrink-0 text-[10px] font-semibold uppercase tracking-wider tabular-nums",
                      toneToColor(i.tone),
                    )}
                  >
                    {i.metric}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{i.body}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
