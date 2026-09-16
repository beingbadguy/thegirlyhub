import crypto from "crypto";
import RateLimit from "@/models/rateLimit.model";

const RATE_LIMIT_SECRET =
  process.env.RATE_LIMIT_SECRET || process.env.TOKEN_SECRET || "girlyhub_rate_secret_key_2026";

export function isLocalhost(ip: string): boolean {
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "localhost" ||
    ip === "::ffff:127.0.0.1"
  );
}

export function getClientIp(request: Request): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const first = xForwardedFor.split(",")[0].trim();
    if (first) return first;
  }
  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) {
    return xRealIp.trim();
  }
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  return "127.0.0.1";
}

export function getUserAgent(request: Request): string {
  return request.headers.get("user-agent") || "unknown";
}

/**
 * Generates a stateless HMAC tamper-proof rate limit token for client headers/cookies.
 */
export function generateRateLimitToken(ip: string, action: string = "order"): string {
  const timestamp = Date.now();
  const payload = `${ip}:${action}:${timestamp}`;
  const hmac = crypto.createHmac("sha256", RATE_LIMIT_SECRET).update(payload).digest("hex");
  return Buffer.from(JSON.stringify({ payload, signature: hmac })).toString("base64url");
}

/**
 * Verifies a stateless client token.
 */
export function verifyRateLimitToken(
  token: string | null | undefined,
  expectedIp: string,
  maxAgeMs: number = 3600000,
): boolean {
  if (!token) return false;
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));
    const { payload, signature } = decoded;
    const expectedSig = crypto.createHmac("sha256", RATE_LIMIT_SECRET).update(payload).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return false;
    }
    const [ip, , timestampStr] = payload.split(":");
    if (ip !== expectedIp) return false;
    const age = Date.now() - Number(timestampStr);
    return age >= 0 && age <= maxAgeMs;
  } catch {
    return false;
  }
}

/**
 * Serverless & Multi-Instance Safe Rate Limiting via atomic MongoDB TTL records.
 */
export async function checkRateLimitAsync(
  key: string,
  limit: number = 3,
  windowMs: number = 60 * 60 * 1000, // 1 hour
): Promise<{ allowed: boolean; remaining: number; retryAfterSeconds: number }> {
  if (process.env.NODE_ENV !== "production" && key.includes("127.0.0.1")) {
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowMs);

  try {
    const record = (await RateLimit.findOneAndUpdate(
      { key },
      {
        $inc: { count: 1 },
        $setOnInsert: { expiresAt },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean()) as any;

    if (record.blockedUntil && new Date(record.blockedUntil) > now) {
      const retryAfter = Math.ceil(
        (new Date(record.blockedUntil).getTime() - now.getTime()) / 1000,
      );
      return { allowed: false, remaining: 0, retryAfterSeconds: retryAfter };
    }

    if (record.count > limit) {
      const retryAfter = Math.ceil(
        (new Date(record.expiresAt).getTime() - now.getTime()) / 1000,
      );
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, retryAfter),
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, limit - record.count),
      retryAfterSeconds: 0,
    };
  } catch (err) {
    console.error("[RateLimiter] DB rate limit check fallback:", err);
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
  }
}

/**
 * Synchronous wrapper with atomic in-memory/async background persistence
 */
const syncFallbackMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  key: string,
  limit: number = 3,
  windowMs: number = 60 * 60 * 1000,
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  if (process.env.NODE_ENV !== "production" && key.includes("127.0.0.1")) {
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
  }

  // Update DB in background asynchronously
  checkRateLimitAsync(key, limit, windowMs).catch(() => {});

  const now = Date.now();
  const record = syncFallbackMap.get(key);

  if (!record || now > record.resetTime) {
    syncFallbackMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (record.count >= limit) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds: retryAfter };
  }

  record.count += 1;
  return { allowed: true, remaining: limit - record.count, retryAfterSeconds: 0 };
}

export async function isIpBlockedAsync(ip: string): Promise<{
  blocked: boolean;
  retryAfterSeconds: number;
}> {
  if (process.env.NODE_ENV !== "production" && isLocalhost(ip)) {
    return { blocked: false, retryAfterSeconds: 0 };
  }

  try {
    const record = (await RateLimit.findOne({ key: `abuse_${ip}` }).lean()) as any;
    if (record?.blockedUntil && new Date(record.blockedUntil) > new Date()) {
      const retryAfter = Math.ceil(
        (new Date(record.blockedUntil).getTime() - Date.now()) / 1000,
      );
      return { blocked: true, retryAfterSeconds: retryAfter };
    }
  } catch (err) {
    console.error("[RateLimiter] Error checking blocked IP:", err);
  }

  return { blocked: false, retryAfterSeconds: 0 };
}

export function isIpBlocked(ip: string): {
  blocked: boolean;
  retryAfterSeconds: number;
} {
  if (process.env.NODE_ENV !== "production" && isLocalhost(ip)) {
    return { blocked: false, retryAfterSeconds: 0 };
  }
  return { blocked: false, retryAfterSeconds: 0 };
}

export async function recordFailedAttemptAsync(
  ip: string,
  userAgent: string,
  reason: string,
  maxFailures: number = 3,
  blockDurationMs: number = 15 * 60 * 1000,
): Promise<void> {
  if (process.env.NODE_ENV !== "production" && isLocalhost(ip)) {
    console.warn(`[Security Alert - DEV] Failed attempt on localhost: ${reason}`);
    return;
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hr window

  try {
    const record = (await RateLimit.findOneAndUpdate(
      { key: `abuse_${ip}` },
      {
        $inc: { failedAttempts: 1 },
        $setOnInsert: { expiresAt },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean()) as any;

    if (record.failedAttempts >= maxFailures) {
      const blockedUntil = new Date(now.getTime() + blockDurationMs);
      await RateLimit.updateOne(
        { key: `abuse_${ip}` },
        {
          $set: {
            blockedUntil,
            expiresAt: new Date(blockedUntil.getTime() + 60000),
          },
        },
      );
      console.warn(
        `[Security Alert] IP ${ip} BLOCKED in MongoDB TTL registry until ${blockedUntil.toISOString()}`,
      );
    }
  } catch (err) {
    console.error("[RateLimiter] Error recording failed attempt:", err);
  }
}

export function recordFailedAttempt(
  ip: string,
  userAgent: string,
  reason: string,
  maxFailures: number = 3,
  blockDurationMs: number = 15 * 60 * 1000,
): void {
  recordFailedAttemptAsync(ip, userAgent, reason, maxFailures, blockDurationMs).catch(
    () => {},
  );
}

export async function clearRateLimit(ipOrKey: string): Promise<void> {
  syncFallbackMap.delete(ipOrKey);
  try {
    await RateLimit.deleteMany({
      key: { $in: [ipOrKey, `order_${ipOrKey}`, `abuse_${ipOrKey}`] },
    });
  } catch {}
}
