import { UserRole } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/db.js";

function sendValidationError(reply: { status: (code: number) => { send: (payload: unknown) => unknown } }, error: z.ZodError) {
    return reply.status(400).send({
        error: "Validation failed",
        details: error.flatten(),
    });
}

export async function usersRoutes(app: FastifyInstance): Promise<void> {
    app.get("/users", async (request, reply) => {
        const querySchema = z.object({
            role: z.nativeEnum(UserRole).optional(),
            email: z.string().email().optional(),
        });

        const parsed = querySchema.safeParse(request.query);
        if (!parsed.success) {
            return sendValidationError(reply, parsed.error);
        }

        const users = await prisma.user.findMany({
            where: {
                role: parsed.data.role,
                email: parsed.data.email,
            },
            orderBy: { createdAt: "asc" },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });

        return reply.send({ users });
    });
}
