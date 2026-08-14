import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import categoryRoutes from "./routes/category";
import productRoutes from "./routes/product";
import adminCategoryRoutes from "./routes/adminCategory";
import adminProductRoutes from "./routes/adminProduct";
import homepageRoutes from "./routes/homepage";
import adminHomepageRoutes from "./routes/adminHomepage";

import { requestIdMiddleware } from "./middleware/requestId";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(requestIdMiddleware);

// Basic development request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// Health endpoint
app.get("/api/v1/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      database: "connected"
    }
  });
});

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/admin/categories", adminCategoryRoutes);
app.use("/api/v1/admin/products", adminProductRoutes);
app.use("/api/v1/homepage", homepageRoutes);
app.use("/api/v1/admin/homepage", adminHomepageRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Endpoint not found" } });
});

// Centralized error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" } });
});

export default app;
