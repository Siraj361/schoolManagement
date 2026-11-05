const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const { User, RolePermission } = require("../models");
const { ROLE_PERMISSIONS, ALL_PERMISSIONS, PERMISSION_CATALOG, normalizePermissions } = require("../config/permissions");

const cleanPermissions = (permissions) => normalizePermissions(permissions).filter((permission) => ALL_PERMISSIONS.includes(permission) || permission === "*");

const listRoles = async (req, res, next) => {
  try {
    const records = await RolePermission.findAll({ where: { instituteId: req.user.instituteId } });
    const overrides = Object.fromEntries(records.map((record) => [record.role, record.permissions]));
    const roles = Object.entries(ROLE_PERMISSIONS).map(([role, defaults]) => ({ role, permissions: overrides[role] ? cleanPermissions(overrides[role]) : defaults, defaults }));
    return res.json({ success: true, data: { roles, permissions: ALL_PERMISSIONS, catalog: PERMISSION_CATALOG } });
  } catch (error) { return next(error); }
};

const updateRole = async (req, res, next) => {
  try {
    if (!ROLE_PERMISSIONS[req.params.roleId]) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Unknown role" } });
    const permissions = cleanPermissions(req.body.permissions);
    const [record] = await RolePermission.findOrCreate({ where: { instituteId: req.user.instituteId, role: req.params.roleId }, defaults: { permissions } });
    if (!record.isNewRecord) await record.update({ permissions });
    return res.json({ success: true, data: { role: record.role, permissions: record.permissions } });
  } catch (error) { return next(error); }
};

const listUsers = async (req, res, next) => {
  try { const users = await User.findAll({ where: { instituteId: req.user.instituteId }, attributes: ["id", "firstName", "lastName", "avatarUrl", "email", "role", "status", "permissions"] }); return res.json({ success: true, data: { items: users } }); } catch (error) { return next(error); }
};

const createUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role, permissions } = req.body || {};
    if (!firstName || !lastName || !email || !password || !ROLE_PERMISSIONS[role]) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Name, email, password, and valid role are required" } });
    if (password.length < 8) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Password must contain at least 8 characters" } });
    const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existing) return res.status(409).json({ success: false, error: { code: "EMAIL_EXISTS", message: "A user with this email already exists" } });
    const user = await User.create({ instituteId: req.user.instituteId, firstName: firstName.trim(), lastName: lastName.trim(), email: email.toLowerCase().trim(), passwordHash: await bcrypt.hash(password, 12), role, permissions: Array.isArray(permissions) ? cleanPermissions(permissions) : [], avatarUrl: req.file ? `/uploads/users/${req.file.filename}` : null });
    return res.status(201).json({ success: true, data: { user }, message: "User created successfully" });
  } catch (error) { return next(error); }
};

const getUserAccess = async (req, res, next) => {
  try { const user = await User.findOne({ where: { id: req.params.userId, instituteId: req.user.instituteId }, attributes: ["id", "firstName", "lastName", "avatarUrl", "email", "role", "status", "permissions"] }); if (!user) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "User not found" } }); return res.json({ success: true, data: { user, effectivePermissions: user.role === "SUPER_ADMIN" ? ["*"] : user.permissions.length ? cleanPermissions(user.permissions) : ROLE_PERMISSIONS[user.role] || [] } }); } catch (error) { return next(error); }
};

const updateUserAccess = async (req, res, next) => {
  try { const user = await User.findOne({ where: { id: req.params.userId, instituteId: req.user.instituteId } }); if (!user) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "User not found" } }); await user.update({ permissions: cleanPermissions(req.body.permissions) }); return res.json({ success: true, data: { userId: user.id, permissions: user.permissions } }); } catch (error) { return next(error); }
};

const listAuditLogs = async (req, res, next) => {
  try {
    const where = { instituteId: req.user.instituteId };
    if (req.query.action) where.action = req.query.action;
    if (req.query.dateFrom || req.query.dateTo) where.created_at = {};
    if (req.query.dateFrom) where.created_at[Op.gte] = new Date(`${req.query.dateFrom}T00:00:00`);
    if (req.query.dateTo) where.created_at[Op.lt] = new Date(`${req.query.dateTo}T23:59:59.999`);
    const result = await require("../models").AuditLog.findAndCountAll({ where, order: [["created_at", "DESC"]], limit: Math.min(Number(req.query.limit) || 100, 250), include: [{ model: User, as: "Actor", attributes: ["id", "firstName", "lastName", "email"] }] });
    return res.json({ success: true, data: { items: result.rows, total: result.count } });
  } catch (error) { return next(error); }
};

module.exports = { listRoles, updateRole, listUsers, createUser, getUserAccess, updateUserAccess, listAuditLogs };
