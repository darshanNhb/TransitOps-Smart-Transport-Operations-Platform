// ─────────────────────────────────────────────────────────────
// Refresh Token Repository
// ─────────────────────────────────────────────────────────────

import prisma from "../config/prisma.js";

class RefreshTokenRepository {
    async create(data) {
        return prisma.refreshToken.create({ data });
    }

    async findByToken(token) {
        return prisma.refreshToken.findUnique({
            where: { token },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        status: true,
                        organizationId: true,
                        roleId: true,
                    },
                },
            },
        });
    }

    async revokeByToken(token) {
        return prisma.refreshToken.update({
            where: { token },
            data: { revokedAt: new Date() },
        });
    }

    /**
     * Revoke all tokens for a user (logout from all devices).
     */
    async revokeAllByUserId(userId) {
        return prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }

    /**
     * Clean up expired tokens (housekeeping).
     */
    async deleteExpired() {
        return prisma.refreshToken.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: new Date() } },
                    { revokedAt: { not: null } },
                ],
            },
        });
    }
}

export default new RefreshTokenRepository();
