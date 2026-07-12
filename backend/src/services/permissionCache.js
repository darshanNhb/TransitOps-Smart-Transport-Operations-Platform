// ─────────────────────────────────────────────────────────────
// Permission Cache — In-Memory Role Permission Resolver
// ─────────────────────────────────────────────────────────────
// Caches the roleId → Set<"resource:action"> mapping in memory
// with a configurable TTL. Avoids hitting the database on every
// single authorized request.
//
// The cache is refreshed:
//   - Automatically when TTL expires
//   - Manually via permissionCache.refresh() when roles/perms
//     are updated by an admin
// ─────────────────────────────────────────────────────────────

import prisma from "../config/prisma.js";
import logger from "../config/logger.js";
import { PERMISSION_CACHE_TTL_MS } from "../constants/index.js";

class PermissionCache {
    constructor() {
        /** @type {Map<string, Set<string>>} roleId → Set of "resource:action" */
        this.cache = new Map();
        this.lastRefreshed = 0;
    }

    /**
     * Load all role-permission mappings into memory.
     */
    async refresh() {
        const rolePermissions = await prisma.rolePermission.findMany({
            include: {
                permission: {
                    select: { resource: true, action: true },
                },
            },
        });

        const newCache = new Map();

        for (const rp of rolePermissions) {
            const key = `${rp.permission.resource}:${rp.permission.action}`;
            if (!newCache.has(rp.roleId)) {
                newCache.set(rp.roleId, new Set());
            }
            newCache.get(rp.roleId).add(key);
        }

        this.cache = newCache;
        this.lastRefreshed = Date.now();
        logger.info(`Permission cache refreshed — ${rolePermissions.length} mappings loaded`);
    }

    /**
     * Check if a role has a specific permission.
     * Auto-refreshes if TTL has expired.
     */
    async hasPermission(roleId, resource, action) {
        if (this.isStale()) {
            await this.refresh();
        }

        const permissions = this.cache.get(roleId);
        if (!permissions) return false;

        return permissions.has(`${resource}:${action}`);
    }

    /**
     * Get all permissions for a role (for attaching to req).
     */
    async getPermissions(roleId) {
        if (this.isStale()) {
            await this.refresh();
        }

        return this.cache.get(roleId) || new Set();
    }

    isStale() {
        return Date.now() - this.lastRefreshed > PERMISSION_CACHE_TTL_MS;
    }
}

// Singleton
const permissionCache = new PermissionCache();
export default permissionCache;
