// ─────────────────────────────────────────────────────────────
// Fuel Log Controller
// ─────────────────────────────────────────────────────────────

import fuelService from "../services/fuel.service.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getFuelLogs = asyncHandler(async (req, res) => {
    const { data, pagination } = await fuelService.getFuelLogs(req.query, req.user.organizationId);
    ApiResponse.paginated(res, "Fuel logs retrieved successfully", data, pagination);
});

export const getFuelLog = asyncHandler(async (req, res) => {
    const log = await fuelService.getFuelLogById(req.params.id, req.user.organizationId);
    ApiResponse.ok(res, "Fuel log details retrieved", log);
});

export const createFuelLog = asyncHandler(async (req, res) => {
    const log = await fuelService.createFuelLog(
        req.body,
        req.user.id,
        req.user.organizationId,
        req
    );
    ApiResponse.created(res, "Fuel log registered successfully, expense generated", log);
});

export const deleteFuelLog = asyncHandler(async (req, res) => {
    await fuelService.deleteFuelLog(
        req.params.id,
        req.user.id,
        req.user.organizationId,
        req
    );
    ApiResponse.ok(res, "Fuel log soft-deleted successfully");
});
