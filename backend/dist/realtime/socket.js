"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitToAll = exports.emitToOrder = exports.emitToSuperAdmins = exports.emitToAdmins = exports.emitToUser = exports.initializeSocket = void 0;
const socket_io_1 = require("socket.io");
const env_1 = require("../config/env");
const jwt_1 = require("../utils/jwt");
const User_1 = require("../models/User");
let io;
const initializeSocket = (server) => {
    const corsOrigin = env_1.config.NODE_ENV === "production"
        ? env_1.config.FRONTEND_URL
        : env_1.config.FRONTEND_URL || "http://localhost:3000";
    io = new socket_io_1.Server(server, {
        cors: {
            origin: corsOrigin,
            methods: ["GET", "POST"],
            credentials: true,
        },
    });
    // Authentication Middleware
    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error("Authentication error: Token missing"));
        }
        try {
            const decoded = (0, jwt_1.verifyAccessToken)(token);
            // Optionally verify user is active
            const user = await User_1.User.findById(decoded.userId).select("status");
            if (!user || user.status !== "Active") {
                return next(new Error("Authentication error: User inactive or not found"));
            }
            socket.data.userId = decoded.userId;
            socket.data.role = decoded.role;
            next();
        }
        catch (err) {
            return next(new Error("Authentication error: Invalid token"));
        }
    });
    // Connection Handler
    io.on("connection", (socket) => {
        const { userId, role } = socket.data;
        if (env_1.config.NODE_ENV === "development") {
            console.log(`Socket connected: User ${userId} (${role}) - Socket ${socket.id}`);
        }
        // Assign rooms based on identity
        socket.join(`user:${userId}`);
        if (role === "Admin") {
            socket.join("admins");
        }
        if (role === "SuperAdmin") {
            socket.join("superadmins");
            // SuperAdmins might also need to listen to Admin events
            socket.join("admins");
        }
        socket.on("disconnect", () => {
            if (env_1.config.NODE_ENV === "development") {
                console.log(`Socket disconnected: User ${userId} (${role}) - Socket ${socket.id}`);
            }
        });
    });
    return io;
};
exports.initializeSocket = initializeSocket;
// --- Emission Helpers ---
const emitToUser = (userId, event, payload) => {
    if (io) {
        io.to(`user:${userId}`).emit(event, payload);
    }
};
exports.emitToUser = emitToUser;
const emitToAdmins = (event, payload) => {
    if (io) {
        io.to("admins").emit(event, payload);
    }
};
exports.emitToAdmins = emitToAdmins;
const emitToSuperAdmins = (event, payload) => {
    if (io) {
        io.to("superadmins").emit(event, payload);
    }
};
exports.emitToSuperAdmins = emitToSuperAdmins;
const emitToOrder = (orderId, event, payload) => {
    if (io) {
        io.to(`order:${orderId}`).emit(event, payload);
    }
};
exports.emitToOrder = emitToOrder;
const emitToAll = (event, payload) => {
    if (io) {
        io.emit(event, payload);
    }
};
exports.emitToAll = emitToAll;
