"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { SegmentScore } from "@/lib/types";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";

interface BrierBreakdownChartProps {
  segments: SegmentScore[];
  height?: number;
}

export function BrierBreakdownChart({ segments, height = 260 }: BrierBreakdownChartProps) {
  const data = segments.map((s) => ({
    label: s.label,
    brier: Number((s.brier_score * 100).toFixed(2)),
    calibration: Number((s.calibration_error * 100).toFixed(2)),
  }));
  return (
    <ChartContainer height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            axisLine={{ stroke: "rgba(148,163,184,0.15)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            axisLine={{ stroke: "rgba(148,163,184,0.15)" }}
            tickLine={false}
            width={40}
            tickFormatter={(v) => `${v}`}
          />
          <Tooltip
            content={(props: any) => (
              <ChartTooltip
                {...props}
                formatter={(v: any) => (v as number).toFixed(2)}
              />
            )}
          />
          <Bar dataKey="brier" fill="#22d3ee" radius={[4, 4, 0, 0]} name="Brier (×100)" />
          <Bar
            dataKey="calibration"
            fill="#a78bfa"
            radius={[4, 4, 0, 0]}
            name="Calibration error (×100)"
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
