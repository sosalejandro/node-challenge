import { Request, Response, NextFunction } from "express";
import { jwtService } from "../infrastructure";


export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const user = jwtService.verifyToken(token);
        (req as any).user = user; // Attach user info to request
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}