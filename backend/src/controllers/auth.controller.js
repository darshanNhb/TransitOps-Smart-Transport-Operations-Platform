// ─────────────────────────────────────────────────────────────
// Auth Controller — Thin Request/Response Layer
// ─────────────────────────────────────────────────────────────
// Controllers extract input from req, delegate to services,
// and send responses. They contain ZERO business logic.
// ─────────────────────────────────────────────────────────────

import authService from "../services/auth.service.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { setRefreshCookie, clearRefreshCookie, getRefreshCookie } from "../utils/cookie.js";

export const register = asyncHandler(async (req, res) => {
    const user = await authService.register(req.body);
    ApiResponse.created(res, "Registration successful", user);
});

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get("User-Agent");

    const result = await authService.login({ email, password, ipAddress, userAgent });

    // Set refresh token as HTTP-only cookie
    setRefreshCookie(res, result.refreshToken);

    ApiResponse.ok(res, "Login successful", {
        accessToken: result.accessToken,
        user: result.user,
    });
});

export const refresh = asyncHandler(async (req, res) => {
    const refreshToken = getRefreshCookie(req) || req.body.refreshToken;
    const ipAddress = req.ip;
    const userAgent = req.get("User-Agent");

    const result = await authService.refresh({ refreshToken, ipAddress, userAgent });

    setRefreshCookie(res, result.refreshToken);

    ApiResponse.ok(res, "Token refreshed", {
        accessToken: result.accessToken,
    });
});

export const logout = asyncHandler(async (req, res) => {
    const refreshToken = getRefreshCookie(req) || req.body.refreshToken;
    await authService.logout(refreshToken);
    clearRefreshCookie(res);
    ApiResponse.ok(res, "Logged out successfully");
});

export const logoutAll = asyncHandler(async (req, res) => {
    await authService.logoutAll(req.user.id);
    clearRefreshCookie(res);
    ApiResponse.ok(res, "Logged out from all devices");
});

export const me = asyncHandler(async (req, res) => {
    const user = await authService.getProfile(req.user.id);
    ApiResponse.ok(res, "Profile retrieved", user);
});
