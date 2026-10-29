import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type LimitName = "chat" | "ingest";

function hasUpstashConfiguration() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return Boolean(
    url &&
      token &&
      !url.startsWith("your_") &&
      !token.startsWith("your_"),
  );
}

const redis = hasUpstashConfiguration() ? Redis.fromEnv() : undefined;
const limiters = redis
  ? {
      chat: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, "1 m"),
        prefix: "rag-chat:chat",
        timeout: 1_500,
      }),
      ingest: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "10 m"),
        prefix: "rag-chat:ingest",
        timeout: 1_500,
      }),
    }
  : undefined;

let warnedAboutDevelopmentBypass = false;

export async function rateLimitResponse(
  name: LimitName,
  userId: string,
) {
  if (!limiters) {
    if (process.env.NODE_ENV === "production") {
      return Response.json(
        {
          error:
            "Rate limiting is not configured. Add the Upstash Redis environment variables.",
        },
        { status: 503 },
      );
    }

    if (!warnedAboutDevelopmentBypass) {
      console.warn(
        "Upstash is not configured; API rate limiting is bypassed in development.",
      );
      warnedAboutDevelopmentBypass = true;
    }
    return null;
  }

  try {
    const result = await limiters[name].limit(userId);
    if (result.success) return null;

    const retryAfter = Math.max(
      1,
      Math.ceil((result.reset - Date.now()) / 1_000),
    );
    return Response.json(
      {
        error:
          name === "chat"
            ? "You are asking questions too quickly. Please wait a moment and try again."
            : "You have reached the PDF upload limit. Please try again later.",
        retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": String(result.remaining),
          "X-RateLimit-Reset": String(result.reset),
        },
      },
    );
  } catch (error) {
    console.error("Rate-limit check failed", error);
    return Response.json(
      { error: "Request protection is temporarily unavailable. Please retry." },
      { status: 503 },
    );
  }
}
