const { Op } = require("sequelize");
const { Course, Student, Invoice, Payment } = require("../models");

const currentMonthRange = () => {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const next = new Date(start);
  next.setMonth(next.getMonth() + 1);
  return { start, next, dueDate: { [Op.gte]: start.toISOString().slice(0, 10), [Op.lt]: next.toISOString().slice(0, 10) } };
};

const list = async (req, res, next) => {
  try {
    const where = { instituteId: req.user.instituteId };
    if (req.query.search) where.name = { [Op.like]: `%${req.query.search}%` };
    const items = await Course.findAll({ where, order: [["created_at", "DESC"]], limit: Math.min(Number(req.query.limit) || 100, 250) });
    return res.json({ success: true, data: { items } });
  } catch (error) { return next(error); }
};

const students = async (req, res, next) => {
  try {
    const course = await Course.findOne({ where: { id: req.params.courseId, instituteId: req.user.instituteId } });
    if (!course) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Course not found" } });

    const range = currentMonthRange();
    const students = await Student.findAll({
      where: { instituteId: req.user.instituteId, courseId: course.id },
      order: [["name", "ASC"]],
      include: [{
        model: Invoice,
        required: false,
        where: { dueDate: range.dueDate },
        include: [{ model: Payment, required: false, attributes: ["amountMinor", "paidAt"] }],
      }],
    });

    const items = students.map((student) => {
      const item = student.toJSON();
      const dueMinor = (item.Invoices || []).reduce((total, invoice) => total + Number(invoice.amountMinor || 0), 0);
      const paidMinor = (item.Invoices || []).reduce((total, invoice) => total + (invoice.Payments || []).filter((payment) => {
        const paidAt = new Date(payment.paidAt);
        return paidAt >= range.start && paidAt < range.next;
      }).reduce((invoiceTotal, payment) => invoiceTotal + Number(payment.amountMinor || 0), 0), 0);
      const outstandingMinor = Math.max(dueMinor - paidMinor, 0);
      delete item.Invoices;
      return { ...item, dueMinor, paidMinor, outstandingMinor, feeStatus: dueMinor > 0 && outstandingMinor === 0 ? "PAID" : "UNPAID" };
    });

    const feeStatus = String(req.query.feeStatus || "ALL").toUpperCase();
    const filteredItems = feeStatus === "ALL" ? items : items.filter((item) => item.feeStatus === feeStatus);
    return res.json({ success: true, data: { course, items: filteredItems, total: filteredItems.length, month: range.start.toISOString().slice(0, 7) } });
  } catch (error) { return next(error); }
};

const create = async (req, res, next) => {
  try {
    const { name, slug, category, description, durationMonths, monthlyFeeMinor, totalFeeMinor } = req.body;
    if (!name || !slug) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Course name and slug are required" } });
    const months = Number(durationMonths) || 12;
    const monthly = Math.max(0, Math.round(Number(monthlyFeeMinor) || 0));
    const total = Math.max(0, Math.round(Number(totalFeeMinor) || monthly * months));
    if (!monthly && !total) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Monthly or total course fee is required" } });
    const course = await Course.create({ instituteId: req.user.instituteId, name: name.trim(), slug: slug.toLowerCase().trim(), category: category?.trim() || "Short Courses", description, durationMonths: months, monthlyFeeMinor: monthly || Math.round(total / months), totalFeeMinor: total || monthly * months });
    return res.status(201).json({ success: true, data: { course } });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") return res.status(409).json({ success: false, error: { code: "SLUG_EXISTS", message: "A course with this slug already exists" } });
    return next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const course = await Course.findOne({ where: { id: req.params.courseId, instituteId: req.user.instituteId } });
    if (!course) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Course not found" } });
    const durationMonths = Number(req.body.durationMonths ?? course.durationMonths);
    const monthlyFeeMinor = req.body.monthlyFeeMinor === undefined ? course.monthlyFeeMinor : Math.max(0, Math.round(Number(req.body.monthlyFeeMinor) || 0));
    const totalFeeMinor = req.body.totalFeeMinor === undefined ? course.totalFeeMinor : Math.max(0, Math.round(Number(req.body.totalFeeMinor) || 0));
    await course.update({ name: req.body.name ?? course.name, slug: req.body.slug?.toLowerCase() ?? course.slug, category: req.body.category?.trim() ?? course.category, description: req.body.description ?? course.description, durationMonths, monthlyFeeMinor, totalFeeMinor, status: req.body.status ?? course.status });
    return res.json({ success: true, data: { course } });
  } catch (error) { return next(error); }
};

module.exports = { list, students, create, update };
