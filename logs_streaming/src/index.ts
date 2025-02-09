import express, { Application, Request, Response } from "express";
import cors from "cors";
import { PORT } from "./lib/config";
import { RedisHandler } from "./redis/redisHandler";
import { StreamHandler } from "./redis/streamHandler";
import rateLimit from "./lib/expressRateLimit";

const app: Application = express();

app.use(express.json())

app.use(cors({
    origin: "*"
}))

app.get("/check-health", async (req: Request, res: Response) => {
    res.json({
        status: 200,
        message: "Server running...."
    });
    return;
})


// Rate limitting the endpoint, to only serve 5 requests per IP per minute in production 
app.get("/logs/:bgJobId", rateLimit, async (req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Getting the background Job Id. using Redis publishes messages to this bgJobId as channel. 
    const { bgJobId } = req.params;

    if (!bgJobId) {
        res.json({
            status: 403,
            message: "bgJobId not defined."
        })
        return
    }

    // Getting the erdis client.
    const redis = await RedisHandler.getRedis();

    // Checking if a stream exists and terminating request if not. 
    const streamExists = await RedisHandler.checkIfStreamExists(redis, `logs:${bgJobId}`);
    if (!streamExists) {
        console.log("Stream does not exist.")
        res.json({
            status: 404,
            message: "Stream does not exist"
        })
        return;
    }

    // Startig a SSE stream.
    const stream = new StreamHandler(redis.duplicate(), res, bgJobId);
    RedisHandler.addStream(stream);

    // Closing the stream when request has been terminated from client. 
    req.on("close", () => {
        console.log(`disconnecting the stream.`);
        RedisHandler.removeStream(stream);
    });

})


app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
