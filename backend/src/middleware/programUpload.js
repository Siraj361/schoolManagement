const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadDirectory = path.join(__dirname, "../../uploads/programs");
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDirectory),
  filename: (_req, file, callback) => callback(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${path.extname(file.originalname).toLowerCase()}`),
});

const uploadProgramImage = multer({
  storage,
  fileFilter: (_req, file, callback) => ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)
    ? callback(null, true)
    : callback(new Error("Only JPEG, PNG, and WebP images are allowed")),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

module.exports = { uploadProgramImage };
