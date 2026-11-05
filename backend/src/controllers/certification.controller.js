const { Op } = require("sequelize");
const { Certification } = require("../models");

const list = async (req, res, next) => {
  try {
    const where = { instituteId: req.user.instituteId };
    if (req.query.status) where.status = req.query.status;
    const items = await Certification.findAll({ where, order: [["examDate", "ASC"], ["created_at", "DESC"]], limit: Math.min(Number(req.query.limit) || 100, 250) });
    const summary = items.reduce((result, item) => { result.candidates += Number(item.candidateCount || 0); result.issued += Number(item.issuedCount || 0); if (item.status === "SCHEDULED" || item.status === "REGISTRATION_OPEN") result.upcoming += 1; return result; }, { upcoming: 0, candidates: 0, issued: 0 });
    return res.json({ success: true, data: { items, summary } });
  } catch (error) { return next(error); }
};

const create = async (req, res, next) => {
  try {
    const { title, code, examDate, candidateCount, status } = req.body;
    if (!title?.trim() || !code?.trim()) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Title and code are required" } });
    const item = await Certification.create({ instituteId: req.user.instituteId, title: title.trim(), code: code.trim().toUpperCase(), examDate: examDate || null, candidateCount: Math.max(0, Number(candidateCount) || 0), status: ["SCHEDULED", "REGISTRATION_OPEN", "COMPLETED", "CANCELLED"].includes(status) ? status : "SCHEDULED" });
    return res.status(201).json({ success: true, data: { item } });
  } catch (error) { if (error.name === "SequelizeUniqueConstraintError") return res.status(409).json({ success: false, error: { code: "CODE_EXISTS", message: "Certification code already exists" } }); return next(error); }
};

module.exports = { list, create };
