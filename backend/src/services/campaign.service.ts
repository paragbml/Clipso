import { CampaignStatus, type Campaign } from "@prisma/client";
import { prisma } from "../lib/db.js";

export type CreateCampaignInput = {
    creatorId: string;
    title: string;
    description?: string;
    budgetCents: number;
    startDate?: string;
    endDate?: string;
    status?: CampaignStatus;
};

function toDate(value?: string): Date | undefined {
    if (!value) {
        return undefined;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function createCampaign(input: CreateCampaignInput): Promise<Campaign> {
    return prisma.campaign.create({
        data: {
            creatorId: input.creatorId,
            title: input.title,
            description: input.description,
            budgetCents: input.budgetCents,
            status: input.status ?? CampaignStatus.LIVE,
            startDate: toDate(input.startDate),
            endDate: toDate(input.endDate),
        },
    });
}

export async function listCampaigns(filters: {
    creatorId?: string;
    status?: CampaignStatus;
}): Promise<Campaign[]> {
    return prisma.campaign.findMany({
        where: {
            creatorId: filters.creatorId,
            status: filters.status,
        },
        orderBy: { createdAt: "desc" },
    });
}
