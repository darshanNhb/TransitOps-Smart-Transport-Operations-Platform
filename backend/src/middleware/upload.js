// ─────────────────────────────────────────────────────────────
// Multer Upload Middleware
// ─────────────────────────────────────────────────────────────
// Handles file uploads, storing them in local `uploads/` folder.
// Filenames are prefixed with dates to prevent collisions.
// Filters only permitted mime types and constrains size to 10MB.
// ─────────────────────────────────────────────────────────────

import multer from "multer";
import path from "path";
import fs from "fs";
import ApiError from "../utils/ApiError.js";

const UPLOAD_DIR = "./uploads";

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedExtensions = /jpeg|jpg|png|pdf|csv/;
    const allowedMimeTypes = ["image/jpeg", "image/png", "application/pdf", "text/csv"];

    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimeTypes.includes(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(ApiError.badRequest("Only JPEG, JPG, PNG, PDF, and CSV files are allowed"));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB limit
    },
});

export default upload;
