import { Response } from "express";
import Redis from "ioredis";
import { randomUUID, UUID } from "crypto";


export class StreamHandler {

    private redis: Redis;
    private responseObject: Response;
    private streamName: string;
    private bgJobId: string
    private isStreamEnded: boolean = false;
    private lastMsgId: string = "0";
    private id: UUID = randomUUID();


    constructor(redis: Redis, res: Response, bgJobId: string) {
        this.redis = redis;
        this.responseObject = res;
        this.bgJobId = bgJobId
        this.streamName = `logs:${this.bgJobId}`;
        this.subscribeToStream()
    }

    public getId() {
        return this.id;
    }

    public sendLog(message: string): boolean {
        if (this.responseObject.writableEnded) {
            console.log("Cannot write to client, server has been closed.");
            return false;
        }
        // Writing to response stream.
        return this.responseObject.write(`data: ${message}\n\n`, (err) => {
            if (err) {
                console.log({ err });
            }
        });
    }

    public async subscribeToStream() {
        // Connecting to redis
        console.log(`Connecting to stream: ${this.streamName}`)
        await this.redis.connect();
        // Stream Expires in 25 minutes
        await this.redis.expire(this.streamName, 1500);

        // Starting the redis stream subscription.
        while (!this.isStreamEnded && this.redis.status === "ready") {
            console.log("New stream....")
            try {
                // Starting from the first message. BLocks the flow for 5 seconds and starting from the lastId provided. 
                const messages = await this.redis.xread("BLOCK", 5000, "STREAMS", this.streamName, this.lastMsgId);

                // Continuing the loop if no messages are found in 5 seconds.
                if (!messages) {
                    continue
                }

                if (messages) {
                    for (const [stream, entries] of messages) {
                        for (const [id, fields] of entries) {
                            console.log("New messages: ", {
                                stream,
                                fields
                            })

                            if (fields[1] === "END_STREAM") {
                                await this.unSubscribe();
                            }

                            if (this.isStreamEnded) {
                                break;
                            }

                            // Sending the logs via response stream.
                            this.sendLog(fields[1]);

                            // Updating last read Id
                            this.lastMsgId = id;
                        }

                        if (this.isStreamEnded) {
                            break;
                        }
                    }
                }

            } catch (e) {
                this.unSubscribe();
                break;
            }
        }
    }

    // Method unsubscribing redis and ending response stream.
    public async unSubscribe() {
        console.log(`Ending stream ${this.streamName}`);
        this.isStreamEnded = true;
        if (this.redis && ["ready", "connecting", "reconnecting"].includes(this.redis.status)) {
            try {
                await this.redis.unsubscribe(this.streamName);
            } catch (error) {
                console.log("Connection is closed, and unsubscribed.");
            }
        }
        this.responseObject.end();
    }


}