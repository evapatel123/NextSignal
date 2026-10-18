"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";

import { useDashboardFilters } from "@/hooks/use-dashboard-filters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SOURCES = [
  { value: "polymarket", label: "Polymarket" },
  { value: "kalshi", label: "Kalshi" },
  { value: "metaculus", label: "Metaculus" },
];

const CATEGORIES = [
  { value: "politics", label: "Politics" },
  { value: "economics", label: "Economics" },
  { value: "crypto", label: "Crypto" },
  { value: "sports", label: "Sports" },
  { value: "geopolitics", label: "Geopolitics" },
  { value: "technology", label: "Technology" },
];

const STATUSES = [
  { value: "active", label: "Active" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const ALL = "__all__";

interface FilterBarProps {
  showSearch?: boolean;
  className?: string;
  compact?: boolean;
}

export function FilterBar({ showSearch = true, className, compact = false }: FilterBarProps) {
  const { source, category, status, search, set, reset } = useDashboardFilters();
  const anyApplied = Boolean(source || category || status || search);

  return (
    <div
      className={
        "flex flex-col md:flex-row md:items-center gap-2 rounded-xl border border-border/50 bg-background/40 p-2.5 " +
        (className || "")
      }
    >
      {showSearch && (
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events, categories, or keywords..."
            value={search || ""}
            onChange={(e) => set({ search: e.target.value })}
            className="pl-9 bg-background/30"
          />
        </div>
      )}

      <FilterSelect
        placeholder="All sources"
        value={source}
        onChange={(v) => set({ source: v })}
        options={SOURCES}
      />
      <FilterSelect
        placeholder="All categories"
        value={category}
        onChange={(v) => set({ category: v })}
        options={CATEGORIES}
      />
      {!compact && (
        <FilterSelect
          placeholder="Any status"
          value={status}
          onChange={(v) => set({ status: v })}
          options={STATUSES}
        />
      )}

      {anyApplied && (
        <Button variant="ghost" size="sm" onClick={() => reset()} className="gap-1">
          <X className="h-3.5 w-3.5" />
          Reset
        </Button>
      )}
    </div>
  );
}

function FilterSelect({
  placeholder,
  value,
  onChange,
  options,
}: {
  placeholder: string;
  value?: string;
  onChange: (v?: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select
      value={value ?? ALL}
      onValueChange={(v) => onChange(v === ALL ? undefined : v)}
    >
      <SelectTrigger className="md:w-40">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{placeholder}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
