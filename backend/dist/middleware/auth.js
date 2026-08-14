"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const User_1 = require("../models/User");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Missing or invalid authorization header" } });
        }
        const token = authHeader.split(" ")[1];
        try {
            const decoded = (0, jwt_1.verifyAccessToken)(token);
            // Optionally verify user is still active in DB
            const user = await User_1.User.findById(decoded.userId).select("status");
            if (!user || user.status !== "Active") {
                return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "User is inactive or deleted" } });
            }
            req.user = decoded;
            next();
        }
        catch (err) {
            return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid or expired token" } });
        }
    }
    catch (error) {
        console.error("Auth middleware error:", error);
        res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" } });
    }
};
exports.authenticate = authenticate;
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Insufficient permissions" } });
        }
        next();
    };
};
exports.requireRole = requireRole;
