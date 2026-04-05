import { SubmissionStatus } from "@prisma/client";
import { crawlPostMetrics } from "../crawler/index.js";
import { prisma } from "../lib/db.js";
import { enqueueMetricsRefresh } from "../lib/queue.js";

function calcEngagementRate(views: number, likes: number, comments: number, shares: number, saves: number): number {
    if (views <= 0) {
        return 0;
    }
    const engagement = likes + comments + shares + saves;
    return Number(((engagement / views) * 100).toFixed(2));
}

async function recomputeSubmissionStats(submissionId: string): Promise<void> {
    const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: { socialPosts: true },
    });

    if (!submission || submission.socialPosts.length === 0) {
        return;
    }

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    let latestViews = 0;
    let latestLikes = 0;
    let latestComments = 0;
    let latestShares = 0;
    let latestSaves = 0;
    let viewsDelta24h = 0;

    for (const post of submission.socialPosts) {
        const latestSample = await prisma.metricSample.findFirst({
            where: { socialPostId: post.id },
            orderBy: { fetchedAt: "desc" },
        });

        if (!latestSample) {
            continue;
        }

        latestViews += latestSample.views;
        latestLikes += latestSample.likes;
        latestComments += latestSample.comments;
        latestShares += latestSample.shares;
        latestSaves += latestSample.saves;

        const sample24h = await prisma.metricSample.findFirst({
            where: {
                socialPostId: post.id,
                fetchedAt: { lte: cutoff },
            },
            orderBy: { fetchedAt: "desc" },
        });

        if (sample24h) {
            viewsDelta24h += latestSample.views - sample24h.views;
        }
    }

    const engagementRate = calcEngagementRate(
        latestViews,
        latestLikes,
        latestComments,
        latestShares,
        latestSaves,
    );

    await prisma.submissionStats.upsert({
        where: { submissionId },
        update: {
            latestViews,
            latestLikes,
            latestComments,
            latestShares,
            latestSaves,
            viewsDelta24h,
            engagementRate,
            totalEarnings: submission.payoutCents ?? 0,
        },
        create: {
            submissionId,
            latestViews,
            latestLikes,
            latestComments,
            latestShares,
            latestSaves,
            viewsDelta24h,
            engagementRate,
            totalEarnings: submission.payoutCents ?? 0,
        },
    });
}

async function recomputeCampaignStats(campaignId: string): Promise<void> {
    const submissions = await prisma.submission.findMany({
        where: { campaignId },
        include: { stats: true },
    });

    const totals = {
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        avgEngagementRate: 0,
    };

    let engagementCount = 0;

    for (const submission of submissions) {
        if (!submission.stats) {
            continue;
        }

        totals.totalViews += submission.stats.latestViews;
        totals.totalLikes += submission.stats.latestLikes;
        totals.totalComments += submission.stats.latestComments;
        totals.totalShares += submission.stats.latestShares;
        totals.avgEngagementRate += submission.stats.engagementRate;
        engagementCount += 1;
    }

    const avgEngagementRate =
        engagementCount > 0 ? Number((totals.avgEngagementRate / engagementCount).toFixed(2)) : 0;

    await prisma.campaignStats.upsert({
        where: { campaignId },
        update: {
            totalViews: totals.totalViews,
            totalLikes: totals.totalLikes,
            totalComments: totals.totalComments,
            totalShares: totals.totalShares,
            totalSubmissions: submissions.length,
            avgEngagementRate,
        },
        create: {
            campaignId,
            totalViews: totals.totalViews,
            totalLikes: totals.totalLikes,
            totalComments: totals.totalComments,
            totalShares: totals.totalShares,
            totalSubmissions: submissions.length,
            avgEngagementRate,
        },
    });
}

export async function refreshSubmissionMetrics(submissionId: string): Promise<void> {
    const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: { socialPosts: true },
    });

    if (!submission) {
        throw new Error("Submission not found");
    }

    for (const socialPost of submission.socialPosts) {
        const metrics = await crawlPostMetrics(socialPost);

        await prisma.metricSample.create({
            data: {
                socialPostId: socialPost.id,
                views: metrics.views,
                likes: metrics.likes,
                comments: metrics.comments,
                shares: metrics.shares,
                saves: metrics.saves,
                watchTimeSecond: metrics.watchTimeSecond,
                fetchedAt: metrics.fetchedAt,
            },
        });
    }

    await recomputeSubmissionStats(submissionId);
    await recomputeCampaignStats(submission.campaignId);
}

export async function enqueueCampaignMetricsRefresh(campaignId: string): Promise<{ queued: number }> {
    const submissions = await prisma.submission.findMany({
        where: {
            campaignId,
            status: {
                in: [SubmissionStatus.PENDING_REVIEW, SubmissionStatus.APPROVED],
            },
            socialPosts: { some: {} },
        },
        select: { id: true },
    });

    await Promise.all(submissions.map((submission) => enqueueMetricsRefresh(submission.id, "campaign-update")));

    return { queued: submissions.length };
}
