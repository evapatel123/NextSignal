"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  height?: number | string;
}

export const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ className, style, height = 280, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("w-full", className)}
      style={{ height, ...style }}
      {...props}
    />
  ),
);
ChartContainer.displayName = "ChartContainer";

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: any[];
  formatter?: (value: any, name: string) => React.ReactNode;
}

export function ChartTooltip({ active, label, payload, formatter }: ChartTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-md border border-border/60 glass-strong px-3 py-2 text-xs shadow-md min-w-[160px]">
      {label !== undefined && label !== "" && (
        <div className="text-muted-foreground mb-1">{label}</div>
      )}
      <div className="space-y-1">
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: p.color || p.stroke || p.fill }}
              />
              <span className="text-muted-foreground">{p.name}</span>
            </div>
            <span className="font-medium tabular-nums">
              {formatter ? formatter(p.value, p.name) : p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
