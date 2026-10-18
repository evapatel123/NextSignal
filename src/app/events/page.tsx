"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Compass, Search } from "lucide-react";

import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { useDashboardFilters } from "@/hooks/use-dashboard-filters";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/filter-bar";
import { EventTable } from "@/components/event-table";
import { EmptyState } from "@/components/empty-state";
import { TableSkeleton } from "@/components/loading-skeleton";

const PAGE_SIZE = 20;

export default function EventsPage() {
  const filters = useDashboardFilters();
  const debouncedSearch = useDebouncedValue(filters.search, 300);
  const [sortBy, setSortBy] = useState("edge_score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      source: filters.source,
      category: filters.category,
      status: filters.status,
      search: debouncedSearch,
      sort_by: sortBy,
      sort_order: sortOrder,
      page,
      limit: PAGE_SIZE,
    }),
    [filters, debouncedSearch, sortBy, sortOrder, page],
  );

  const query = useQuery({
    queryKey: qk.events(params),
    queryFn: () => api.events(params),
  });

  const handleSort = (key: string) => {
    if (key === sortBy) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortOrder("desc");
    }
  };

  const totalPages = Math.max(1, Math.ceil((query.data?.total || 0) / PAGE_SIZE));

  return (
    <div className="container pt-6 pb-10 space-y-5">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Event Explorer</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Every tracked prediction-market event, normalized to a single schema and ranked by edge,
            drift, and cross-market divergence. Click a row to dive deeper.
          </p>
        </div>
        <div className="text-xs text-muted-foreground tabular-nums">
          {query.data?.total ?? 0} events · sorted by <span className="text-foreground">{sortBy}</span>
        </div>
      </div>

      <FilterBar />

      <Card>
        <CardContent className="p-3">
          {query.isLoading ? (
            <TableSkeleton rows={8} />
          ) : query.data && query.data.items.length > 0 ? (
            <EventTable
              events={query.data.items}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={handleSort}
            />
          ) : (
            <EmptyState
              icon={<Search className="h-7 w-7" />}
              title="No events match those filters"
              body="Try clearing filters or broadening your search — the sample set covers politics, economics, crypto, sports, geopolitics, and technology."
              action={
                <Button variant="outline" size="sm" onClick={() => filters.reset()}>
                  Clear filters
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>

      {query.data && query.data.items.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
