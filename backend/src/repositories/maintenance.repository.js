// ─────────────────────────────────────────────────────────────
// Maintenance Repository
// ─────────────────────────────────────────────────────────────

import BaseRepository from "./baseRepository.js";

class MaintenanceRepository extends BaseRepository {
    constructor() {
        super("maintenance");
    }
}

export default new MaintenanceRepository();
