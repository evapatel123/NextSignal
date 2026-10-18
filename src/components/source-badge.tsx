import { cn } from "@/lib/utils";
import { SOURCE_COLORS } from "@/lib/constants";

export function SourceBadge({
  name,
  display,
  className,
  compact = false,
}: {
  name: string;
  display?: string;
  className?: string;
  compact?: boolean;
}) {
  const color = SOURCE_COLORS[name] || SOURCE_COLORS.unknown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border/50 bg-white/[0.04] px-2 py-0.5 text-xs",
        className,
      )}
    >
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
      {!compact && <span className="text-foreground/90">{display || name}</span>}
    </span>
  );
}
