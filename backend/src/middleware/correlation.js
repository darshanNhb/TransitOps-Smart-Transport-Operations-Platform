// ─────────────────────────────────────────────────────────────
// Correlation ID Middleware
// ─────────────────────────────────────────────────────────────
// Appends a unique trace identifier (UUID) to req.correlationId.
// If the incoming request already has an x-correlation-id header
// (e.g. from an API gateway or client), we reuse it.
// We also set the header in the outgoing response.
// ─────────────────────────────────────────────────────────────

import crypto from "crypto";

const CORRELATION_HEADER = "x-correlation-id";

const correlation = (req, res, next) => {
    const correlationId = req.headers[CORRELATION_HEADER] || crypto.randomUUID();
    
    req.correlationId = correlationId;
    res.setHeader(CORRELATION_HEADER, correlationId);
    
    next();
};

export default correlation;
export { CORRELATION_HEADER };
