import { Worker } from "bullmq";
import { startMetricsScheduler } from "./scheduler.js";
import { METRICS_QUEUE_NAME, type MetricsRefreshJobData } from "../lib/queue.js";
import { redis } from "../lib/redis.js";
import { refreshSubmissionMetrics } from "../services/metrics.service.js";

type LogLike = {
    info: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
};

const defaultLogger: LogLike = {
    info: (...args: unknown[]) => {
        console.log(...args);
    },
    error: (...args: unknown[]) => {
        console.error(...args);
    },
};

export function startWorkerRuntime(logger: LogLike = defaultLogger) {
    const worker = new Worker<MetricsRefreshJobData>(
        METRICS_QUEUE_NAME,
        async (job) => {
            await refreshSubmissionMetrics(job.data.submissionId);
        },
        {
            connection: redis,
            concurrency: 8,
        },
    );

    worker.on("completed", (job) => {
        logger.info(`metrics job completed: ${job.id}`);
    });

    worker.on("failed", (job, error) => {
        logger.error(`metrics job failed: ${job?.id ?? "unknown"}`, error);
    });

    const scheduler = startMetricsScheduler();
    logger.info("metrics worker runtime started");

    return {
        async stop(): Promise<void> {
            scheduler.stop();
            await worker.close();
            logger.info("metrics worker runtime stopped");
        },
    };
}
