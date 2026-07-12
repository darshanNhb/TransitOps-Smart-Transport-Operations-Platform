// ─────────────────────────────────────────────────────────────
// Common Validation Schemas
// ─────────────────────────────────────────────────────────────
// Reusable Zod primitives shared across module-specific schemas.
// ─────────────────────────────────────────────────────────────

import { z } from "zod";

export const uuidParam = z.object({
    params: z.object({
        id: z.string().uuid("Invalid ID format"),
    }),
});

export const paginationQuery = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().default(1).optional(),
        limit: z.coerce.number().int().positive().max(100).default(20).optional(),
        sortBy: z.string().default("createdAt").optional(),
        sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
        search: z.string().optional(),
    }),
});

export const emailSchema = z
    .string()
    .email("Invalid email address")
    .toLowerCase()
    .trim();

export const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters");

export const nameSchema = z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .trim();
