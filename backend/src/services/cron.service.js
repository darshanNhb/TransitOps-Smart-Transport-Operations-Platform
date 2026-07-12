import cron from "node-cron";
import prisma from "../config/prisma.js";
import emailService from "./email.service.js";
import logger from "../config/logger.js";

class CronService {
    start() {
        // Run every day at 00:00 (Midnight)
        cron.schedule("0 0 * * *", async () => {
            logger.info("Running daily license expiry check...");
            await this.checkLicenseExpiries();
        });

        logger.info("Cron service started (Scheduled tasks registered)");
    }

    async checkLicenseExpiries() {
        try {
            // Find 7 days from now (start and end of day)
            const targetDateStart = new Date();
            targetDateStart.setDate(targetDateStart.getDate() + 7);
            targetDateStart.setHours(0, 0, 0, 0);

            const targetDateEnd = new Date(targetDateStart);
            targetDateEnd.setDate(targetDateEnd.getDate() + 1);

            const drivers = await prisma.driver.findMany({
                where: {
                    licenseExpiry: {
                        gte: targetDateStart,
                        lt: targetDateEnd,
                    },
                    status: {
                        not: "SUSPENDED"
                    }
                }
            });

            logger.info(`Found ${drivers.length} drivers with licenses expiring on ${targetDateStart.toDateString()}`);

            for (const driver of drivers) {
                const subject = "ACTION REQUIRED: Driver's License Expiry Reminder (7 Days)";
                const html = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                        <h2 style="color: #e11d48; border-bottom: 2px solid #fee2e2; padding-bottom: 10px;">License Expiry Reminder</h2>
                        <p>Dear <strong>${driver.name}</strong>,</p>
                        <p>This is an automated reminder that your driver's license (Number: <strong>${driver.licenseNumber}</strong>) is scheduled to expire in exactly <strong>7 days</strong> on <strong>${targetDateStart.toDateString()}</strong>.</p>
                        <p>Please ensure you renew your license and provide the updated documents to the fleet management team before this date to avoid any suspension of driving privileges.</p>
                        <br/>
                        <p style="color: #64748b; font-size: 14px;">If you have already submitted your renewed license, please disregard this email.</p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                        <p style="font-size: 12px; color: #94a3b8; text-align: center;">TransitOps Fleet Safety Management</p>
                    </div>
                `;

                await emailService.sendEmail({
                    to: driver.email,
                    subject,
                    html
                });
            }
        } catch (error) {
            logger.error("Failed to execute daily license expiry check:", error);
        }
    }
}

export default new CronService();
