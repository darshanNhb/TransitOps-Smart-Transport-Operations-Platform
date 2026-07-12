import { Router } from "express";
import authRoutes from "./auth.routes.js";
import vehicleRoutes from "./vehicle.routes.js";
import driverRoutes from "./driver.routes.js";
import tripRoutes from "./trip.routes.js";
import maintenanceRoutes from "./maintenance.routes.js";
import fuelRoutes from "./fuel.routes.js";
import expenseRoutes from "./expense.routes.js";
import attachmentRoutes from "./attachment.routes.js";
import notificationRoutes from "./notification.routes.js";
import activityLogRoutes from "./activityLog.routes.js";

const router = Router();

// Health check (lightweight — no auth required)
router.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "TransitOps API v1 is running",
        timestamp: new Date().toISOString(),
    });
});

// ── Module Routes ────────────────────────────────────────────
router.use("/auth", authRoutes);
router.use("/vehicles", vehicleRoutes);
router.use("/drivers", driverRoutes);
router.use("/trips", tripRoutes);
router.use("/maintenance", maintenanceRoutes);
router.use("/fuel-logs", fuelRoutes);
router.use("/expenses", expenseRoutes);
router.use("/attachments", attachmentRoutes);
router.use("/notifications", notificationRoutes);
router.use("/activity-logs", activityLogRoutes);

export default router;
