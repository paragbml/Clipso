import type { Platform, SocialPost } from "@prisma/client";

export type CrawledMetrics = {
  platform: Platform;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  watchTimeSecond?: number;
  fetchedAt: Date;
  source: "api" | "mock";
};

export interface PlatformConnector {
  fetchMetrics(post: SocialPost): Promise<CrawledMetrics>;
}
