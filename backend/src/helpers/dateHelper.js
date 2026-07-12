// ─────────────────────────────────────────────────────────────
// Date Helper
// ─────────────────────────────────────────────────────────────

/**
 * Convert a duration string (e.g., "15m", "7d", "1h") to milliseconds.
 */
export function durationToMs(duration) {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) throw new Error(`Invalid duration format: ${duration}`);

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return value * multipliers[unit];
}

/**
 * Check if a date is in the past.
 */
export function isExpired(date) {
    return new Date(date) < new Date();
}

/**
 * Get a future Date by adding milliseconds to now.
 */
export function futureDate(ms) {
    return new Date(Date.now() + ms);
}
