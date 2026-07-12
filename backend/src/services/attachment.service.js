// ─────────────────────────────────────────────────────────────
// Attachment Service — Document Management Business Logic
// ─────────────────────────────────────────────────────────────

import attachmentRepository from "../repositories/attachment.repository.js";
import vehicleRepository from "../repositories/vehicle.repository.js";
import driverRepository from "../repositories/driver.repository.js";
import tripRepository from "../repositories/trip.repository.js";
import maintenanceRepository from "../repositories/maintenance.repository.js";
import expenseRepository from "../repositories/expense.repository.js";
import activityLogService from "./activityLog.service.js";
import ApiError from "../utils/ApiError.js";
import fs from "fs";
import path from "path";

class AttachmentService {
    /**
     * Upload an attachment. Validates ownership of the linked entity.
     */
    async uploadAttachment(file, body, userId, organizationId, req) {
        if (!file) {
            throw ApiError.badRequest("No file uploaded");
        }

        const { vehicleId, driverId, tripId, maintenanceId, expenseId } = body;

        // Perform target relation verification
        if (vehicleId) {
            const exists = await vehicleRepository.findById(vehicleId, organizationId);
            if (!exists) throw ApiError.badRequest("Linked vehicle does not exist inside tenant");
        }
        if (driverId) {
            const exists = await driverRepository.findById(driverId, organizationId);
            if (!exists) throw ApiError.badRequest("Linked driver does not exist inside tenant");
        }
        if (tripId) {
            const exists = await tripRepository.findById(tripId, organizationId);
            if (!exists) throw ApiError.badRequest("Linked trip does not exist inside tenant");
        }
        if (maintenanceId) {
            const exists = await maintenanceRepository.findById(maintenanceId, organizationId);
            if (!exists) throw ApiError.badRequest("Linked maintenance does not exist inside tenant");
        }
        if (expenseId) {
            const exists = await expenseRepository.findById(expenseId, organizationId);
            if (!exists) throw ApiError.badRequest("Linked expense does not exist inside tenant");
        }

        const attachment = await attachmentRepository.create({
            fileName: file.originalname,
            fileType: file.mimetype,
            fileSize: file.size,
            fileUrl: `/uploads/${file.filename}`,
            vehicleId: vehicleId || null,
            driverId: driverId || null,
            tripId: tripId || null,
            maintenanceId: maintenanceId || null,
            expenseId: expenseId || null,
            organizationId,
            createdById: userId,
        });

        await activityLogService.log({
            userId,
            action: "UPLOAD",
            resource: "Attachment",
            resourceId: attachment.id,
            newData: attachment,
            req,
            organizationId,
        });

        return attachment;
    }

    /**
     * Delete an attachment and clean up physical disk space.
     */
    async deleteAttachment(id, userId, organizationId, req) {
        const attachment = await attachmentRepository.findById(id, organizationId);
        if (!attachment) {
            throw ApiError.notFound("Attachment record not found");
        }

        // 1. Delete DB record
        const result = await attachmentRepository.softDelete(id, userId);

        // 2. Remove file from storage
        const filePath = path.resolve(".", attachment.fileUrl.substring(1)); // strip leading slash
        fs.unlink(filePath, (err) => {
            // Log local disk unlinks failures but don't fail transaction
            if (err) req?.log?.error(`Failed to delete file from disk: ${filePath}`, err);
        });

        await activityLogService.log({
            userId,
            action: "DELETE",
            resource: "Attachment",
            resourceId: id,
            oldData: attachment,
            req,
            organizationId,
        });

        return result;
    }
}

export default new AttachmentService();
