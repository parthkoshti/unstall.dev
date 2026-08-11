import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { QueueStatusChip } from "@/components/queue-status-chip";

export type EnvironmentQueueRow = {
  name: string;
  redisInstanceId: string;
  isPaused: boolean;
  counts: {
    waiting: number;
    active: number;
    delayed: number;
    completed: number;
    failed: number;
    paused: number;
    prioritized: number;
    "waiting-children": number;
    schedulers: number;
  };
  workers: number;
};

const thClass =
  "px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground";
const tdClass = "px-3 py-2 align-middle";

export function EnvironmentQueuesTableHeader() {
  return (
    <thead className="sticky top-0 z-10 bg-muted/40 backdrop-blur-sm">
      <tr className="border-b border-border text-left">
        <th className={cn(thClass, "pl-4")}>Queue</th>
        <th className={cn(thClass, "text-right")}>Waiting</th>
        <th className={cn(thClass, "text-right")}>Active</th>
        <th className={cn(thClass, "text-right")}>Delayed</th>
        <th className={cn(thClass, "text-right")}>Failed</th>
        <th className={cn(thClass, "text-right")}>Completed</th>
        <th className={cn(thClass, "pr-4")}>Status</th>
      </tr>
    </thead>
  );
}

function CountCell({
  value,
  emphasis,
}: {
  value: number;
  emphasis?: "failed" | "active";
}) {
  return (
    <td
      className={cn(
        tdClass,
        "text-right font-mono text-[11px] tabular-nums",
        emphasis === "failed" && value > 0 && "font-medium text-destructive",
        emphasis === "active" && value > 0 && "text-blue-600 dark:text-blue-400",
        value === 0 && "text-muted-foreground",
      )}
    >
      {value.toLocaleString()}
    </td>
  );
}

export function EnvironmentQueuesTable({
  queues,
  workspaceId,
  environmentId,
}: {
  queues: EnvironmentQueueRow[];
  workspaceId: string;
  environmentId: string;
}) {
  return (
    <table className="w-full text-xs">
      <EnvironmentQueuesTableHeader />
      <tbody>
        {queues.map((queue) => (
          <tr
            key={`${queue.redisInstanceId}-${queue.name}`}
            className="group border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
          >
            <td className={cn(tdClass, "pl-4")}>
              <Link
                to="/$workspaceId/$environmentId/queues/$queueName"
                params={{
                  workspaceId,
                  environmentId,
                  queueName: queue.name,
                }}
                search={{ redisInstanceId: queue.redisInstanceId }}
                className="block max-w-[16rem] truncate font-mono text-[11px] font-medium hover:underline"
              >
                {queue.name}
              </Link>
            </td>
            <CountCell value={queue.counts.waiting} />
            <CountCell value={queue.counts.active} emphasis="active" />
            <CountCell value={queue.counts.delayed} />
            <CountCell value={queue.counts.failed} emphasis="failed" />
            <CountCell value={queue.counts.completed} />
            <td className={cn(tdClass, "pr-4")}>
              <QueueStatusChip
                status={queue.isPaused ? "paused" : "running"}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
