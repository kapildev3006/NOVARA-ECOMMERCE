import { Request, Response } from "express";
import { User } from "../models/User";
import { RefreshSession } from "../models/RefreshSession";
import { registerSchema, loginSchema } from "../validators/auth";
import { hashPassword, comparePassword } from "../utils/password";
import { generateAccessToken, generateRefreshToken, hashToken } from "../utils/jwt";
import ms from "ms";
import { config } from "../config/env";
import { ZodError } from "zod";

const setRefreshCookie = (res: Response, token: string) => {
  const maxAge = Number(ms(config.REFRESH_TOKEN_EXPIRES_IN as any));
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "strict",
    maxAge,
    path: "/api/v1/auth",
  });
};

const clearRefreshCookie = (res: Response) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/v1/auth",
  });
};

export const register = async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return res.status(409).json({ success: false, error: { code: "CONFLICT", message: "Email already in use" } });
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await User.create({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      passwordHash: hashedPassword,
      role: "Customer",
      status: "Active",
    });

    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });

    await RefreshSession.create({
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + ms(config.REFRESH_TOKEN_EXPIRES_IN as any)),
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    setRefreshCookie(res, refreshToken);

    const safeUser = { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone, role: user.role, status: user.status };
    return res.status(201).json({ success: true, data: { user: safeUser, accessToken } });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: error.issues[0].message } });
    }
    console.error("Register error:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" } });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await User.findOne({ email: data.email });
    if (!user) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid credentials" } });
    }

    if (user.status !== "Active") {
      return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Account is inactive" } });
    }

    const isMatch = await comparePassword(data.password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid credentials" } });
    }

    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });

    await RefreshSession.create({
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + ms(config.REFRESH_TOKEN_EXPIRES_IN as any)),
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    setRefreshCookie(res, refreshToken);

    const safeUser = { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone, role: user.role, status: user.status };
    return res.json({ success: true, data: { user: safeUser, accessToken } });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: error.issues[0].message } });
    }
    console.error("Login error:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" } });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Refresh token missing" } });
    }

    const hashedToken = hashToken(token);
    const session = await RefreshSession.findOne({ tokenHash: hashedToken });

    if (!session || session.revokedAt) {
      clearRefreshCookie(res);
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid or revoked refresh token" } });
    }

    if (new Date() > session.expiresAt) {
      clearRefreshCookie(res);
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Refresh token expired" } });
    }

    const user = await User.findById(session.userId);
    if (!user || user.status !== "Active") {
      clearRefreshCookie(res);
      return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "User is inactive or deleted" } });
    }

    // Optional token rotation: Create a new refresh token and invalidate old one
    const newAccessToken = generateAccessToken({ userId: user.id, role: user.role });
    const newRefreshToken = generateRefreshToken({ userId: user.id, role: user.role });

    session.revokedAt = new Date();
    await session.save();

    await RefreshSession.create({
      userId: user.id,
      tokenHash: hashToken(newRefreshToken),
      expiresAt: new Date(Date.now() + ms(config.REFRESH_TOKEN_EXPIRES_IN as any)),
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    setRefreshCookie(res, newRefreshToken);

    return res.json({ success: true, data: { accessToken: newAccessToken } });
  } catch (error) {
    console.error("Refresh error:", error);
    clearRefreshCookie(res);
    res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" } });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      const hashedToken = hashToken(token);
      await RefreshSession.findOneAndUpdate(
        { tokenHash: hashedToken },
        { revokedAt: new Date() }
      );
    }
    clearRefreshCookie(res);
    return res.json({ success: true, data: { message: "Logged out successfully" } });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" } });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "User not found" } });
    }

    const safeUser = { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone, role: user.role, status: user.status };
    return res.json({ success: true, data: { user: safeUser } });
  } catch (error) {
    console.error("Me error:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" } });
  }
};
