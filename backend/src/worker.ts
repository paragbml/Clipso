import { Worker } from "bullmq";
import { prisma } from "./lib/db.js";
import { METRICS_QUEUE_NAME, type MetricsRefreshJobData, metricsQueue } from "./lib/queue.js";
import { redis } from "./lib/redis.js";
import { startMetricsScheduler } from "./jobs/scheduler.js";
import { refreshSubmissionMetrics } from "./services/metrics.service.js";

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
  console.log(`metrics job completed: ${job.id}`);
});

worker.on("failed", (job, error) => {
  console.error(`metrics job failed: ${job?.id ?? "unknown"}`, error);
});

const scheduler = startMetricsScheduler();

async function shutdown(signal: string): Promise<void> {
  console.log(`worker shutdown started: ${signal}`);
  scheduler.stop();
  await worker.close();
  await metricsQueue.close();
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

console.log("metrics worker started");
