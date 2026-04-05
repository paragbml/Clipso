import { CampaignStatus } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { enqueueCampaignMetricsRefresh } from "../services/metrics.service.js";
import { createCampaign, listCampaigns } from "../services/campaign.service.js";

function sendValidationError(reply: { status: (code: number) => { send: (payload: unknown) => unknown } }, error: z.ZodError) {
    return reply.status(400).send({
        error: "Validation failed",
        details: error.flatten(),
    });
}

export async function campaignsRoutes(app: FastifyInstance): Promise<void> {
    app.get("/campaigns", async (request, reply) => {
        const querySchema = z.object({
            creatorId: z.string().min(1).optional(),
            status: z.nativeEnum(CampaignStatus).optional(),
        });

        const parsed = querySchema.safeParse(request.query);
        if (!parsed.success) {
            return sendValidationError(reply, parsed.error);
        }

        const campaigns = await listCampaigns(parsed.data);
        return reply.send({ campaigns });
    });

    app.post("/campaigns", async (request, reply) => {
        const bodySchema = z.object({
            creatorId: z.string().min(1),
            title: z.string().min(3),
            description: z.string().optional(),
            budgetCents: z.number().int().positive(),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
            status: z.nativeEnum(CampaignStatus).optional(),
        });

        const parsed = bodySchema.safeParse(request.body);
        if (!parsed.success) {
            return sendValidationError(reply, parsed.error);
        }

        const campaign = await createCampaign(parsed.data);
        return reply.status(201).send({ campaign });
    });

    app.post("/campaigns/:campaignId/refresh-metrics", async (request, reply) => {
        const paramsSchema = z.object({ campaignId: z.string().min(1) });
        const parsed = paramsSchema.safeParse(request.params);

        if (!parsed.success) {
            return sendValidationError(reply, parsed.error);
        }

        const result = await enqueueCampaignMetricsRefresh(parsed.data.campaignId);
        return reply.send({
            message: "Metrics refresh queued",
            ...result,
        });
    });
}
