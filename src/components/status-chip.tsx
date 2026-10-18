import { Badge } from "@/components/ui/badge";

export function StatusChip({ status }: { status: string }) {
  const normalized = status?.toLowerCase?.() || "active";
  const variant =
    normalized === "active" ? "neutral" : normalized === "resolved" ? "success" : "muted";
  return (
    <Badge variant={variant as any} className="uppercase tracking-wider">
      {normalized}
    </Badge>
  );
}

export function SignalChip({ label }: { label: string }) {
  const l = (label || "neutral").toLowerCase();
  const variant =
    l === "underpriced"
      ? "success"
      : l === "overconfident" || l === "drifting" || l === "divergent"
        ? "warning"
        : "neutral";
  return (
    <Badge variant={variant as any} className="uppercase tracking-wider">
      {l}
    </Badge>
  );
}

export function SeverityChip({ severity }: { severity: string }) {
  const v =
    severity === "critical"
      ? "danger"
      : severity === "high"
        ? "warning"
        : severity === "medium"
          ? "warning"
          : "neutral";
  return (
    <Badge variant={v as any} className="uppercase tracking-wider">
      {severity}
    </Badge>
  );
}
