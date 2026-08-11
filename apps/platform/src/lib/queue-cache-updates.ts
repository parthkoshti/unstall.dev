import type { QueryClient } from "@tanstack/react-query";
import type { EnvironmentQueueRow } from "@/components/environment-queues-table";
import { environmentQueuesQueryKey } from "@/lib/queue-query-keys";

type QueueCountsPayload = {
  counts: EnvironmentQueueRow["counts"];
  isPaused: boolean;
};

function parseQueueRoom(room: string): { redisInstanceId: string; queueName: string } | null {
  if (!room.startsWith("queue:")) return null;
  const rest = room.slice("queue:".length);
  const separator = rest.indexOf(":");
  if (separator === -1) return null;
  return {
    redisInstanceId: rest.slice(0, separator),
    queueName: rest.slice(separator + 1),
  };
}

export function applyQueueCountsPatch(
  queryClient: QueryClient,
  environmentId: string,
  room: string,
  payload: unknown,
): void {
  const parsed = parseQueueRoom(room);
  if (!parsed) return;

  const data = payload as QueueCountsPayload;
  if (!data?.counts) return;

  queryClient.setQueryData<EnvironmentQueueRow[]>(
    environmentQueuesQueryKey(environmentId),
    (old) => {
      if (!old) return old;
      return old.map((queue) =>
        queue.redisInstanceId === parsed.redisInstanceId &&
        queue.name === parsed.queueName
          ? { ...queue, counts: data.counts, isPaused: data.isPaused }
          : queue,
      );
    },
  );
}

export function applyQueueAdded(
  queryClient: QueryClient,
  environmentId: string,
  redisInstanceId: string,
  queueName: string,
): void {
  queryClient.setQueryData<EnvironmentQueueRow[]>(
    environmentQueuesQueryKey(environmentId),
    (old) => {
      if (!old) return old;
      if (
        old.some(
          (queue) =>
            queue.redisInstanceId === redisInstanceId && queue.name === queueName,
        )
      ) {
        return old;
      }
      return [
        ...old,
        {
          name: queueName,
          redisInstanceId,
          isPaused: false,
          counts: {
            waiting: 0,
            active: 0,
            delayed: 0,
            completed: 0,
            failed: 0,
            paused: 0,
            prioritized: 0,
            "waiting-children": 0,
            schedulers: 0,
          },
          workers: 0,
        },
      ];
    },
  );
}

export function applyQueueRemoved(
  queryClient: QueryClient,
  environmentId: string,
  redisInstanceId: string,
  queueName: string,
): void {
  queryClient.setQueryData<EnvironmentQueueRow[]>(
    environmentQueuesQueryKey(environmentId),
    (old) => {
      if (!old) return old;
      return old.filter(
        (queue) =>
          !(
            queue.redisInstanceId === redisInstanceId && queue.name === queueName
          ),
      );
    },
  );
}

export function parseRedisDiscoveryRoom(room: string): string | null {
  if (!room.startsWith("redis:")) return null;
  return room.slice("redis:".length) || null;
}

export type LatestJobSummary = {
  id: string;
  name: string;
  state: string;
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
  attemptsMade: number;
  delay?: number;
  opts?: {
    attempts?: number;
  };
};

type JobsInfiniteData = {
  pages: LatestJobSummary[][];
  pageParams: number[];
};

function latestJobsQueryKey(redisInstanceId: string, queueName: string) {
  return ["jobs", redisInstanceId, queueName, "latest"] as const;
}

function mergeLatestJob(
  existing: LatestJobSummary,
  incoming: LatestJobSummary,
): LatestJobSummary {
  return {
    ...existing,
    ...incoming,
    name: incoming.name || existing.name,
    timestamp: incoming.timestamp || existing.timestamp,
    processedOn: incoming.processedOn ?? existing.processedOn,
    finishedOn: incoming.finishedOn ?? existing.finishedOn,
    attemptsMade: incoming.attemptsMade ?? existing.attemptsMade,
    delay: incoming.delay ?? existing.delay,
    opts: incoming.opts ?? existing.opts,
  };
}

export function applyLatestJobUpdate(
  queryClient: QueryClient,
  redisInstanceId: string,
  queueName: string,
  job: LatestJobSummary,
): void {
  queryClient.setQueryData<JobsInfiniteData>(
    latestJobsQueryKey(redisInstanceId, queueName),
    (old) => {
      if (!old?.pages.length) {
        return {
          pages: [[job]],
          pageParams: [0],
        };
      }

      let found = false;
      const pages = old.pages.map((page) =>
        page.map((existing) => {
          if (existing.id === job.id) {
            found = true;
            return mergeLatestJob(existing, job);
          }
          return existing;
        }),
      );

      if (found) {
        return { ...old, pages };
      }

      const nextPages = [...pages];
      nextPages[0] = [job, ...(nextPages[0] ?? [])];
      return { ...old, pages: nextPages };
    },
  );
}

export function applyLatestJobRemoved(
  queryClient: QueryClient,
  redisInstanceId: string,
  queueName: string,
  jobId: string,
): void {
  queryClient.setQueryData<JobsInfiniteData>(
    latestJobsQueryKey(redisInstanceId, queueName),
    (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page) => page.filter((job) => job.id !== jobId)),
      };
    },
  );
}
