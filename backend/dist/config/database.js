"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const connectDB = async () => {
    try {
        if (!env_1.config.MONGODB_URI) {
            throw new Error("MONGODB_URI is missing");
        }
        if (mongoose_1.default.connection.readyState >= 1) {
            return;
        }
        await mongoose_1.default.connect(env_1.config.MONGODB_URI);
        console.log("MongoDB Connected");
    }
    catch (error) {
        console.error("Error connecting to MongoDB:", error instanceof Error ? error.message : "Unknown error");
        process.exit(1);
    }
};
exports.connectDB = connectDB;
