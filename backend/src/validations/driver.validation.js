// ─────────────────────────────────────────────────────────────
// Driver Validation Schemas
// ─────────────────────────────────────────────────────────────

import { z } from "zod";
import { LicenseCategory, DriverStatus } from "@prisma/client";
import { emailSchema } from "./common.js";

// Age validation helper (must be at least 18)
const DOBMinDate = new Date();
DOBMinDate.setFullYear(DOBMinDate.getFullYear() - 18);

export const createDriverSchema = z.object({
    body: z.object({
        employeeCode: z.string().min(2).max(50).trim(),
        name: z.string().min(2).max(100).trim(),
        email: emailSchema,
        phone: z.string().min(5).max(30).trim(),
        address: z.string().max(255).trim().optional().nullable(),
        dateOfBirth: z.string().datetime().refine((dob) => {
            return new Date(dob) <= DOBMinDate;
        }, "Driver must be at least 18 years of age"),
        joiningDate: z.string().datetime(),
        experience: z.coerce.number().int().nonnegative(),
        salary: z.coerce.number().positive("Salary must be positive"),
        licenseNumber: z.string().min(5).max(50).trim(),
        licenseCategory: z.nativeEnum(LicenseCategory),
        licenseExpiry: z.string().datetime(),
        bloodGroup: z.string().max(10).trim().optional().nullable(),
        emergencyContactName: z.string().max(100).trim().optional().nullable(),
        emergencyContactNumber: z.string().max(30).trim().optional().nullable(),
        governmentId: z.string().max(50).trim().optional().nullable(),
        photoUrl: z.string().url().optional().nullable(),
        medicalCertificateExpiry: z.string().datetime().optional().nullable(),
    }),
});

export const updateDriverSchema = z.object({
    body: createDriverSchema.shape.body.partial().extend({
        status: z.nativeEnum(DriverStatus).optional(),
        availability: z.boolean().optional(),
        safetyScore: z.coerce.number().min(0).max(100).optional(),
    }),
});
