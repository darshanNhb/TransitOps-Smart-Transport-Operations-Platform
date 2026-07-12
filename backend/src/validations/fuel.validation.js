// ─────────────────────────────────────────────────────────────
// Fuel Log Validation Schemas
// ─────────────────────────────────────────────────────────────

import { z } from "zod";
import { FuelType } from "@prisma/client";

export const createFuelLogSchema = z.object({
    body: z.object({
        vehicleId: z.string().uuid("Invalid Vehicle ID"),
        fuelType: z.nativeEnum(FuelType),
        fuelQuantity: z.coerce.number().positive("Quantity must be positive"),
        pricePerLiter: z.coerce.number().positive("Price per liter must be positive"),
        receiptNumber: z.string().max(50).trim().optional().nullable(),
        fuelStation: z.string().max(100).trim().optional().nullable(),
        odometerReading: z.coerce.number().int().positive("Odometer must be positive"),
        date: z.string().datetime(),
    }),
});
