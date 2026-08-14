import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// Extend Express Request to include requestId
declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  req.id = req.headers["x-request-id"] as string || crypto.randomUUID();
  res.setHeader("X-Request-Id", req.id);
  next();
};
