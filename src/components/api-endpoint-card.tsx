"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ApiEndpointCardProps {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  summary: string;
  description?: string;
  curl: string;
  response: string;
}

const methodColors: Record<string, string> = {
  GET: "bg-cyan-400/10 text-cyan-300 border-cyan-400/20",
  POST: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
  PUT: "bg-amber-400/10 text-amber-300 border-amber-400/20",
  DELETE: "bg-rose-400/10 text-rose-300 border-rose-400/20",
};

export function ApiEndpointCard({
  method,
  path,
  summary,
  description,
  curl,
  response,
}: ApiEndpointCardProps) {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={methodColors[method] + " font-mono text-[11px] px-2 py-0.5"}
          >
            {method}
          </Badge>
          <code className="text-sm font-mono text-foreground">{path}</code>
        </div>
        <CardTitle className="text-base">{summary}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className="space-y-3">
        <CodeBlock label="cURL" code={curl} />
        <CodeBlock label="Response" code={response} />
      </CardContent>
    </Card>
  );
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };
  return (
    <div className="overflow-hidden rounded-lg border border-border/50 bg-background/70">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/40">
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
        <Button variant="ghost" size="sm" className="h-6 px-2" onClick={onCopy}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          <span className="text-xs">{copied ? "Copied" : "Copy"}</span>
        </Button>
      </div>
      <pre className="overflow-x-auto px-3 py-3 text-xs font-mono leading-relaxed text-foreground/90 scrollbar-thin">
        <code>{code}</code>
      </pre>
    </div>
  );
}
