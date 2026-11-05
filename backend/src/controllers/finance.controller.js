const { Op } = require("sequelize");
const sequelize = require("../config/database");
const { Invoice, Payment, Student, Scholarship, AuditLog } = require("../models");

const minor = (value) => Number.isInteger(value) && value > 0;
const receiptNumber = () => `RCT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const invoiceNumber = () => `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const currentMonthStart = () => { const date = new Date(); date.setDate(1); date.setHours(0, 0, 0, 0); return date; };
const dateValue = (date) => date.toISOString().slice(0, 10);
const nextMonthStart = () => { const date = currentMonthStart(); date.setMonth(date.getMonth() + 1); return date; };
const markOverdueInvoices = async (instituteId) => {
  await Invoice.update({ status: "OVERDUE" }, { where: { instituteId, status: "PENDING", dueDate: { [Op.lt]: currentMonthStart() } } });
};

const overview = async (req, res, next) => {
  try {
    const where = { instituteId: req.user.instituteId };
    await markOverdueInvoices(req.user.instituteId);
    const start = currentMonthStart();
    const next = nextMonthStart();
    const currentInvoiceWhere = { ...where, dueDate: { [Op.gte]: dateValue(start), [Op.lt]: dateValue(next) } };
    const currentPaymentWhere = { ...where, paidAt: { [Op.gte]: start, [Op.lt]: next } };
    const [invoices, payments, pending, overdue] = await Promise.all([
      Invoice.count({ where: currentInvoiceWhere }),
      Payment.sum("amountMinor", { where: currentPaymentWhere }),
      Invoice.sum("amountMinor", { where: { ...currentInvoiceWhere, status: { [Op.in]: ["PENDING", "PARTIAL"] } } }),
      Invoice.sum("amountMinor", { where: { ...currentInvoiceWhere, status: "OVERDUE" } }),
    ]);
    return res.json({ success: true, data: { invoiceCount: invoices, collectedMinor: payments || 0, pendingMinor: pending || 0, overdueMinor: overdue || 0, currency: "PKR", currentMonth: { invoiceCount: invoices, collectedMinor: payments || 0, pendingMinor: pending || 0, overdueMinor: overdue || 0 } } });
  } catch (error) { return next(error); }
};

const listInvoices = async (req, res, next) => {
  try {
    await markOverdueInvoices(req.user.instituteId);
    const where = { instituteId: req.user.instituteId };
    if (req.query.status) where.status = req.query.status;
    if (req.query.studentId) where.studentId = req.query.studentId;
    if (req.query.courseId) where["$Student.courseId$"] = req.query.courseId;
    if (req.query.currentMonthOnly === "true") {
      const start = currentMonthStart();
      const next = new Date(start);
      next.setMonth(next.getMonth() + 1);
      where.dueDate = { [Op.gte]: dateValue(start), [Op.lt]: dateValue(next) };
    }
    const result = await Invoice.findAndCountAll({ where, distinct: true, limit: Math.min(Number(req.query.limit) || 25, 100), offset: Math.max(Number(req.query.offset) || 0, 0), order: [["dueDate", "ASC"]], include: [{ model: Student, attributes: ["id", "studentCode", "name", "courseId"], include: [{ model: require("../models").Course, attributes: ["id", "name"] }] }, { model: Payment, attributes: ["amountMinor"] }] });
    const items = result.rows.map((invoice) => {
      const item = invoice.toJSON();
      const paidMinor = (item.Payments || []).reduce((total, payment) => total + payment.amountMinor, 0);
      delete item.Payments;
      return { ...item, paidMinor, outstandingMinor: Math.max(item.amountMinor - paidMinor, 0) };
    });
    const visibleItems = req.query.currentOnly === "true"
      ? Object.values(items.filter((item) => item.outstandingMinor > 0).reduce((groups, item) => {
        const key = item.studentId;
        if (!groups[key] || (item.sequenceNumber || 0) < (groups[key].sequenceNumber || 0)) groups[key] = item;
        return groups;
      }, {})).map((item) => ({ ...item, cycleStatus: item.paidMinor > 0 ? "PARTIAL" : "PENDING" }))
      : items;
    return res.json({ success: true, data: { items: visibleItems, total: req.query.currentOnly === "true" ? visibleItems.length : result.count } });
  } catch (error) { return next(error); }
};

const createInvoice = async (req, res, next) => {
  try {
    const { studentId, amountMinor, dueDate, description } = req.body;
    if (!studentId || !minor(amountMinor) || !dueDate) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Student, positive amountMinor, and dueDate are required" } });
    const student = await Student.findOne({ where: { id: studentId, instituteId: req.user.instituteId } });
    if (!student) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Student not found" } });
    const invoice = await Invoice.create({ instituteId: req.user.instituteId, studentId, invoiceNumber: invoiceNumber(), amountMinor, dueDate, description });
    return res.status(201).json({ success: true, data: { invoice } });
  } catch (error) { return next(error); }
};

const updateInvoiceStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["PENDING", "OVERDUE", "CANCELLED"].includes(status)) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Status must be PENDING, DEFAULTER, or CANCELLED" } });
    const invoice = await Invoice.findOne({ where: { id: req.params.invoiceId, instituteId: req.user.instituteId } });
    if (!invoice) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Invoice not found" } });
    await invoice.update({ status });
    return res.json({ success: true, data: { invoice } });
  } catch (error) { return next(error); }
};

const collectPayment = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const idempotencyKey = req.headers["idempotency-key"];
    const { invoiceId, amountMinor, method } = req.body;
    if (!idempotencyKey) { await transaction.rollback(); return res.status(400).json({ success: false, error: { code: "IDEMPOTENCY_KEY_REQUIRED", message: "Idempotency-Key header is required" } }); }
    if (!invoiceId || !minor(amountMinor) || !["CASH", "BANK_TRANSFER", "CARD", "ONLINE"].includes(method)) { await transaction.rollback(); return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invoice, positive amountMinor, and valid method are required" } }); }
    const existing = await Payment.findOne({ where: { idempotencyKey, instituteId: req.user.instituteId }, transaction });
    if (existing) { await transaction.rollback(); return res.json({ success: true, data: { payment: existing }, message: "Original payment returned for duplicate request" }); }
    const invoice = await Invoice.findOne({ where: { id: invoiceId, instituteId: req.user.instituteId }, transaction, lock: transaction.LOCK.UPDATE });
    if (!invoice) { await transaction.rollback(); return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Invoice not found" } }); }
    const paid = await Payment.sum("amountMinor", { where: { invoiceId }, transaction }) || 0;
    const balance = invoice.amountMinor - paid;
    if (balance <= 0 || amountMinor > balance) { await transaction.rollback(); return res.status(400).json({ success: false, error: { code: "INVALID_PAYMENT", message: "Payment exceeds the outstanding invoice balance" } }); }
    const payment = await Payment.create({ instituteId: req.user.instituteId, invoiceId, studentId: invoice.studentId, receiptNumber: receiptNumber(), amountMinor, currency: "PKR", method, paidAt: new Date(), idempotencyKey, receivedBy: req.user.id }, { transaction });
    const nextStatus = paid + amountMinor === invoice.amountMinor ? "PAID" : "PARTIAL";
    await invoice.update({ status: nextStatus }, { transaction });
    await AuditLog.create({ instituteId: req.user.instituteId, actorId: req.user.id, action: "PAYMENT_CREATED", entityType: "Payment", entityId: payment.id, afterJson: { invoiceId, amountMinor, method }, ipAddress: req.ip }, { transaction });
    await transaction.commit();
    return res.status(201).json({ success: true, data: { payment, invoice: { ...invoice.toJSON(), status: nextStatus }, balanceMinor: balance - amountMinor, currency: "PKR" } });
  } catch (error) { await transaction.rollback(); return next(error); }
};

const updatePayment = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { amountMinor, method, paidAt } = req.body;
    if (!minor(Number(amountMinor)) || !["CASH", "BANK_TRANSFER", "CARD", "ONLINE"].includes(method)) {
      await transaction.rollback();
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Positive amountMinor and valid method are required" } });
    }
    const payment = await Payment.findOne({ where: { id: req.params.paymentId, instituteId: req.user.instituteId }, transaction, lock: transaction.LOCK.UPDATE });
    if (!payment) { await transaction.rollback(); return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Payment not found" } }); }
    const invoice = await Invoice.findOne({ where: { id: payment.invoiceId, instituteId: req.user.instituteId }, transaction, lock: transaction.LOCK.UPDATE });
    const otherPaid = await Payment.sum("amountMinor", { where: { invoiceId: payment.invoiceId, id: { [Op.ne]: payment.id } }, transaction }) || 0;
    if (!invoice || otherPaid + Number(amountMinor) > invoice.amountMinor) { await transaction.rollback(); return res.status(400).json({ success: false, error: { code: "INVALID_PAYMENT", message: "Payment exceeds the invoice balance" } }); }
    await payment.update({ amountMinor: Number(amountMinor), method, paidAt: paidAt || payment.paidAt }, { transaction });
    await invoice.update({ status: otherPaid + Number(amountMinor) === invoice.amountMinor ? "PAID" : "PARTIAL" }, { transaction });
    await transaction.commit();
    return res.json({ success: true, data: { payment, invoice } });
  } catch (error) { await transaction.rollback(); return next(error); }
};

const listPayments = async (req, res, next) => {
  try { const where = { instituteId: req.user.instituteId }; if (req.query.currentMonthOnly === "true") where.paidAt = { [Op.gte]: currentMonthStart(), [Op.lt]: nextMonthStart() }; const payments = await Payment.findAll({ where, order: [["paidAt", "DESC"]], limit: Math.min(Number(req.query.limit) || 50, 100), include: [{ model: Student, attributes: ["studentCode", "name"] }, { model: Invoice, attributes: ["invoiceNumber", "dueDate", "sequenceNumber", "description"] }] }); return res.json({ success: true, data: { items: payments } }); } catch (error) { return next(error); }
};

const recentPayments = async (req, res, next) => {
  try {
    const where = { instituteId: req.user.instituteId }; if (req.query.currentMonthOnly === "true") where.paidAt = { [Op.gte]: currentMonthStart(), [Op.lt]: nextMonthStart() };
    const payments = await Payment.findAll({ where, order: [["paidAt", "DESC"]], limit: Math.min(Number(req.query.limit) || 100, 250), include: [{ model: Student, attributes: ["studentCode", "name"] }, { model: Invoice, attributes: ["invoiceNumber"] }] });
    return res.json({ success: true, data: { items: payments } });
  } catch (error) { return next(error); }
};

const defaulters = async (req, res, next) => {
  try {
    await markOverdueInvoices(req.user.instituteId);
    const invoices = await Invoice.findAll({ where: { instituteId: req.user.instituteId, status: { [Op.in]: ["PENDING", "PARTIAL", "OVERDUE"] } }, include: [{ model: Student, attributes: ["studentCode", "name"] }, { model: Payment, attributes: ["amountMinor"] }] });
    const items = invoices.map((invoice) => {
      const item = invoice.toJSON();
      const paidMinor = (item.Payments || []).reduce((total, payment) => total + Number(payment.amountMinor || 0), 0);
      delete item.Payments;
      return { ...item, paidMinor, outstandingMinor: Math.max(Number(item.amountMinor || 0) - paidMinor, 0) };
    }).filter((invoice) => invoice.outstandingMinor > 0);
    return res.json({ success: true, data: { items } });
  } catch (error) { return next(error); }
};

const listScholarships = async (req, res, next) => {
  try { const items = await Scholarship.findAll({ where: { instituteId: req.user.instituteId }, order: [["created_at", "DESC"]], include: [{ model: Student, attributes: ["studentCode", "name"] }] }); return res.json({ success: true, data: { items } }); } catch (error) { return next(error); }
};

const createScholarship = async (req, res, next) => {
  try { const { studentId, type, amountMinor, percentage, validFrom, validUntil } = req.body; const student = await Student.findOne({ where: { id: studentId, instituteId: req.user.instituteId } }); const validFixed = type === "FIXED" && minor(amountMinor); const validPercentage = type === "PERCENTAGE" && Number.isFinite(Number(percentage)) && Number(percentage) > 0 && Number(percentage) <= 100; if (!student || !validFrom || (!validFixed && !validPercentage)) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Student, validFrom, and a valid fixed amount or percentage are required" } }); const scholarship = await Scholarship.create({ instituteId: req.user.instituteId, studentId, type, amountMinor: type === "FIXED" ? amountMinor : null, percentage: type === "PERCENTAGE" ? percentage : null, validFrom, validUntil, status: "APPROVED" }); return res.status(201).json({ success: true, data: { scholarship } }); } catch (error) { return next(error); }
};

module.exports = { overview, listInvoices, createInvoice, updateInvoiceStatus, collectPayment, updatePayment, listPayments, recentPayments, defaulters, listScholarships, createScholarship };
