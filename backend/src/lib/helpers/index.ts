import { rateLimit } from "../rateLimit";

export const authorizeRateLimitter = rateLimit(60, 10);
export const streamRateLimitter = rateLimit(60, 10);
