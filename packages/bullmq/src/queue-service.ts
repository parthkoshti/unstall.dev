import { Job, type Queue } from "bullmq";
import type { RedisConnection } from "./redis-types.js";
import { withQueue } from "./queue-runner.js";
import type { QueuePoolContext } from "./queue-pool-context.js";
import { jobLogSchema } from "@unqueue/validators";
import type { FailedJobGroup, JobDetail, JobSummary, ParsedLog, QueueCounts, QueueMeta } from "./types.js";

export async function getQueueMeta(
  connection: RedisConnection,
  queueName: string,
  prefix: string,
  pool?: QueuePoolContext,
): Promise<QueueMeta> {
  return withQueue(
    connection,
    queueName,
    prefix,
    async (queue) => {
    const workerKey = `${prefix}:${queueName}:workers`;
    const [counts, isPaused, workerCount] = await Promise.all([
      queue.getJobCounts(
        "waiting",
        "active",
        "delayed",
        "completed",
        "failed",
        "paused",
        "prioritized",
        "waiting-children",
        "repeat",
      ),
      queue.isPaused(),
      connection.hlen(workerKey),
    ]);

    const typedCounts = counts as Record<string, number>;

    return {
      name: queueName,
      isPaused,
      workers: workerCount,
      counts: {
        waiting: typedCounts.waiting ?? 0,
        active: typedCounts.active ?? 0,
        delayed: typedCounts.delayed ?? 0,
        completed: typedCounts.completed ?? 0,
        failed: typedCounts.failed ?? 0,
        paused: typedCounts.paused ?? 0,
        prioritized: typedCounts.prioritized ?? 0,
        "waiting-children": typedCounts["waiting-children"] ?? 0,
        schedulers: typedCounts.repeat ?? 0,
      },
    };
  },
    pool,
  );
}

const JOB_STATES = [
  "waiting",
  "active",
  "delayed",
  "completed",
  "failed",
  "paused",
  "prioritized",
  "waiting-children",
] as const;

export type JobState = (typeof JOB_STATES)[number];
export type JobListState = JobState | "all" | "schedulers";

async function toJobDetails(
  queue: Queue,
  jobs: (Job | undefined)[],
  knownState?: JobState,
): Promise<JobDetail[]> {
  const filtered = jobs.filter((job): job is Job => job != null);

  const details = await Promise.all(
    filtered.map(async (job) => {
      const [jobState, logsResult] = await Promise.all([
        knownState ?? job.getState(),
        job.id ? queue.getJobLogs(job.id) : Promise.resolve({ logs: [] }),
      ]);

      return {
        ...toJobSummary(job),
        state: jobState,
        payload: job.data,
        progress: job.progress,
        logs: logsResult.logs.map(parseLogLine),
      };
    }),
  );

  return details.sort((a, b) => b.timestamp - a.timestamp);
}

export async function listJobs(
  connection: RedisConnection,
  queueName: string,
  prefix: string,
  state: JobListState,
  start = 0,
  end = 49,
  pool?: QueuePoolContext,
): Promise<JobDetail[]> {
  if (state === "schedulers") {
    return [];
  }

  return withQueue(
    connection,
    queueName,
    prefix,
    async (queue) => {
      if (state === "all") {
        // Get counts first to skip states with no jobs — avoids fetching
        // and deserializing 8×(end+1) job records when most states are empty.
        const rawCounts = await queue.getJobCounts(...JOB_STATES);
        const counts = rawCounts as Record<string, number>;
        const nonEmptyStates = JOB_STATES.filter((s) => (counts[s] ?? 0) > 0);
        if (nonEmptyStates.length === 0) return [];

        const pageSize = end - start + 1;
        const perStateCap = start + pageSize;
        const batches = await Promise.all(
          nonEmptyStates.map(async (jobState) => {
            const jobs = await queue.getJobs([jobState], 0, perStateCap, false);
            return toJobDetails(queue, jobs, jobState);
          }),
        );
        const seen = new Set<string>();
        const merged = batches
          .flat()
          .sort((a, b) => b.timestamp - a.timestamp)
          .filter((job) => {
            if (seen.has(job.id)) return false;
            seen.add(job.id);
            return true;
          });
        return merged.slice(start, start + pageSize);
      }

      const jobs = await queue.getJobs([state], start, end, false);
      return toJobDetails(queue, jobs, state);
    },
    pool,
  );
}

export async function listFailedJobGroups(
  connection: RedisConnection,
  queueName: string,
  prefix: string,
  pool?: QueuePoolContext,
): Promise<FailedJobGroup[]> {
  return withQueue(
    connection,
    queueName,
    prefix,
    async (queue) => {
      const jobs = await queue.getJobs(["failed"], 0, 999);
      const groups = new Map<string, FailedJobGroup>();

      for (const job of jobs) {
        const existing = groups.get(job.name);
        if (existing) {
          existing.count++;
          if ((job.finishedOn ?? 0) > (existing.latestFailedAt ?? 0)) {
            existing.latestFailedAt = job.finishedOn;
            existing.latestJobId = job.id ?? "";
            existing.failedReason = job.failedReason;
            existing.stacktrace = job.stacktrace?.length
              ? job.stacktrace
              : undefined;
          }
        } else {
          groups.set(job.name, {
            name: job.name,
            count: 1,
            latestJobId: job.id ?? "",
            latestFailedAt: job.finishedOn,
            failedReason: job.failedReason,
            stacktrace: job.stacktrace?.length ? job.stacktrace : undefined,
          });
        }
      }

      return Array.from(groups.values()).sort((a, b) => b.count - a.count);
    },
    pool,
  );
}

export function toJobSummary(job: Job): JobSummary {
  return {
    id: job.id ?? "",
    name: job.name,
    state: "",
    timestamp: job.timestamp,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
    attemptsMade: job.attemptsMade,
    failedReason: job.failedReason,
    delay: job.delay,
    priority: job.priority,
    stacktrace: job.stacktrace?.length ? job.stacktrace : undefined,
    returnValue: job.returnvalue,
    opts: {
      attempts: job.opts.attempts,
      backoff: job.opts.backoff,
      priority: job.opts.priority,
      delay: job.opts.delay,
      removeOnComplete: job.opts.removeOnComplete,
      removeOnFail: job.opts.removeOnFail,
    },
  };
}

export async function listJobIds(
  connection: RedisConnection,
  queueName: string,
  prefix: string,
  state: JobListState,
): Promise<string[]> {
  if (state === "schedulers") return [];

  const k = (s: string) => `${prefix}:${queueName}:${s}`;

  if (state === "all") {
    const pipeline = connection.pipeline();
    pipeline.lrange(k("wait"), 0, -1);
    pipeline.lrange(k("active"), 0, -1);
    pipeline.lrange(k("paused"), 0, -1);
    pipeline.zrange(k("delayed"), 0, -1);
    pipeline.zrange(k("completed"), 0, -1);
    pipeline.zrange(k("failed"), 0, -1);
    pipeline.zrange(k("prioritized"), 0, -1);
    pipeline.zrange(k("waiting-children"), 0, -1);
    const results = await pipeline.exec();
    const ids = new Set<string>();
    for (const result of results ?? []) {
      if (!result[0] && Array.isArray(result[1])) {
        for (const id of result[1] as string[]) ids.add(id);
      }
    }
    return [...ids];
  }

  const listKey = state === "waiting" ? "wait" : state;
  const listStates = ["waiting", "active", "paused"];
  if (listStates.includes(state)) {
    return connection.lrange(k(listKey), 0, -1);
  }

  return connection.zrange(k(state), 0, -1);
}

export async function getJobState(
  connection: RedisConnection,
  queueName: string,
  prefix: string,
  jobId: string,
): Promise<JobSummary | null> {
  return withQueue(connection, queueName, prefix, async (queue) => {
    const job = await queue.getJob(jobId);
    if (!job) return null;
    const state = await job.getState();
    return { ...toJobSummary(job), state };
  });
}

export async function getJob(
  connection: RedisConnection,
  queueName: string,
  prefix: string,
  jobId: string,
): Promise<JobDetail | null> {
  return withQueue(connection, queueName, prefix, async (queue) => {
    const [job, logsResult] = await Promise.all([
      queue.getJob(jobId),
      queue.getJobLogs(jobId),
    ]);
    if (!job) return null;
    const jobState = await job.getState();
    return {
      ...toJobSummary(job),
      state: jobState,
      payload: job.data,
      progress: job.progress,
      logs: logsResult.logs.map(parseLogLine),
    };
  });
}

function parseLogLine(line: string): ParsedLog {
  try {
    const parsed = JSON.parse(line);
    const result = jobLogSchema.safeParse(parsed);
    if (result.success) {
      return { format: "json", entry: result.data };
    }
  } catch {
    // fall through
  }
  return { format: "raw", raw: line };
}

// BullMQ v5 key layout: {prefix}:{name}:{suffix}
// wait/active/paused use LLEN; everything else uses ZCARD.
// isPaused = HEXISTS {prefix}:{name}:meta paused
//
// Note: BullMQ v5 deprecated a "0:"-prefixed tail marker in the wait/paused
// lists (to be removed in v6). Fresh v5 queues don't have it. We skip the
// marker correction here since it's a minor off-by-1 on a legacy edge case.
const FIELDS_PER_QUEUE = 11;

export async function getQueueMetaBatch(
  connection: RedisConnection,
  queueNames: string[],
  prefix: string,
): Promise<QueueMeta[]> {
  if (queueNames.length === 0) return [];

  const pipeline = connection.pipeline();
  for (const name of queueNames) {
    const k = (s: string) => `${prefix}:${name}:${s}`;
    pipeline.llen(k("wait"));               // 0 waiting
    pipeline.llen(k("active"));             // 1 active
    pipeline.zcard(k("delayed"));           // 2 delayed
    pipeline.zcard(k("completed"));         // 3 completed
    pipeline.zcard(k("failed"));            // 4 failed
    pipeline.llen(k("paused"));             // 5 paused
    pipeline.zcard(k("prioritized"));       // 6 prioritized
    pipeline.zcard(k("waiting-children"));  // 7 waiting-children
    pipeline.zcard(k("repeat"));            // 8 schedulers
    pipeline.hexists(k("meta"), "paused");  // 9 isPaused
    pipeline.hlen(k("workers"));            // 10 workers
  }

  const results = await pipeline.exec();

  const num = (i: number): number => {
    const entry = results?.[i];
    return entry && !entry[0] ? (entry[1] as number) : 0;
  };
  const bool = (i: number): boolean => {
    const entry = results?.[i];
    return entry && !entry[0] ? entry[1] === 1 : false;
  };

  return queueNames.map((name, qi) => {
    const o = qi * FIELDS_PER_QUEUE;
    const counts: QueueCounts = {
      waiting: num(o + 0),
      active: num(o + 1),
      delayed: num(o + 2),
      completed: num(o + 3),
      failed: num(o + 4),
      paused: num(o + 5),
      prioritized: num(o + 6),
      "waiting-children": num(o + 7),
      schedulers: num(o + 8),
    };
    return { name, isPaused: bool(o + 9), workers: num(o + 10), counts };
  });
}
