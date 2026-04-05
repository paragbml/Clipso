import Fastify, { type FastifyInstance } from "fastify";
import { campaignsRoutes } from "./routes/campaigns.route.js";
import { dashboardRoutes } from "./routes/dashboard.route.js";
import { healthRoutes } from "./routes/health.route.js";
import { submissionsRoutes } from "./routes/submissions.route.js";

export function buildServer(): FastifyInstance {
    const app = Fastify({
        logger: true,
    });

    app.setErrorHandler((error, request, reply) => {
        request.log.error({ err: error }, "request_failed");

        const statusCode = typeof (error as { statusCode?: number }).statusCode === "number" ? (error as { statusCode: number }).statusCode : 500;
        reply.status(statusCode).send({
            error: error.message,
            statusCode,
        });
    });

    app.register(healthRoutes, { prefix: "/v1" });
    app.register(campaignsRoutes, { prefix: "/v1" });
    app.register(submissionsRoutes, { prefix: "/v1" });
    app.register(dashboardRoutes, { prefix: "/v1" });

    return app;
}
