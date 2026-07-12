// ─────────────────────────────────────────────────────────────
// Vehicle Controller — Request & Response Mapping
// ─────────────────────────────────────────────────────────────

import vehicleService from "../services/vehicle.service.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getVehicles = asyncHandler(async (req, res) => {
    const { data, pagination } = await vehicleService.getVehicles(req.query, req.user.organizationId);
    ApiResponse.paginated(res, "Vehicles list retrieved", data, pagination);
});

export const getVehicle = asyncHandler(async (req, res) => {
    const vehicle = await vehicleService.getVehicleById(req.params.id, req.user.organizationId);
    ApiResponse.ok(res, "Vehicle details retrieved", vehicle);
});

export const createVehicle = asyncHandler(async (req, res) => {
    const vehicle = await vehicleService.createVehicle(
        req.body,
        req.user.id,
        req.user.organizationId,
        req
    );
    ApiResponse.created(res, "Vehicle registered successfully", vehicle);
});

export const updateVehicle = asyncHandler(async (req, res) => {
    const vehicle = await vehicleService.updateVehicle(
        req.params.id,
        req.body,
        req.user.id,
        req.user.organizationId,
        req
    );
    ApiResponse.ok(res, "Vehicle updated successfully", vehicle);
});

export const deleteVehicle = asyncHandler(async (req, res) => {
    await vehicleService.deleteVehicle(
        req.params.id,
        req.user.id,
        req.user.organizationId,
        req
    );
    ApiResponse.ok(res, "Vehicle soft-deleted successfully");
});
