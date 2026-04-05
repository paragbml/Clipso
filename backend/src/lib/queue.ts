import { Queue } from "bullmq";
import { env } from "../config.js";
import { redis } from "./redis.js";

export const METRICS_QUEUE_NAME = "metrics-refresh";

export type MetricsRefreshJobData = {
    submissionId: string;
    reason: "manual" | "scheduled" | "campaign-update";
};

type InlineMetricsHandler = (job: MetricsRefreshJobData) => Promise<void>;

let inlineHandler: InlineMetricsHandler | null = null;

const bullQueue = redis
    ? new Queue<MetricsRefreshJobData>(METRICS_QUEUE_NAME, {
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
    })
    : null;

export const metricsQueue = {
    async close(): Promise<void> {
        if (bullQueue) {
            await bullQueue.close();
        }
    },
};

export function registerInlineMetricsHandler(handler: InlineMetricsHandler | null): void {
    inlineHandler = handler;
}

export async function enqueueMetricsRefresh(
    submissionId: string,
    reason: MetricsRefreshJobData["reason"] = "manual",
): Promise<void> {
    const job = {
        submissionId,
        reason,
    };

    if (bullQueue) {
        await bullQueue.add("refresh-submission-metrics", job);
        return;
    }

    if (!inlineHandler) {
        throw new Error("In-memory queue mode requires a registered inline metrics handler.");
    }

    // In free-mode, process immediately in-process without Redis.
    await inlineHandler(job);
}

export function isRedisBackedQueue(): boolean {
    return Boolean(bullQueue) && !env.USE_MEMORY_QUEUE;
}
