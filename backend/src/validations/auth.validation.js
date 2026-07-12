// ─────────────────────────────────────────────────────────────
// Auth Validation Schemas
// ─────────────────────────────────────────────────────────────

import { z } from "zod";
import { emailSchema, passwordSchema, nameSchema } from "./common.js";

export const registerSchema = z.object({
    body: z.object({
        name: nameSchema,
        email: emailSchema,
        password: passwordSchema,
        organizationName: z
            .string()
            .min(2, "Organization name must be at least 2 characters")
            .max(100)
            .trim(),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: emailSchema,
        password: z.string().min(1, "Password is required"),
    }),
});
