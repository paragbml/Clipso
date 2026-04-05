import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/db.js";

export async function devRoutes(app: FastifyInstance): Promise<void> {
    app.get("/dev/bootstrap", async (_request, reply) => {
        const [creator, clipper, campaigns] = await Promise.all([
            prisma.user.findFirst({
                where: { role: "CREATOR" },
                orderBy: { createdAt: "asc" },
                select: { id: true, name: true, email: true },
            }),
            prisma.user.findFirst({
                where: { role: "CLIPPER" },
                orderBy: { createdAt: "asc" },
                select: { id: true, name: true, email: true },
            }),
            prisma.campaign.findMany({
                orderBy: { createdAt: "desc" },
                take: 10,
                select: {
                    id: true,
                    title: true,
                    status: true,
                    creatorId: true,
                },
            }),
        ]);

        return reply.send({
            creator,
            clipper,
            campaigns,
        });
    });
}
