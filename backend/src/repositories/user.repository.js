// ─────────────────────────────────────────────────────────────
// User Repository
// ─────────────────────────────────────────────────────────────

import prisma from "../config/prisma.js";

class UserRepository {
    async findByEmail(email) {
        return prisma.user.findFirst({
            where: { email, deletedAt: null },
            include: {
                role: { select: { id: true, name: true } },
                organization: { select: { id: true, name: true, slug: true } },
            },
        });
    }

    async findById(id) {
        return prisma.user.findFirst({
            where: { id, deletedAt: null },
            select: {
                id: true,
                name: true,
                email: true,
                status: true,
                lastLoginAt: true,
                emailVerifiedAt: true,
                createdAt: true,
                organizationId: true,
                roleId: true,
                role: {
                    select: {
                        id: true,
                        name: true,
                        permissions: {
                            select: {
                                permission: {
                                    select: {
                                        resource: true,
                                        action: true,
                                    },
                                },
                            },
                        },
                    },
                },
                organization: { select: { id: true, name: true, slug: true } },
            },
        });
    }

    async create(data) {
        return prisma.user.create({
            data,
            select: {
                id: true,
                name: true,
                email: true,
                status: true,
                createdAt: true,
                organizationId: true,
                roleId: true,
            },
        });
    }

    async updateLastLogin(id) {
        return prisma.user.update({
            where: { id },
            data: { lastLoginAt: new Date(), failedLoginAttempts: 0 },
        });
    }

    async incrementFailedLogins(id, lockoutUntil = null) {
        return prisma.user.update({
            where: { id },
            data: {
                failedLoginAttempts: { increment: 1 },
                ...(lockoutUntil && { lockoutUntil, status: "LOCKED" }),
            },
        });
    }
}

export default new UserRepository();
