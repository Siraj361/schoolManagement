const { Op } = require("sequelize");
const { Student, Batch, Course, StudentAttendance } = require("../models");

const today = () => new Date().toISOString().slice(0, 10);

const list = async (req, res, next) => {
  try {
    const date = req.query.date || today();
    const studentWhere = { instituteId: req.user.instituteId, status: "ACTIVE" };
    if (req.query.batchId) studentWhere.batchId = req.query.batchId;
    if (req.query.search) studentWhere[Op.or] = [{ name: { [Op.like]: `%${req.query.search}%` } }, { studentCode: { [Op.like]: `%${req.query.search}%` } }];
    const students = await Student.findAll({
      where: studentWhere,
      order: [["name", "ASC"]],
      include: [Batch, Course, { model: StudentAttendance, required: false, where: { date }, attributes: ["id", "date", "status", "method", "note", "createdAt"] }],
    });
    const items = students.map((student) => {
      const item = student.toJSON();
      const attendance = item.StudentAttendances?.[0] || null;
      delete item.StudentAttendances;
      return { ...item, attendance };
    });
    const counts = items.reduce((summary, item) => { const status = item.attendance?.status || "ABSENT"; summary[status] = (summary[status] || 0) + 1; return summary; }, {});
    return res.json({ success: true, data: { items, date, counts } });
  } catch (error) { return next(error); }
};

const mark = async (req, res, next) => {
  try {
    const { studentId, date, status, note, method } = req.body;
    if (!studentId || !date || !["PRESENT", "LATE", "ABSENT", "EXCUSED"].includes(status)) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Student, date, and valid attendance status are required" } });
    const student = await Student.findOne({ where: { id: studentId, instituteId: req.user.instituteId, status: "ACTIVE" } });
    if (!student) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Active student not found" } });
    const values = { instituteId: req.user.instituteId, studentId, date, status, method: method === "BIOMETRIC" ? "BIOMETRIC" : "MANUAL", note: note || null };
    const [attendance] = await StudentAttendance.findOrCreate({ where: { instituteId: req.user.instituteId, studentId, date }, defaults: values });
    if (!attendance.isNewRecord) await attendance.update(values);
    return res.json({ success: true, data: { attendance } });
  } catch (error) { return next(error); }
};

module.exports = { list, mark };
