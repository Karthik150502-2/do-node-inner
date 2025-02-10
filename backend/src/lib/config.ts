import { config } from "dotenv";
config()

export const IS_PROD = process.env.NODE_ENV === "production"
export const REDIS_USERNAME = process.env.REDIS_USERNAME || "";
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD || "";
export const REDIS_HOST = process.env.REDIS_HOST || "";
export const REDIS_PORT = parseInt(process.env.REDIS_PORT ?? "0");

export const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000
export const JWT_SECRET = process.env.JWT_SECRET ?? "abc123"
