import { BookOpen, Database, Flame, LineChart, ShieldAlert, Users } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MethodologyCallout } from "@/components/methodology-callout";
import { SourceBadge } from "@/components/source-badge";

export default function AboutPage() {
  return (
    <div className="container pt-6 pb-10 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">About NextSignal</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
          NextSignal is a research-grade analytics layer for prediction markets. We ingest events
          from multiple platforms, normalize them into a single schema, and grade each market with
          calibration and divergence signals that are easy to understand and easy to query.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[0.85fr_1.15fr]">
        <div className="md:row-span-2">
          <StoryCard
            icon={<Flame className="h-4 w-4" />}
            title="Why this exists"
            body="Prediction markets are useful collective-intelligence instruments, but their outputs are scattered and hard to compare. NextSignal grades the quality of the signal, not just the quoted probability."
          />
        </div>
        <div className="grid gap-4">
          <StoryCard
            icon={<LineChart className="h-4 w-4" />}
            title="What it measures"
            body="Compare Polymarket, Kalshi, and Metaculus using calibration, Brier scores, drift, and cross-market divergence—with an explanation behind each signal."
          />
          <StoryCard
            icon={<ShieldAlert className="h-4 w-4" />}
            title="How to use it"
            body="Treat each score as a research lead. Signals are explainable and traceable to source data; they are not automated trading instructions or guarantees."
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-cyan-300" /> Methodology
          </CardTitle>
          <CardDescription>How we turn raw odds into calibrated, explainable signals.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <MethodologyCallout title="1. Ingestion and normalization">
            Each platform uses a different schema (market, question, claim, contract). We unify them
            into one canonical MarketEvent record, keep the raw payload for traceability, and join
            equivalent events across platforms using stable slugs.
          </MethodologyCallout>
          <MethodologyCallout title="2. Calibration aggregates">
            For resolved events we compute Brier score, absolute calibration error, and signed bias,
            broken down by source, category, and probability bucket (10-percentage-point bins).
          </MethodologyCallout>
          <MethodologyCallout title="3. Drift and divergence">
            Drift = mean absolute change in probability per snapshot, squashed to [0,1]. Divergence =
            standard deviation of the latest probability across platforms, scaled to [0,1].
          </MethodologyCallout>
          <MethodologyCallout title="4. Adjusted probability">
            adjusted = market − (0.6·categoryBias + 0.4·sourceBias)·shrink, then pulled toward 0.5
            proportional to drift and divergence. Shrinkage is a logistic function of sample size, so
            thin evidence has little influence.
          </MethodologyCallout>
          <MethodologyCallout title="5. Composite edge score">
            edge = 0.55·|adjusted − market| + 0.25·divergence + 0.20·drift. Alerts fire when edge
            exceeds thresholds, with a human-readable explanation attached.
          </MethodologyCallout>
          <MethodologyCallout title="6. Narrative insights">
            A rule-based generator produces short, confident bullets for the dashboard (best
            calibrated platform, most biased category, sharpest disagreement, top mispricing, and
            live activity summary).
          </MethodologyCallout>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-4 w-4 text-fuchsia-300" /> Data sources
          </CardTitle>
          <CardDescription>
            NextSignal ships with bundled sample data so the app works without keys. Live adapters
            are wired in for each source and can be enabled with <code>ENABLE_LIVE_INGEST=true</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <SourceRow name="polymarket" display="Polymarket" note="Largest decentralized prediction market; deep liquidity on politics, crypto, and tech." />
          <SourceRow name="kalshi" display="Kalshi" note="CFTC-regulated U.S. event contracts exchange; strong on macro and economics." />
          <SourceRow name="metaculus" display="Metaculus" note="Non-monetary community forecasting platform with calibration-aware scoring." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Limitations and caveats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            The bundled sample includes a curated selection of events and a few resolved outcomes to
            make calibration meaningful; this is intentionally small for demo purposes.
          </p>
          <p>
            The confidence-adjusted probability is a transparent, explainable heuristic — not a deep
            model. It is designed to be auditable, not optimal.
          </p>
          <p>
            Nothing in NextSignal constitutes financial advice. Predictions are probabilistic
            assessments that may be wrong; signals are diagnostic tools, not trading recommendations.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-300" /> Build note
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            NextSignal is built with Next.js 14, TypeScript, Tailwind CSS, shadcn-style UI, and
            Recharts. Its FastAPI backend uses SQLAlchemy and SQLite, with Docker support for local
            full-stack development.
          </p>
          <p>
            Author and developer: <span className="text-foreground">Eva Patel</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StoryCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="grid h-8 w-8 place-items-center rounded-md bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20">
          {icon}
        </div>
        <h3 className="mt-3 text-base font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{body}</p>
      </CardContent>
    </Card>
  );
}

function SourceRow({ name, display, note }: { name: string; display: string; note: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-white/[0.02] p-4">
      <SourceBadge name={name} display={display} />
      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{note}</p>
    </div>
  );
}
