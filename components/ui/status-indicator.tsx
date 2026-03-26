import { cn } from "@/lib/utils";

type Status = "green" | "yellow" | "red";

interface StatusIndicatorProps {
  status: Status;
  label?: string;
  className?: string;
  pulse?: boolean;
}

const statusColors: Record<Status, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  red: "bg-red-500",
};

const statusLabels: Record<Status, string> = {
  green: "Healthy",
  yellow: "Degraded",
  red: "Down",
};

export function StatusIndicator({
  status,
  label,
  className,
  pulse = true,
}: StatusIndicatorProps) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <span className="relative flex h-2.5 w-2.5">
        {pulse && status !== "red" && (
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              statusColors[status]
            )}
          />
        )}
        <span
          className={cn(
            "relative inline-flex rounded-full h-2.5 w-2.5",
            statusColors[status]
          )}
        />
      </span>
      {(label || true) && (
        <span className="text-xs text-slate-500">
          {label || statusLabels[status]}
        </span>
      )}
    </div>
  );
}
