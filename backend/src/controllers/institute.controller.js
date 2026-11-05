const bcrypt = require("bcryptjs");
const sequelize = require("../config/database");
const getPublicInstituteEmail = require("../config/publicInstitute");
const { Institute, User, Student, Instructor, Course, Program, ModuleRecord } = require("../models");

const publicProfile = async (req, res, next) => {
  try {
    const institute = await Institute.findOne({ where: { email: getPublicInstituteEmail() }, attributes: ["id", "name", "shortName", "logoUrl", "email", "phone", "secondaryPhone", "address", "facebookUrl", "instagramUrl", "youtubeUrl", "linkedinUrl", "yearsOfExcellence", "academicYear"] });
    if (!institute) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Institute not found" } });
    const [studentCount, facultyCount, landingProgramCount, programs, courses, team, lifeAtPrimeRecord] = await Promise.all([
      Student.count({ where: { instituteId: institute.id, status: "ACTIVE" } }),
      Instructor.count({ where: { instituteId: institute.id, status: "ACTIVE" } }),
      Program.count({ where: { instituteId: institute.id, status: "ACTIVE" } }),
      Program.findAll({ where: { instituteId: institute.id, status: "ACTIVE" }, attributes: ["id", "name", "category", "description", "durationMonths"], order: [["category", "ASC"], ["name", "ASC"]] }),
      Course.findAll({ where: { instituteId: institute.id, status: "ACTIVE" }, attributes: ["id", "name", "category", "description", "durationMonths", "monthlyFeeMinor", "totalFeeMinor"], order: [["category", "ASC"], ["name", "ASC"]] }),
      Instructor.findAll({ where: { instituteId: institute.id, status: "ACTIVE" }, attributes: ["id", "firstName", "lastName", "qualifications", "skills", "avatarUrl"], order: [["firstName", "ASC"], ["lastName", "ASC"]] }),
      ModuleRecord.findOne({ where: { instituteId: institute.id, module: "life-at-prime", status: "ACTIVE" }, order: [["created_at", "DESC"]] }),
    ]);
    return res.json({ success: true, data: { institute, stats: { studentCount, facultyCount, programCount: landingProgramCount }, programs, courses, team, lifeAtPrime: lifeAtPrimeRecord?.details || null } });
  } catch (error) { return next(error); }
};

const profile = async (req, res, next) => {
  try {
    const institute = await Institute.findOne({ where: { id: req.user.instituteId } });
    if (!institute) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Institute not found" } });
    return res.json({ success: true, data: { institute } });
  } catch (error) { return next(error); }
};

const updateProfile = async (req, res, next) => {
  try {
    const institute = await Institute.findOne({ where: { id: req.user.instituteId } });
    if (!institute) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Institute not found" } });
    const { name, shortName, email, phone, secondaryPhone, address, facebookUrl, instagramUrl, youtubeUrl, linkedinUrl, yearsOfExcellence, academicYear, timezone } = req.body || {};
    if (!name?.trim() || !shortName?.trim() || !email?.trim() || !academicYear?.trim())
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Name, short name, email, and academic year are required" } });
    await institute.update({
      name: name.trim(),
      shortName: shortName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || null,
      secondaryPhone: secondaryPhone?.trim() || null,
      address: address?.trim() || null,
      facebookUrl: facebookUrl?.trim() || null,
      instagramUrl: instagramUrl?.trim() || null,
      youtubeUrl: youtubeUrl?.trim() || null,
      linkedinUrl: linkedinUrl?.trim() || null,
      yearsOfExcellence: Math.max(0, Number.parseInt(yearsOfExcellence, 10) || 5),
      academicYear: academicYear.trim(),
      timezone: timezone?.trim() || institute.timezone,
      ...(req.file ? { logoUrl: `/uploads/users/${req.file.filename}` } : {}),
    });
    return res.json({ success: true, data: { institute } });
  } catch (error) { return next(error); }
};

const createInstitute = async (req, res, next) => {
  const bootstrapKey = process.env.INSTITUTE_BOOTSTRAP_KEY;
  if (!bootstrapKey || req.headers["x-bootstrap-key"] !== bootstrapKey) {
    return res.status(401).json({ success: false, error: { code: "INVALID_BOOTSTRAP_KEY", message: "A valid X-Bootstrap-Key is required" } });
  }

  const transaction = await sequelize.transaction();
  try {
    const { name, shortName, email, phone, secondaryPhone, address, facebookUrl, instagramUrl, youtubeUrl, linkedinUrl, yearsOfExcellence, academicYear, timezone, adminFirstName, adminLastName, adminEmail, adminPassword } = req.body;
    if (!name || !shortName || !email || !adminFirstName || !adminLastName || !adminEmail || !adminPassword) {
      await transaction.rollback();
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Institute and first Super Admin fields are required" } });
    }
    if (adminPassword.length < 8) {
      await transaction.rollback();
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Admin password must contain at least 8 characters" } });
    }
    const existing = await User.findOne({ where: { email: adminEmail.toLowerCase().trim() }, transaction });
    if (existing) {
      await transaction.rollback();
      return res.status(409).json({ success: false, error: { code: "EMAIL_EXISTS", message: "Admin email already exists" } });
    }
    const institute = await Institute.create({ name: name.trim(), shortName: shortName.trim(), email: email.toLowerCase().trim(), phone, secondaryPhone, address, facebookUrl, instagramUrl, youtubeUrl, linkedinUrl, yearsOfExcellence: Math.max(0, Number.parseInt(yearsOfExcellence, 10) || 5), academicYear, timezone }, { transaction });
    const admin = await User.create({ instituteId: institute.id, firstName: adminFirstName.trim(), lastName: adminLastName.trim(), email: adminEmail.toLowerCase().trim(), passwordHash: await bcrypt.hash(adminPassword, 12), role: "SUPER_ADMIN", permissions: ["*"] }, { transaction });
    await transaction.commit();
    return res.status(201).json({ success: true, data: { institute, admin: { id: admin.id, firstName: admin.firstName, lastName: admin.lastName, email: admin.email, role: admin.role } }, message: "Institute and Super Admin created successfully" });
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
};

module.exports = { createInstitute, publicProfile, profile, updateProfile };
