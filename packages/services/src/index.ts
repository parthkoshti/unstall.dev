import type { ServiceDeps } from "./context.js";
import { createEncryptionService } from "./encryption.js";
import { createServiceLogger } from "./logging.js";
import { createAlertService } from "./services/alert.service.js";
import { createBookmarkService } from "./services/bookmark.service.js";
import { createEnvironmentService } from "./services/environment.service.js";
import { createInviteService } from "./services/invite.service.js";
import { createJobActionsService } from "./services/job-actions.service.js";
import { createJobService } from "./services/job.service.js";
import { createMembersService } from "./services/members.service.js";
import { createQueueAdminService } from "./services/queue-admin.service.js";
import { createQueueService } from "./services/queue.service.js";
import { createRedisInstanceRegistry } from "./redis-instance-registry.js";
import { createRedisService } from "./services/redis.service.js";
import { createSchedulerService } from "./services/scheduler.service.js";
import { createStatsService } from "./services/stats.service.js";
import { createWorkspaceService } from "./services/workspace.service.js";

export type Services = {
  workspace: ReturnType<typeof createWorkspaceService>;
  members: ReturnType<typeof createMembersService>;
  environment: ReturnType<typeof createEnvironmentService>;
  redis: ReturnType<typeof createRedisService>;
  queue: ReturnType<typeof createQueueService>;
  job: ReturnType<typeof createJobService>;
  jobActions: ReturnType<typeof createJobActionsService>;
  queueAdmin: ReturnType<typeof createQueueAdminService>;
  scheduler: ReturnType<typeof createSchedulerService>;
  bookmark: ReturnType<typeof createBookmarkService>;
  alert: ReturnType<typeof createAlertService>;
  invite: ReturnType<typeof createInviteService>;
  stats: ReturnType<typeof createStatsService>;
};

export type CreateServicesInput = Omit<
  ServiceDeps,
  "encryption" | "redisInstances" | "getBootstrapPromise" | "setBootstrapPromise"
> & {
  encryptionKeys: string;
};

export function createServices(input: CreateServicesInput): Services {
  const encryption = createEncryptionService(input.encryptionKeys);
  const { encryptionKeys: _encryptionKeys, ...rest } = input;

  const rootLogger = createServiceLogger(rest.logger, "services");

  let bootstrapPromise: Promise<void> | null = null;

  const depsWithoutRegistry: Omit<ServiceDeps, "redisInstances"> = {
    ...rest,
    encryption,
    getBootstrapPromise: () => bootstrapPromise,
    setBootstrapPromise: (promise) => {
      bootstrapPromise = promise;
    },
  };

  const redisInstances = createRedisInstanceRegistry(
    depsWithoutRegistry,
    createServiceLogger(rootLogger, "redis-instances"),
  );

  const deps: ServiceDeps = {
    ...depsWithoutRegistry,
    redisInstances,
  };

  return {
    workspace: createWorkspaceService(deps, createServiceLogger(rootLogger, "workspace")),
    members: createMembersService(deps, createServiceLogger(rootLogger, "members")),
    environment: createEnvironmentService(
      deps,
      createServiceLogger(rootLogger, "environment"),
    ),
    redis: createRedisService(deps, createServiceLogger(rootLogger, "redis")),
    queue: createQueueService(deps, createServiceLogger(rootLogger, "queue")),
    job: createJobService(deps, createServiceLogger(rootLogger, "job")),
    jobActions: createJobActionsService(
      deps,
      createServiceLogger(rootLogger, "job-actions"),
    ),
    queueAdmin: createQueueAdminService(
      deps,
      createServiceLogger(rootLogger, "queue-admin"),
    ),
    scheduler: createSchedulerService(
      deps,
      createServiceLogger(rootLogger, "scheduler"),
    ),
    bookmark: createBookmarkService(deps, createServiceLogger(rootLogger, "bookmark")),
    alert: createAlertService(deps, createServiceLogger(rootLogger, "alert")),
    invite: createInviteService(deps, createServiceLogger(rootLogger, "invite")),
    stats: createStatsService(deps, createServiceLogger(rootLogger, "stats")),
  };
}

export { ServiceError, forbidden, notFound, unauthorized } from "./errors.js";
export type { ServiceErrorCode } from "./errors.js";
export type { Actor } from "./types.js";
export type { ServiceDeps } from "./context.js";
export type { EncryptionService } from "./encryption.js";
export { createEncryptionService } from "./encryption.js";
export type { RealtimeGateway } from "./ports/realtime.js";
export type { AlertScheduler, AlertRow } from "./ports/alerts.js";
export type { EnvironmentQueueRow } from "./services/queue.service.js";
export {
  assertEnvironmentAccess,
  assertRedisInstanceAccess,
  assertWorkspaceAccess,
  getMembership,
  getWorkspaceIdForEnvironment,
} from "./rbac.js";
