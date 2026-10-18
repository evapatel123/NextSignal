"use client";

import { ArrowDown, ArrowUp } from "lucide-react";

import type { EventSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EventRow } from "@/components/event-row";

interface EventTableProps {
  events: EventSummary[];
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (key: string) => void;
}

const COLUMNS: { key: string; label: string; sortable?: boolean }[] = [
  { key: "title", label: "Event" },
  { key: "current_probability", label: "Market / Adj.", sortable: true },
  { key: "edge_score", label: "Edge", sortable: true },
  { key: "divergence_score", label: "Divergence", sortable: true },
  { key: "drift_score", label: "Drift", sortable: true },
  { key: "signal_label", label: "Signal" },
  { key: "resolution_date", label: "Resolves", sortable: true },
];

export function EventTable({ events, sortBy, sortOrder, onSortChange }: EventTableProps) {
  return (
    <div className="rounded-xl border border-border/50 glass overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((c) => (
              <TableHead
                key={c.key}
                onClick={() => c.sortable && onSortChange(c.key)}
                className={cn(c.sortable && "cursor-pointer select-none", "whitespace-nowrap")}
              >
                <span className="inline-flex items-center gap-1">
                  {c.label}
                  {c.sortable && sortBy === c.key && (sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
