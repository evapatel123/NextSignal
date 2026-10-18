"use client";

import { create } from "zustand";

interface AppState {
  lastRefresh: number;
  triggerRefresh: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  lastRefresh: Date.now(),
  triggerRefresh: () => set({ lastRefresh: Date.now() }),
}));
