import { startWorkerRuntime } from "./jobs/worker-runtime.js";
import { prisma } from "./lib/db.js";
import { metricsQueue } from "./lib/queue.js";
import { redis } from "./lib/redis.js";
const runtime = startWorkerRuntime();

async function shutdown(signal: string): Promise<void> {
    console.log(`worker shutdown started: ${signal}`);
    await runtime.stop();
    await metricsQueue.close();
    await prisma.$disconnect();
    if (redis) {
        await redis.quit();
    }
    process.exit(0);
}

process.on("SIGINT", () => {
    void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
});

console.log("metrics worker started");
