"use server";

import { Redis } from "@upstash/redis";

const DAILY_GLOBAL_LIMIT = 100;

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
});

function getTodayKey(): string {
  const today = new Date().toISOString().slice(0, 10);
  return `design:rate_limit:${today}`;
}

type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; message: string };

export async function checkRateLimit(): Promise<RateLimitResult> {
  try {
    const key = getTodayKey();
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, 86400);
    }

    if (current > DAILY_GLOBAL_LIMIT) {
      return {
        allowed: false,
        message:
          "今日はたくさんの方に受験いただいて、1日の上限に達しちゃいました。明日また来てくださいね〜",
      };
    }

    return { allowed: true, remaining: DAILY_GLOBAL_LIMIT - current };
  } catch {
    return { allowed: true, remaining: DAILY_GLOBAL_LIMIT };
  }
}
