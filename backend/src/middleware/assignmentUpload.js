const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadDirectory = path.join(__dirname, "../../uploads/assignments");
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDirectory),
  filename: (_req, file, callback) => callback(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${path.extname(file.originalname).toLowerCase()}`),
});

const fileFilter = (_req, file, callback) => {
  if (file.mimetype === "application/zip" || file.mimetype === "application/x-zip-compressed" || path.extname(file.originalname).toLowerCase() === ".zip") return callback(null, true);
  return callback(new Error("Only ZIP files are allowed for assignment submissions"));
};

const uploadAssignmentFile = multer({ storage, fileFilter, limits: { fileSize: 25 * 1024 * 1024, files: 1 } });

module.exports = { uploadAssignmentFile };
