// ─────────────────────────────────────────────────────────────
// Attachment Router
// ─────────────────────────────────────────────────────────────

import { Router } from "express";
import { uploadAttachment, deleteAttachment } from "../../controllers/attachment.controller.js";
import authenticate from "../../middleware/authenticate.js";
import authorize from "../../middleware/authorize.js";
import upload from "../../middleware/upload.js";
import validate from "../../middleware/validate.js";
import { uuidParam } from "../../validations/common.js";

const router = Router();

// Secure all endpoints in this router
router.use(authenticate);

router.post("/upload", upload.single("file"), authorize("document", "create"), uploadAttachment);
router.delete("/:id", validate(uuidParam), authorize("document", "delete"), deleteAttachment);

export default router;
