import { NextFunction, Request, Response } from "express";
import { RedisHandler } from "../redis/redisHandler";

// Time window in seconds
export const WINDOW_SIZE_IN_SECONDS = 60;

// Max requests per window
export const MAX_REQUESTS = 10;

export function rateLimit(windowSizeSeconds: number = WINDOW_SIZE_IN_SECONDS, maxRequests: number = MAX_REQUESTS) {
    return async function (req: Request, res: Response, next: NextFunction) {
        const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;

        if (!ip) {
            res.status(500).json({ message: "Unable to determine IP address" });
            return
        }

        const key = `rate-limit:${ip}`;
        const redis = await RedisHandler.getRedis();
        try {
            const requestCount = await redis.incr(key);

            if (requestCount === 1) {
                await redis.expire(key, windowSizeSeconds);
            }

            if (requestCount > maxRequests) {
                res.status(429).json({
                    status: 429,
                    message: "Too many requests. Please try again later."
                });
                return
            }

            next();
        } catch (err) {
            console.error("Redis rate limiting error:", err);
            res.status(500).json({ message: "Internal server error" });
            return
        }
    }

}
