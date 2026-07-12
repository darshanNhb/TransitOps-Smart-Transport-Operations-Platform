// ─────────────────────────────────────────────────────────────
// Fuel Log Repository
// ─────────────────────────────────────────────────────────────

import BaseRepository from "./baseRepository.js";

class FuelRepository extends BaseRepository {
    constructor() {
        super("fuelLog");
    }
}

export default new FuelRepository();
