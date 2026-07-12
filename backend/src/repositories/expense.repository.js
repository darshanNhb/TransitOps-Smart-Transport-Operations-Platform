// ─────────────────────────────────────────────────────────────
// Expense Repository
// ─────────────────────────────────────────────────────────────

import BaseRepository from "./baseRepository.js";

class ExpenseRepository extends BaseRepository {
    constructor() {
        super("expense");
    }
}

export default new ExpenseRepository();
