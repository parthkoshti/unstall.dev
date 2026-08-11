import { describe, expect, it, vi } from "vitest";
import type { Database } from "@unqueue/db";
import {
  assertEnvironmentAccess,
  assertRedisInstanceAccess,
} from "./rbac.js";

function createMockDb(
  firstQuery: unknown[],
  secondQuery: unknown[] = [],
) {
  const limit = vi
    .fn()
    .mockResolvedValueOnce(firstQuery)
    .mockResolvedValueOnce(secondQuery);

  const where = vi.fn().mockReturnValue({ limit });
  const innerJoin = vi.fn().mockReturnValue({ where });
  const from = vi.fn().mockReturnValue({ where, innerJoin });
  const select = vi.fn().mockReturnValue({ from });

  return { select } as unknown as Database;
}

function createRedisAccessDb(rows: unknown[]) {
  const limit = vi.fn().mockResolvedValueOnce(rows);
  const where = vi.fn().mockReturnValue({ limit });
  const innerJoin2 = vi.fn().mockReturnValue({ where });
  const innerJoin1 = vi.fn().mockReturnValue({ innerJoin: innerJoin2 });
  const from = vi.fn().mockReturnValue({ innerJoin: innerJoin1 });
  const select = vi.fn().mockReturnValue({ from });
  return { select } as unknown as Database;
}

describe("assertEnvironmentAccess", () => {
  it("returns workspace when user has access", async () => {
    const db = createMockDb([{ workspaceId: "ws1", role: "viewer" }]);

    const result = await assertEnvironmentAccess(
      db,
      "user1",
      "env1",
      "viewer",
    );

    expect(result).toEqual({ workspaceId: "ws1", role: "viewer" });
  });

  it("not found when environment is missing", async () => {
    const db = createMockDb([]);

    await expect(
      assertEnvironmentAccess(db, "user1", "env1", "viewer"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("assertRedisInstanceAccess", () => {
  it("not found when user lacks workspace membership", async () => {
    const db = createRedisAccessDb([]);

    await expect(
      assertRedisInstanceAccess(db, "user1", "redis1", "viewer"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("returns workspace and environment when authorized", async () => {
    const db = createRedisAccessDb([
      { environmentId: "env1", workspaceId: "ws1", role: "member" },
    ]);

    const result = await assertRedisInstanceAccess(
      db,
      "user1",
      "redis1",
      "viewer",
    );

    expect(result).toEqual({
      workspaceId: "ws1",
      environmentId: "env1",
      role: "member",
    });
  });

  it("forbids when role is insufficient", async () => {
    const db = createRedisAccessDb([
      { environmentId: "env1", workspaceId: "ws1", role: "viewer" },
    ]);

    await expect(
      assertRedisInstanceAccess(db, "user1", "redis1", "admin"),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
