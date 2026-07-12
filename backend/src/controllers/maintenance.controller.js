// ─────────────────────────────────────────────────────────────
// Maintenance Controller
// ─────────────────────────────────────────────────────────────

import maintenanceService from "../services/maintenance.service.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getMaintenances = asyncHandler(async (req, res) => {
    const { data, pagination } = await maintenanceService.getMaintenances(req.query, req.user.organizationId);
    ApiResponse.paginated(res, "Maintenance records list retrieved", data, pagination);
});

export const getMaintenance = asyncHandler(async (req, res) => {
    const record = await maintenanceService.getMaintenanceById(req.params.id, req.user.organizationId);
    ApiResponse.ok(res, "Maintenance record details retrieved", record);
});

export const createMaintenance = asyncHandler(async (req, res) => {
    const record = await maintenanceService.createMaintenance(
        req.body,
        req.user.id,
        req.user.organizationId,
        req
    );
    ApiResponse.created(res, "Maintenance scheduled successfully", record);
});

export const startMaintenance = asyncHandler(async (req, res) => {
    const record = await maintenanceService.startMaintenance(
        req.params.id,
        req.user.id,
        req.user.organizationId,
        req
    );
    ApiResponse.ok(res, "Maintenance started successfully, vehicle locked", record);
});

export const completeMaintenance = asyncHandler(async (req, res) => {
    const record = await maintenanceService.completeMaintenance(
        req.params.id,
        req.body,
        req.user.id,
        req.user.organizationId,
        req
    );
    ApiResponse.ok(res, "Maintenance completed successfully, vehicle released", record);
});

export const cancelMaintenance = asyncHandler(async (req, res) => {
    const record = await maintenanceService.cancelMaintenance(
        req.params.id,
        req.user.id,
        req.user.organizationId,
        req
    );
    ApiResponse.ok(res, "Maintenance cancelled successfully", record);
});
