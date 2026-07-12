// ─────────────────────────────────────────────────────────────
// Attachment Repository
// ─────────────────────────────────────────────────────────────

import BaseRepository from "./baseRepository.js";

class AttachmentRepository extends BaseRepository {
    constructor() {
        super("attachment");
    }
}

export default new AttachmentRepository();
