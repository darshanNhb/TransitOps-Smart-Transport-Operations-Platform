// ─────────────────────────────────────────────────────────────
// Pagination Utility
// ─────────────────────────────────────────────────────────────
// Converts page/limit into Prisma skip/take and builds a
// standardized pagination metadata object for API responses.
// ─────────────────────────────────────────────────────────────

/**
 * Build Prisma pagination args from request query params.
 * @param {{ page?: number, limit?: number }} query
 * @returns {{ skip: number, take: number }}
 */
export function buildPaginationArgs(query) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));

    return {
        skip: (page - 1) * limit,
        take: limit,
        page,
        limit,
    };
}

/**
 * Build pagination metadata for response.
 * @param {number} total - Total record count
 * @param {number} page  - Current page
 * @param {number} limit - Page size
 */
export function buildPaginationMeta(total, page, limit) {
    return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
    };
}
