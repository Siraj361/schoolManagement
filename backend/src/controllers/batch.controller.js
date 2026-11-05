const { Op } = require("sequelize");
const { Batch, Course, Student } = require("../models");

const list = async (req, res, next) => {
  try {
    const where = { instituteId: req.user.instituteId };
    if (req.query.search) where.name = { [Op.like]: `%${req.query.search}%` };
    const items = await Batch.findAll({
      where,
      order: [["created_at", "DESC"]],
      limit: Math.min(Number(req.query.limit) || 100, 250),
      include: [{ model: Course, attributes: ["id", "name"] }, { model: Student, attributes: ["id"], required: false }],
    });
    return res.json({ success: true, data: { items: items.map((batch) => ({ ...batch.toJSON(), enrollmentCount: batch.Students?.length || 0 })) } });
  } catch (error) { return next(error); }
};

const create = async (req, res, next) => {
  try {
    const { courseId, name, shift, startDate, endDate, capacity, status } = req.body;
    if (!courseId || !name?.trim()) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Course and batch name are required" } });
    const course = await Course.findOne({ where: { id: courseId, instituteId: req.user.instituteId } });
    if (!course) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Course does not belong to this institute" } });
    const batch = await Batch.create({ instituteId: req.user.instituteId, courseId, name: name.trim(), shift: shift || null, startDate: startDate || null, endDate: endDate || null, capacity: Number(capacity) || null, status: status || "ACTIVE" });
    const record = await Batch.findByPk(batch.id, { include: [{ model: Course, attributes: ["id", "name"] }] });
    return res.status(201).json({ success: true, data: { item: { ...record.toJSON(), enrollmentCount: 0 } } });
  } catch (error) { return next(error); }
};

module.exports = { list, create };
