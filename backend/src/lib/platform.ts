import { Platform } from "@prisma/client";
import { createHash } from "crypto";

export type ParsedSocialPost = {
    platform: Platform;
    externalPostId: string;
    normalizedUrl: string;
};

function normalizeUrl(url: URL): string {
    url.hash = "";
    return `${url.origin}${url.pathname}`.replace(/\/$/, "");
}

function fallbackExternalId(input: string): string {
    return createHash("sha256").update(input).digest("hex").slice(0, 20);
}

export function parseSocialPostUrl(rawUrl: string): ParsedSocialPost {
    let url: URL;
    try {
        url = new URL(rawUrl);
    } catch {
        throw new Error("Invalid social post URL");
    }

    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const path = url.pathname;
    const segments = path.split("/").filter(Boolean);

    if (host.includes("youtube.com") || host.includes("youtu.be")) {
        const shortsMatch = path.match(/\/shorts\/([^/?#]+)/i);
        const watchId = url.searchParams.get("v");
        const shortId = shortsMatch?.[1] ?? watchId ?? segments[0] ?? fallbackExternalId(rawUrl);
        return {
            platform: Platform.YOUTUBE_SHORTS,
            externalPostId: shortId,
            normalizedUrl: normalizeUrl(url),
        };
    }

    if (host.includes("tiktok.com")) {
        const videoMatch = path.match(/\/video\/([^/?#]+)/i);
        const postId = videoMatch?.[1] ?? segments.at(-1) ?? fallbackExternalId(rawUrl);
        return {
            platform: Platform.TIKTOK,
            externalPostId: postId,
            normalizedUrl: normalizeUrl(url),
        };
    }

    if (host.includes("instagram.com")) {
        const igMatch = path.match(/\/(?:reel|p|tv)\/([^/?#]+)/i);
        const postId = igMatch?.[1] ?? segments.at(-1) ?? fallbackExternalId(rawUrl);
        return {
            platform: Platform.INSTAGRAM,
            externalPostId: postId,
            normalizedUrl: normalizeUrl(url),
        };
    }

    if (host.includes("twitch.tv") || host.includes("clips.twitch.tv")) {
        const clipMatch = path.match(/\/clip\/([^/?#]+)/i);
        const postId = clipMatch?.[1] ?? segments.at(-1) ?? fallbackExternalId(rawUrl);
        return {
            platform: Platform.TWITCH,
            externalPostId: postId,
            normalizedUrl: normalizeUrl(url),
        };
    }

    if (host === "x.com" || host.includes("twitter.com")) {
        const statusMatch = path.match(/\/status\/([^/?#]+)/i);
        const postId = statusMatch?.[1] ?? segments.at(-1) ?? fallbackExternalId(rawUrl);
        return {
            platform: Platform.X,
            externalPostId: postId,
            normalizedUrl: normalizeUrl(url),
        };
    }

    return {
        platform: Platform.OTHER,
        externalPostId: fallbackExternalId(rawUrl),
        normalizedUrl: normalizeUrl(url),
    };
}
