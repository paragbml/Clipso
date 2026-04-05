import type { SocialPost } from "@prisma/client";
import { createHash } from "crypto";
import type { CrawledMetrics, PlatformConnector } from "../types.js";

function seededInt(seed: string, min: number, max: number): number {
    const digest = createHash("sha256").update(seed).digest("hex");
    const value = Number.parseInt(digest.slice(0, 8), 16);
    return min + (value % (max - min + 1));
}

export class MockConnector implements PlatformConnector {
    async fetchMetrics(post: SocialPost): Promise<CrawledMetrics> {
        const now = new Date();
        const ageHours = Math.max(1, Math.floor((Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60)));

        const baseViews = seededInt(`${post.externalPostId}:base`, 5000, 120000);
        const velocity = seededInt(`${post.externalPostId}:velocity`, 120, 1800);
        const jitter = seededInt(`${post.externalPostId}:${Math.floor(Date.now() / (1000 * 60 * 10))}`, 0, 1200);

        const views = baseViews + ageHours * velocity + jitter;

        const likeRatio = seededInt(`${post.externalPostId}:like-ratio`, 2, 12) / 100;
        const commentRatio = seededInt(`${post.externalPostId}:comment-ratio`, 1, 4) / 100;
        const shareRatio = seededInt(`${post.externalPostId}:share-ratio`, 1, 3) / 100;
        const saveRatio = seededInt(`${post.externalPostId}:save-ratio`, 1, 3) / 100;

        const likes = Math.floor(views * likeRatio);
        const comments = Math.floor(views * commentRatio);
        const shares = Math.floor(views * shareRatio);
        const saves = Math.floor(views * saveRatio);
        const watchTimeSecond = Math.floor(views * seededInt(`${post.externalPostId}:watch`, 7, 35));

        return {
            platform: post.platform,
            views,
            likes,
            comments,
            shares,
            saves,
            watchTimeSecond,
            fetchedAt: now,
            source: "mock",
        };
    }
}
