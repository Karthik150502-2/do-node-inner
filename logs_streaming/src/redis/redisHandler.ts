import Redis from "ioredis";
import {
    REDIS_HOST,
    REDIS_PASSWORD,
    REDIS_PORT,
    REDIS_USERNAME
} from "../lib/config";
import { StreamHandler } from "./streamHandler";

export class RedisHandler {

    private static streams: Record<string, StreamHandler> = {};
    private static client: Redis | null = null;

    private constructor() { }

    static async getRedis(): Promise<Redis> {
        if (!this.client) {
            this.client = new Redis({
                username: REDIS_USERNAME,
                password: REDIS_PASSWORD,
                host: REDIS_HOST,
                port: REDIS_PORT,
                // lazyConnect = true, lets us connect the duplicate redis instances explicitly.
                lazyConnect: true,
            });
        }
        return this.client;
    }

    public static async checkIfStreamExists(redis: Redis, streamName: string) {
        const streamExists = redis.exists(streamName);
        return streamExists
    }

    public static async addStream(stream: StreamHandler) {
        // Adding stream in memory. 
        this.streams[stream.getId()] = stream;
        console.log("Stream added in memory.");
    }

    public static async removeStream(stream: StreamHandler) {
        let streamId = stream.getId();

        // Unsubscribing and removing the stream from in memory record.
        if (this.streams[streamId]) {
            this.streams[streamId].unSubscribe();
            delete this.streams[streamId];
            console.log("Stream unsubscribed and deleted.");
        }
    }
}



