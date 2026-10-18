import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "neutral" | "positive" | "warning" | "danger";
  className?: string;
}

export function MetricCard({ label, value, sub, icon, tone = "neutral", className }: MetricCardProps) {
  const toneRing = {
    neutral: "ring-cyan-400/20",
    positive: "ring-emerald-400/30",
    warning: "ring-amber-400/30",
    danger: "ring-rose-400/30",
  }[tone];
  const toneText = {
    neutral: "text-cyan-200",
    positive: "text-emerald-200",
    warning: "text-amber-200",
    danger: "text-rose-200",
  }[tone];
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <span
        className={cn(
          "absolute -inset-1 rounded-[inherit] opacity-40 blur-2xl pointer-events-none",
          tone === "positive" && "bg-emerald-500/10",
          tone === "warning" && "bg-amber-500/10",
          tone === "danger" && "bg-rose-500/10",
          tone === "neutral" && "bg-cyan-500/10",
        )}
      />
      <CardContent className="relative flex items-start justify-between gap-3 p-5">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{value}</div>
          {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
        </div>
        {icon && (
          <div
            className={cn(
              "grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.03]",
              toneText,
              "ring-1",
              toneRing,
            )}
          >
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
