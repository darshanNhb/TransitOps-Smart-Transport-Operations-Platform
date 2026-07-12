// ─────────────────────────────────────────────────────────────
// Driver Controller
// ─────────────────────────────────────────────────────────────

import driverService from "../services/driver.service.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getDrivers = asyncHandler(async (req, res) => {
    const { data, pagination } = await driverService.getDrivers(req.query, req.user.organizationId);
    ApiResponse.paginated(res, "Drivers list retrieved", data, pagination);
});

export const getDriver = asyncHandler(async (req, res) => {
    const driver = await driverService.getDriverById(req.params.id, req.user.organizationId);
    ApiResponse.ok(res, "Driver details retrieved", driver);
});

export const createDriver = asyncHandler(async (req, res) => {
    const driver = await driverService.createDriver(
        req.body,
        req.user.id,
        req.user.organizationId,
        req
    );
    ApiResponse.created(res, "Driver registered successfully", driver);
});

export const updateDriver = asyncHandler(async (req, res) => {
    const driver = await driverService.updateDriver(
        req.params.id,
        req.body,
        req.user.id,
        req.user.organizationId,
        req
    );
    ApiResponse.ok(res, "Driver updated successfully", driver);
});

export const deleteDriver = asyncHandler(async (req, res) => {
    await driverService.deleteDriver(
        req.params.id,
        req.user.id,
        req.user.organizationId,
        req
    );
    ApiResponse.ok(res, "Driver soft-deleted successfully");
});
