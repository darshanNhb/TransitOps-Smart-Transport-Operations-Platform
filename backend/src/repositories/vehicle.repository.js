// ─────────────────────────────────────────────────────────────
// Vehicle Repository
// ─────────────────────────────────────────────────────────────

import BaseRepository from "./baseRepository.js";

class VehicleRepository extends BaseRepository {
    constructor() {
        super("vehicle");
    }

    async findByVehicleNumber(vehicleNumber, organizationId) {
        return this.findOne(organizationId, { vehicleNumber });
    }

    async findByRegistrationNumber(registrationNumber, organizationId) {
        return this.findOne(organizationId, { registrationNumber });
    }
}

export default new VehicleRepository();
