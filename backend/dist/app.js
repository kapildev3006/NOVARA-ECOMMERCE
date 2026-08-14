"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const category_1 = __importDefault(require("./routes/category"));
const product_1 = __importDefault(require("./routes/product"));
const adminCategory_1 = __importDefault(require("./routes/adminCategory"));
const adminProduct_1 = __importDefault(require("./routes/adminProduct"));
const homepage_1 = __importDefault(require("./routes/homepage"));
const adminHomepage_1 = __importDefault(require("./routes/adminHomepage"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
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
// Routes
app.use("/api/v1/auth", auth_routes_1.default);
app.use("/api/v1/categories", category_1.default);
app.use("/api/v1/products", product_1.default);
app.use("/api/v1/admin/categories", adminCategory_1.default);
app.use("/api/v1/admin/products", adminProduct_1.default);
app.use("/api/v1/homepage", homepage_1.default);
app.use("/api/v1/admin/homepage", adminHomepage_1.default);
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
