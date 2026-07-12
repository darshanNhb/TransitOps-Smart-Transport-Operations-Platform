// ─────────────────────────────────────────────────────────────
// Driver Repository
// ─────────────────────────────────────────────────────────────

import BaseRepository from "./baseRepository.js";

class DriverRepository extends BaseRepository {
    constructor() {
        super("driver");
    }

    async findByEmployeeCode(employeeCode, organizationId) {
        return this.findOne(organizationId, { employeeCode });
    }

    async findByLicenseNumber(licenseNumber, organizationId) {
        return this.findOne(organizationId, { licenseNumber });
    }

    async findByEmail(email, organizationId) {
        return this.findOne(organizationId, { email });
    }
}

export default new DriverRepository();
