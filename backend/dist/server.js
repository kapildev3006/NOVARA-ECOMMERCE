"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const env_1 = require("./config/env");
const socket_1 = require("./realtime/socket");
const scheduler_1 = require("./utils/scheduler");
const startServer = async () => {
    (0, env_1.validateEnv)();
    await (0, database_1.connectDB)();
    const server = http_1.default.createServer(app_1.default);
    // Initialize Socket.IO on the same HTTP server
    (0, socket_1.initializeSocket)(server);
    // Start background workers
    (0, scheduler_1.startScheduler)();
    server.listen(env_1.config.PORT, () => {
        console.log(`Server running in ${env_1.config.NODE_ENV} mode on port ${env_1.config.PORT}`);
    });
};
startServer();
