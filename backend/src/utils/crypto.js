// ─────────────────────────────────────────────────────────────
// Cryptography Utilities — PII Encryption at Rest
// ─────────────────────────────────────────────────────────────
// Uses AES-256-GCM to encrypt/decrypt sensitive fields (PII) at
// the application layer. The key is derived dynamically using
// SHA256 of the JWT_SECRET to guarantee a 32-byte key width.
// ─────────────────────────────────────────────────────────────

import crypto from "crypto";
import env from "../config/env.js";

const ALGORITHM = "aes-256-gcm";
// Derive a stable 32-byte key from JWT_SECRET
const KEY = crypto.createHash("sha256").update(env.JWT_SECRET).digest();

/**
 * Encrypt a plaintext string.
 * @param {string} text - Plaintext to encrypt
 * @returns {string|null} - Format ivHex:encryptedHex:authTagHex
 */
export function encrypt(text) {
    if (!text) return null;
    try {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
        
        let encrypted = cipher.update(text, "utf8", "hex");
        encrypted += cipher.final("hex");
        
        const authTag = cipher.getAuthTag().toString("hex");
        
        return `${iv.toString("hex")}:${encrypted}:${authTag}`;
    } catch (error) {
        return null;
    }
}

/**
 * Decrypt a ciphertext string.
 * @param {string} cipherText - Format ivHex:encryptedHex:authTagHex
 * @returns {string|null} - Decrypted plaintext
 */
export function decrypt(cipherText) {
    if (!cipherText) return null;
    try {
        const parts = cipherText.split(":");
        if (parts.length !== 3) return cipherText; // Return original if not formatted
        
        const [ivHex, encryptedHex, authTagHex] = parts;
        const iv = Buffer.from(ivHex, "hex");
        const authTag = Buffer.from(authTagHex, "hex");
        
        const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encryptedHex, "hex", "utf8");
        decrypted += decipher.final("utf8");
        
        return decrypted;
    } catch (error) {
        return null;
    }
}
