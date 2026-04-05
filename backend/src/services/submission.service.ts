import {
    type Submission,
    SubmissionStatus,
} from "@prisma/client";
import { prisma } from "../lib/db.js";
import { parseSocialPostUrl } from "../lib/platform.js";

export type CreateSubmissionInput = {
    campaignId: string;
    clipperId: string;
    sourceUrl: string;
    caption?: string;
    handle?: string;
};

export async function createSubmission(input: CreateSubmissionInput): Promise<Submission> {
    const campaign = await prisma.campaign.findUnique({ where: { id: input.campaignId } });
    if (!campaign) {
        throw new Error("Campaign not found");
    }

    const post = parseSocialPostUrl(input.sourceUrl);

    const submission = await prisma.submission.create({
        data: {
            campaignId: input.campaignId,
            clipperId: input.clipperId,
            sourceUrl: post.normalizedUrl,
            platform: post.platform,
            caption: input.caption,
            socialPosts: {
                create: {
                    platform: post.platform,
                    externalPostId: post.externalPostId,
                    postUrl: post.normalizedUrl,
                    handle: input.handle,
                },
            },
        },
    });

    return submission;
}

export async function getSubmissionById(submissionId: string) {
    return prisma.submission.findUnique({
        where: { id: submissionId },
        include: {
            campaign: true,
            clipper: true,
            socialPosts: true,
            stats: true,
        },
    });
}

export async function listClipperSubmissions(clipperId: string) {
    return prisma.submission.findMany({
        where: { clipperId },
        include: {
            campaign: true,
            socialPosts: true,
            stats: true,
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function updateSubmissionReview(input: {
    submissionId: string;
    status: SubmissionStatus;
    payoutCents?: number;
}) {
    return prisma.submission.update({
        where: { id: input.submissionId },
        data: {
            status: input.status,
            payoutCents: input.payoutCents,
        },
        include: {
            campaign: true,
            socialPosts: true,
            stats: true,
        },
    });
}
