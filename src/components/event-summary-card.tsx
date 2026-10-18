"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

import type { EventDetail } from "@/lib/types";
import { fmtDate, fmtPct, fmtShortNum } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SourceBadge } from "@/components/source-badge";
import { SignalChip, StatusChip } from "@/components/status-chip";

export function EventSummaryCard({ event }: { event: EventDetail }) {
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <SourceBadge name={event.source} display={event.source_display} />
          <Badge variant="muted" className="capitalize">
            {event.category}
          </Badge>
          <StatusChip status={event.status} />
          <SignalChip label={event.signal_label} />
        </div>
        <h1 className="text-xl md:text-2xl font-semibold leading-tight">{event.title}</h1>
        {event.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <Stat label="Market" value={fmtPct(event.current_probability, 1)} />
          <Stat label="Adjusted" value={fmtPct(event.adjusted_probability, 1)} accent="text-fuchsia-300" />
          <Stat label="Edge" value={event.edge_score.toFixed(2)} accent="text-amber-300" />
          <Stat label="Divergence" value={event.divergence_score.toFixed(2)} accent="text-cyan-300" />
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-3 text-xs text-muted-foreground">
          <span>
            <span className="uppercase tracking-wider text-[10px]">Resolves</span>{" "}
            {fmtDate(event.resolution_date)}
          </span>
          <span>
            <span className="uppercase tracking-wider text-[10px]">Volume</span>{" "}
            ${fmtShortNum(event.volume)}
          </span>
          {event.liquidity > 0 && (
            <span>
              <span className="uppercase tracking-wider text-[10px]">Liquidity</span>{" "}
              ${fmtShortNum(event.liquidity)}
            </span>
          )}
          {event.url && (
            <Link
              href={event.url}
              target="_blank"
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              View source <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className={`mt-1 text-xl font-semibold tabular-nums ${accent || ""}`}>{value}</div>
    </div>
  );
}
