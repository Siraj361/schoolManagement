const { Op } = require("sequelize");
const { Inquiry, Course, Institute } = require("../models");
const getPublicInstituteEmail = require("../config/publicInstitute");

const createPublic = async (req, res, next) => {
  try {
    const { name, phone, email, courseId, preferredTiming, message } = req.body || {};
    const trimmedName = typeof name === "string" ? name.trim() : "";
    const trimmedPhone = typeof phone === "string" ? phone.trim() : "";
    const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const trimmedMessage = typeof message === "string" ? message.trim() : "";
    const timing = typeof preferredTiming === "string" ? preferredTiming.trim().toUpperCase() : "";

    if (!trimmedName || trimmedName.length > 160) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Enter your name (up to 160 characters)" } });
    if (!/^[+()\d\s.-]{7,40}$/.test(trimmedPhone)) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Enter a valid mobile or WhatsApp number" } });
    if (trimmedEmail && (trimmedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail))) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Enter a valid email address" } });
    if (!["MORNING", "AFTERNOON", "EVENING"].includes(timing)) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Select a preferred class timing" } });
    if (trimmedMessage.length > 2000) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Message must be 2000 characters or fewer" } });
    if (typeof courseId !== "string" || !courseId.trim()) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Select a program or course" } });

    const institute = await Institute.findOne({ where: { email: getPublicInstituteEmail() }, attributes: ["id"] });
    if (!institute) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Institute not found" } });

    const selectedCourse = courseId.trim();
    const courseWhere = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(selectedCourse)
      ? { id: selectedCourse, instituteId: institute.id, status: "ACTIVE" }
      : { name: selectedCourse, instituteId: institute.id, status: "ACTIVE" };
    const course = await Course.findOne({ where: courseWhere });
    if (!course) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Select a valid program or course" } });

    const item = await Inquiry.create({
      instituteId: institute.id,
      name: trimmedName,
      phone: trimmedPhone,
      email: trimmedEmail || null,
      courseId: course.id,
      preferredTiming: timing,
      message: trimmedMessage || null,
      source: "Website application",
      stage: "NEW",
    });
    return res.status(201).json({ success: true, data: { id: item.id }, message: "Inquiry submitted successfully" });
  } catch (error) { return next(error); }
};

const list = async (req, res, next) => {
  try {
    const where = { instituteId: req.user.instituteId };
    if (req.query.stage) where.stage = req.query.stage;
    if (req.query.search) where.name = { [Op.like]: `%${req.query.search}%` };
    const items = await Inquiry.findAll({ where, order: [["created_at", "DESC"]], limit: Math.min(Number(req.query.limit) || 100, 250), include: [{ model: Course, attributes: ["id", "name"] }] });
    return res.json({ success: true, data: { items } });
  } catch (error) { return next(error); }
};

const create = async (req, res, next) => {
  try {
    const { name, courseId, source, stage, followUpAt } = req.body;
    if (!name?.trim() || !courseId) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Applicant name and course are required" } });
    const course = await Course.findOne({ where: { id: courseId, instituteId: req.user.instituteId } });
    if (!course) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Course does not belong to this institute" } });
    const item = await Inquiry.create({ instituteId: req.user.instituteId, name: name.trim(), courseId, source: source || "Walk-in inquiry", stage: stage || "NEW", followUpAt: followUpAt || null });
    const record = await Inquiry.findByPk(item.id, { include: [{ model: Course, attributes: ["id", "name"] }] });
    return res.status(201).json({ success: true, data: { item: record } });
  } catch (error) { return next(error); }
};

module.exports = { list, create, createPublic };
