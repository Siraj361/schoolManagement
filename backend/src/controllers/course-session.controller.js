const { Course, CourseSession, FacultyAllocation } = require("../models");

const courseFor = (req) => Course.findOne({ where: { id: req.params.courseId, instituteId: req.user.instituteId } });
const canTeachCourse = async (req, courseId) => {
  if (req.user.role !== "INSTRUCTOR") return true;
  const allocations = await FacultyAllocation.findAll({ where: { instituteId: req.user.instituteId, facultyId: req.user.id, status: "ACTIVE" } });
  const { Batch } = require("../models");
  return Boolean(await Batch.findOne({ where: { id: allocations.map((item) => item.batchId), courseId, instituteId: req.user.instituteId } }));
};

const list = async (req, res, next) => {
  try {
    const course = await courseFor(req);
    if (!course) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Course not found" } });
    const sessions = await CourseSession.findAll({ where: { instituteId: req.user.instituteId, courseId: course.id }, order: [["sequenceNumber", "ASC"]], include: [{ association: CourseSession.associations.Assignments, required: false, order: [["sessionOrder", "ASC"]] }] }).catch(async () => CourseSession.findAll({ where: { instituteId: req.user.instituteId, courseId: course.id }, order: [["sequenceNumber", "ASC"]] }));
    return res.json({ success: true, data: { course, sessions } });
  } catch (error) { return next(error); }
};

const create = async (req, res, next) => {
  try {
    const course = await courseFor(req);
    if (!course || !(await canTeachCourse(req, course.id))) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Course not found or not allocated to this teacher" } });
    const { title, description, sequenceNumber, status } = req.body || {};
    if (!title?.trim()) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Session title is required" } });
    const sequence = Number(sequenceNumber) || (await CourseSession.max("sequenceNumber", { where: { courseId: course.id, instituteId: req.user.instituteId } }) || 0) + 1;
    if (!["LOCKED", "CURRENT", "COMPLETED"].includes(status || "LOCKED")) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid session status" } });
    if (status === "CURRENT") await CourseSession.update({ status: "LOCKED" }, { where: { instituteId: req.user.instituteId, courseId: course.id, status: "CURRENT" } });
    const session = await CourseSession.create({ instituteId: req.user.instituteId, courseId: course.id, sequenceNumber: sequence, title: title.trim(), description: description?.trim() || null, status: status || "LOCKED", createdBy: req.user.id });
    return res.status(201).json({ success: true, data: { session } });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") return res.status(409).json({ success: false, error: { code: "SESSION_ORDER_EXISTS", message: "This session order already exists for the selected course" } });
    return next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const session = await CourseSession.findOne({ where: { id: req.params.sessionId, instituteId: req.user.instituteId, courseId: req.params.courseId } });
    if (!session) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Session not found" } });
    const status = req.body.status || session.status;
    if (!["LOCKED", "CURRENT", "COMPLETED"].includes(status)) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid session status" } });
    if (status === "CURRENT") await CourseSession.update({ status: "LOCKED" }, { where: { instituteId: req.user.instituteId, courseId: session.courseId, status: "CURRENT" } });
    await session.update({ title: req.body.title?.trim() || session.title, description: req.body.description ?? session.description, sequenceNumber: Number(req.body.sequenceNumber) || session.sequenceNumber, status });
    return res.json({ success: true, data: { session } });
  } catch (error) { return next(error); }
};

module.exports = { list, create, update };