const { Op } = require("sequelize");
const { BatchSession, Batch, Course, User } = require("../models");

const dateOnly = (value) => new Date(`${value}T00:00:00.000Z`);
const dateString = (value) => value.toISOString().slice(0, 10);
const startOfWeek = (value) => {
  const date = dateOnly(value);
  const day = date.getUTCDay();
  date.setUTCDate(date.getUTCDate() - (day === 0 ? 6 : day - 1));
  return dateString(date);
};
const addDays = (value, days) => {
  const date = dateOnly(value);
  date.setUTCDate(date.getUTCDate() + days);
  return dateString(date);
};
const today = () => dateString(new Date());

const include = [
  { model: Batch, attributes: ["id", "name", "shift", "courseId"], include: [{ model: Course, attributes: ["id", "name"] }] },
  { model: User, as: "Instructor", attributes: ["id", "firstName", "lastName"], required: false },
];

const list = async (req, res, next) => {
  try {
    const weekStart = startOfWeek(req.query.weekStart || today());
    const where = { instituteId: req.user.instituteId, date: { [Op.gte]: weekStart, [Op.lte]: addDays(weekStart, 6) } };
    if (req.query.batchId) where.batchId = req.query.batchId;
    const sessions = await BatchSession.findAll({ where, order: [["date", "ASC"], ["startTime", "ASC"]], include });
    return res.json({ success: true, data: { items: sessions, weekStart, weekEnd: addDays(weekStart, 6) } });
  } catch (error) { return next(error); }
};

const create = async (req, res, next) => {
  try {
    const { batchId, instructorId, title, date, startTime, endTime, room, status } = req.body;
    if (!batchId || !title?.trim() || !date || !startTime || !endTime) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Batch, title, date, start time, and end time are required" } });
    if (startTime >= endTime) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "End time must be after start time" } });
    const batch = await Batch.findOne({ where: { id: batchId, instituteId: req.user.instituteId, status: "ACTIVE" } });
    if (!batch) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Active batch does not belong to this institute" } });
    if (instructorId && !await User.findOne({ where: { id: instructorId, instituteId: req.user.instituteId, role: "INSTRUCTOR", status: "ACTIVE" } })) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Instructor does not belong to this institute" } });
    const session = await BatchSession.create({ instituteId: req.user.instituteId, batchId, instructorId: instructorId || null, title: title.trim(), date, startTime, endTime, room: room?.trim() || null, status: ["SCHEDULED", "COMPLETED", "CANCELLED"].includes(status) ? status : "SCHEDULED" });
    const record = await BatchSession.findByPk(session.id, { include });
    return res.status(201).json({ success: true, data: { item: record } });
  } catch (error) { return next(error); }
};

module.exports = { list, create, startOfWeek, addDays };
