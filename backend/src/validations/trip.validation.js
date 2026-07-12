// ─────────────────────────────────────────────────────────────
// Trip Validation Schemas
// ─────────────────────────────────────────────────────────────

import { z } from "zod";
import { TripType, TripStatus } from "@prisma/client";

const tripBodySchema = z.object({
    tripNumber: z.string().min(2).max(50).trim(),
    vehicleId: z.string().uuid("Invalid Vehicle ID"),
    driverId: z.string().uuid("Invalid Driver ID"),
    origin: z.string().min(2).max(255).trim(),
    destination: z.string().min(2).max(255).trim(),
    plannedDistance: z.coerce.number().positive("Planned distance must be positive"),
    cargoWeight: z.coerce.number().positive("Cargo weight must be positive"),
    estimatedFuel: z.coerce.number().positive("Estimated fuel must be positive"),
    startOdometer: z.coerce.number().int().nonnegative(),
    dispatchTime: z.string().datetime(),
    expectedArrival: z.string().datetime(),
    revenue: z.coerce.number().nonnegative("Revenue cannot be negative"),
    tripType: z.nativeEnum(TripType),
    notes: z.string().max(500).trim().optional().nullable(),
});

export const createTripSchema = z.object({
    body: tripBodySchema,
}).refine((data) => {
    return new Date(data.body.expectedArrival) > new Date(data.body.dispatchTime);
}, {
    message: "Expected arrival must be after dispatch time",
    path: ["body", "expectedArrival"],
});

export const updateTripSchema = z.object({
    body: tripBodySchema.partial().extend({
        status: z.nativeEnum(TripStatus).optional(),
    }),
});

export const completeTripSchema = z.object({
    body: z.object({
        actualDistance: z.coerce.number().positive("Actual distance must be positive"),
        actualFuel: z.coerce.number().positive("Actual fuel must be positive"),
        endOdometer: z.coerce.number().int().positive("End odometer must be positive"),
        actualArrival: z.string().datetime(),
    }),
});
