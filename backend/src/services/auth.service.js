// ─────────────────────────────────────────────────────────────
// Auth Service — Business Logic Layer
// ─────────────────────────────────────────────────────────────
// Contains all authentication business logic:
//   - Registration (creates org, role, permissions, user)
//   - Login (validates credentials, generates tokens)
//   - Token refresh (rotates refresh tokens)
//   - Logout (revokes tokens)
//
// This service orchestrates repositories. It never touches
// Prisma directly except through the repositories.
// ─────────────────────────────────────────────────────────────

import prisma from "../config/prisma.js";
import userRepository from "../repositories/user.repository.js";
import refreshTokenRepository from "../repositories/refreshToken.repository.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateAccessToken, generateRefreshToken, verifyToken } from "../utils/jwt.js";
import { durationToMs, futureDate } from "../helpers/dateHelper.js";
import ApiError from "../utils/ApiError.js";
import env from "../config/env.js";
import logger from "../config/logger.js";
import permissionCache from "./permissionCache.js";

// Maximum failed login attempts before lockout
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

class AuthService {
    /**
     * Register a new user with their organization.
     * Creates: Organization → Role → Permissions → RolePermissions → User
     */
    async register({ name, email, password, organizationName }) {
        // Check if email already taken
        const existing = await userRepository.findByEmail(email);
        if (existing) {
            throw ApiError.conflict("Email is already registered");
        }

        const passwordHash = await hashPassword(password);
        const slug = organizationName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

        // Use a transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create organization
            const org = await tx.organization.create({
                data: { name: organizationName, slug: `${slug}-${Date.now()}` },
            });

            // 2. Create default permissions
            const permissionDefs = [
                { resource: "vehicle", action: "create" },
                { resource: "vehicle", action: "read" },
                { resource: "vehicle", action: "update" },
                { resource: "vehicle", action: "delete" },
                { resource: "driver", action: "create" },
                { resource: "driver", action: "read" },
                { resource: "driver", action: "update" },
                { resource: "driver", action: "delete" },
                { resource: "trip", action: "create" },
                { resource: "trip", action: "read" },
                { resource: "trip", action: "update" },
                { resource: "trip", action: "delete" },
                { resource: "trip", action: "dispatch" },
                { resource: "maintenance", action: "create" },
                { resource: "maintenance", action: "read" },
                { resource: "maintenance", action: "update" },
                { resource: "maintenance", action: "delete" },
                { resource: "fuel", action: "create" },
                { resource: "fuel", action: "read" },
                { resource: "fuel", action: "update" },
                { resource: "expense", action: "create" },
                { resource: "expense", action: "read" },
                { resource: "expense", action: "update" },
                { resource: "expense", action: "delete" },
                { resource: "expense", action: "approve" },
                { resource: "report", action: "read" },
                { resource: "report", action: "generate" },
                { resource: "dashboard", action: "read" },
                { resource: "user", action: "create" },
                { resource: "user", action: "read" },
                { resource: "user", action: "update" },
                { resource: "user", action: "delete" },
                { resource: "role", action: "create" },
                { resource: "role", action: "read" },
                { resource: "role", action: "update" },
                { resource: "organization", action: "read" },
                { resource: "organization", action: "update" },
                { resource: "notification", action: "create" },
                { resource: "notification", action: "read" },
                { resource: "notification", action: "update" },
                { resource: "notification", action: "delete" },
                { resource: "document", action: "create" },
                { resource: "document", action: "read" },
                { resource: "document", action: "update" },
                { resource: "document", action: "delete" },
            ];

            // Upsert permissions (they are global, shared across orgs)
            const permissions = [];
            for (const perm of permissionDefs) {
                const p = await tx.permission.upsert({
                    where: { resource_action: { resource: perm.resource, action: perm.action } },
                    create: perm,
                    update: {},
                });
                permissions.push(p);
            }

            // 3. Create admin role for this org
            const adminRole = await tx.role.create({
                data: {
                    name: "Admin",
                    description: "Full access administrator",
                    organizationId: org.id,
                },
            });

            // 4. Assign all permissions to admin role
            await tx.rolePermission.createMany({
                data: permissions.map((p) => ({
                    roleId: adminRole.id,
                    permissionId: p.id,
                })),
            });

            // 5. Create user
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    passwordHash,
                    roleId: adminRole.id,
                    organizationId: org.id,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    organizationId: true,
                    roleId: true,
                },
            });

            return user;
        });

        // Refresh permission cache so the new admin role is active immediately
        await permissionCache.refresh();

        logger.info(`New organization registered: ${organizationName} by ${email}`);
        return result;
    }

    /**
     * Authenticate a user and return access + refresh tokens.
     */
    async login({ email, password, ipAddress, userAgent }) {
        const user = await userRepository.findByEmail(email);

        if (!user) {
            throw ApiError.unauthorized("Invalid email or password");
        }

        // Check lockout
        if (user.status === "LOCKED" && user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
            throw ApiError.forbidden("Account is temporarily locked. Try again later.");
        }

        // Compare password
        const isMatch = await comparePassword(password, user.passwordHash);

        if (!isMatch) {
            // Increment failed attempts
            const lockoutUntil =
                user.failedLoginAttempts + 1 >= MAX_FAILED_ATTEMPTS
                    ? futureDate(LOCKOUT_DURATION_MS)
                    : null;

            await userRepository.incrementFailedLogins(user.id, lockoutUntil);

            throw ApiError.unauthorized("Invalid email or password");
        }

        // Success — reset failed attempts, update last login
        await userRepository.updateLastLogin(user.id);

        // Generate tokens
        const tokenPayload = {
            userId: user.id,
            organizationId: user.organizationId,
            roleId: user.roleId,
        };

        const accessToken = generateAccessToken(tokenPayload);
        const { token: refreshToken, jti } = generateRefreshToken(tokenPayload);

        // Store refresh token in database
        await refreshTokenRepository.create({
            token: refreshToken,
            jti,
            userId: user.id,
            expiresAt: futureDate(durationToMs(env.JWT_REFRESH_EXPIRY)),
            ipAddress,
            userAgent,
        });

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role.name,
                organization: user.organization.name,
            },
        };
    }

    /**
     * Rotate a refresh token — revoke old, issue new.
     */
    async refresh({ refreshToken, ipAddress, userAgent }) {
        if (!refreshToken) {
            throw ApiError.unauthorized("Refresh token is required");
        }

        // Verify the JWT signature
        let decoded;
        try {
            decoded = verifyToken(refreshToken);
        } catch {
            throw ApiError.unauthorized("Invalid or expired refresh token");
        }

        // Find the stored token
        const storedToken = await refreshTokenRepository.findByToken(refreshToken);

        if (!storedToken || storedToken.revokedAt) {
            throw ApiError.unauthorized("Refresh token has been revoked");
        }

        if (new Date(storedToken.expiresAt) < new Date()) {
            throw ApiError.unauthorized("Refresh token has expired");
        }

        // Revoke old token
        await refreshTokenRepository.revokeByToken(refreshToken);

        // Issue new pair
        const tokenPayload = {
            userId: storedToken.user.id,
            organizationId: storedToken.user.organizationId,
            roleId: storedToken.user.roleId,
        };

        const newAccessToken = generateAccessToken(tokenPayload);
        const { token: newRefreshToken, jti } = generateRefreshToken(tokenPayload);

        await refreshTokenRepository.create({
            token: newRefreshToken,
            jti,
            userId: storedToken.user.id,
            expiresAt: futureDate(durationToMs(env.JWT_REFRESH_EXPIRY)),
            ipAddress,
            userAgent,
        });

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        };
    }

    /**
     * Revoke the current refresh token (single-device logout).
     */
    async logout(refreshToken) {
        if (!refreshToken) return;

        const storedToken = await refreshTokenRepository.findByToken(refreshToken);
        if (storedToken && !storedToken.revokedAt) {
            await refreshTokenRepository.revokeByToken(refreshToken);
        }
    }

    /**
     * Revoke all refresh tokens for a user (all-device logout).
     */
    async logoutAll(userId) {
        await refreshTokenRepository.revokeAllByUserId(userId);
    }

    /**
     * Get current user profile.
     */
    async getProfile(userId) {
        const user = await userRepository.findById(userId);
        if (!user) {
            throw ApiError.notFound("User not found");
        }
        return user;
    }
}

export default new AuthService();
