export type ParsedLog = {
  format: "json" | "raw";
  entry?: {
    ts: number;
    level: string;
    message: string;
    metadata?: Record<string, unknown>;
  };
  raw?: string;
};

export type JobSummary = {
  id: string;
  name: string;
  state: string;
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
  attemptsMade: number;
  failedReason?: string;
  delay?: number;
  priority?: number;
  stacktrace?: string[];
  returnValue?: unknown;
  opts?: {
    attempts?: number;
    backoff?: unknown;
    priority?: number;
    delay?: number;
    removeOnComplete?: unknown;
    removeOnFail?: unknown;
  };
};

export type JobDetail = JobSummary & {
  payload: unknown;
  progress: unknown;
  logs: ParsedLog[];
};

export type QueueCounts = {
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

export type QueueMeta = {
  name: string;
  isPaused: boolean;
  counts: QueueCounts;
  workers: number;
};

export type FailedJobGroup = {
  name: string;
  count: number;
  latestJobId: string;
  latestFailedAt?: number;
  failedReason?: string;
  stacktrace?: string[];
};

export type RedisInstanceConfig = {
  id: string;
  workspaceId: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  db: number;
  tls: boolean;
  tlsServername?: string;
  bullmqPrefix: string;
};
