// ─────────────────────────────────────────────────────────────
// Driver Service — Workforce & Compliance Business Logic
// ─────────────────────────────────────────────────────────────

import driverRepository from "../repositories/driver.repository.js";
import activityLogService from "./activityLog.service.js";
import { encrypt, decrypt } from "../utils/crypto.js";
import ApiError from "../utils/ApiError.js";
import { getDiff } from "../utils/diff.js";

class DriverService {
    /**
     * Map database record to plaintext by decrypting PII fields.
     */
    _decryptPII(driver) {
        if (!driver) return null;
        return {
            ...driver,
            licenseNumber: decrypt(driver.licenseNumber) || driver.licenseNumber,
            governmentId: driver.governmentId ? (decrypt(driver.governmentId) || driver.governmentId) : null,
            emergencyContactNumber: driver.emergencyContactNumber ? (decrypt(driver.emergencyContactNumber) || driver.emergencyContactNumber) : null,
        };
    }

    /**
     * Get paginated drivers list with decrypted PII.
     */
    async getDrivers(query, organizationId) {
        const where = {};
        if (query.status) where.status = query.status;
        if (query.availability !== undefined) {
            where.availability = query.availability === "true" || query.availability === true;
        }

        const { data, pagination } = await driverRepository.findAll(organizationId, query, { where });
        const decryptedData = data.map((d) => this._decryptPII(d));

        return { data: decryptedData, pagination };
    }

    /**
     * Get single driver profile.
     */
    async getDriverById(id, organizationId) {
        const driver = await driverRepository.findById(id, organizationId);
        if (!driver) {
            throw ApiError.notFound("Driver not found");
        }
        return this._decryptPII(driver);
    }

    /**
     * Register a new driver with PII encryption.
     */
    async createDriver(data, userId, organizationId, req) {
        // Uniqueness checks
        const dupCode = await driverRepository.findByEmployeeCode(data.employeeCode, organizationId);
        if (dupCode) throw ApiError.conflict("Employee code already exists");

        const dupEmail = await driverRepository.findByEmail(data.email, organizationId);
        if (dupEmail) throw ApiError.conflict("Email address already registered for a driver");

        // Decrypt / encrypt check for license number
        const encryptedLicense = encrypt(data.licenseNumber);
        const dupLic = await driverRepository.findByLicenseNumber(encryptedLicense, organizationId);
        if (dupLic) throw ApiError.conflict("License number already exists");

        // Prepare data with encrypted PII
        const payload = {
            ...data,
            organizationId,
            createdById: userId,
            licenseNumber: encryptedLicense,
            governmentId: encrypt(data.governmentId),
            emergencyContactNumber: encrypt(data.emergencyContactNumber),
            dateOfBirth: new Date(data.dateOfBirth),
            joiningDate: new Date(data.joiningDate),
            licenseExpiry: new Date(data.licenseExpiry),
            medicalCertificateExpiry: data.medicalCertificateExpiry ? new Date(data.medicalCertificateExpiry) : null,
        };

        const driver = await driverRepository.create(payload);

        await activityLogService.log({
            userId,
            action: "CREATE",
            resource: "Driver",
            resourceId: driver.id,
            newData: this._decryptPII(driver),
            req,
            organizationId,
        });

        return this._decryptPII(driver);
    }

    /**
     * Update driver metadata.
     */
    async updateDriver(id, data, userId, organizationId, req) {
        const original = await this.getDriverById(id, organizationId);

        if (data.employeeCode && data.employeeCode !== original.employeeCode) {
            const dup = await driverRepository.findByEmployeeCode(data.employeeCode, organizationId);
            if (dup) throw ApiError.conflict("Employee code already in use");
        }

        if (data.email && data.email !== original.email) {
            const dup = await driverRepository.findByEmail(data.email, organizationId);
            if (dup) throw ApiError.conflict("Email already in use");
        }

        // Encrypt updated license number if provided
        let encryptedLicense;
        if (data.licenseNumber && data.licenseNumber !== original.licenseNumber) {
            encryptedLicense = encrypt(data.licenseNumber);
            const dup = await driverRepository.findByLicenseNumber(encryptedLicense, organizationId);
            if (dup) throw ApiError.conflict("License number already in use");
        }

        const payload = { ...data };
        if (encryptedLicense) payload.licenseNumber = encryptedLicense;
        if (data.governmentId) payload.governmentId = encrypt(data.governmentId);
        if (data.emergencyContactNumber) payload.emergencyContactNumber = encrypt(data.emergencyContactNumber);
        
        if (payload.dateOfBirth) payload.dateOfBirth = new Date(payload.dateOfBirth);
        if (payload.joiningDate) payload.joiningDate = new Date(payload.joiningDate);
        if (payload.licenseExpiry) payload.licenseExpiry = new Date(payload.licenseExpiry);
        if (payload.medicalCertificateExpiry) payload.medicalCertificateExpiry = new Date(payload.medicalCertificateExpiry);

        const updated = await driverRepository.update(id, {
            ...payload,
            updatedById: userId,
        });

        const diff = getDiff(original, data);
        if (diff) {
            await activityLogService.log({
                userId,
                action: "UPDATE",
                resource: "Driver",
                resourceId: id,
                oldData: diff.oldData,
                newData: diff.newData,
                req,
                organizationId,
            });
        }

        return this._decryptPII(updated);
    }

    /**
     * Soft-delete a driver.
     */
    async deleteDriver(id, userId, organizationId, req) {
        const driver = await this.getDriverById(id, organizationId);
        const result = await driverRepository.softDelete(id, userId);

        await activityLogService.log({
            userId,
            action: "DELETE",
            resource: "Driver",
            resourceId: id,
            oldData: driver,
            req,
            organizationId,
        });

        return result;
    }
}

export default new DriverService();
