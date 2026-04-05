import { SubmissionStatus } from "@prisma/client";
import cron, { type ScheduledTask } from "node-cron";
import { env } from "../config.js";
import { prisma } from "../lib/db.js";
import { enqueueMetricsRefresh } from "../lib/queue.js";

const ACTIVE_STATUSES: SubmissionStatus[] = [SubmissionStatus.PENDING_REVIEW, SubmissionStatus.APPROVED];

export function startMetricsScheduler(): ScheduledTask {
    return cron.schedule(env.METRICS_REFRESH_CRON, async () => {
        const submissions = await prisma.submission.findMany({
            where: {
                status: { in: ACTIVE_STATUSES },
                socialPosts: { some: {} },
            },
            select: { id: true },
            take: 1000,
            orderBy: { createdAt: "desc" },
        });

        await Promise.all(submissions.map((submission) => enqueueMetricsRefresh(submission.id, "scheduled")));
    });
}
