import type { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => {
    return {
      status: "ok",
      service: "clipso-backend",
      timestamp: new Date().toISOString(),
    };
  });
}
