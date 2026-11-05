const { Op } = require("sequelize");
const { ContactMessage, Institute } = require("../models");
const getPublicInstituteEmail = require("../config/publicInstitute");

const createPublic = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body || {};
    const cleanName = typeof name === "string" ? name.trim() : "";
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const cleanSubject = typeof subject === "string" ? subject.trim() : "";
    const cleanMessage = typeof message === "string" ? message.trim() : "";

    if (!cleanName || cleanName.length > 160) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Enter your name (up to 160 characters)" } });
    if (cleanEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Enter a valid email address" } });
    if (!cleanSubject || cleanSubject.length > 160) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Enter a subject (up to 160 characters)" } });
    if (!cleanMessage || cleanMessage.length > 2000) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Enter a message (up to 2000 characters)" } });

    const institute = await Institute.findOne({ where: { email: getPublicInstituteEmail() }, attributes: ["id"] });
    if (!institute) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Institute not found" } });

    const item = await ContactMessage.create({
      instituteId: institute.id,
      name: cleanName,
      email: cleanEmail,
      subject: cleanSubject,
      message: cleanMessage,
    });
    return res.status(201).json({ success: true, data: { id: item.id }, message: "Message submitted successfully" });
  } catch (error) {
    return next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const where = { instituteId: req.user.instituteId };
    if (["NEW", "READ", "REPLIED"].includes(req.query.status)) where.status = req.query.status;
    if (typeof req.query.search === "string" && req.query.search.trim()) {
      const search = req.query.search.trim();
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { subject: { [Op.like]: `%${search}%` } },
        { message: { [Op.like]: `%${search}%` } },
      ];
    }
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 100, 1), 250);
    const [items, total] = await Promise.all([
      ContactMessage.findAll({ where, order: [["created_at", "DESC"]], limit }),
      ContactMessage.count({ where }),
    ]);
    return res.json({ success: true, data: { items, total } });
  } catch (error) {
    return next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!["NEW", "READ", "REPLIED"].includes(status)) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Select a valid message status" } });
    const item = await ContactMessage.findOne({ where: { id: req.params.messageId, instituteId: req.user.instituteId } });
    if (!item) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Contact message not found" } });
    await item.update({ status });
    return res.json({ success: true, data: { item } });
  } catch (error) {
    return next(error);
  }
};

module.exports = { createPublic, list, updateStatus };
