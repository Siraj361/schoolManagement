const { Op } = require("sequelize");
const { Student, Invoice, Payment, Course, BatchSession, Inquiry, StudentAttendance, AssignmentSubmission } = require("../models");

const startOfMonth = (date = new Date()) => {
  const month = new Date(date);
  month.setUTCDate(1);
  month.setUTCHours(0, 0, 0, 0);
  return month;
};

const endOfMonth = (date = new Date()) => {
  const month = startOfMonth(date);
  month.setUTCMonth(month.getUTCMonth() + 1);
  return month;
};

const requestedMonthDate = (value) => {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(value || ""))) return new Date();
  const [year, month] = String(value).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1));
};

const buildRegistrationMonthly = (students = []) => {
  const monthly = new Map();
  for (const student of students) {
    const month = String(student.registrationDate || '').slice(0, 7);
    if (!month) continue;
    const current = monthly.get(month) || { month, count: 0, feesMinor: 0 };
    current.count += 1;
    current.feesMinor += Math.round(Number(student.admissionFees || 0) * 100);
    monthly.set(month, current);
  }
  return [...monthly.values()].sort((left, right) => right.month.localeCompare(left.month));
};

const buildPaymentMonthly = (payments = [], now = new Date()) => {
  const months = [];
  const cursor = startOfMonth(now);
  cursor.setUTCMonth(cursor.getUTCMonth() - 11);
  for (let index = 0; index < 13; index += 1) {
    const month = cursor.toISOString().slice(0, 7);
    months.push({ month, amountMinor: 0 });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  const totals = new Map(months.map((entry) => [entry.month, entry]));
  for (const payment of payments) {
    const month = payment.paidAt ? new Date(payment.paidAt).toISOString().slice(0, 7) : '';
    const entry = totals.get(month);
    if (entry) entry.amountMinor += Number(payment.amountMinor || 0);
  }
  return months;
};

const buildCourseFeeSummary = ({ courses = [], students = [], invoices = [], payments = [], now = new Date() }) => {
  const monthStart = startOfMonth(now).toISOString().slice(0, 10);
  const monthEnd = endOfMonth(now).toISOString().slice(0, 10);
  const studentMap = new Map(students.map((student) => [student.id, student]));
  const currentMonthInvoiceMap = new Map();
  const currentMonthPaymentMap = new Map();

  for (const invoice of invoices) {
    if (!invoice.dueDate || invoice.dueDate < monthStart || invoice.dueDate >= monthEnd) continue;
    const student = studentMap.get(invoice.studentId);
    if (!student || student.status !== "ACTIVE") continue;
    const key = student.courseId;
    currentMonthInvoiceMap.set(key, (currentMonthInvoiceMap.get(key) || 0) + Number(invoice.amountMinor || 0));
  }

  for (const payment of payments) {
    const paidAt = payment.paidAt ? new Date(payment.paidAt) : null;
    if (!paidAt || paidAt < startOfMonth(now) || paidAt >= endOfMonth(now)) continue;
    const student = studentMap.get(payment.studentId);
    if (!student || student.status !== "ACTIVE") continue;
    const key = student.courseId;
    currentMonthPaymentMap.set(key, (currentMonthPaymentMap.get(key) || 0) + Number(payment.amountMinor || 0));
  }

  const courseSummaries = courses
    .filter((course) => course.status === "ACTIVE")
    .map((course) => {
      const courseStudents = students.filter((student) => student.courseId === course.id && student.status === "ACTIVE");
      const dueMinor = currentMonthInvoiceMap.get(course.id) || 0;
      const collectedMinor = currentMonthPaymentMap.get(course.id) || 0;
      const pendingMinor = Math.max(dueMinor - collectedMinor, 0);
      return {
        courseId: course.id,
        courseName: course.name,
        studentCount: courseStudents.length,
        dueMinor,
        collectedMinor,
        pendingMinor,
        currency: "PKR",
      };
    })
    .filter((summary) => summary.studentCount > 0 || summary.dueMinor > 0 || summary.collectedMinor > 0)
    .sort((left, right) => right.collectedMinor - left.collectedMinor || right.dueMinor - left.dueMinor);

  return courseSummaries;
};

const overview = async (req, res, next) => {
  try {
    const instituteId = req.user.instituteId;
    const selectedMonth = requestedMonthDate(req.query.month);
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const currentMonthInvoiceWhere = { instituteId, dueDate: { [Op.gte]: monthStart.toISOString().slice(0, 10), [Op.lt]: monthEnd.toISOString().slice(0, 10) } };
    const nextMonthEnd = endOfMonth(monthEnd);
    const nextMonthInvoiceWhere = { instituteId, dueDate: { [Op.gte]: monthEnd.toISOString().slice(0, 10), [Op.lt]: nextMonthEnd.toISOString().slice(0, 10) } };
    const currentMonthPaymentWhere = { instituteId, paidAt: { [Op.gte]: monthStart, [Op.lt]: monthEnd } };
    const currentMonthRegistrationWhere = { instituteId, registrationDate: { [Op.gte]: monthStart.toISOString().slice(0, 10), [Op.lt]: monthEnd.toISOString().slice(0, 10) } };
    const today = new Date().toISOString().slice(0, 10);

    const [totalStudents, collected, registrationCount, registrationFees, registrationStudents, recentStudents, recentPayments, courseCount, courses, activeStudents, currentMonthInvoices, currentMonthPayments, nextMonthInvoices, paymentHistory, todaySessions, inquiries, attendanceToday, submissions] = await Promise.all([
      Student.count({ where: { instituteId, status: "ACTIVE" } }),
      Payment.sum("amountMinor", { where: currentMonthPaymentWhere }),
      Student.count({ where: currentMonthRegistrationWhere }),
      Student.sum("admissionFees", { where: currentMonthRegistrationWhere }),
      Student.findAll({ where: { instituteId }, attributes: ["registrationDate", "admissionFees"] }),
      Student.findAll({ where: { instituteId }, limit: 8, order: [["created_at", "DESC"]], include: [Course] }),
      Payment.findAll({ where: { instituteId }, limit: 8, order: [["paidAt", "DESC"]], include: [Student] }),
      Course.count({ where: { instituteId, status: "ACTIVE" } }),
      Course.findAll({ where: { instituteId, status: "ACTIVE" } }),
      Student.findAll({ where: { instituteId, status: "ACTIVE" } }),
      Invoice.findAll({ where: currentMonthInvoiceWhere }),
      Payment.findAll({ where: currentMonthPaymentWhere }),
      Invoice.findAll({ where: nextMonthInvoiceWhere }),
      Payment.findAll({ where: { instituteId }, attributes: ["amountMinor", "paidAt"] }),
      BatchSession.findAll({ where: { instituteId, date: today, status: { [Op.ne]: "CANCELLED" } }, order: [["startTime", "ASC"]], limit: 10 }),
      Inquiry.findAll({ where: { instituteId }, attributes: ["id", "stage"] }),
      StudentAttendance.findAll({ where: { instituteId, date: today }, attributes: ["status"] }),
      AssignmentSubmission.findAll({ where: { instituteId }, attributes: ["score", "reviewStatus"] }),
    ]);

    const dueTotalMinor = (currentMonthInvoices || []).reduce((total, invoice) => total + Number(invoice.amountMinor || 0), 0);
    const collectedMinor = Number(collected || 0);
    const pendingMinor = Math.max(dueTotalMinor - collectedMinor, 0);
    const nextMonthDueMinor = (nextMonthInvoices || []).reduce((total, invoice) => total + Number(invoice.amountMinor || 0), 0);
    const overdueMinor = 0;
    const collectionRate = dueTotalMinor ? Number(((collectedMinor / dueTotalMinor) * 100).toFixed(1)) : 0;
    const registrationFeesMinor = Math.round(Number(registrationFees || 0) * 100);
    const registrationMonthly = buildRegistrationMonthly(registrationStudents);
    const paymentMonthly = buildPaymentMonthly(paymentHistory, selectedMonth);
    const courseFeeSummary = buildCourseFeeSummary({ courses, students: activeStudents, invoices: currentMonthInvoices, payments: currentMonthPayments, now: selectedMonth });
    const scoredSubmissions = submissions.filter((submission) => Number.isFinite(Number(submission.score)));
    const assignmentAverageScore = scoredSubmissions.length ? Number((scoredSubmissions.reduce((total, submission) => total + Number(submission.score), 0) / scoredSubmissions.length).toFixed(1)) : 0;
    const dashboardCards = {
      sessions: todaySessions.map((session) => ({ title: session.title, startTime: session.startTime, endTime: session.endTime, status: session.status })),
      admissions: { newInquiries: inquiries.filter((inquiry) => inquiry.stage === "NEW").length, counselling: inquiries.filter((inquiry) => inquiry.stage === "COUNSELLING").length, registered: inquiries.filter((inquiry) => inquiry.stage === "REGISTERED").length },
      assignments: { pendingReviews: submissions.filter((submission) => submission.reviewStatus === "PENDING").length, revisionRequests: submissions.filter((submission) => submission.reviewStatus === "REVISION_REQUESTED").length, averageScore: assignmentAverageScore },
      attendance: { absenceAlerts: attendanceToday.filter((attendance) => attendance.status === "ABSENT").length, present: attendanceToday.filter((attendance) => attendance.status === "PRESENT").length, late: attendanceToday.filter((attendance) => attendance.status === "LATE").length },
    };

    return res.json({ success: true, data: { selectedMonth: monthStart.toISOString().slice(0, 7), kpis: { totalStudents, registrationCount, registrationFeesMinor, collectedMinor, pendingMinor, nextMonthDueMinor, nextMonthPendingMinor: nextMonthDueMinor, overdueMinor, collectionRate, courseCount, currency: "PKR" }, registrationMonthly, paymentMonthly, recentStudents, recentPayments, courseFeeSummary, dashboardCards } });
  } catch (error) { return next(error); }
};

module.exports = { overview, buildCourseFeeSummary };
