const crypto = require("crypto");
const { Op } = require("sequelize");
const { User, Instructor, Student, Payment, FacultyAllocation, FacultyAttendance, FacultyReview, Batch } = require("../models");

const facultyWhere = (req) => ({ instituteId: req.user.instituteId, role: "INSTRUCTOR" });
const userView = (user) => ({ id: user.id, name: `${user.firstName} ${user.lastName}`, firstName: user.firstName, lastName: user.lastName, fatherName: user.fatherName, caste: user.caste, religion: user.religion, cnic: user.cnic, address: user.address, qualifications: user.qualifications, skills: user.skills, email: user.email, role: user.role, status: user.status, avatarUrl: user.avatarUrl });
const instructorView = (instructor) => ({ id: instructor.userId, profileId: instructor.id, name: `${instructor.firstName} ${instructor.lastName}`, firstName: instructor.firstName, lastName: instructor.lastName, fatherName: instructor.fatherName, caste: instructor.caste, religion: instructor.religion, cnic: instructor.cnic, address: instructor.address, qualifications: instructor.qualifications, skills: instructor.skills, email: instructor.User?.email, role: "INSTRUCTOR", status: instructor.status, avatarUrl: instructor.avatarUrl, compensationType: instructor.compensationType, fixedSalary: Number(instructor.fixedSalary || 0), percentage: Number(instructor.percentage || 0), created_at: instructor.created_at, updated_at: instructor.updated_at });
const findFaculty = async (req, id) => User.findOne({ where: { id, ...facultyWhere(req) } });

const buildCompensation = ({ instructor, allocations, students, payments }) => {
  const isPercentage = instructor.compensationType === "PERCENTAGE";
  const percentage = isPercentage ? Number(instructor.percentage || 0) : 0;
  const paymentsByStudent = payments.reduce((result, payment) => {
    result[payment.studentId] = (result[payment.studentId] || 0) + Number(payment.amountMinor || 0);
    return result;
  }, {});
  const batches = isPercentage ? allocations.filter((allocation) => allocation.batchId).map((allocation) => {
    const batchStudents = students.filter((student) => student.batchId === allocation.batchId);
    const studentBreakdown = batchStudents.map((student) => {
      const collectedMinor = paymentsByStudent[student.id] || 0;
      return { studentId: student.id, studentName: student.name, studentCode: student.studentCode, collectedMinor, earnedMinor: Math.round(collectedMinor * percentage / 100) };
    });
    const collectedMinor = studentBreakdown.reduce((total, student) => total + student.collectedMinor, 0);
    return { allocationId: allocation.id, batchId: allocation.batchId, batchName: allocation.Batch?.name || allocation.title, studentCount: batchStudents.length, collectedMinor, earnedMinor: Math.round(collectedMinor * percentage / 100), students: studentBreakdown };
  }) : [];
  return { type: instructor.compensationType, fixedSalary: Number(instructor.fixedSalary || 0), percentage, batches, collectedMinor: batches.reduce((total, batch) => total + batch.collectedMinor, 0), earnedMinor: batches.reduce((total, batch) => total + batch.earnedMinor, 0) };
};

const list = async (req, res, next) => {
  try {
    const faculty = await Instructor.findAll({ where: { instituteId: req.user.instituteId }, include: [{ model: User, attributes: ["id", "email", "role"] }], order: [["firstName", "ASC"]] });
    const ids = faculty.map((instructor) => instructor.userId);
    const [allocations, attendance, reviews, students, payments] = await Promise.all([
      FacultyAllocation.findAll({ where: { instituteId: req.user.instituteId, facultyId: { [Op.in]: ids } }, order: [["created_at", "DESC"]], include: [{ model: Batch, attributes: ["id", "name"] }] }),
      FacultyAttendance.findAll({ where: { instituteId: req.user.instituteId, date: req.query.date || new Date().toISOString().slice(0, 10), facultyId: { [Op.in]: ids } } }),
      FacultyReview.findAll({ where: { instituteId: req.user.instituteId, facultyId: { [Op.in]: ids }, status: "PUBLISHED" }, order: [["created_at", "DESC"]], include: [{ model: Student, attributes: ["name", "studentCode"] }] }),
      Student.findAll({ where: { instituteId: req.user.instituteId }, attributes: ["id", "name", "studentCode", "batchId"] }),
      Payment.findAll({ where: { instituteId: req.user.instituteId }, attributes: ["studentId", "amountMinor"] }),
    ]);
    const allocationHours = Object.fromEntries(ids.map((id) => [id, allocations.filter((item) => item.facultyId === id).reduce((total, item) => total + Number(item.hoursPerWeek), 0)]));
    const reviewRatings = Object.fromEntries(ids.map((id) => { const items = reviews.filter((item) => item.facultyId === id); return [id, items.length ? Number((items.reduce((total, item) => total + item.rating, 0) / items.length).toFixed(1)) : null]; }));
    return res.json({ success: true, data: { faculty: faculty.map((instructor) => ({ ...instructorView(instructor), workloadHours: allocationHours[instructor.userId] || 0, rating: reviewRatings[instructor.userId], attendance: attendance.find((item) => item.facultyId === instructor.userId) || null, compensation: buildCompensation({ instructor, allocations: allocations.filter((item) => item.facultyId === instructor.userId), students, payments }) })), allocations, attendance, reviews } });
  } catch (error) { return next(error); }
};

const create = async (req, res, next) => {
  try {
    const { firstName, lastName, fatherName, caste, religion, cnic, address, qualifications, skills, email, password, status, compensationType, fixedSalary, percentage } = req.body || {};
    const normalizedLastName = lastName?.trim() || fatherName?.trim();
    if (!firstName || !normalizedLastName || !email) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Name, father name, and email are required" } });
    const bcrypt = require("bcryptjs");
    const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existing) return res.status(409).json({ success: false, error: { code: "EMAIL_EXISTS", message: "A user with this email already exists" } });
    if (!password?.trim()) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Instructor portal password is required" } });
    const temporaryPassword = password.trim();
    if (temporaryPassword.length < 8) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Instructor password must contain at least 8 characters" } });
    const normalizedCompensationType = compensationType === "PERCENTAGE" ? "PERCENTAGE" : "FIXED";
    const normalizedPercentage = Number(percentage || 0);
    const normalizedFixedSalary = Number(fixedSalary || 0);
    if (normalizedFixedSalary < 0 || normalizedPercentage < 0 || normalizedPercentage > 100) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Salary must be non-negative and percentage must be between 0 and 100" } });
    const profile = { instituteId: req.user.instituteId, firstName: firstName.trim(), lastName: normalizedLastName, fatherName: fatherName?.trim() || normalizedLastName, caste: caste?.trim() || null, religion: religion?.trim() || null, cnic: cnic?.trim() || null, address: address?.trim() || null, qualifications: qualifications?.trim() || null, skills: skills?.trim() || null, avatarUrl: req.file ? `/uploads/users/${req.file.filename}` : null, compensationType: normalizedCompensationType, fixedSalary: normalizedCompensationType === "FIXED" ? normalizedFixedSalary : 0, percentage: normalizedCompensationType === "PERCENTAGE" ? normalizedPercentage : 0, status: ["ACTIVE", "INVITED", "SUSPENDED"].includes(status) ? status : "ACTIVE" };
    const user = await User.create({ instituteId: req.user.instituteId, firstName: profile.firstName, lastName: profile.lastName, email: email.toLowerCase().trim(), passwordHash: await bcrypt.hash(temporaryPassword, 12), role: "INSTRUCTOR", permissions: [] });
    const instructor = await Instructor.create({ ...profile, userId: user.id });
    return res.status(201).json({ success: true, data: { faculty: instructorView({ ...instructor.toJSON(), User: user }) } });
  } catch (error) { return next(error); }
};

const update = async (req, res, next) => {
  try {
    const instructor = await Instructor.findOne({ where: { userId: req.params.facultyId, instituteId: req.user.instituteId }, include: [{ model: User, attributes: ["email"] }] });
    if (!instructor) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Instructor not found" } });
    const { firstName, lastName, status, compensationType, fixedSalary, percentage } = req.body || {};
    const nextType = compensationType === "PERCENTAGE" ? "PERCENTAGE" : compensationType === "FIXED" ? "FIXED" : instructor.compensationType;
    const nextPercentage = percentage === undefined ? Number(instructor.percentage || 0) : Number(percentage);
    const nextFixedSalary = fixedSalary === undefined ? Number(instructor.fixedSalary || 0) : Number(fixedSalary);
    if (nextFixedSalary < 0 || nextPercentage < 0 || nextPercentage > 100) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Salary must be non-negative and percentage must be between 0 and 100" } });
    await instructor.update({ firstName: firstName?.trim() || instructor.firstName, lastName: lastName?.trim() || instructor.lastName, status: ["ACTIVE", "INVITED", "SUSPENDED"].includes(status) ? status : instructor.status, compensationType: nextType, fixedSalary: nextType === "FIXED" ? nextFixedSalary : 0, percentage: nextType === "PERCENTAGE" ? nextPercentage : 0, ...(req.file ? { avatarUrl: `/uploads/users/${req.file.filename}` } : {}) });
    return res.json({ success: true, data: { faculty: instructorView(instructor) } });
  } catch (error) { return next(error); }
};

const createAllocation = async (req, res, next) => {
  try {
    const { facultyId, title, courseId, batchId, hoursPerWeek, schedule } = req.body;
    if (!facultyId || !title || !Number.isFinite(Number(hoursPerWeek)) || Number(hoursPerWeek) <= 0)
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Faculty, title, and positive weekly hours are required" } });
    const faculty = await Instructor.findOne({ where: { userId: facultyId, instituteId: req.user.instituteId } });
    if (!faculty) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Instructor not found" } });
    if (faculty.compensationType === "PERCENTAGE" && !batchId)
      return res.status(400).json({ success: false, error: { code: "BATCH_REQUIRED", message: "A batch must be assigned to percentage-based instructors" } });
    let batch = null;
    if (batchId) {
      batch = await Batch.findOne({ where: { id: batchId, instituteId: req.user.instituteId, status: "ACTIVE" } });
      if (!batch) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Active batch not found" } });
      if (courseId && batch.courseId !== courseId)
        return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Selected batch does not belong to the selected course" } });
    }
    const allocation = await FacultyAllocation.create({ instituteId: req.user.instituteId, facultyId, title, courseId: courseId || batch?.courseId || null, batchId: batchId || null, hoursPerWeek, schedule });
    return res.status(201).json({ success: true, data: { allocation } });
  } catch (error) { return next(error); }
};

const markAttendance = async (req, res, next) => {
  try { const { facultyId, date, status, note } = req.body; if (!facultyId || !date || !["PRESENT", "LATE", "ABSENT", "ON_LEAVE"].includes(status)) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Faculty, date, and valid status are required" } }); if (!await findFaculty(req, facultyId)) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Instructor not found" } }); const values = { instituteId: req.user.instituteId, facultyId, date, status, note, checkIn: ["PRESENT", "LATE"].includes(status) ? new Date() : null }; const [attendance] = await FacultyAttendance.findOrCreate({ where: { instituteId: req.user.instituteId, facultyId, date }, defaults: values }); if (!attendance.isNewRecord) await attendance.update(values); return res.json({ success: true, data: { attendance } }); } catch (error) { return next(error); }
};

const createReview = async (req, res, next) => {
  try { const { facultyId, studentId, rating, comment } = req.body; if (!facultyId || !Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Faculty and a rating from 1 to 5 are required" } }); if (!await findFaculty(req, facultyId)) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Instructor not found" } }); const review = await FacultyReview.create({ instituteId: req.user.instituteId, facultyId, studentId: studentId || null, rating, comment, status: "PUBLISHED" }); return res.status(201).json({ success: true, data: { review } }); } catch (error) { return next(error); }
};

module.exports = { list, create, update, createAllocation, markAttendance, createReview, buildCompensation };
