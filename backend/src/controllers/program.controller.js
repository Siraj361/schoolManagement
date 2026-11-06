const { Op } = require("sequelize");
const fs = require("fs");
const path = require("path");
const { Program } = require("../models");

const normalizeSlug = (slug) => String(slug || "")
  .trim()
  .toLowerCase()
  .replace(/\s+/g, "-")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const list = async (req, res, next) => {
  try {
    const where = { instituteId: req.user.instituteId };
    if (req.query.status) where.status = req.query.status;
    if (req.query.search) where.name = { [Op.like]: `%${req.query.search}%` };
    const items = await Program.findAll({ where, order: [["category", "ASC"], ["name", "ASC"]], limit: Math.min(Number(req.query.limit) || 100, 250) });
    return res.json({ success: true, data: { items } });
  } catch (error) { return next(error); }
};

const create = async (req, res, next) => {
  try {
    const { name, slug, category, description, durationMonths, imageUrl } = req.body || {};
    if (typeof name !== "string" || !name.trim() || name.trim().length > 160) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Program name is required and must be 160 characters or fewer" } });
    const normalizedSlug = normalizeSlug(slug);
    if (!normalizedSlug || normalizedSlug.length > 180) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Enter a valid program slug" } });
    if (typeof category !== "string" || !category.trim() || category.trim().length > 100) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Program category is required and must be 100 characters or fewer" } });
    if (typeof description !== "string" || !description.trim()) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Program description is required" } });
    const months = durationMonths === null || durationMonths === "" || durationMonths === undefined ? null : Number(durationMonths);
    if (months !== null && (!Number.isInteger(months) || months < 1 || months > 120)) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Duration must be between 1 and 120 months" } });
    const item = await Program.create({ instituteId: req.user.instituteId, name: name.trim(), slug: normalizedSlug, category: category.trim(), description: description.trim(), durationMonths: months, imageUrl: typeof imageUrl === "string" ? imageUrl.trim() || null : null });
    return res.status(201).json({ success: true, data: { item } });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") return res.status(409).json({ success: false, error: { code: "SLUG_EXISTS", message: "A program with this slug already exists" } });
    return next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const item = await Program.findOne({ where: { id: req.params.programId, instituteId: req.user.instituteId } });
    if (!item) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Program not found" } });
    const { name, slug, category, description, durationMonths, status, imageUrl } = req.body || {};
    const values = {};
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim() || name.trim().length > 160) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Program name is required and must be 160 characters or fewer" } });
      values.name = name.trim();
    }
    if (slug !== undefined) {
      const normalizedSlug = normalizeSlug(slug);
      if (!normalizedSlug || normalizedSlug.length > 180) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Enter a valid program slug" } });
      values.slug = normalizedSlug;
    }
    if (category !== undefined) {
      if (typeof category !== "string" || !category.trim() || category.trim().length > 100) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Program category is required and must be 100 characters or fewer" } });
      values.category = category.trim();
    }
    if (description !== undefined) {
      if (typeof description !== "string" || !description.trim()) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Program description is required" } });
      values.description = description.trim();
    }
    if (imageUrl !== undefined) values.imageUrl = typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim() : null;
    if (durationMonths !== undefined) {
      const months = durationMonths === null || durationMonths === "" ? null : Number(durationMonths);
      if (months !== null && (!Number.isInteger(months) || months < 1 || months > 120)) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Duration must be between 1 and 120 months" } });
      values.durationMonths = months;
    }
    if (status !== undefined) {
      if (!["ACTIVE", "ARCHIVED"].includes(status)) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Status must be ACTIVE or ARCHIVED" } });
      values.status = status;
    }
    await item.update(values);
    return res.json({ success: true, data: { item } });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") return res.status(409).json({ success: false, error: { code: "SLUG_EXISTS", message: "A program with this slug already exists" } });
    return next(error);
  }
};

const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: { code: "IMAGE_REQUIRED", message: "An image file is required" } });
    const item = await Program.findOne({ where: { id: req.params.programId, instituteId: req.user.instituteId } });
    if (!item) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Program not found" } });
    }
    if (item.imageUrl?.startsWith("/uploads/programs/")) {
      const oldPath = path.join(__dirname, "../..", item.imageUrl);
      await fs.promises.unlink(oldPath).catch(() => {});
    }
    const imageUrl = `/uploads/programs/${req.file.filename}`;
    await item.update({ imageUrl });
    return res.json({ success: true, data: { imageUrl, item } });
  } catch (error) { return next(error); }
};

module.exports = { list, create, update, uploadImage };
