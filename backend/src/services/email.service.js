import nodemailer from "nodemailer";
import logger from "../config/logger.js";
import env from "../config/env.js";

// ─────────────────────────────────────────────────────────────
// Email Service
// ─────────────────────────────────────────────────────────────

class EmailService {
    constructor() {
        this.transporter = null;
    }

    async init() {
        if (env.SMTP_HOST && env.SMTP_USER) {
            // Use provided SMTP credentials
            this.transporter = nodemailer.createTransport({
                host: env.SMTP_HOST,
                port: env.SMTP_PORT || 587,
                secure: env.SMTP_PORT === 465, // true for 465, false for other ports
                auth: {
                    user: env.SMTP_USER,
                    pass: env.SMTP_PASS,
                },
            });
        } else {
            // Development fallback: Automatically create an Ethereal test account
            logger.info("No SMTP credentials provided. Creating an Ethereal test account...");
            const testAccount = await nodemailer.createTestAccount();
            this.transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            logger.info("Ethereal test account created successfully.");
        }
    }

    async sendEmail({ to, subject, html, text }) {
        if (!this.transporter) {
            await this.init();
        }

        try {
            const info = await this.transporter.sendMail({
                from: '"TransitOps Fleet Safety" <noreply@transitops.com>',
                to,
                subject,
                text,
                html,
            });

            logger.info(`Message sent to ${to}: ${info.messageId}`);
            
            // If using Ethereal, log the preview URL so the developer can see the email
            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) {
                logger.info(`Preview URL: ${previewUrl}`);
            }

            return info;
        } catch (error) {
            logger.error(`Error sending email to ${to}:`, error);
            throw error;
        }
    }
}

export default new EmailService();
