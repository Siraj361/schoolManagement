const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const { Institute, TeamApplication } = require("../models");
const getPublicInstituteEmail = require("../config/publicInstitute");

const uploadDirectory = path.join(__dirname, "../../uploads/team-applications");
const applicationStatuses = ["NEW", "REVIEWING", "SHORTLISTED", "ACCEPTED", "REJECTED"];

const hasValidCvSignature = (file) => {
  const extension = path.extname(file.originalname).toLowerCase();
  if (extension === ".pdf") return file.buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  if (extension === ".doc") return file.buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
  if (extension === ".docx") return file.buffer.subarray(0, 2).toString("ascii") === "PK";
  return false;
};

const createPublic = async (req, res, next) => {
  let savedFilePath;
  try {
    const { applicationType, name, email, phone } = req.body || {};
    let details;
    try {
      details = JSON.parse(req.body?.details || "");
    } catch {
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Application details are invalid" } });
    }
    const types = ["FACULTY", "COMMUNITY", "INTERNSHIP"];
    const cleanName = typeof name === "string" ? name.trim() : "";
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const cleanPhone = typeof phone === "string" ? phone.trim() : "";

    if (!types.includes(applicationType)) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Select a valid application type" } });
    if (!cleanName || cleanName.length > 160) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Enter your name (up to 160 characters)" } });
    if (cleanEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Enter a valid email address" } });
    if (!/^[+()\d\s.-]{7,40}$/.test(cleanPhone)) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Enter a valid mobile or WhatsApp number" } });
    if (!req.file) return res.status(400).json({ success: false, error: { code: "CV_REQUIRED", message: "Please attach your CV (PDF, DOC, or DOCX, up to 5MB)" } });
    if (!hasValidCvSignature(req.file)) return res.status(400).json({ success: false, error: { code: "INVALID_FILE_CONTENT", message: "The uploaded CV does not match its file type" } });
    if (!details || typeof details !== "object" || Array.isArray(details)) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Complete the application details" } });

    const fields = applicationType === "FACULTY"
      ? ["expertise", "experience", "message"]
      : applicationType === "COMMUNITY"
        ? ["interest", "message"]
        : ["education", "department", "message"];
    const cleanDetails = {};
    for (const field of fields) {
      const value = typeof details[field] === "string" ? details[field].trim() : "";
      if (value.length > (field === "message" ? 2000 : 500)) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: `${field} is too long` } });
      if (field !== "message" && !value) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Complete all required application details" } });
      if (value) cleanDetails[field] = value;
    }

    const institute = await Institute.findOne({ where: { email: getPublicInstituteEmail() }, attributes: ["id"] });
    if (!institute) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Institute not found" } });

    await fs.mkdir(uploadDirectory, { recursive: true });
    const cvFileName = `${Date.now()}-${crypto.randomBytes(16).toString("hex")}${path.extname(req.file.originalname).toLowerCase()}`;
    savedFilePath = path.join(uploadDirectory, cvFileName);
    await fs.writeFile(savedFilePath, req.file.buffer, { flag: "wx" });
    const application = await TeamApplication.create({
      instituteId: institute.id,
      applicationType,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      details: { ...cleanDetails, cv: { fileName: cvFileName, originalName: path.basename(req.file.originalname).slice(0, 255) } },
    });
    return res.status(201).json({ success: true, data: { id: application.id }, message: "Application submitted successfully" });
  } catch (error) {
    if (savedFilePath) {
      try {
        await fs.unlink(savedFilePath);
      } catch (cleanupError) {
        if (cleanupError.code !== "ENOENT") return next(cleanupError);
      }
    }
    return next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const where = { instituteId: req.user.instituteId };
    if (["FACULTY", "COMMUNITY", "INTERNSHIP"].includes(req.query.type)) where.applicationType = req.query.type;
    if (applicationStatuses.includes(req.query.status)) where.status = req.query.status;
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 100, 1), 250);
    const [items, total] = await Promise.all([
      TeamApplication.findAll({ where, order: [["created_at", "DESC"]], limit }),
      TeamApplication.count({ where }),
    ]);
    return res.json({ success: true, data: { items, total } });
  } catch (error) {
    return next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!applicationStatuses.includes(status)) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Select a valid application status" } });
    const application = await TeamApplication.findOne({ where: { id: req.params.applicationId, instituteId: req.user.instituteId } });
    if (!application) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Team application not found" } });
    await application.update({ status });
    return res.json({ success: true, data: { item: application } });
  } catch (error) {
    return next(error);
  }
};

const downloadCv = async (req, res, next) => {
  try {
    const application = await TeamApplication.findOne({ where: { id: req.params.applicationId, instituteId: req.user.instituteId } });
    if (!application) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Team application not found" } });
    const fileName = application.details?.cv?.fileName;
    if (!fileName || path.basename(fileName) !== fileName) return res.status(404).json({ success: false, error: { code: "CV_NOT_FOUND", message: "CV is not available" } });
    const filePath = path.join(uploadDirectory, fileName);
    await fs.access(filePath);
    return res.download(filePath, path.basename(application.details.cv.originalName || "applicant-cv"));
  } catch (error) {
    if (error.code === "ENOENT") return res.status(404).json({ success: false, error: { code: "CV_NOT_FOUND", message: "CV file is not available" } });
    return next(error);
  }
};

module.exports = { createPublic, list, updateStatus, downloadCv };
