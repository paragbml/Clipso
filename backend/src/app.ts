import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { campaignsRoutes } from "./routes/campaigns.route.js";
import { devRoutes } from "./routes/dev.route.js";
import { dashboardRoutes } from "./routes/dashboard.route.js";
import { healthRoutes } from "./routes/health.route.js";
import { submissionsRoutes } from "./routes/submissions.route.js";
import { usersRoutes } from "./routes/users.route.js";

export function buildServer(): FastifyInstance {
    const app = Fastify({
        logger: true,
    });

    void app.register(cors, {
        origin: true,
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
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
    app.register(usersRoutes, { prefix: "/v1" });
    app.register(devRoutes, { prefix: "/v1" });
    app.register(campaignsRoutes, { prefix: "/v1" });
    app.register(submissionsRoutes, { prefix: "/v1" });
    app.register(dashboardRoutes, { prefix: "/v1" });

    return app;
}
