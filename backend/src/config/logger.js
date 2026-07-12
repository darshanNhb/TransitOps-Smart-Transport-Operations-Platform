// ─────────────────────────────────────────────────────────────
// Winston Logger Configuration
// ─────────────────────────────────────────────────────────────
// Development: colorized console output
// Production:  JSON-formatted file output (error.log + combined.log)
// Morgan HTTP logger is piped into Winston via a writable stream.
// ─────────────────────────────────────────────────────────────

import winston from "winston";
import env from "./env.js";

const { combine, timestamp, printf, colorize, json } = winston.format;

// Human-readable format for development console
const devFormat = printf(({ level, message, timestamp, stack, correlationId }) => {
    const cid = correlationId ? ` [CID: ${correlationId}]` : "";
    return `${timestamp} [${level}]${cid}: ${stack || message}`;
});

const logger = winston.createLogger({
    level: env.isDevelopment ? "debug" : "info",
    format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.errors({ stack: true })
    ),
    defaultMeta: { service: "transitops" },
    transports: [],
});

// Development — colorized console
if (env.isDevelopment) {
    logger.add(
        new winston.transports.Console({
            format: combine(colorize(), devFormat),
        })
    );
}

// Production — structured JSON files
if (env.isProduction) {
    logger.add(
        new winston.transports.File({
            filename: "logs/error.log",
            level: "error",
            format: json(),
            maxsize: 5 * 1024 * 1024, // 5 MB
            maxFiles: 5,
        })
    );
    logger.add(
        new winston.transports.File({
            filename: "logs/combined.log",
            format: json(),
            maxsize: 10 * 1024 * 1024, // 10 MB
            maxFiles: 5,
        })
    );
}

// Stream interface for Morgan
logger.stream = {
    write: (message) => logger.http(message.trim()),
};

export default logger;
