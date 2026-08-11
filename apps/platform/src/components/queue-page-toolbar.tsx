import { rpcClient } from "@/lib/api";

type QueueMeta = Awaited<ReturnType<typeof rpcClient.queue.getMeta>>;
type QueueCounts = QueueMeta["counts"];
type QueueMetrics = Awaited<ReturnType<typeof rpcClient.queue.getMetrics>>;
type MetricsWindow = "1m" | "1h" | "24h" | "7d";
import {
  AlertTriangleIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CirclePlusIcon,
  ClockIcon,
  GitBranchIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  RefreshCwIcon,
  HistoryIcon,
  ListMinusIcon,
  TimerIcon,
  Trash2Icon,
  XCircleIcon,
  ZapIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RedisIcon } from "@/components/icons/redis";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type QueueJobFilterState =
  | "latest"
  | "completed"
  | "failed"
  | "errors"
  | "active"
  | "prioritized"
  | "waiting"
  | "waiting-children"
  | "delayed"
  | "paused"
  | "schedulers";

export const QUEUE_STATE_TABS: Array<{
  state: QueueJobFilterState;
  label: string;
  icon: typeof CheckCircle2Icon;
}> = [
  { state: "latest", label: "Latest", icon: HistoryIcon },
  { state: "completed", label: "Completed", icon: CheckCircle2Icon },
  { state: "failed", label: "Failed", icon: XCircleIcon },
  { state: "errors", label: "Errors", icon: AlertTriangleIcon },
  { state: "active", label: "Active", icon: ZapIcon },
  { state: "prioritized", label: "Prioritized", icon: CirclePlusIcon },
  { state: "waiting", label: "Waiting", icon: ClockIcon },
  {
    state: "waiting-children",
    label: "Waiting Children",
    icon: GitBranchIcon,
  },
  { state: "delayed", label: "Delayed", icon: TimerIcon },
  { state: "paused", label: "Paused", icon: PauseCircleIcon },
  { state: "schedulers", label: "Schedulers", icon: CalendarIcon },
];

const QUEUE_TAB_ACTIVE_CLASS: Record<QueueJobFilterState, string> = {
  latest:
    "data-active:border-foreground data-active:bg-muted/40 data-active:text-foreground group-data-[variant=line]/tabs-list:data-active:shadow-[inset_0_-4px_0_0_var(--foreground)] dark:group-data-[variant=line]/tabs-list:data-active:border-foreground",
  completed:
    "data-active:border-emerald-500 data-active:bg-emerald-500/10 data-active:text-emerald-600 group-data-[variant=line]/tabs-list:data-active:shadow-[inset_0_-4px_0_0_var(--color-emerald-500)] dark:data-active:text-emerald-400 dark:group-data-[variant=line]/tabs-list:data-active:border-emerald-500",
  failed:
    "data-active:border-destructive data-active:bg-destructive/10 data-active:text-destructive group-data-[variant=line]/tabs-list:data-active:shadow-[inset_0_-4px_0_0_var(--color-destructive)] dark:group-data-[variant=line]/tabs-list:data-active:border-destructive",
  errors:
    "data-active:border-orange-500 data-active:bg-orange-500/10 data-active:text-orange-600 group-data-[variant=line]/tabs-list:data-active:shadow-[inset_0_-4px_0_0_var(--color-orange-500)] dark:data-active:text-orange-400 dark:group-data-[variant=line]/tabs-list:data-active:border-orange-500",
  active:
    "data-active:border-blue-500 data-active:bg-blue-500/10 data-active:text-blue-600 group-data-[variant=line]/tabs-list:data-active:shadow-[inset_0_-4px_0_0_var(--color-blue-500)] dark:data-active:text-blue-400 dark:group-data-[variant=line]/tabs-list:data-active:border-blue-500",
  prioritized:
    "data-active:border-violet-500 data-active:bg-violet-500/10 data-active:text-violet-600 group-data-[variant=line]/tabs-list:data-active:shadow-[inset_0_-4px_0_0_var(--color-violet-500)] dark:data-active:text-violet-400 dark:group-data-[variant=line]/tabs-list:data-active:border-violet-500",
  waiting:
    "data-active:border-sky-500 data-active:bg-sky-500/10 data-active:text-sky-600 group-data-[variant=line]/tabs-list:data-active:shadow-[inset_0_-4px_0_0_var(--color-sky-500)] dark:data-active:text-sky-400 dark:group-data-[variant=line]/tabs-list:data-active:border-sky-500",
  "waiting-children":
    "data-active:border-cyan-500 data-active:bg-cyan-500/10 data-active:text-cyan-600 group-data-[variant=line]/tabs-list:data-active:shadow-[inset_0_-4px_0_0_var(--color-cyan-500)] dark:data-active:text-cyan-400 dark:group-data-[variant=line]/tabs-list:data-active:border-cyan-500",
  delayed:
    "data-active:border-amber-500 data-active:bg-amber-500/10 data-active:text-amber-600 group-data-[variant=line]/tabs-list:data-active:shadow-[inset_0_-4px_0_0_var(--color-amber-500)] dark:data-active:text-amber-400 dark:group-data-[variant=line]/tabs-list:data-active:border-amber-500",
  paused:
    "data-active:border-orange-500 data-active:bg-orange-500/10 data-active:text-orange-600 group-data-[variant=line]/tabs-list:data-active:shadow-[inset_0_-4px_0_0_var(--color-orange-500)] dark:data-active:text-orange-400 dark:group-data-[variant=line]/tabs-list:data-active:border-orange-500",
  schedulers:
    "data-active:border-violet-500 data-active:bg-violet-500/10 data-active:text-violet-600 group-data-[variant=line]/tabs-list:data-active:shadow-[inset_0_-4px_0_0_var(--color-violet-500)] dark:data-active:text-violet-400 dark:group-data-[variant=line]/tabs-list:data-active:border-violet-500",
};

export const METRICS_WINDOWS: Array<{ key: MetricsWindow; label: string }> = [
  { key: "1m", label: "Last minute" },
  { key: "1h", label: "Last hour" },
  { key: "24h", label: "Last 24 hours" },
  { key: "7d", label: "Last 7 days" },
];

export function getLatestJobCount(counts: QueueCounts | undefined) {
  if (!counts) return 0;
  return (
    counts.waiting +
    counts.active +
    counts.delayed +
    counts.completed +
    counts.failed +
    counts.paused +
    counts.prioritized +
    counts["waiting-children"]
  );
}

export function getQueueTabJobCount(
  counts: QueueCounts | undefined,
  state: QueueJobFilterState,
) {
  if (!counts) return 0;
  if (state === "latest") return getLatestJobCount(counts);
  if (state === "errors") return counts.failed;
  return counts[state] ?? 0;
}

export function getQueueTabEmptyState(state: QueueJobFilterState) {
  if (state === "schedulers") {
    return {
      title: "No schedulers",
      description:
        "Repeatable job schedulers will appear here when configured.",
    };
  }

  if (state === "errors") {
    return {
      title: "No errors",
      description: "Failed jobs grouped by type will appear here.",
    };
  }

  if (state === "latest") {
    return {
      title: "No jobs yet",
      description: "Jobs from all states appear here, newest first.",
    };
  }

  const label = state.replace("-", " ");
  return {
    title: `No ${label} jobs`,
    description: `There are no jobs in the ${label} state right now.`,
  };
}

function formatRate(rate: number) {
  return `${(rate * 100).toFixed(2)}%`;
}

function formatThroughput(value: number) {
  return `${value.toFixed(1)}/min`;
}

type QueueAction = "refresh" | "pause" | "resume" | "drain" | "clean" | "obliterate";

export function QueuePageHeader({
  queueName,
  isPaused,
  counts,
  redisNickname,
  isFetching,
  canWrite,
  onAction,
}: {
  queueName: string;
  isPaused: boolean;
  counts?: QueueCounts;
  redisNickname?: string;
  isFetching: boolean;
  canWrite: boolean;
  onAction: (action: QueueAction) => void;
}) {
  const health = counts
    ? isPaused
      ? "paused"
      : counts.failed > 0
        ? "failed"
        : counts.waiting + counts.delayed >= 10
          ? "backlog"
          : counts.active > 0
            ? "active"
            : "idle"
    : null;

  const HEALTH_DOT: Record<string, string> = {
    failed: "bg-destructive",
    paused: "bg-amber-500",
    backlog: "bg-sky-500",
    active: "bg-blue-500",
    idle: "bg-emerald-500/50",
  };

  const HEALTH_LABEL: Record<string, string> = {
    failed: "Failed jobs",
    paused: "Paused",
    backlog: "Backlog",
    active: "Active",
    idle: "Idle",
  };

  return (
    <div className="flex shrink-0 items-center justify-between gap-4 border-b px-4 py-3">
      <div className="flex min-w-0 items-center gap-2.5">
        {health && (
          <span
            className={cn("size-2 shrink-0 rounded-full", HEALTH_DOT[health])}
            title={HEALTH_LABEL[health]}
          />
        )}
        <h1 className="truncate text-base font-medium">{queueName}</h1>
        {redisNickname && (
          <span className="flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
            <RedisIcon className="size-3 shrink-0" />
            {redisNickname}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <Button size="sm" variant="ghost" onClick={() => onAction("refresh")} disabled={isFetching}>
          <RefreshCwIcon className={isFetching ? "animate-spin" : undefined} />
          Refresh
        </Button>
        {canWrite && (
          <>
            <Button size="sm" variant="ghost" onClick={() => onAction("pause")} disabled={isPaused}>
              <PauseCircleIcon />
              Pause
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onAction("resume")} disabled={!isPaused}>
              <PlayCircleIcon />
              Resume
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onAction("drain")}>
              <ListMinusIcon />
              Drain
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onAction("clean")}>
              <Trash2Icon />
              Clean
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onAction("obliterate")}>
              <XCircleIcon />
              Obliterate
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function fmtMs(ms: number) {
  if (ms === 0) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function QueueMetricsPanel({
  window,
  metrics,
  waitingJobs,
  workers,
  isLoading,
  onWindowChange,
}: {
  window: MetricsWindow;
  metrics: QueueMetrics | undefined;
  waitingJobs: number;
  workers: number;
  isLoading: boolean;
  onWindowChange: (window: MetricsWindow) => void;
}) {
  const successRate = metrics?.successRate ?? 1;
  const completedInWindow = metrics?.completedInWindow ?? 0;
  const totalInWindow = metrics?.totalInWindow ?? 0;
  const throughput = metrics?.throughputPerMinute ?? 0;
  const p95Wait = metrics?.p95WaitMs ?? 0;
  const p95Runtime = metrics?.p95RuntimeMs ?? 0;

  return (
    <div className="shrink-0">
      <div className="flex flex-wrap gap-1.5 px-4 py-2.5">
        {METRICS_WINDOWS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onWindowChange(item.key)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              window === item.key
                ? "border-border bg-muted text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid w-full grid-cols-2 gap-0 sm:grid-cols-5">
        <MetricCard
          label="Success Rate"
          value={isLoading ? undefined : formatRate(successRate)}
          sub={
            isLoading
              ? undefined
              : `${completedInWindow.toLocaleString()}/${totalInWindow.toLocaleString()}`
          }
          isLoading={isLoading}
        />
        <MetricCard
          label="Throughput"
          value={isLoading ? undefined : formatThroughput(throughput)}
          sub={isLoading ? undefined : "jobs/min"}
          isLoading={isLoading}
        />
        <MetricCard
          label="Wait P95"
          value={isLoading ? undefined : fmtMs(p95Wait)}
          sub={isLoading ? undefined : "queue wait"}
          isLoading={isLoading}
        />
        <MetricCard
          label="Runtime P95"
          value={isLoading ? undefined : fmtMs(p95Runtime)}
          sub={isLoading ? undefined : "job runtime"}
          isLoading={isLoading}
        />
        <MetricCard
          label="Workers"
          value={isLoading ? undefined : workers.toLocaleString()}
          sub={isLoading ? undefined : "online"}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  isLoading,
}: {
  label: string;
  value?: string;
  sub?: string;
  isLoading: boolean;
}) {
  return (
    <div
      className={cn(
        "min-w-0 w-full space-y-1 border-t border-r border-b-0 border-border px-3 py-2.5",
        "max-sm:odd:border-l sm:first:border-l",
      )}
    >
      <p className="text-[11px] text-muted-foreground">{label}</p>
      {isLoading ? (
        <Skeleton className="h-5 w-20" />
      ) : (
        <p className="font-mono text-base font-semibold tracking-tight tabular-nums">
          {value}
        </p>
      )}
      {isLoading ? (
        <Skeleton className="h-3 w-16" />
      ) : (
        <p className="font-mono text-[10px] text-muted-foreground tabular-nums">
          {sub}
        </p>
      )}
    </div>
  );
}

export function QueueStateTabs({
  state,
  counts,
  isLoading,
  onStateChange,
}: {
  state: QueueJobFilterState;
  counts: QueueCounts | undefined;
  isLoading: boolean;
  onStateChange: (state: QueueJobFilterState) => void;
}) {
  return (
    <div className="shrink-0">
      <Tabs
        value={state}
        onValueChange={(next) => onStateChange(next as QueueJobFilterState)}
        className="gap-0"
      >
        <TabsList
          variant="line"
          className="grid h-auto! w-full grid-cols-3 items-stretch gap-0 overflow-visible rounded-none bg-transparent p-0 group-data-horizontal/tabs:h-auto! sm:grid-cols-5 xl:grid-cols-11"
        >
          {QUEUE_STATE_TABS.map((tab) => {
            const Icon = tab.icon;
            const count = getQueueTabJobCount(counts, tab.state);
            const isActive = state === tab.state;

            return (
              <TabsTrigger
                key={tab.state}
                value={tab.state}
                disabled={isLoading}
                className={cn(
                  "relative flex h-auto! min-h-14 w-full min-w-0 flex-col items-start justify-center gap-1.5 rounded-none border-t border-r border-b-0 border-border/60 px-3 py-3 text-left",
                  "max-sm:nth-[3n+1]:border-l sm:max-xl:nth-[5n+1]:border-l xl:nth-[11n+1]:border-l",
                  "whitespace-normal after:hidden",
                  "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
                  QUEUE_TAB_ACTIVE_CLASS[tab.state],
                )}
              >
                <span className="flex w-full min-w-0 items-center justify-between gap-2">
                  <span className="truncate text-[11px] font-medium leading-none">
                    {tab.label}
                  </span>
                  <Icon
                    className={cn(
                      "size-3.5 shrink-0 opacity-50",
                      isActive && "opacity-100",
                    )}
                  />
                </span>
                {isLoading ? (
                  <Skeleton className="h-3.5 w-14 rounded-sm" />
                ) : (
                  <span
                    className={cn(
                      "font-mono text-sm font-semibold leading-none tabular-nums",
                      !isActive &&
                        tab.state === "failed" &&
                        count > 0 &&
                        "text-destructive",
                    )}
                  >
                    {count.toLocaleString()}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
}
