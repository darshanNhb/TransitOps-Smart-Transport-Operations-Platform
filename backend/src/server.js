// ─────────────────────────────────────────────────────────────
// Server Entry Point — Startup & Graceful Shutdown
// ─────────────────────────────────────────────────────────────
// Responsibilities:
//   1. Start the HTTP server
//   2. Log startup confirmation via Winston
//   3. Gracefully shutdown on SIGTERM / SIGINT:
//      - Stop accepting new connections
//      - Disconnect Prisma client
//      - Exit cleanly
// ─────────────────────────────────────────────────────────────

import app from "./app.js";
import env from "./config/env.js";
import logger from "./config/logger.js";
import prisma from "./config/prisma.js";
import cronService from "./services/cron.service.js";

const server = app.listen(env.PORT, () => {
    logger.info(`🚀 TransitOps API running on http://localhost:${env.PORT}`);
    logger.info(`📦 Environment: ${env.NODE_ENV}`);
    
    // Start background jobs
    cronService.start();
});

// ── Graceful Shutdown ────────────────────────────────────────
const shutdown = async (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);

    server.close(async () => {
        logger.info("HTTP server closed");
        await prisma.$disconnect();
        logger.info("Prisma client disconnected");
        process.exit(0);
    });

    // Force shutdown after 10 seconds if graceful fails
    setTimeout(() => {
        logger.error("Forced shutdown — graceful shutdown timed out");
        process.exit(1);
    }, 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// ── Unhandled Rejection / Exception Safety Net ──────────────
process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
    logger.error("Uncaught Exception:", err);
    process.exit(1);
});