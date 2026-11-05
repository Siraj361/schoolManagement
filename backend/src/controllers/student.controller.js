const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const fs = require("fs/promises");
const path = require("path");
const { Op } = require("sequelize");
const sequelize = require("../config/database");
const { Student, Course, Batch, Institute, Invoice, User } = require("../models");

const dateOnly = (value) => new Date(`${value}T00:00:00.000Z`);
const expiryFor = (value) => { const date = dateOnly(value); date.setUTCFullYear(date.getUTCFullYear() + 1); return date.toISOString().slice(0, 10); };
const monthDate = (value, offset) => { const date = dateOnly(value); date.setUTCMonth(date.getUTCMonth() + offset); return date.toISOString().slice(0, 10); };
const scheduleStart = (registrationDate) => { const registration = dateOnly(registrationDate); const current = new Date(); current.setUTCDate(1); current.setUTCHours(0, 0, 0, 0); return registration > current ? registrationDate : current.toISOString().slice(0, 10); };
const today = () => new Date().toISOString().slice(0, 10);
const digitsOnly = (value) => /^\d+$/.test(String(value || ""));
const invoiceNumber = () => `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const publicStudent = (student) => ({ institute: student.Institute?.name, studentCode: student.studentCode, name: student.name, course: student.Course?.name, registrationDate: student.registrationDate, expiryDate: student.expiryDate, status: student.status });

const list = async (req, res, next) => {
  try {
    const where = { instituteId: req.user.instituteId };
    if (req.query.search) where[Op.or] = [{ name: { [Op.like]: `%${req.query.search}%` } }, { studentCode: { [Op.like]: `%${req.query.search}%` } }];
    const limit = Math.min(Number(req.query.limit) || 25, 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const result = await Student.findAndCountAll({ where, limit, offset, order: [["created_at", "DESC"]], include: [Course, Batch] });
    return res.json({ success: true, data: { items: result.rows, total: result.count, limit, offset } });
  } catch (error) { return next(error); }
};

const getOne = async (req, res, next) => {
  try {
    const student = await Student.findOne({ where: { id: req.params.studentId, instituteId: req.user.instituteId }, include: [Course, Batch] });
    if (!student) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Student not found" } });
    return res.json({ success: true, data: { student } });
  } catch (error) { return next(error); }
};

const create = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { name, fatherName, cnic, mobileNumber, email, loginPassword, emergencyMobileNumber, residentialAddress, courseId, courseName, batchId, duration, shift, admissionFees, hasScholarship, scholarshipDetails, photoUrl } = req.body;
    const registrationDate = req.body.registrationDate || today();
    if (!name || !fatherName || !cnic || !mobileNumber || !emergencyMobileNumber || !residentialAddress || (!courseId && !courseName) || !batchId || !shift) { await transaction.rollback(); return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Student name, father name, CNIC, mobile numbers, address, course, batch, and shift are required" } }); }
    if (![cnic, mobileNumber, emergencyMobileNumber].every(digitsOnly)) { await transaction.rollback(); return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "CNIC and mobile numbers must contain digits only" } }); }
    if (String(hasScholarship).toLowerCase() === "true" && !scholarshipDetails?.trim()) { await transaction.rollback(); return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Scholarship details are required when a scholarship is selected" } }); }
    const course = await Course.findOne({ where: { instituteId: req.user.instituteId, status: "ACTIVE", ...(courseId ? { id: courseId } : { name: courseName }) }, transaction });
    if (!course) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Course does not belong to this institute" } });
    const count = await Student.count({ where: { instituteId: req.user.instituteId }, transaction, lock: transaction.LOCK.UPDATE });
    const batch = await Batch.findOne({ where: { id: batchId, instituteId: req.user.instituteId, courseId: course.id, status: "ACTIVE" }, transaction });
    if (!batch) { await transaction.rollback(); return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Batch must be an active batch for the selected course" } }); }
    const studentShift = batch.shift || shift;
    if (!email || !loginPassword) { await transaction.rollback(); return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Student portal email and password are required" } }); }
    let userId = null;
    if (email) {
      if (String(loginPassword).length < 8) { await transaction.rollback(); return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Student login password must contain at least 8 characters" } }); }
      const existingUser = await User.findOne({ where: { email: email.toLowerCase().trim() }, transaction });
      if (existingUser) { await transaction.rollback(); return res.status(409).json({ success: false, error: { code: "EMAIL_EXISTS", message: "A user with this email already exists" } }); }
      const user = await User.create({ instituteId: req.user.instituteId, firstName: name.split(" ")[0], lastName: name.split(" ").slice(1).join(" ") || fatherName, email: email.toLowerCase().trim(), passwordHash: await bcrypt.hash(loginPassword, 12), role: "STUDENT", permissions: [] }, { transaction });
      userId = user.id;
    }
    const student = await Student.create({ userId, instituteId: req.user.instituteId, studentCode: `STU-${String(1001 + count).padStart(4, "0")}`, name, fatherName, cnic, mobileNumber, email: email || null, emergencyMobileNumber, residentialAddress, courseId: course.id, batchId: batch.id, duration: `${course.durationMonths} months`, shift: studentShift, admissionFees: Number(admissionFees) || 0, hasScholarship: String(hasScholarship).toLowerCase() === "true", scholarshipDetails: scholarshipDetails?.trim() || null, registrationDate, expiryDate: expiryFor(registrationDate), photoUrl: req.file ? `/uploads/students/${req.file.filename}` : photoUrl || null, verificationToken: crypto.randomBytes(32).toString("hex") }, { transaction });
    const monthlyFeeMinor = course.monthlyFeeMinor || Math.round(course.totalFeeMinor / course.durationMonths);
    if (monthlyFeeMinor > 0) {
      const schedule = Array.from({ length: course.durationMonths }, (_, index) => ({
        instituteId: req.user.instituteId,
        studentId: student.id,
        invoiceNumber: invoiceNumber(),
        amountMinor: index === course.durationMonths - 1 ? course.totalFeeMinor - monthlyFeeMinor * (course.durationMonths - 1) : monthlyFeeMinor,
        dueDate: monthDate(scheduleStart(registrationDate), index),
        description: `${course.name} - Month ${index + 1} of ${course.durationMonths}`,
        sequenceNumber: index + 1,
        status: "PENDING",
      }));
      await Invoice.bulkCreate(schedule.filter((invoice) => invoice.amountMinor > 0), { transaction });
    }
    await transaction.commit();
    const record = await Student.findByPk(student.id, { include: [Course, Institute] });
    return res.status(201).json({ success: true, data: { student: record, verificationUrl: `/api/v1/public/verify/student/${record.studentCode}?sig=${record.verificationToken}`, accountCreated: Boolean(userId) }, message: "Student registered with portal login" });
  } catch (error) { await transaction.rollback(); return next(error); }
};

const updatePhoto = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: { code: "PHOTO_REQUIRED", message: "A student photo is required" } });
    const student = await Student.findOne({ where: { id: req.params.studentId, instituteId: req.user.instituteId } });
    if (!student) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Student not found" } });
    if (student.photoUrl?.startsWith("/uploads/")) await fs.unlink(path.join(__dirname, "../..", student.photoUrl)).catch(() => {});
    await student.update({ photoUrl: `/uploads/students/${req.file.filename}` });
    return res.json({ success: true, data: { studentId: student.id, photoUrl: student.photoUrl } });
  } catch (error) { return next(error); }
};

const update = async (req, res, next) => {
  try {
    const student = await Student.findOne({ where: { id: req.params.studentId, instituteId: req.user.instituteId } });
    if (!student) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Student not found" } });
    const allowedFields = ["name", "fatherName", "cnic", "mobileNumber", "email", "emergencyMobileNumber", "residentialAddress", "shift", "admissionFees", "hasScholarship", "scholarshipDetails", "status", "registrationDate"];
    const changes = Object.fromEntries(allowedFields.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]]));
    if ([changes.cnic, changes.mobileNumber, changes.emergencyMobileNumber].filter((value) => value !== undefined).some((value) => !digitsOnly(value))) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "CNIC and mobile numbers must contain digits only" } });
    if (changes.hasScholarship === true && !changes.scholarshipDetails?.trim() && !student.scholarshipDetails) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Scholarship details are required when a scholarship is selected" } });
    if (changes.status && !["ACTIVE", "EXPIRED", "SUSPENDED"].includes(changes.status)) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid student status" } });
    await student.update(changes);
    const record = await Student.findByPk(student.id, { include: [Course, Batch] });
    return res.json({ success: true, data: { student: record } });
  } catch (error) { return next(error); }
};

const verify = async (req, res, next) => {
  try {
    const student = await Student.findOne({ where: { studentCode: req.params.studentCode }, include: [Course, Institute] });
    const valid = Boolean(student && student.verificationToken === req.query.sig);
    return res.json({ success: true, data: valid ? { valid: true, ...publicStudent(student) } : { valid: false } });
  } catch (error) { return next(error); }
};

module.exports = { list, getOne, create, update, updatePhoto, verify };
