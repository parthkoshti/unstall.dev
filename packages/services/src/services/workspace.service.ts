import { eq } from "drizzle-orm";
import {
  environments,
  workspaceMembers,
  workspaces,
} from "@unqueue/db/schema";
import {
  createId,
  DEFAULT_ENVIRONMENT_NAME,
  DEFAULT_ENVIRONMENT_NAMES,
} from "@unqueue/shared";
import type { Logger } from "@unqueue/logger";
import type { ServiceDeps } from "../context.js";
import { notFound } from "../errors.js";
import type { Actor } from "../types.js";

export function createWorkspaceService(deps: ServiceDeps, logger: Logger) {
  return {
    async list(actor: Actor) {
      logger.debug({ userId: actor.userId }, "Listing workspaces");

      return deps.db
        .select({
          id: workspaces.id,
          name: workspaces.name,
          role: workspaceMembers.role,
          createdAt: workspaces.createdAt,
        })
        .from(workspaceMembers)
        .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
        .where(eq(workspaceMembers.userId, actor.userId));
    },

    async get(_actor: Actor, workspaceId: string) {
      logger.debug({ workspaceId }, "Getting workspace");

      const [workspace] = await deps.db
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, workspaceId))
        .limit(1);

      if (!workspace) notFound("Workspace");
      return workspace;
    },

    async rename(_actor: Actor, workspaceId: string, name: string) {
      logger.debug({ workspaceId, name }, "Renaming workspace");

      const [updated] = await deps.db
        .update(workspaces)
        .set({ name })
        .where(eq(workspaces.id, workspaceId))
        .returning();

      if (!updated) notFound("Workspace");
      return updated;
    },

    async create(actor: Actor, name: string) {
      logger.debug({ userId: actor.userId, name }, "Creating workspace");

      const workspaceId = createId();
      const memberId = createId();

      const defaultEnvironments = DEFAULT_ENVIRONMENT_NAMES.map((envName) => ({
        id: createId(),
        workspaceId,
        name: envName,
      }));

      const defaultEnvironment = defaultEnvironments.find(
        (env) => env.name === DEFAULT_ENVIRONMENT_NAME,
      );

      await deps.db.insert(workspaces).values({
        id: workspaceId,
        name,
      });

      await deps.db.insert(workspaceMembers).values({
        id: memberId,
        workspaceId,
        userId: actor.userId,
        role: "owner",
      });

      await deps.db.insert(environments).values(defaultEnvironments);

      return {
        workspaceId,
        environmentId: defaultEnvironment?.id ?? defaultEnvironments[0]!.id,
      };
    },
  };
}

export type WorkspaceService = ReturnType<typeof createWorkspaceService>;
