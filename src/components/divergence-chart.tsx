"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { PlatformQuote } from "@/lib/types";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { SOURCE_COLORS } from "@/lib/constants";
import { fmtPct } from "@/lib/format";

interface DivergenceChartProps {
  platforms: PlatformQuote[];
  adjusted?: number;
  height?: number;
}

export function DivergenceChart({ platforms, adjusted, height = 220 }: DivergenceChartProps) {
  const data = platforms.map((p) => ({
    label: p.source_display,
    probability: Number((p.probability * 100).toFixed(1)),
    source: p.source,
  }));
  if (adjusted !== undefined) {
    data.push({ label: "Adjusted", probability: Number((adjusted * 100).toFixed(1)), source: "adjusted" });
  }

  return (
    <ChartContainer height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
        >
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            axisLine={{ stroke: "rgba(148,163,184,0.15)" }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            axisLine={{ stroke: "rgba(148,163,184,0.15)" }}
            tickLine={false}
            width={86}
          />
          <Tooltip
            cursor={{ fill: "rgba(148,163,184,0.05)" }}
            content={(props: any) => (
              <ChartTooltip
                {...props}
                formatter={(v: any) => fmtPct((v as number) / 100, 1)}
              />
            )}
          />
          <Bar dataKey="probability" radius={[0, 6, 6, 0]} barSize={18}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={d.source === "adjusted" ? "#f0abfc" : SOURCE_COLORS[d.source] || SOURCE_COLORS.unknown}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
