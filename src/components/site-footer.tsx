import Link from "next/link";
import { LineChart } from "lucide-react";

import { APP_NAME } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border/50 bg-background/60">
      <div className="container py-10 text-sm text-muted-foreground">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <LineChart className="h-4 w-4 text-primary" />
              {APP_NAME}
            </div>
            <p className="mt-2 text-xs">
              A prediction-market research tool for comparing odds, calibration, drift, and mispricing signals.
            </p>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-foreground mb-2">Product</div>
            <ul className="space-y-1 text-xs">
              <li><Link className="hover:text-foreground" href="/">Dashboard</Link></li>
              <li><Link className="hover:text-foreground" href="/events">Events</Link></li>
              <li><Link className="hover:text-foreground" href="/calibration">Calibration</Link></li>
              <li><Link className="hover:text-foreground" href="/alerts">Alerts</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-foreground mb-2">For developers</div>
            <ul className="space-y-1 text-xs">
              <li><Link className="hover:text-foreground" href="/api">API reference</Link></li>
              <li><Link className="hover:text-foreground" href="/about">Methodology</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-foreground mb-2">Important notes</div>
            <p className="text-[11px] leading-relaxed">
              NextSignal is a research prototype. Data is sourced from Polymarket, Kalshi, and
              Metaculus (or bundled samples when API access is unavailable). Calibration and signal
              estimates are explanatory — not investment advice.
            </p>
          </div>
        </div>
        <div className="mt-8 pt-5 border-t border-border/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <span className="text-[11px]">© {new Date().getFullYear()} Eva Patel. All rights reserved.</span>
          <span className="text-[11px]">Author and developer: Eva Patel · Built with Next.js, FastAPI, and Recharts.</span>
        </div>
      </div>
    </footer>
  );
}
