"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.logout = exports.refresh = exports.login = exports.register = void 0;
const User_1 = require("../models/User");
const RefreshSession_1 = require("../models/RefreshSession");
const auth_1 = require("../validators/auth");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const ms_1 = __importDefault(require("ms"));
const env_1 = require("../config/env");
const zod_1 = require("zod");
const setRefreshCookie = (res, token) => {
    const maxAge = Number((0, ms_1.default)(env_1.config.REFRESH_TOKEN_EXPIRES_IN));
    res.cookie("refreshToken", token, {
        httpOnly: true,
        secure: env_1.config.NODE_ENV === "production",
        sameSite: "strict",
        maxAge,
        path: "/api/v1/auth",
    });
};
const clearRefreshCookie = (res) => {
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: env_1.config.NODE_ENV === "production",
        sameSite: "strict",
        path: "/api/v1/auth",
    });
};
const register = async (req, res) => {
    try {
        const data = auth_1.registerSchema.parse(req.body);
        const existingUser = await User_1.User.findOne({ email: data.email });
        if (existingUser) {
            return res.status(409).json({ success: false, error: { code: "CONFLICT", message: "Email already in use" } });
        }
        const hashedPassword = await (0, password_1.hashPassword)(data.password);
        const user = await User_1.User.create({
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            passwordHash: hashedPassword,
            role: "Customer",
            status: "Active",
        });
        const accessToken = (0, jwt_1.generateAccessToken)({ userId: user.id, role: user.role });
        const refreshToken = (0, jwt_1.generateRefreshToken)({ userId: user.id, role: user.role });
        await RefreshSession_1.RefreshSession.create({
            userId: user.id,
            tokenHash: (0, jwt_1.hashToken)(refreshToken),
            expiresAt: new Date(Date.now() + (0, ms_1.default)(env_1.config.REFRESH_TOKEN_EXPIRES_IN)),
            userAgent: req.headers["user-agent"],
            ipAddress: req.ip,
        });
        setRefreshCookie(res, refreshToken);
        const safeUser = { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone, role: user.role, status: user.status };
        return res.status(201).json({ success: true, data: { user: safeUser, accessToken } });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: error.issues[0].message } });
        }
        console.error("Register error:", error);
        res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" } });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const data = auth_1.loginSchema.parse(req.body);
        const user = await User_1.User.findOne({ email: data.email });
        if (!user) {
            return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid credentials" } });
        }
        if (user.status !== "Active") {
            return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Account is inactive" } });
        }
        const isMatch = await (0, password_1.comparePassword)(data.password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid credentials" } });
        }
        const accessToken = (0, jwt_1.generateAccessToken)({ userId: user.id, role: user.role });
        const refreshToken = (0, jwt_1.generateRefreshToken)({ userId: user.id, role: user.role });
        await RefreshSession_1.RefreshSession.create({
            userId: user.id,
            tokenHash: (0, jwt_1.hashToken)(refreshToken),
            expiresAt: new Date(Date.now() + (0, ms_1.default)(env_1.config.REFRESH_TOKEN_EXPIRES_IN)),
            userAgent: req.headers["user-agent"],
            ipAddress: req.ip,
        });
        setRefreshCookie(res, refreshToken);
        const safeUser = { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone, role: user.role, status: user.status };
        return res.json({ success: true, data: { user: safeUser, accessToken } });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: error.issues[0].message } });
        }
        console.error("Login error:", error);
        res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" } });
    }
};
exports.login = login;
const refresh = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        if (!token) {
            return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Refresh token missing" } });
        }
        const hashedToken = (0, jwt_1.hashToken)(token);
        const session = await RefreshSession_1.RefreshSession.findOne({ tokenHash: hashedToken });
        if (!session || session.revokedAt) {
            clearRefreshCookie(res);
            return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid or revoked refresh token" } });
        }
        if (new Date() > session.expiresAt) {
            clearRefreshCookie(res);
            return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Refresh token expired" } });
        }
        const user = await User_1.User.findById(session.userId);
        if (!user || user.status !== "Active") {
            clearRefreshCookie(res);
            return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "User is inactive or deleted" } });
        }
        // Optional token rotation: Create a new refresh token and invalidate old one
        const newAccessToken = (0, jwt_1.generateAccessToken)({ userId: user.id, role: user.role });
        const newRefreshToken = (0, jwt_1.generateRefreshToken)({ userId: user.id, role: user.role });
        session.revokedAt = new Date();
        await session.save();
        await RefreshSession_1.RefreshSession.create({
            userId: user.id,
            tokenHash: (0, jwt_1.hashToken)(newRefreshToken),
            expiresAt: new Date(Date.now() + (0, ms_1.default)(env_1.config.REFRESH_TOKEN_EXPIRES_IN)),
            userAgent: req.headers["user-agent"],
            ipAddress: req.ip,
        });
        setRefreshCookie(res, newRefreshToken);
        return res.json({ success: true, data: { accessToken: newAccessToken } });
    }
    catch (error) {
        console.error("Refresh error:", error);
        clearRefreshCookie(res);
        res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" } });
    }
};
exports.refresh = refresh;
const logout = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        if (token) {
            const hashedToken = (0, jwt_1.hashToken)(token);
            await RefreshSession_1.RefreshSession.findOneAndUpdate({ tokenHash: hashedToken }, { revokedAt: new Date() });
        }
        clearRefreshCookie(res);
        return res.json({ success: true, data: { message: "Logged out successfully" } });
    }
    catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" } });
    }
};
exports.logout = logout;
const me = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const user = await User_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "User not found" } });
        }
        const safeUser = { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone, role: user.role, status: user.status };
        return res.json({ success: true, data: { user: safeUser } });
    }
    catch (error) {
        console.error("Me error:", error);
        res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" } });
    }
};
exports.me = me;
