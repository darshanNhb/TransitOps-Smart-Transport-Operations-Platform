// ─────────────────────────────────────────────────────────────
// Base Repository — Tenant-Scoped Data Access Layer
// ─────────────────────────────────────────────────────────────
// Every module repository extends this class. It provides:
//   - Automatic organizationId scoping (multi-tenancy)
//   - Automatic soft-delete filtering (deletedAt: null) if supported
//   - Pagination, sorting, and search
//   - CRUD primitives
//
// Controllers and services NEVER import Prisma directly.
// ─────────────────────────────────────────────────────────────

import prisma from "../config/prisma.js";
import { buildPaginationArgs, buildPaginationMeta } from "../utils/pagination.js";

class BaseRepository {
    /**
     * @param {string} modelName - Prisma model name (e.g., "vehicle", "driver")
     * @param {boolean} [supportsSoftDelete=true] - Set to false for append-only tables
     * @param {string} [defaultSortBy="createdAt"] - Default column name to sort records by
     */
    constructor(modelName, supportsSoftDelete = true, defaultSortBy = "createdAt") {
        this.model = prisma[modelName];
        this.modelName = modelName;
        this.supportsSoftDelete = supportsSoftDelete;
        this.defaultSortBy = defaultSortBy;
    }

    /**
     * Find all records for an organization with pagination.
     */
    async findAll(organizationId, query = {}, options = {}) {
        const { skip, take, page, limit } = buildPaginationArgs(query);
        const { include, select } = options;

        const where = {
            organizationId,
            ...(this.supportsSoftDelete && { deletedAt: null }),
            ...options.where,
        };

        const orderBy = {
            [query.sortBy || this.defaultSortBy]: query.sortOrder || "desc",
        };

        const [data, total] = await Promise.all([
            this.model.findMany({ where, skip, take, orderBy, include, select }),
            this.model.count({ where }),
        ]);

        const pagination = buildPaginationMeta(total, page, limit);

        return { data, pagination };
    }

    /**
     * Find a single record by ID within an organization.
     */
    async findById(id, organizationId, options = {}) {
        const { include, select } = options;

        return this.model.findFirst({
            where: {
                id,
                organizationId,
                ...(this.supportsSoftDelete && { deletedAt: null }),
            },
            include,
            select,
        });
    }

    /**
     * Find a single record by a custom filter within an organization.
     */
    async findOne(organizationId, where, options = {}) {
        const { include, select } = options;

        return this.model.findFirst({
            where: {
                ...where,
                organizationId,
                ...(this.supportsSoftDelete && { deletedAt: null }),
            },
            include,
            select,
        });
    }

    /**
     * Create a new record.
     */
    async create(data) {
        return this.model.create({ data });
    }

    /**
     * Update a record by ID.
     */
    async update(id, data) {
        return this.model.update({
            where: { id },
            data,
        });
    }

    /**
     * Soft-delete a record by setting deletedAt.
     */
    async softDelete(id, deletedById) {
        if (!this.supportsSoftDelete) {
            throw new Error(`Model ${this.modelName} does not support soft delete`);
        }
        return this.model.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                deletedById,
            },
        });
    }

    /**
     * Permanently delete a record. Use sparingly.
     */
    async hardDelete(id) {
        return this.model.delete({ where: { id } });
    }

    /**
     * Count records matching a filter within an organization.
     */
    async count(organizationId, where = {}) {
        return this.model.count({
            where: {
                organizationId,
                ...(this.supportsSoftDelete && { deletedAt: null }),
                ...where,
            },
        });
    }
}

export default BaseRepository;
