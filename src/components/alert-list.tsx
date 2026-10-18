"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

import type { AlertItem } from "@/lib/types";
import { fmtPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { SourceBadge } from "@/components/source-badge";
import { SeverityChip } from "@/components/status-chip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface AlertListProps {
  items: AlertItem[];
  limit?: number;
  variant?: "table" | "cards";
}

export function AlertList({ items, limit, variant = "table" }: AlertListProps) {
  const shown = limit ? items.slice(0, limit) : items;

  if (variant === "cards") {
    return (
      <div className="grid gap-3">
        {shown.map((a) => (
          <AlertCard key={a.id} item={a} />
        ))}
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-border/50 glass">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="py-2.5 px-3 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/40">
              Event
            </th>
            <th className="py-2.5 px-3 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/40">
              Severity
            </th>
            <th className="py-2.5 px-3 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/40 text-right">
              Edge
            </th>
            <th className="py-2.5 px-3 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/40 text-right">
              Δ Market
            </th>
            <th className="py-2.5 px-3 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/40" />
          </tr>
        </thead>
        <tbody>
          {shown.map((a) => {
            const delta = a.adjusted_probability - a.current_probability;
            return (
              <tr key={a.id} className="hover:bg-white/[0.03] transition-colors">
                <td className="py-2.5 px-3 border-b border-border/30">
                  <Link href={`/events/${a.event_id}`} className="block">
                    <div className="text-sm font-medium line-clamp-1 hover:text-primary">
                      {a.event_title}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <SourceBadge name={a.source} compact />
                      <span className="text-[11px] text-muted-foreground capitalize">{a.category}</span>
                      <span className="text-[11px] text-muted-foreground">· {a.alert_type}</span>
                    </div>
                  </Link>
                </td>
                <td className="py-2.5 px-3 border-b border-border/30">
                  <SeverityChip severity={a.severity} />
                </td>
                <td className="py-2.5 px-3 border-b border-border/30 text-right tabular-nums font-medium text-amber-300">
                  {a.edge_score.toFixed(2)}
                </td>
                <td
                  className={cn(
                    "py-2.5 px-3 border-b border-border/30 text-right tabular-nums text-sm",
                    delta > 0 ? "text-emerald-300" : delta < 0 ? "text-rose-300" : "text-muted-foreground",
                  )}
                >
                  {delta > 0 ? "+" : ""}
                  {(delta * 100).toFixed(1)}%
                </td>
                <td className="py-2.5 px-3 border-b border-border/30 text-right">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-xs">
                        Why?
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="text-xs">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-300 mt-0.5" />
                        <div className="leading-relaxed">{a.reason}</div>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
                        <div><div className="uppercase">Edge</div><div className="text-foreground font-medium">{a.edge_score.toFixed(2)}</div></div>
                        <div><div className="uppercase">Drift</div><div className="text-foreground font-medium">{a.drift_score.toFixed(2)}</div></div>
                        <div><div className="uppercase">Diverge</div><div className="text-foreground font-medium">{a.divergence_score.toFixed(2)}</div></div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Link
                    href={`/events/${a.event_id}`}
                    className="inline-flex items-center text-[11px] text-muted-foreground hover:text-foreground ml-1"
                  >
                    Open <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AlertCard({ item }: { item: AlertItem }) {
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <SeverityChip severity={item.severity} />
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
            {item.alert_type}
          </span>
        </div>
        <Link href={`/events/${item.event_id}`} className="block hover:text-primary">
          <h3 className="text-base font-semibold leading-snug">{item.event_title}</h3>
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <SourceBadge name={item.source} display={item.source} compact />
          <span className="capitalize">{item.category}</span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{item.reason}</p>
        <div className="grid grid-cols-3 gap-2 pt-2 text-center">
          <Metric label="Edge" value={item.edge_score.toFixed(2)} color="text-amber-300" />
          <Metric label="Drift" value={item.drift_score.toFixed(2)} color="text-cyan-300" />
          <Metric label="Diverge" value={item.divergence_score.toFixed(2)} color="text-fuchsia-300" />
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-md border border-border/40 bg-white/[0.02] py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 font-semibold tabular-nums", color)}>{value}</div>
    </div>
  );
}
