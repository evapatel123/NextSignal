"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Activity, LineChart, Menu, Sparkles } from "lucide-react";

import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { APP_NAME, NAV_LINKS, SOURCE_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { fmtRelative } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function SiteHeader() {
  const pathname = usePathname();
  const { data: health } = useQuery({ queryKey: qk.health, queryFn: api.health, refetchInterval: 60_000 });
  const { data: sources } = useQuery({ queryKey: qk.sources, queryFn: api.sources });

  const last = health?.last_sync_at;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="container flex h-16 items-center gap-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-blue-500 via-cyan-400 to-emerald-400 shadow-[0_0_20px_-4px_rgba(96,165,250,0.6)]">
            <LineChart className="h-4.5 w-4.5 text-background" strokeWidth={2.4} />
            <span className="absolute -inset-1 rounded-lg bg-gradient-to-br from-blue-400/30 to-emerald-400/30 blur-md opacity-0 group-hover:opacity-100 transition" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">{APP_NAME}</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              forecasting terminal
            </div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-4">
          {NAV_LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm transition-colors",
                  active
                    ? "bg-white/[0.05] text-foreground border border-white/10"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        <div className="hidden lg:flex items-center gap-2">
          <SourceDots />
          <SyncPill health={health} />
          <div className="text-[11px] text-muted-foreground">Last sync {fmtRelative(last)}</div>
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="mt-4 space-y-1">
                {NAV_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={cn(
                      "block px-3 py-2 rounded-md text-sm",
                      pathname === l.href
                        ? "bg-white/[0.05] text-foreground"
                        : "text-muted-foreground hover:bg-white/[0.04]",
                    )}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
              <div className="mt-6 border-t border-border/50 pt-4">
                <SourceDots expanded />
                <div className="mt-2">
                  <SyncPill health={health} />
                </div>
                <div className="text-[11px] text-muted-foreground mt-2">
                  Last sync {fmtRelative(last)}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function SyncPill({ health }: { health: any }) {
  const ok = health?.status === "ok" && health?.data_mode === "live" && Boolean(health?.last_sync_at);
  const demo = health?.data_mode === "demo";
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-2.5 py-1">
      <span className="relative inline-flex">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            ok ? "bg-emerald-400" : "bg-amber-400",
          )}
        />
        <span
          className={cn(
            "absolute inset-0 h-2 w-2 rounded-full animate-ping",
            ok ? "bg-emerald-400/50" : "bg-amber-400/50",
          )}
        />
      </span>
      <span className="text-[11px] font-medium tracking-wide">
        {ok ? "Live" : demo ? "Demo data" : health?.status === "degraded" ? "Degraded" : "Connecting"}
      </span>
    </div>
  );
}

function SourceDots({ expanded = false }: { expanded?: boolean }) {
  const { data } = useQuery({ queryKey: qk.sources, queryFn: api.sources, refetchInterval: 60_000 });
  const srcs = data?.sources ?? [];
  return (
    <div className="flex items-center gap-2">
      {srcs.map((source) => {
        const s = source.name;
        const healthy = source.status === "ok";
        return (
        <div
          key={s}
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            title={`${source.display_name}: ${source.status}`}
            style={{
              background: healthy ? (SOURCE_COLORS[s] || "#64748b") : "#f59e0b",
              boxShadow: `0 0 6px ${healthy ? (SOURCE_COLORS[s] || "#64748b") : "#f59e0b"}`,
            }}
          />
          {expanded && <span>{source.display_name} · {source.status}</span>}
        </div>
        );
      })}
    </div>
  );
}
