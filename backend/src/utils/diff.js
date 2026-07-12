// ─────────────────────────────────────────────────────────────
// JSON Diff Engine
// ─────────────────────────────────────────────────────────────
// Compares two objects (original vs updated record) and returns
// an optimized payload containing only the fields that changed.
// Ignores standard system timestamps.
// ─────────────────────────────────────────────────────────────

const IGNORE_FIELDS = new Set(["createdAt", "updatedAt", "deletedAt"]);

/**
 * Compare two objects and return diff.
 * @param {Object} original - The database record before updates
 * @param {Object} updated - The submitted data payload
 * @returns {{ oldData: Object, newData: Object }|null}
 */
export function getDiff(original, updated) {
    if (!original || !updated) return null;
    
    const oldData = {};
    const newData = {};
    let hasChanges = false;

    // We only care about fields in the updated payload
    for (const key of Object.keys(updated)) {
        if (IGNORE_FIELDS.has(key)) continue;

        const origVal = original[key];
        const newVal = updated[key];

        // Format dates / decimals to comparable strings or primitives
        const val1 = origVal instanceof Date ? origVal.toISOString() : origVal;
        const val2 = newVal instanceof Date ? newVal.toISOString() : newVal;

        // Perform comparison, resolving null vs undefined matches
        if (val1 !== val2 && !(val1 === null && val2 === undefined) && !(val1 === undefined && val2 === null)) {
            oldData[key] = origVal;
            newData[key] = newVal;
            hasChanges = true;
        }
    }

    return hasChanges ? { oldData, newData } : null;
}
