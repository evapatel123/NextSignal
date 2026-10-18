"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

import { TooltipProvider } from "@/components/ui/tooltip";

// Keep one sync request per browser app load, including React Strict Mode's effect replay.
let initialSyncPromise: Promise<unknown> | null = null;

function SyncOnLoad() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!initialSyncPromise) {
      initialSyncPromise = api.triggerSync().catch((error) => {
        // Existing market data remains available if a provider is temporarily unavailable.
        console.error("NextSignal automatic refresh failed:", error);
        throw error;
      });
    }

    let active = true;
    initialSyncPromise
      .then(() => {
        if (active) return queryClient.invalidateQueries();
      })
      .catch(() => {
        // The UI should remain usable; health/source status will indicate a degraded feed.
      });

    return () => {
      active = false;
    };
  }, [queryClient]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 30_000,
            retry: 1,
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <TooltipProvider delayDuration={200}>
        <SyncOnLoad />
        {children}
      </TooltipProvider>
    </QueryClientProvider>
  );
}
