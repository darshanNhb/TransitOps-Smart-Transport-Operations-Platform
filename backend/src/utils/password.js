// ─────────────────────────────────────────────────────────────
// Password Utilities
// ─────────────────────────────────────────────────────────────

import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

/**
 * Hash a plaintext password.
 */
export async function hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plaintext password against a hash.
 */
export async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}
