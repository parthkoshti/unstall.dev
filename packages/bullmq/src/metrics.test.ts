import { describe, expect, it } from "vitest";
import { MetricsAggregator } from "./metrics.js";

describe("MetricsAggregator", () => {
  it("computes failure rate from completions", () => {
    const agg = new MetricsAggregator();
    agg.recordCompletion("redis1", "queue1", 100, 0, true);
    agg.recordCompletion("redis1", "queue1", 200, 0, false);

    const metrics = agg.getMetrics("redis1", "queue1", "5m");
    expect(metrics.failureRate).toBe(0.5);
  });
});
