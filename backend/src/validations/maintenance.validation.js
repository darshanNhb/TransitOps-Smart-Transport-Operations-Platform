// ─────────────────────────────────────────────────────────────
// Maintenance Validation Schemas
// ─────────────────────────────────────────────────────────────

import { z } from "zod";
import { Priority, MaintenanceStatus } from "@prisma/client";

export const createMaintenanceSchema = z.object({
    body: z.object({
        vehicleId: z.string().uuid("Invalid Vehicle ID"),
        vendor: z.string().min(2).max(100).trim(),
        serviceType: z.string().min(2).max(100).trim(),
        priority: z.nativeEnum(Priority),
        description: z.string().min(5).max(1000).trim(),
        cost: z.coerce.number().positive("Cost must be positive"),
        startDate: z.string().datetime(),
        nextServiceDate: z.string().datetime().optional().nullable(),
    }),
});

export const updateMaintenanceSchema = z.object({
    body: createMaintenanceSchema.shape.body.partial().extend({
        status: z.nativeEnum(MaintenanceStatus).optional(),
    }),
});

export const completeMaintenanceSchema = z.object({
    body: z.object({
        invoiceNumber: z.string().max(50).trim().optional().nullable(),
        invoiceDate: z.string().datetime().optional().nullable(),
        remarks: z.string().max(500).trim().optional().nullable(),
        completionDate: z.string().datetime(),
    }),
});
