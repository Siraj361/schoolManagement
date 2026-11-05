const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadDirectory = path.join(__dirname, "../../uploads/students");
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDirectory),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${extension}`);
  },
});

const fileFilter = (_req, file, callback) => {
  if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) return callback(null, true);
  return callback(new Error("Only JPEG, PNG, and WebP images are allowed"));
};

const uploadStudentPhoto = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

module.exports = { uploadStudentPhoto };
