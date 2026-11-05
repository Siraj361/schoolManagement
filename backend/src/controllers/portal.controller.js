const PDFDocument = require("pdfkit");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const { Assignment, AssignmentSubmission, Batch, Course, CourseSession, FacultyAllocation, FacultyAttendance, Instructor, Invoice, Payment, Student, StudentAttendance, User } = require("../models");

const studentFor = (req) => Student.findOne({ where: { userId: req.user.id, instituteId: req.user.instituteId }, include: [Course, Batch] });
const orderedAssignments = (items) => {
  let previousApproved = true;
  return items.sort((left, right) => Number(left.sessionOrder || 1) - Number(right.sessionOrder || 1) || new Date(left.dueDate) - new Date(right.dueDate)).map((assignment, index) => {
    const submission = assignment.AssignmentSubmissions?.[0];
    const isApproved = submission?.reviewStatus === "REVIEWED";
    const canResubmit = submission?.reviewStatus === "REVISION_REQUESTED";
    const isWaitingForApproval = submission && !isApproved && !canResubmit;
    const sessionLocked = assignment.CourseSession && assignment.CourseSession.status !== "CURRENT";
    const item = { ...assignment.toJSON(), sequenceNumber: index + 1, isLocked: sessionLocked || !previousApproved || isWaitingForApproval, canSubmit: !sessionLocked && previousApproved && (!submission || canResubmit) };
    previousApproved = isApproved;
    return item;
  });
};
const sendPdf = (res, name, title, rows) => {
  const document = new PDFDocument({ margin: 48 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
  document.pipe(res);
  document.fontSize(20).text(title).moveDown();
  rows.forEach(([label, value]) => document.fontSize(11).text(`${label}: ${value ?? "-"}`));
  document.end();
};

const studentDashboard = async (req, res, next) => {
  try {
    const student = await studentFor(req);
    if (!student) return res.status(404).json({ success: false, error: { code: "STUDENT_PROFILE_REQUIRED", message: "No student profile is linked to this login" } });
    const [attendance, invoices, payments, assignments] = await Promise.all([
      StudentAttendance.findAll({ where: { instituteId: req.user.instituteId, studentId: student.id }, order: [["date", "DESC"]] }),
      Invoice.findAll({ where: { instituteId: req.user.instituteId, studentId: student.id }, include: [{ model: Payment, attributes: ["id", "amountMinor", "paidAt", "receiptNumber", "method"] }], order: [["dueDate", "ASC"]] }),
      Payment.findAll({ where: { instituteId: req.user.instituteId, studentId: student.id }, order: [["paidAt", "DESC"]] }),
      Assignment.findAll({ where: { instituteId: req.user.instituteId, batchId: student.batchId }, include: [{ model: AssignmentSubmission, where: { studentId: student.id }, required: false }, { model: CourseSession, required: false, attributes: ["id", "title", "sequenceNumber", "status"] }], order: [["sessionOrder", "ASC"], ["dueDate", "ASC"]] }),
    ]);
    const paidMinor = payments.reduce((total, payment) => total + Number(payment.amountMinor || 0), 0);
    const present = attendance.filter((item) => ["PRESENT", "LATE"].includes(item.status)).length;
    const courseSessions = await CourseSession.findAll({ where: { instituteId: req.user.instituteId, courseId: student.courseId }, order: [["sequenceNumber", "ASC"]], include: [{ model: Assignment, where: { batchId: student.batchId }, required: false, include: [{ model: AssignmentSubmission, where: { studentId: student.id }, required: false }] }] });
    return res.json({ success: true, data: { student, attendance, invoices, payments, assignments: orderedAssignments(assignments), courseSessions, summary: { paidMinor, outstandingMinor: invoices.reduce((total, invoice) => total + Number(invoice.amountMinor || 0), 0) - paidMinor, attendancePercent: attendance.length ? Math.round((present / attendance.length) * 100) : 0 } } });
  } catch (error) { return next(error); }
};

const updateStudentProfile = async (req, res, next) => {
  try {
    const student = await studentFor(req);
    if (!student) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Student profile not found" } });
    const user = await require("../models").User.scope("withPassword").findByPk(req.user.id);
    const { name, fatherName, mobileNumber, emergencyMobileNumber, residentialAddress, currentPassword, newPassword } = req.body || {};
    const numberFields = [mobileNumber, emergencyMobileNumber].filter((value) => value !== undefined);
    if (numberFields.some((value) => !/^\d+$/.test(String(value)))) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Mobile numbers must contain digits only" } });
    if (newPassword) {
      if (!currentPassword || !(await bcrypt.compare(currentPassword, user.passwordHash))) return res.status(400).json({ success: false, error: { code: "CURRENT_PASSWORD_INVALID", message: "Current password is required and must be correct" } });
      if (newPassword.length < 8) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "New password must contain at least 8 characters" } });
      await user.update({ passwordHash: await bcrypt.hash(newPassword, 12) });
    }
    await student.update(Object.fromEntries(Object.entries({ name, fatherName, mobileNumber, emergencyMobileNumber, residentialAddress }).filter(([, value]) => value !== undefined && String(value).trim())));
    return res.json({ success: true, data: { student: await studentFor(req) }, message: "Profile updated successfully" });
  } catch (error) { return next(error); }
};

const studentIdCard = async (req, res, next) => {
  try {
    const student = await studentFor(req);
    if (!student) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Student profile not found" } });
    return sendPdf(res, `${student.studentCode}-id.pdf`, "Student Identity Card", [["Student ID", student.studentCode], ["Name", student.name], ["Father name", student.fatherName], ["Course", student.Course?.name], ["Batch", student.Batch?.name], ["Valid until", student.expiryDate], ["Status", student.status]]);
  } catch (error) { return next(error); }
};

const studentReceipt = async (req, res, next) => {
  try {
    const student = await studentFor(req);
    const payment = student && await Payment.findOne({ where: { id: req.params.paymentId, studentId: student.id, instituteId: req.user.instituteId }, include: [Invoice] });
    if (!payment) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Receipt not found" } });
    return sendPdf(res, `${payment.receiptNumber}.pdf`, "Fee Payment Receipt", [["Receipt number", payment.receiptNumber], ["Student", student.name], ["Student ID", student.studentCode], ["Invoice", payment.Invoice?.invoiceNumber], ["Amount", `${payment.amountMinor} PKR`], ["Method", payment.method], ["Paid on", payment.paidAt]]);
  } catch (error) { return next(error); }
};

const teacherDashboard = async (req, res, next) => {
  try {
    const instructor = await Instructor.findOne({ where: { userId: req.user.id, instituteId: req.user.instituteId }, include: [{ model: User, attributes: ["email", "firstName", "lastName"] }] });
    if (!instructor) return res.status(404).json({ success: false, error: { code: "TEACHER_PROFILE_REQUIRED", message: "No teacher profile is linked to this login" } });
    const [allocations, attendance, assignments, submissions] = await Promise.all([
      FacultyAllocation.findAll({ where: { instituteId: req.user.instituteId, facultyId: req.user.id }, include: [{ model: Batch, include: [Course] }] }),
      FacultyAttendance.findAll({ where: { instituteId: req.user.instituteId, facultyId: req.user.id }, order: [["date", "DESC"]] }),
      Assignment.findAll({ where: { instituteId: req.user.instituteId, createdBy: req.user.id }, include: [Batch], order: [["dueDate", "DESC"]] }),
      AssignmentSubmission.findAll({ where: { instituteId: req.user.instituteId }, include: [{ model: Assignment, where: { createdBy: req.user.id } }, Student], order: [["submittedAt", "DESC"]] }),
    ]);
    const courseIds = [...new Set(allocations.map((item) => item.Batch?.courseId).filter(Boolean))];
    const courseSessions = await CourseSession.findAll({ where: { instituteId: req.user.instituteId, ...(courseIds.length ? { courseId: courseIds } : { courseId: null }) }, order: [["courseId", "ASC"], ["sequenceNumber", "ASC"]], include: [{ model: Course, attributes: ["id", "name"] }, { model: Assignment, required: false, include: [Batch] }] });
    return res.json({ success: true, data: { instructor, allocations, attendance, assignments, submissions, courseSessions, salary: { type: instructor.compensationType, fixedSalary: Number(instructor.fixedSalary || 0), percentage: Number(instructor.percentage || 0) } } });
  } catch (error) { return next(error); }
};

const updateTeacherProfile = async (req, res, next) => {
  try {
    const instructor = await Instructor.findOne({ where: { userId: req.user.id, instituteId: req.user.instituteId } });
    const user = await User.scope("withPassword").findOne({ where: { id: req.user.id, instituteId: req.user.instituteId } });
    if (!instructor || !user) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Teacher profile not found" } });
    const { firstName, lastName, fatherName, address, qualifications, skills, currentPassword, newPassword } = req.body || {};
    if (newPassword) {
      if (!currentPassword || !(await bcrypt.compare(currentPassword, user.passwordHash))) return res.status(400).json({ success: false, error: { code: "CURRENT_PASSWORD_INVALID", message: "Current password is required and must be correct" } });
      if (newPassword.length < 8) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "New password must contain at least 8 characters" } });
      await user.update({ passwordHash: await bcrypt.hash(newPassword, 12) });
    }
    await user.update({ firstName: firstName?.trim() || user.firstName, lastName: lastName?.trim() || user.lastName });
    await instructor.update({ fatherName: fatherName?.trim() || instructor.fatherName, address: address?.trim() || instructor.address, qualifications: qualifications?.trim() || instructor.qualifications, skills: skills?.trim() || instructor.skills });
    return res.json({ success: true, data: { instructor: await Instructor.findOne({ where: { userId: req.user.id, instituteId: req.user.instituteId }, include: [{ model: User, attributes: ["email", "firstName", "lastName"] }] }) }, message: "Teacher profile updated successfully" });
  } catch (error) { return next(error); }
};

module.exports = { studentDashboard, studentIdCard, studentReceipt, teacherDashboard, updateStudentProfile, updateTeacherProfile };