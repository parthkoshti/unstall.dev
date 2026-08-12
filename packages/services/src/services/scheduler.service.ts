import {
  listSchedulers,
  getScheduler,
  removeScheduler,
  runScheduler,
  updateScheduler,
} from "@unqueue/bullmq";
import type { Logger } from "@unqueue/logger";
import type { ServiceDeps } from "../context.js";
import { notFound } from "../errors.js";
import { assertRedisInstanceAccess } from "../rbac.js";
import type { Actor } from "../types.js";

export function createSchedulerService(deps: ServiceDeps, logger: Logger) {
  async function getConnection(actor: Actor, redisInstanceId: string) {
    await assertRedisInstanceAccess(
      deps.db,
      actor.userId,
      redisInstanceId,
      "viewer",
    );
    await deps.redisInstances.ensureRegistered(redisInstanceId);
    return deps.realtime.getConnection(redisInstanceId);
  }

  async function requireWriteConnection(actor: Actor, redisInstanceId: string) {
    await assertRedisInstanceAccess(
      deps.db,
      actor.userId,
      redisInstanceId,
      "member",
    );
    await deps.redisInstances.ensureRegistered(redisInstanceId);
    return deps.realtime.getConnection(redisInstanceId);
  }

  return {
    async list(
      actor: Actor,
      input: { redisInstanceId: string; queueName: string },
    ) {
      logger.debug(input, "Listing schedulers");

      const { connection, prefix, queuePool } = await getConnection(
        actor,
        input.redisInstanceId,
      );
      return listSchedulers(
        connection,
        input.queueName,
        prefix,
        queuePool,
      );
    },

    async get(
      actor: Actor,
      input: {
        redisInstanceId: string;
        queueName: string;
        schedulerId: string;
      },
    ) {
      logger.debug(input, "Getting scheduler");

      const { connection, prefix, queuePool } = await getConnection(
        actor,
        input.redisInstanceId,
      );
      const scheduler = await getScheduler(
        connection,
        input.queueName,
        prefix,
        input.schedulerId,
        queuePool,
      );

      if (!scheduler) notFound("Scheduler");
      return scheduler;
    },

    async run(
      actor: Actor,
      input: {
        redisInstanceId: string;
        queueName: string;
        schedulerId: string;
      },
    ) {
      logger.info(input, "Running scheduler immediately");

      const { connection, prefix } = await requireWriteConnection(
        actor,
        input.redisInstanceId,
      );
      await runScheduler(
        connection,
        input.queueName,
        prefix,
        input.schedulerId,
      );
      return { ok: true as const };
    },

    async remove(
      actor: Actor,
      input: {
        redisInstanceId: string;
        queueName: string;
        schedulerId: string;
      },
    ) {
      logger.info(input, "Removing scheduler");

      const { connection, prefix } = await requireWriteConnection(
        actor,
        input.redisInstanceId,
      );
      await removeScheduler(
        connection,
        input.queueName,
        prefix,
        input.schedulerId,
      );
      return { ok: true as const };
    },

    async update(
      actor: Actor,
      input: {
        redisInstanceId: string;
        queueName: string;
        schedulerId: string;
        pattern?: string;
        every?: number;
      },
    ) {
      logger.info(input, "Updating scheduler");

      const { connection, prefix } = await requireWriteConnection(
        actor,
        input.redisInstanceId,
      );
      await updateScheduler(
        connection,
        input.queueName,
        prefix,
        input.schedulerId,
        { pattern: input.pattern, every: input.every },
      );
      return { ok: true as const };
    },
  };
}

export type SchedulerService = ReturnType<typeof createSchedulerService>;
