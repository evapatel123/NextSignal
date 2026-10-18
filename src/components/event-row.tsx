"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { EventSummary } from "@/lib/types";
import { fmtDate, fmtPct, fmtSigned } from "@/lib/format";
import { TableCell, TableRow } from "@/components/ui/table";
import { SourceBadge } from "@/components/source-badge";
import { SignalChip, StatusChip } from "@/components/status-chip";
import { Badge } from "@/components/ui/badge";

interface EventRowProps {
  event: EventSummary;
}

export function EventRow({ event }: EventRowProps) {
  const delta = event.adjusted_probability - event.current_probability;
  const deltaColor =
    delta > 0.04 ? "text-emerald-300" : delta < -0.04 ? "text-amber-300" : "text-muted-foreground";
  return (
    <TableRow className="group cursor-pointer">
      <TableCell className="max-w-[28rem]">
        <Link href={`/events/${event.id}`} className="flex items-start gap-2">
          <div className="min-w-0">
            <div className="truncate font-medium group-hover:text-primary transition-colors">
              {event.title}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <SourceBadge name={event.source} display={event.source_display} />
              <Badge variant="muted" className="capitalize">
                {event.category}
              </Badge>
              <StatusChip status={event.status} />
            </div>
          </div>
          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 mt-1" />
        </Link>
      </TableCell>
      <TableCell className="tabular-nums">
        <div className="flex flex-col">
          <span className="font-medium">{fmtPct(event.current_probability, 1)}</span>
          <span className={`text-[11px] ${deltaColor}`}>
            adj {fmtPct(event.adjusted_probability, 1)} ({fmtSigned(delta * 100, 1)})
          </span>
        </div>
      </TableCell>
      <TableCell className="tabular-nums">
        <ScoreBar value={event.edge_score} accent="#f0abfc" />
      </TableCell>
      <TableCell className="tabular-nums">
        <ScoreBar value={event.divergence_score} accent="#22d3ee" />
      </TableCell>
      <TableCell className="tabular-nums">
        <ScoreBar value={event.drift_score} accent="#f59e0b" />
      </TableCell>
      <TableCell>
        <SignalChip label={event.signal_label} />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
        {fmtDate(event.resolution_date)}
      </TableCell>
    </TableRow>
  );
}

function ScoreBar({ value, accent }: { value: number; accent: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-10 text-right text-xs font-medium">{value.toFixed(2)}</span>
      <div className="relative h-1.5 w-16 overflow-hidden rounded-full bg-white/[0.05]">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${Math.min(100, value * 100)}%`, background: accent, boxShadow: `0 0 8px ${accent}` }}
        />
      </div>
    </div>
  );
}
