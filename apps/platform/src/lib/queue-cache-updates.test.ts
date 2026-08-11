import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { applyQueueCountsPatch } from "./queue-cache-updates";
import { environmentQueuesQueryKey } from "./queue-query-keys";
import type { EnvironmentQueueRow } from "@/components/environment-queues-table";

const environmentId = "env123456789012345678901";

const sampleQueues: EnvironmentQueueRow[] = [
  {
    name: "emails",
    redisInstanceId: "redis123456789012345678901",
    isPaused: false,
    counts: {
      waiting: 1,
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

describe("applyQueueCountsPatch", () => {
  it("updates matching queue counts in the cache", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(environmentQueuesQueryKey(environmentId), sampleQueues);

    applyQueueCountsPatch(
      queryClient,
      environmentId,
      "queue:redis123456789012345678901:emails",
      {
          counts: {
            waiting: 1,
            active: 5,
            delayed: 0,
            completed: 0,
            failed: 0,
            paused: 0,
            prioritized: 0,
            "waiting-children": 0,
            schedulers: 0,
          },
        isPaused: true,
      },
    );

    const updated = queryClient.getQueryData<EnvironmentQueueRow[]>(
      environmentQueuesQueryKey(environmentId),
    );

    expect(updated?.[0]?.counts.active).toBe(5);
    expect(updated?.[0]?.isPaused).toBe(true);
  });
});
