const errorHandler = (error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  if (error.code === "LIMIT_FILE_SIZE") return res.status(400).json({ success: false, error: { code: "FILE_TOO_LARGE", message: error.field === "cv" ? "CV must be 5MB or smaller" : "Student photo must be 5MB or smaller" } });
  if (error.message === "CV must be a PDF, DOC, or DOCX file") return res.status(400).json({ success: false, error: { code: "INVALID_FILE_TYPE", message: error.message } });
  if (error.code === "INVALID_FILE_CONTENT") return res.status(400).json({ success: false, error: { code: error.code, message: error.message } });
  if (error.message === "Only JPEG, PNG, and WebP images are allowed") return res.status(400).json({ success: false, error: { code: "INVALID_FILE_TYPE", message: error.message } });
  if (error.name === "SequelizeValidationError") return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: error.errors?.map((item) => item.message).join(", ") || error.message } });
  if (error.name === "SequelizeUniqueConstraintError") return res.status(409).json({ success: false, error: { code: "DUPLICATE_RECORD", message: error.errors?.map((item) => item.message).join(", ") || "A record with these values already exists" } });
  return res.status(error.statusCode || 500).json({ success: false, error: { code: error.code || "INTERNAL_ERROR", message: error.message || "An unexpected error occurred" } });
};

module.exports = errorHandler;
