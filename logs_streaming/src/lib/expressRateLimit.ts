import { rateLimit } from "express-rate-limit";
import { IS_PROD } from "./config";

export default rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: IS_PROD ? 5 : 100, // Limit each IP to 5 requests per windowMs in production
    message: "Too many requests, please try again later.",
})