import { Platform, type SocialPost } from "@prisma/client";
import { env } from "../config.js";
import { MockConnector } from "./connectors/mock.connector.js";
import { YouTubeConnector } from "./connectors/youtube.connector.js";
import type { CrawledMetrics } from "./types.js";

const mockConnector = new MockConnector();
const youtubeConnector = new YouTubeConnector(env.YOUTUBE_API_KEY);

export async function crawlPostMetrics(post: SocialPost): Promise<CrawledMetrics> {
  if (post.platform === Platform.YOUTUBE_SHORTS && env.YOUTUBE_API_KEY) {
    return youtubeConnector.fetchMetrics(post);
  }

  if (env.ENABLE_MOCK_CRAWLER) {
    return mockConnector.fetchMetrics(post);
  }

  throw new Error(
    `No crawler connector configured for platform ${post.platform}. Provide credentials or enable mock mode.`,
  );
}
