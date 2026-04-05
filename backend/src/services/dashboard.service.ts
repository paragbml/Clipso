import { prisma } from "../lib/db.js";

export async function getClipperDashboard(clipperId: string) {
    const submissions = await prisma.submission.findMany({
        where: { clipperId },
        include: {
            campaign: true,
            socialPosts: true,
            stats: true,
        },
        orderBy: { createdAt: "desc" },
    });

    const totals = {
        submissions: submissions.length,
        approvedSubmissions: submissions.filter((item) => item.status === "APPROVED").length,
        totalViews: submissions.reduce((sum, item) => sum + (item.stats?.latestViews ?? 0), 0),
        totalLikes: submissions.reduce((sum, item) => sum + (item.stats?.latestLikes ?? 0), 0),
        totalEarningsCents: submissions.reduce((sum, item) => sum + (item.payoutCents ?? 0), 0),
        avgEngagementRate: 0,
    };

    const engagementValues = submissions
        .map((item) => item.stats?.engagementRate)
        .filter((value): value is number => typeof value === "number");

    totals.avgEngagementRate =
        engagementValues.length > 0
            ? Number((engagementValues.reduce((sum, value) => sum + value, 0) / engagementValues.length).toFixed(2))
            : 0;

    return {
        clipperId,
        totals,
        submissions: submissions.map((submission) => ({
            id: submission.id,
            campaignId: submission.campaignId,
            campaignTitle: submission.campaign.title,
            status: submission.status,
            platform: submission.platform,
            sourceUrl: submission.sourceUrl,
            latestViews: submission.stats?.latestViews ?? 0,
            engagementRate: submission.stats?.engagementRate ?? 0,
            payoutCents: submission.payoutCents ?? 0,
            createdAt: submission.createdAt,
        })),
    };
}

export async function getCampaignDashboard(campaignId: string) {
    const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
            stats: true,
            submissions: {
                include: {
                    clipper: true,
                    stats: true,
                    socialPosts: true,
                },
                orderBy: { createdAt: "desc" },
            },
        },
    });

    if (!campaign) {
        throw new Error("Campaign not found");
    }

    return {
        campaign: {
            id: campaign.id,
            title: campaign.title,
            status: campaign.status,
            budgetCents: campaign.budgetCents,
            createdAt: campaign.createdAt,
        },
        stats: campaign.stats ?? {
            totalViews: 0,
            totalLikes: 0,
            totalComments: 0,
            totalShares: 0,
            totalSubmissions: campaign.submissions.length,
            avgEngagementRate: 0,
            updatedAt: null,
        },
        submissions: campaign.submissions.map((submission) => ({
            id: submission.id,
            clipper: {
                id: submission.clipper.id,
                name: submission.clipper.name,
                email: submission.clipper.email,
            },
            status: submission.status,
            latestViews: submission.stats?.latestViews ?? 0,
            engagementRate: submission.stats?.engagementRate ?? 0,
            payoutCents: submission.payoutCents ?? 0,
            sourceUrl: submission.sourceUrl,
            platform: submission.platform,
        })),
    };
}
