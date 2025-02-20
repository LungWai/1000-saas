import Redis from 'ioredis';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  max: number;       // Max requests per window
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 100,           // 100 requests per minute
};

const API_RATE_LIMITS: Record<string, RateLimitConfig> = {
  '/api/grids': { windowMs: 60 * 1000, max: 100 },
  '/api/grids/subscribe': { windowMs: 60 * 1000, max: 10 },
  '/api/upload': { windowMs: 60 * 1000, max: 5 },
};

export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const ip = request.ip || 'unknown';
  const path = new URL(request.url).pathname;
  const key = `rate-limit:${path}:${ip}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    // Remove old requests
    await redis.zremrangebyscore(key, 0, windowStart);

    // Count requests in current window
    const requestCount = await redis.zcard(key);

    if (requestCount >= config.max) {
      const oldestRequest = await redis.zrange(key, 0, 0, 'WITHSCORES');
      const reset = oldestRequest[1] ? parseInt(oldestRequest[1]) + config.windowMs : now + config.windowMs;
      
      return {
        success: false,
        remaining: 0,
        reset,
      };
    }

    // Add current request
    await redis.zadd(key, now, `${now}`);
    // Set expiry on the key
    await redis.expire(key, Math.ceil(config.windowMs / 1000));

    return {
      success: true,
      remaining: config.max - requestCount - 1,
      reset: now + config.windowMs,
    };
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Fail open - allow request if Redis is down
    return {
      success: true,
      remaining: config.max - 1,
      reset: now + config.windowMs,
    };
  }
}

export function getRateLimitConfig(path: string): RateLimitConfig {
  // Find the most specific matching path
  const matchingPath = Object.keys(API_RATE_LIMITS)
    .sort((a, b) => b.length - a.length)
    .find(pattern => path.startsWith(pattern));

  return matchingPath ? API_RATE_LIMITS[matchingPath] : DEFAULT_CONFIG;
}

export function getRateLimitHeaders(result: { remaining: number; reset: number }) {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toUTCString(),
  };
} 