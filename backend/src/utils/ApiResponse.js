// ─────────────────────────────────────────────────────────────
// ApiResponse — Standardized Success Response Builder
// ─────────────────────────────────────────────────────────────
// Every successful API response goes through this class to
// guarantee a uniform JSON structure across all endpoints.
// ─────────────────────────────────────────────────────────────

class ApiResponse {
    constructor(statusCode, message, data = null, meta = null) {
        this.success = true;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.meta = meta;
    }

    static ok(res, message, data, meta) {
        const response = new ApiResponse(200, message, data, meta);
        return res.status(200).json(response);
    }

    static created(res, message, data) {
        const response = new ApiResponse(201, message, data);
        return res.status(201).json(response);
    }

    static noContent(res) {
        return res.status(204).end();
    }

    static paginated(res, message, data, pagination) {
        const response = new ApiResponse(200, message, data, { pagination });
        return res.status(200).json(response);
    }
}

export default ApiResponse;
