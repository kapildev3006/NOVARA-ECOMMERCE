import dotenv from "dotenv";

dotenv.config();

export const config = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGODB_URI: process.env.MONGODB_URI,
  AUDIT_LOG_RETENTION_DAYS: process.env.AUDIT_LOG_RETENTION_DAYS || 90,
  JWT_SECRET: process.env.JWT_SECRET || "default_jwt_secret",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "default_jwt_refresh_secret",
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
};

export function validateEnv() {
  if (!config.MONGODB_URI) {
    console.error("FATAL ERROR: MONGODB_URI is missing from environment variables.");
    process.exit(1);
  }
}
