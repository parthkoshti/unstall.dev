import {
  CalendarIcon,
  PlayCircleIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { Badge } from "@unqueue/ui/components/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatJobTimestamp, formatElapsedMs } from "@/lib/format-timestamp";
import type { SchedulerSummary } from "@unqueue/bullmq";

function formatSchedulerSchedule(scheduler: SchedulerSummary): string {
  if (scheduler.pattern) {
    return scheduler.pattern;
  }
  if (scheduler.every) {
    return formatElapsedMs(scheduler.every);
  }
  return "—";
}

export function SchedulerList({
  schedulers,
  isLoading,
  canWrite,
  onOpenScheduler,
  onRun,
  onEdit,
  onRemove,
}: {
  schedulers: SchedulerSummary[];
  isLoading: boolean;
  canWrite: boolean;
  onOpenScheduler: (schedulerId: string) => void;
  onRun: (schedulerId: string) => void;
  onEdit: (schedulerId: string) => void;
  onRemove: (schedulerId: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="divide-y divide-border/60">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="ml-auto h-4 w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (schedulers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
        <CalendarIcon className="size-8 opacity-40" />
        <p className="text-sm">No schedulers</p>
        <p className="text-xs">
          Repeatable job schedulers will appear here when configured.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/60">
      <div className="flex items-center gap-4 px-4 py-2 text-[11px] font-medium text-muted-foreground">
        <span className="w-8">#</span>
        <span className="min-w-[16rem]">Scheduler ID</span>
        <span className="min-w-[10rem]">Schedule</span>
        <span className="min-w-[10rem]">Next Run</span>
        <span className="min-w-[10rem]">Last Run</span>
        <span className="w-16 text-right">Runs</span>
        {canWrite && <span className="w-40 text-right">Actions</span>}
      </div>
      {schedulers.map((scheduler, index) => {
        const nextRun = formatJobTimestamp(scheduler.nextMillis);
        const lastRun = formatJobTimestamp(scheduler.prevMillis);

        return (
          <div
            key={scheduler.id}
            className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/40"
          >
            <span className="w-8 font-mono text-xs text-muted-foreground">
              {index + 1}
            </span>
            <button
              type="button"
              className="min-w-[16rem] truncate text-left font-medium hover:underline"
              onClick={() => onOpenScheduler(scheduler.id)}
            >
              {scheduler.id}
            </button>
            <span className="min-w-[10rem] font-mono text-xs">
              <Badge variant="outline">{formatSchedulerSchedule(scheduler)}</Badge>
            </span>
            <span
              className="min-w-[10rem] font-mono text-xs text-muted-foreground"
              title={nextRun.title}
            >
              {nextRun.label}
            </span>
            <span
              className="min-w-[10rem] font-mono text-xs text-muted-foreground"
              title={lastRun.title}
            >
              {lastRun.label}
            </span>
            <span className="w-16 text-right font-mono text-xs tabular-nums">
              {scheduler.count ?? 0}
            </span>
            {canWrite && (
              <div className="flex w-40 justify-end gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  onClick={() => onRun(scheduler.id)}
                  title="Run now"
                >
                  <PlayCircleIcon className="size-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  onClick={() => onEdit(scheduler.id)}
                  title="Edit"
                >
                  <PencilIcon className="size-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-destructive hover:text-destructive"
                  onClick={() => onRemove(scheduler.id)}
                  title="Remove"
                >
                  <Trash2Icon className="size-3.5" />
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
