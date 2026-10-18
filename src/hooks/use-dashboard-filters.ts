"use client";

import { create } from "zustand";

import type { DashboardFilters } from "@/lib/types";

interface FilterState extends DashboardFilters {
  set: (patch: Partial<DashboardFilters>) => void;
  reset: () => void;
}

export const useDashboardFilters = create<FilterState>((set) => ({
  source: undefined,
  category: undefined,
  status: undefined,
  search: "",
  set: (patch) => set((s) => ({ ...s, ...patch })),
  reset: () => set({ source: undefined, category: undefined, status: undefined, search: "" }),
}));
