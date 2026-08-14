"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Basic development request logging
app.use((req, res, next) => {
    if (process.env.NODE_ENV === "development") {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    }
    next();
});
// Health endpoint
app.get("/api/v1/health", (req, res) => {
    res.json({
        success: true,
        data: {
            status: "ok",
            database: "connected"
        }
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Endpoint not found" } });
});
// Centralized error handler
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" } });
});
exports.default = app;
