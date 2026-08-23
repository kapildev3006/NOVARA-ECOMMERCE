"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestIdMiddleware = void 0;
const crypto_1 = __importDefault(require("crypto"));
const requestIdMiddleware = (req, res, next) => {
    req.id = req.headers["x-request-id"] || crypto_1.default.randomUUID();
    res.setHeader("X-Request-Id", req.id);
    next();
};
exports.requestIdMiddleware = requestIdMiddleware;
