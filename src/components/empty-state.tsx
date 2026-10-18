import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, body, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-white/[0.02] p-10 text-center",
        className,
      )}
    >
      {icon && <div className="mb-3 text-muted-foreground">{icon}</div>}
      <div className="text-sm font-semibold">{title}</div>
      {body && <p className="mt-1 text-xs text-muted-foreground max-w-sm">{body}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
