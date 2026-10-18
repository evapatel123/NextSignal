"use client";

import { cn } from "@/lib/utils";

interface SignalGaugeProps {
  value: number;
  label?: string;
  tone?: "neutral" | "positive" | "warning" | "danger";
  size?: number;
}

export function SignalGauge({ value, label, tone = "neutral", size = 140 }: SignalGaugeProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const angle = -90 + clamped * 180;
  const colors = {
    neutral: "#22d3ee",
    positive: "#34d399",
    warning: "#f59e0b",
    danger: "#f43f5e",
  } as const;
  const color = colors[tone];
  const r = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2 + size * 0.08;
  const pct = Math.round(clamped * 100);

  const path = arcPath(cx, cy, r, -180, 0);
  const fillPath = arcPath(cx, cy, r, -180, -180 + clamped * 180);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`} className="overflow-visible">
        <path d={path} stroke="rgba(148,163,184,0.15)" strokeWidth={10} fill="none" strokeLinecap="round" />
        <path d={fillPath} stroke={color} strokeWidth={10} fill="none" strokeLinecap="round" />
        <line
          x1={cx}
          y1={cy}
          x2={cx + Math.cos((angle * Math.PI) / 180) * (r - 4)}
          y2={cy + Math.sin((angle * Math.PI) / 180) * (r - 4)}
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={4} fill={color} />
      </svg>
      <div className="mt-1 text-3xl font-semibold tabular-nums" style={{ color }}>
        {pct}%
      </div>
      {label && (
        <div className="mt-0.5 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </div>
      )}
    </div>
  );
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const s = polar(cx, cy, r, startDeg);
  const e = polar(cx, cy, r, endDeg);
  const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  const sweep = endDeg > startDeg ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${e.x} ${e.y}`;
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
