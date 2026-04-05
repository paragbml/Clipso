import { buildServer } from "./app.js";
import { env } from "./config.js";
import { prisma } from "./lib/db.js";
import { metricsQueue } from "./lib/queue.js";
import { redis } from "./lib/redis.js";

async function start(): Promise<void> {
  const app = buildServer();

  await app.listen({
    host: "0.0.0.0",
    port: env.PORT,
  });

  app.log.info({ port: env.PORT }, "api_started");

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, "api_shutdown_started");
    await app.close();
    await metricsQueue.close();
    await prisma.$disconnect();
    await redis.quit();
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}

start().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  await redis.quit();
  process.exit(1);
});
