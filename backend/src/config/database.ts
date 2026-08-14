import mongoose from "mongoose";
import { config } from "./env";

export const connectDB = async () => {
  try {
    if (!config.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing");
    }
    
    if (mongoose.connection.readyState >= 1) {
      return;
    }

    await mongoose.connect(config.MONGODB_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error instanceof Error ? error.message : "Unknown error");
    process.exit(1);
  }
};
