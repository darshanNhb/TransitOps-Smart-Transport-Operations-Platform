// ─────────────────────────────────────────────────────────────
// Async Handler — Express Async Wrapper
// ─────────────────────────────────────────────────────────────
// Wraps async route handlers so rejected promises are
// automatically forwarded to the global error handler.
// Eliminates try/catch boilerplate in every controller.
// ─────────────────────────────────────────────────────────────

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
