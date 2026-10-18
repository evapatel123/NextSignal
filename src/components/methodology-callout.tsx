import { Info } from "lucide-react";

import { cn } from "@/lib/utils";

interface MethodologyCalloutProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function MethodologyCallout({ title, children, className }: MethodologyCalloutProps) {
  return (
    <div className={cn("rounded-lg border border-border/50 bg-white/[0.02] p-4", className)}>
      <div className="flex items-start gap-3">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20">
          <Info className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{children}</div>
        </div>
      </div>
    </div>
  );
}
