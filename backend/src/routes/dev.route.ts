import { CampaignStatus, Platform, SubmissionStatus, UserRole } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/db.js";

async function seedDemoData() {
    const creator = await prisma.user.upsert({
        where: { email: "creator@clipso.dev" },
        update: { name: "Creator Demo", role: UserRole.CREATOR },
        create: {
            email: "creator@clipso.dev",
            name: "Creator Demo",
            role: UserRole.CREATOR,
        },
        select: { id: true, name: true, email: true },
    });

    const clipper = await prisma.user.upsert({
        where: { email: "clipper@clipso.dev" },
        update: { name: "Clipper Demo", role: UserRole.CLIPPER },
        create: {
            email: "clipper@clipso.dev",
            name: "Clipper Demo",
            role: UserRole.CLIPPER,
        },
        select: { id: true, name: true, email: true },
    });

    const campaign = await prisma.campaign.upsert({
        where: { id: "camp_seed_001" },
        update: {
            title: "Podcast Shorts Launch",
            description: "Weekly short-form clips from podcast highlights",
            budgetCents: 300000,
            status: CampaignStatus.LIVE,
            creatorId: creator.id,
        },
        create: {
            id: "camp_seed_001",
            title: "Podcast Shorts Launch",
            description: "Weekly short-form clips from podcast highlights",
            budgetCents: 300000,
            status: CampaignStatus.LIVE,
            creatorId: creator.id,
        },
    });

    const submission = await prisma.submission.upsert({
        where: { id: "sub_seed_001" },
        update: {
            campaignId: campaign.id,
            clipperId: clipper.id,
            sourceUrl: "https://www.youtube.com/shorts/abc123seed",
            platform: Platform.YOUTUBE_SHORTS,
            status: SubmissionStatus.APPROVED,
            payoutCents: 4500,
            caption: "Podcast growth hack clip",
        },
        create: {
            id: "sub_seed_001",
            campaignId: campaign.id,
            clipperId: clipper.id,
            sourceUrl: "https://www.youtube.com/shorts/abc123seed",
            platform: Platform.YOUTUBE_SHORTS,
            status: SubmissionStatus.APPROVED,
            payoutCents: 4500,
            caption: "Podcast growth hack clip",
        },
    });

    await prisma.socialPost.upsert({
        where: {
            platform_externalPostId: {
                platform: Platform.YOUTUBE_SHORTS,
                externalPostId: "abc123seed",
            },
        },
        update: {
            submissionId: submission.id,
            postUrl: "https://www.youtube.com/shorts/abc123seed",
            handle: "@clipso_demo",
        },
        create: {
            submissionId: submission.id,
            platform: Platform.YOUTUBE_SHORTS,
            externalPostId: "abc123seed",
            postUrl: "https://www.youtube.com/shorts/abc123seed",
            handle: "@clipso_demo",
        },
    });

    return { creator, clipper };
}

export async function devRoutes(app: FastifyInstance): Promise<void> {
    app.post("/dev/seed", async (_request, reply) => {
        const seeded = await seedDemoData();

        return reply.send({
            seeded: true,
            creator: seeded.creator,
            clipper: seeded.clipper,
        });
    });

    app.get("/dev/bootstrap", async (_request, reply) => {
        let [creator, clipper, campaigns] = await Promise.all([
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

        if (!creator || !clipper || campaigns.length === 0) {
            const seeded = await seedDemoData();
            creator = creator ?? seeded.creator;
            clipper = clipper ?? seeded.clipper;
            campaigns = await prisma.campaign.findMany({
                orderBy: { createdAt: "desc" },
                take: 10,
                select: {
                    id: true,
                    title: true,
                    status: true,
                    creatorId: true,
                },
            });
        }

        return reply.send({
            creator,
            clipper,
            campaigns,
        });
    });
}
