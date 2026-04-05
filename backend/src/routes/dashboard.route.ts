import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getCampaignDashboard, getClipperDashboard } from "../services/dashboard.service.js";

function sendValidationError(reply: { status: (code: number) => { send: (payload: unknown) => unknown } }, error: z.ZodError) {
    return reply.status(400).send({
        error: "Validation failed",
        details: error.flatten(),
    });
}

export async function dashboardRoutes(app: FastifyInstance): Promise<void> {
    app.get("/clippers/:clipperId/dashboard", async (request, reply) => {
        const paramsSchema = z.object({ clipperId: z.string().min(1) });
        const parsed = paramsSchema.safeParse(request.params);

        if (!parsed.success) {
            return sendValidationError(reply, parsed.error);
        }

        const dashboard = await getClipperDashboard(parsed.data.clipperId);
        return reply.send(dashboard);
    });

    app.get("/campaigns/:campaignId/dashboard", async (request, reply) => {
        const paramsSchema = z.object({ campaignId: z.string().min(1) });
        const parsed = paramsSchema.safeParse(request.params);

        if (!parsed.success) {
            return sendValidationError(reply, parsed.error);
        }

        try {
            const dashboard = await getCampaignDashboard(parsed.data.campaignId);
            return reply.send(dashboard);
        } catch (error) {
            if (error instanceof Error && error.message === "Campaign not found") {
                return reply.status(404).send({ error: error.message });
            }
            throw error;
        }
    });
}
