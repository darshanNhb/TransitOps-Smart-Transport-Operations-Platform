// ─────────────────────────────────────────────────────────────
// Vehicle Validation Schemas
// ─────────────────────────────────────────────────────────────

import { z } from "zod";
import { FuelType, VehicleStatus } from "@prisma/client";

const currentYear = new Date().getFullYear();

export const createVehicleSchema = z.object({
    body: z.object({
        registrationNumber: z.string().min(2).max(50).trim(),
        vehicleNumber: z.string().min(2).max(50).trim(),
        name: z.string().min(2).max(100).trim(),
        manufacturer: z.string().min(2).max(100).trim(),
        model: z.string().min(1).max(100).trim(),
        manufacturingYear: z.coerce.number().int().min(1900).max(currentYear + 1),
        VIN: z.string().min(5).max(100).trim().optional().nullable(),
        engineNumber: z.string().min(5).max(100).trim().optional().nullable(),
        chassisNumber: z.string().min(5).max(100).trim().optional().nullable(),
        insuranceProvider: z.string().max(100).trim().optional().nullable(),
        insurancePolicyNumber: z.string().max(100).trim().optional().nullable(),
        insuranceExpiry: z.string().datetime().optional().nullable(),
        fitnessExpiry: z.string().datetime().optional().nullable(),
        currentOdometer: z.coerce.number().int().nonnegative().default(0),
        GPSDeviceId: z.string().max(100).trim().optional().nullable(),
        fuelType: z.nativeEnum(FuelType),
        payloadCapacity: z.coerce.number().positive("Capacity must be positive"),
        purchaseCost: z.coerce.number().positive("Purchase cost must be positive"),
        purchaseDate: z.string().datetime(),
        color: z.string().max(50).trim().optional().nullable(),
    }),
});

export const updateVehicleSchema = z.object({
    body: createVehicleSchema.shape.body.partial().extend({
        status: z.nativeEnum(VehicleStatus).optional(),
        availability: z.boolean().optional(),
    }),
});
