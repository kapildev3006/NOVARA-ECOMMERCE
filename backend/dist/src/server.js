"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const env_1 = require("./config/env");
const startServer = async () => {
    (0, env_1.validateEnv)();
    await (0, database_1.connectDB)();
    app_1.default.listen(env_1.config.PORT, () => {
        console.log(`Server running in ${env_1.config.NODE_ENV} mode on port ${env_1.config.PORT}`);
    });
};
startServer();
