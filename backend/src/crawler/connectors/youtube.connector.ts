import type { SocialPost } from "@prisma/client";
import type { CrawledMetrics, PlatformConnector } from "../types.js";

type YouTubeVideoStatsResponse = {
    items?: Array<{
        statistics?: {
            viewCount?: string;
            likeCount?: string;
            commentCount?: string;
        };
    }>;
};

export class YouTubeConnector implements PlatformConnector {
    constructor(private readonly apiKey?: string) { }

    async fetchMetrics(post: SocialPost): Promise<CrawledMetrics> {
        if (!this.apiKey) {
            throw new Error("YOUTUBE_API_KEY is not configured");
        }

        const endpoint = new URL("https://www.googleapis.com/youtube/v3/videos");
        endpoint.searchParams.set("part", "statistics");
        endpoint.searchParams.set("id", post.externalPostId);
        endpoint.searchParams.set("key", this.apiKey);

        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`YouTube API request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as YouTubeVideoStatsResponse;
        const stats = payload.items?.[0]?.statistics;

        if (!stats) {
            throw new Error("No statistics returned for this YouTube post");
        }

        const views = Number.parseInt(stats.viewCount ?? "0", 10) || 0;
        const likes = Number.parseInt(stats.likeCount ?? "0", 10) || 0;
        const comments = Number.parseInt(stats.commentCount ?? "0", 10) || 0;

        return {
            platform: post.platform,
            views,
            likes,
            comments,
            shares: 0,
            saves: 0,
            fetchedAt: new Date(),
            source: "api",
        };
    }
}
