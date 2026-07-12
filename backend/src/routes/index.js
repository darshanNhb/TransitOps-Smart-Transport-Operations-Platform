// ─────────────────────────────────────────────────────────────
// Root API Router — Version Multiplexer
// ─────────────────────────────────────────────────────────────
// Mounts versioned API routers. When v2 is introduced, add:
//   import v2Router from "./v2/index.js";
//   router.use("/v2", v2Router);
// Existing v1 clients are never broken.
// ─────────────────────────────────────────────────────────────

import { Router } from "express";
import v1Router from "./v1/index.js";

const router = Router();

router.use("/v1", v1Router);

export default router;
