import { AlertTriangleIcon } from "lucide-react";
import { Badge } from "@unqueue/ui/components/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatJobTimestamp } from "@/lib/format-timestamp";
import type { FailedJobGroup } from "@unqueue/bullmq";

export function FailedJobGroupsTable({
  groups,
  totalFailed,
  isLoading,
  onOpenJob,
}: {
  groups: FailedJobGroup[];
  totalFailed: number;
  isLoading: boolean;
  onOpenJob: (jobId: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="divide-y divide-border/60">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="ml-auto h-4 w-48" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
        <AlertTriangleIcon className="size-8 opacity-40" />
        <p className="text-sm">No errors</p>
        <p className="text-xs">Failed jobs grouped by type will appear here.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/60">
      <div className="flex items-center gap-4 px-4 py-2 text-[11px] font-medium text-muted-foreground">
        <span className="w-8">#</span>
        <span className="min-w-[12rem]">Job Name</span>
        <span className="w-20 text-right">Failures</span>
        <span className="w-20 text-right">Error Rate</span>
        <span className="min-w-0 flex-1">Latest Error</span>
        <span className="w-24 text-right">Latest Failed</span>
      </div>
      {groups.map((group, index) => {
        const errorRate = totalFailed > 0 ? group.count / totalFailed : 0;

        return (
          <button
            key={group.name}
            type="button"
            className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/40"
            onClick={() => onOpenJob(group.latestJobId)}
          >
            <span className="w-8 font-mono text-xs text-muted-foreground">
              {index + 1}
            </span>
            <span className="min-w-[12rem] truncate font-medium">
              {group.name}
            </span>
            <span className="w-20 text-right">
              <Badge variant="destructive">{group.count}</Badge>
            </span>
            <span className="w-20 text-right font-mono text-xs tabular-nums">
              {(errorRate * 100).toFixed(1)}%
            </span>
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
              {group.failedReason ?? "—"}
            </span>
            <span className="w-24 text-right font-mono text-xs text-muted-foreground tabular-nums">
              {formatJobTimestamp(group.latestFailedAt).label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
