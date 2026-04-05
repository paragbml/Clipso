import { Queue } from "bullmq";
import { redis } from "./redis.js";

export const METRICS_QUEUE_NAME = "metrics-refresh";

export type MetricsRefreshJobData = {
    submissionId: string;
    reason: "manual" | "scheduled" | "campaign-update";
};

export const metricsQueue = new Queue<MetricsRefreshJobData>(METRICS_QUEUE_NAME, {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 1000,
        },
        removeOnComplete: 500,
        removeOnFail: 1000,
    },
});

export async function enqueueMetricsRefresh(
    submissionId: string,
    reason: MetricsRefreshJobData["reason"] = "manual",
): Promise<void> {
    await metricsQueue.add("refresh-submission-metrics", {
        submissionId,
        reason,
    });
}
