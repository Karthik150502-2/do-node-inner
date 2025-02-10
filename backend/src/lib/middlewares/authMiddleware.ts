import { NextFunction, Request, Response } from "express";
import { jwtVerify } from "jose"
import { JWT_SECRET } from "../config";

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const tokenString = req.headers["authorization"];
    if (!tokenString) {
        res.json({
            status: 401,
            message: "Unauthorized."
        })
        return
    }

    const token = tokenString.split(" ")[1];

    if (!token) {
        res.json({
            status: 401,
            message: "Unauthorized."
        })
        return
    }

    try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        await jwtVerify(token, secret);
    } catch (e) {
        res.json({
            status: 401,
            message: "Unauthorized."
        })
        return
    }
    next();
}