import { Redis } from "ioredis";
import { env } from "../config.js";

export const redis = env.REDIS_URL
    ? new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: true,
    })
    : null;
