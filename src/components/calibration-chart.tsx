"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ComposedChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { BucketScore } from "@/lib/types";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";

interface CalibrationChartProps {
  buckets: BucketScore[];
  height?: number;
}

export function CalibrationChart({ buckets, height = 320 }: CalibrationChartProps) {
  const data = buckets
    .filter((b) => b.sample_size > 0)
    .map((b) => ({
      predicted: Math.round(b.predicted * 100),
      observed: Math.round(b.observed * 100),
      sample_size: b.sample_size,
      label: b.bucket,
    }));

  return (
    <ChartContainer height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(148,163,184,0.08)" />
          <XAxis
            dataKey="predicted"
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            axisLine={{ stroke: "rgba(148,163,184,0.15)" }}
            tickLine={false}
            label={{
              value: "Predicted probability",
              position: "insideBottom",
              offset: -2,
              fill: "hsl(var(--muted-foreground))",
              fontSize: 11,
            }}
          />
          <YAxis
            dataKey="observed"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            axisLine={{ stroke: "rgba(148,163,184,0.15)" }}
            tickLine={false}
            width={40}
            label={{
              value: "Observed rate",
              angle: -90,
              position: "insideLeft",
              fill: "hsl(var(--muted-foreground))",
              fontSize: 11,
            }}
          />
          <ReferenceLine
            segment={[
              { x: 0, y: 0 },
              { x: 100, y: 100 },
            ]}
            stroke="rgba(148,163,184,0.35)"
            strokeDasharray="4 4"
            ifOverflow="extendDomain"
          />
          <Tooltip
            content={(props: any) => (
              <ChartTooltip
                {...props}
                formatter={(v: any, name: string) =>
                  name.toLowerCase().includes("sample") ? v : `${v}%`
                }
              />
            )}
          />
          <Line
            type="monotone"
            dataKey="observed"
            stroke="#22d3ee"
            strokeWidth={2}
            dot={{ fill: "#22d3ee", r: 3 }}
            name="Observed"
          />
          <Scatter dataKey="observed" fill="#a78bfa" name="Bucket" />
          <Legend
            wrapperStyle={{ color: "hsl(var(--muted-foreground))", fontSize: 11 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
