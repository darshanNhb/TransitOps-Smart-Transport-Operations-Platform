// ─────────────────────────────────────────────────────────────
// Expense Validation Schemas
// ─────────────────────────────────────────────────────────────

import { z } from "zod";
import { ExpenseCategory, PaymentMethod } from "@prisma/client";

export const createExpenseSchema = z.object({
    body: z.object({
        vehicleId: z.string().uuid("Invalid Vehicle ID").optional().nullable(),
        tripId: z.string().uuid("Invalid Trip ID").optional().nullable(),
        maintenanceId: z.string().uuid("Invalid Maintenance ID").optional().nullable(),
        amount: z.coerce.number().positive("Amount must be positive"),
        category: z.nativeEnum(ExpenseCategory),
        description: z.string().min(3).max(255).trim(),
        paymentMethod: z.nativeEnum(PaymentMethod),
        date: z.string().datetime(),
    }),
});

export const updateExpenseSchema = z.object({
    body: createExpenseSchema.shape.body.partial(),
});
