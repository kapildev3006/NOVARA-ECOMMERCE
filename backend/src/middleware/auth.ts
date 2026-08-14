import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, JwtPayload } from "../utils/jwt";
import { User } from "../models/User";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Missing or invalid authorization header" } });
    }

    const token = authHeader.split(" ")[1];
    
    try {
      const decoded = verifyAccessToken(token);
      
      // Optionally verify user is still active in DB
      const user = await User.findById(decoded.userId).select("status");
      if (!user || user.status !== "Active") {
         return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "User is inactive or deleted" } });
      }

      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid or expired token" } });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" } });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Insufficient permissions" } });
    }

    next();
  };
};
