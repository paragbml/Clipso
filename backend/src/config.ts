import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().default(8080),
    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().min(1),
    RUN_INLINE_WORKER: z.string().optional().default("false"),
    METRICS_REFRESH_CRON: z.string().default("*/15 * * * *"),
    ENABLE_MOCK_CRAWLER: z.string().optional().default("true"),
    YOUTUBE_API_KEY: z.string().optional(),
    TIKTOK_ACCESS_TOKEN: z.string().optional(),
    INSTAGRAM_ACCESS_TOKEN: z.string().optional(),
    TWITCH_CLIENT_ID: z.string().optional(),
    TWITCH_CLIENT_SECRET: z.string().optional(),
    X_BEARER_TOKEN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Invalid environment variables: ${issues}`);
}

const clean = (value?: string): string | undefined => {
    if (!value) {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
};

const raw = parsed.data;

export const env = {
    ...raw,
    RUN_INLINE_WORKER: raw.RUN_INLINE_WORKER === "true",
    ENABLE_MOCK_CRAWLER: raw.ENABLE_MOCK_CRAWLER !== "false",
    YOUTUBE_API_KEY: clean(raw.YOUTUBE_API_KEY),
    TIKTOK_ACCESS_TOKEN: clean(raw.TIKTOK_ACCESS_TOKEN),
    INSTAGRAM_ACCESS_TOKEN: clean(raw.INSTAGRAM_ACCESS_TOKEN),
    TWITCH_CLIENT_ID: clean(raw.TWITCH_CLIENT_ID),
    TWITCH_CLIENT_SECRET: clean(raw.TWITCH_CLIENT_SECRET),
    X_BEARER_TOKEN: clean(raw.X_BEARER_TOKEN),
};
