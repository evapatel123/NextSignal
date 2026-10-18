"use client";

import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { OddsPoint } from "@/lib/types";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { fmtPct } from "@/lib/format";

interface ProbabilityChartProps {
  points: OddsPoint[];
  adjusted?: number;
  market?: number;
  height?: number;
}

export function ProbabilityChart({ points, adjusted, market, height = 320 }: ProbabilityChartProps) {
  const data = useMemo(
    () =>
      points.map((p) => ({
        ts: new Date(p.timestamp).getTime(),
        label: new Date(p.timestamp).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        probability: p.probability,
      })),
    [points],
  );

  return (
    <ChartContainer height={height} className="relative">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="prob-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            axisLine={{ stroke: "rgba(148,163,184,0.15)" }}
            tickLine={false}
            minTickGap={32}
          />
          <YAxis
            domain={[0, 1]}
            tickFormatter={(v) => `${Math.round(v * 100)}%`}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            axisLine={{ stroke: "rgba(148,163,184,0.15)" }}
            tickLine={false}
            width={38}
          />
          <Tooltip
            cursor={{ stroke: "rgba(148,163,184,0.2)" }}
            content={(props: any) => (
              <ChartTooltip
                {...props}
                formatter={(v: any) => fmtPct(v as number, 1)}
              />
            )}
          />
          <Area
            dataKey="probability"
            type="monotone"
            stroke="#38bdf8"
            strokeWidth={2}
            fill="url(#prob-fill)"
            name="Market probability"
          />
          {adjusted !== undefined && (
            <Line
              type="monotone"
              dataKey={() => adjusted}
              stroke="#a78bfa"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              dot={false}
              name="Adjusted (calibrated)"
            />
          )}
          {market !== undefined && (
            <Line
              type="monotone"
              dataKey={() => market}
              stroke="rgba(56,189,248,0.3)"
              strokeDasharray="2 4"
              strokeWidth={1}
              dot={false}
              name="Current market"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
