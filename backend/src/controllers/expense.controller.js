const { Op } = require("sequelize");
const { InstituteExpense, User } = require("../models");

const methods = ["CASH", "BANK_TRANSFER", "CARD", "ONLINE"];
const dateOnly = (value) => value || new Date().toISOString().slice(0, 10);
const positiveMinor = (value) => Number.isInteger(Number(value)) && Number(value) > 0;

const list = async (req, res, next) => {
  try {
    const where = { instituteId: req.user.instituteId };
    if (req.query.category) where.category = req.query.category;
    if (req.query.status) where.status = req.query.status;
    if (req.query.dateFrom || req.query.dateTo) where.expenseDate = {};
    if (req.query.dateFrom) where.expenseDate[Op.gte] = req.query.dateFrom;
    if (req.query.dateTo) where.expenseDate[Op.lte] = req.query.dateTo;
    const items = await InstituteExpense.findAll({ where, order: [["expenseDate", "DESC"], ["created_at", "DESC"]], limit: Math.min(Number(req.query.limit) || 100, 250), include: [{ model: User, attributes: ["id", "firstName", "lastName"] }] });
    const activeItems = items.filter((item) => item.status === "RECORDED");
    const totalMinor = activeItems.reduce((total, item) => total + Number(item.amountMinor || 0), 0);
    const today = new Date().toISOString().slice(0, 10);
    const todayMinor = activeItems.filter((item) => item.expenseDate === today).reduce((total, item) => total + Number(item.amountMinor || 0), 0);
    return res.json({ success: true, data: { items, summary: { totalMinor, todayMinor, recordCount: activeItems.length } } });
  } catch (error) { return next(error); }
};

const create = async (req, res, next) => {
  try {
    const { category, description, vendor, amountMinor, expenseDate, paymentMethod, notes } = req.body || {};
    if (!category?.trim() || !description?.trim() || !positiveMinor(amountMinor) || !methods.includes(paymentMethod) || !expenseDate) {
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Category, description, positive amount, date, and valid payment method are required" } });
    }
    const expense = await InstituteExpense.create({ instituteId: req.user.instituteId, category: category.trim(), description: description.trim(), vendor: vendor?.trim() || null, amountMinor: Number(amountMinor), expenseDate: dateOnly(expenseDate), paymentMethod, notes: notes?.trim() || null, createdBy: req.user.id });
    return res.status(201).json({ success: true, data: { expense } });
  } catch (error) { return next(error); }
};

const updateStatus = async (req, res, next) => {
  try {
    if (!["RECORDED", "VOID"].includes(req.body?.status)) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Status must be RECORDED or VOID" } });
    const expense = await InstituteExpense.findOne({ where: { id: req.params.expenseId, instituteId: req.user.instituteId } });
    if (!expense) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Expense not found" } });
    await expense.update({ status: req.body.status });
    return res.json({ success: true, data: { expense } });
  } catch (error) { return next(error); }
};

module.exports = { list, create, updateStatus };