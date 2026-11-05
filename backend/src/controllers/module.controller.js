const { Op } = require("sequelize");
const { ModuleRecord } = require("../models");

const moduleName = (req) => req.params.module || req.baseUrl.replace(/^\/api\/v1\//, "").replaceAll("/", "-");

const list = async (req, res, next) => {
  try {
    const where = { instituteId: req.user.instituteId, module: moduleName(req) };
    if (req.query.search) where.name = { [Op.like]: `%${req.query.search}%` };
    const items = await ModuleRecord.findAll({ where, order: [["created_at", "DESC"]], limit: Math.min(Number(req.query.limit) || 100, 250) });
    return res.json({ success: true, data: { items } });
  } catch (error) { return next(error); }
};

const create = async (req, res, next) => {
  try {
    const { name, details, status, owner } = req.body;
    if (!name) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Name is required" } });
    const item = await ModuleRecord.create({ instituteId: req.user.instituteId, module: moduleName(req), name, details: details || {}, status: status || "ACTIVE", owner: owner || "Admin team" });
    return res.status(201).json({ success: true, data: { item } });
  } catch (error) { return next(error); }
};

const update = async (req, res, next) => {
  try {
    const item = await ModuleRecord.findOne({ where: { id: req.params.id, instituteId: req.user.instituteId, module: moduleName(req) } });
    if (!item) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Record not found" } });
    await item.update({ name: req.body.name || item.name, details: req.body.details || item.details, status: req.body.status || item.status, owner: req.body.owner || item.owner });
    return res.json({ success: true, data: { item } });
  } catch (error) { return next(error); }
};

const uploadImage = async (req, res, next) => {
  try {
    if (moduleName(req) !== "life-at-prime") return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Image uploads are not available for this module" } });
    if (!req.file) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "An image file is required" } });
    return res.status(201).json({ success: true, data: { imageUrl: `/uploads/users/${req.file.filename}` } });
  } catch (error) { return next(error); }
};

module.exports = { list, create, update, uploadImage };
