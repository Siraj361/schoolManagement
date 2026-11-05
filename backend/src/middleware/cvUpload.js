const multer = require("multer");
const path = require("path");

const allowedTypes = new Map([
  [".pdf", "application/pdf"],
  [".doc", "application/msword"],
  [".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
]);

const uploadCv = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.get(extension) === file.mimetype) return callback(null, true);
    return callback(new Error("CV must be a PDF, DOC, or DOCX file"));
  },
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

module.exports = { uploadCv };
