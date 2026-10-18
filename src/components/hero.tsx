import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/50 glass p-8 md:p-12">
      <div className="absolute inset-0 grid-bg opacity-70" />
      <div className="absolute -top-24 -right-20 h-72 w-72 rounded-full bg-gradient-to-br from-blue-500/20 via-cyan-400/20 to-emerald-400/20 blur-3xl" />
      <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-gradient-to-br from-blue-500/10 to-emerald-500/10 blur-3xl" />

      <div className="relative max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <Sparkles className="h-3 w-3 text-emerald-300" />
          Live prediction-market intelligence
        </div>
        <h1 className="mt-4 text-4xl md:text-5xl font-semibold leading-[1.05] tracking-tight">
          See which markets are{" "}
          <span className="gradient-text">actually trustworthy</span>.
        </h1>
        <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl">
          {APP_NAME} unifies Polymarket, Kalshi, and Metaculus into a single analytics surface —
          then grades each event with calibration, drift, and cross-market divergence to surface
          mispricings you can actually act on.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/events">
              Explore events
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="glass">
            <Link href="/alerts">View mispricing alerts</Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link href="/api">API reference →</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
