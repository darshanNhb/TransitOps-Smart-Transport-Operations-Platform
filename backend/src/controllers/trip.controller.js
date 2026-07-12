// ─────────────────────────────────────────────────────────────
// Trip Controller
// ─────────────────────────────────────────────────────────────

import tripService from "../services/trip.service.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getTrips = asyncHandler(async (req, res) => {
    const { data, pagination } = await tripService.getTrips(req.query, req.user.organizationId);
    ApiResponse.paginated(res, "Trips retrieved successfully", data, pagination);
});

export const getTrip = asyncHandler(async (req, res) => {
    const trip = await tripService.getTripById(req.params.id, req.user.organizationId);
    ApiResponse.ok(res, "Trip details retrieved", trip);
});

export const createTrip = asyncHandler(async (req, res) => {
    const trip = await tripService.createTrip(
        req.body,
        req.user.id,
        req.user.organizationId,
        req
    );
    ApiResponse.created(res, "Trip scheduled successfully", trip);
});

export const dispatchTrip = asyncHandler(async (req, res) => {
    const trip = await tripService.dispatchTrip(
        req.params.id,
        req.user.id,
        req.user.organizationId,
        req
    );
    ApiResponse.ok(res, "Trip dispatched successfully, vehicle and driver locked", trip);
});

export const completeTrip = asyncHandler(async (req, res) => {
    const trip = await tripService.completeTrip(
        req.params.id,
        req.body,
        req.user.id,
        req.user.organizationId,
        req
    );
    ApiResponse.ok(res, "Trip completed successfully, statuses released", trip);
});

export const cancelTrip = asyncHandler(async (req, res) => {
    const trip = await tripService.cancelTrip(
        req.params.id,
        req.user.id,
        req.user.organizationId,
        req
    );
    ApiResponse.ok(res, "Trip cancelled successfully", trip);
});
