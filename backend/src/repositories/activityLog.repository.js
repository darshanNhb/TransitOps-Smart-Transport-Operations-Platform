// ─────────────────────────────────────────────────────────────
// Activity Log Repository
// ─────────────────────────────────────────────────────────────

import BaseRepository from "./baseRepository.js";

class ActivityLogRepository extends BaseRepository {
    constructor() {
        super("activityLog", false, "timestamp");
    }
}

export default new ActivityLogRepository();
