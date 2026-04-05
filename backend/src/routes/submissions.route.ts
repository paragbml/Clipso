import { SubmissionStatus } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { enqueueMetricsRefresh } from "../lib/queue.js";
import {
    createSubmission,
    getSubmissionById,
    listCampaignSubmissions,
    listClipperSubmissions,
    updateSubmissionReview,
} from "../services/submission.service.js";

function sendValidationError(reply: { status: (code: number) => { send: (payload: unknown) => unknown } }, error: z.ZodError) {
    return reply.status(400).send({
        error: "Validation failed",
        details: error.flatten(),
    });
}

export async function submissionsRoutes(app: FastifyInstance): Promise<void> {
    app.post("/submissions", async (request, reply) => {
        const bodySchema = z.object({
            campaignId: z.string().min(1),
            clipperId: z.string().min(1),
            sourceUrl: z.string().url(),
            caption: z.string().optional(),
            handle: z.string().optional(),
        });

        const parsed = bodySchema.safeParse(request.body);
        if (!parsed.success) {
            return sendValidationError(reply, parsed.error);
        }

        const submission = await createSubmission(parsed.data);
        return reply.status(201).send({ submission });
    });

    app.get("/submissions/:submissionId", async (request, reply) => {
        const paramsSchema = z.object({ submissionId: z.string().min(1) });
        const parsed = paramsSchema.safeParse(request.params);

        if (!parsed.success) {
            return sendValidationError(reply, parsed.error);
        }

        const submission = await getSubmissionById(parsed.data.submissionId);
        if (!submission) {
            return reply.status(404).send({ error: "Submission not found" });
        }

        return reply.send({ submission });
    });

    app.get("/clippers/:clipperId/submissions", async (request, reply) => {
        const paramsSchema = z.object({ clipperId: z.string().min(1) });
        const parsed = paramsSchema.safeParse(request.params);

        if (!parsed.success) {
            return sendValidationError(reply, parsed.error);
        }

        const submissions = await listClipperSubmissions(parsed.data.clipperId);
        return reply.send({ submissions });
    });

    app.get("/campaigns/:campaignId/submissions", async (request, reply) => {
        const paramsSchema = z.object({ campaignId: z.string().min(1) });
        const parsed = paramsSchema.safeParse(request.params);

        if (!parsed.success) {
            return sendValidationError(reply, parsed.error);
        }

        const submissions = await listCampaignSubmissions(parsed.data.campaignId);
        return reply.send({ submissions });
    });

    app.patch("/submissions/:submissionId/review", async (request, reply) => {
        const paramsSchema = z.object({ submissionId: z.string().min(1) });
        const bodySchema = z.object({
            status: z.nativeEnum(SubmissionStatus),
            payoutCents: z.number().int().nonnegative().optional(),
        });

        const params = paramsSchema.safeParse(request.params);
        const body = bodySchema.safeParse(request.body);

        if (!params.success) {
            return sendValidationError(reply, params.error);
        }

        if (!body.success) {
            return sendValidationError(reply, body.error);
        }

        const submission = await updateSubmissionReview({
            submissionId: params.data.submissionId,
            status: body.data.status,
            payoutCents: body.data.payoutCents,
        });

        return reply.send({ submission });
    });

    app.post("/submissions/:submissionId/refresh-metrics", async (request, reply) => {
        const paramsSchema = z.object({ submissionId: z.string().min(1) });
        const parsed = paramsSchema.safeParse(request.params);

        if (!parsed.success) {
            return sendValidationError(reply, parsed.error);
        }

        await enqueueMetricsRefresh(parsed.data.submissionId, "manual");
        return reply.send({ message: "Metrics refresh queued" });
    });
}
