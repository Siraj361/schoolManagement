const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Institute } = require("../models");
const { getSecret } = require("../middleware/auth");
const { ROLE_PERMISSIONS, normalizePermissions } = require("../config/permissions");

const issueToken = (user) => jwt.sign({ userId: user.id, instituteId: user.instituteId, role: user.role, tokenVersion: user.tokenVersion }, getSecret(), { expiresIn: process.env.JWT_EXPIRES_IN || "8h" });
const effectivePermissions = (user) => user.role === "SUPER_ADMIN" ? ["*"] : user.permissions.length ? normalizePermissions(user.permissions) : ROLE_PERMISSIONS[user.role] || [];

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Email and password are required" } });
    const user = await User.scope("withPassword").findOne({ where: { email: email.toLowerCase().trim(), status: "ACTIVE" }, include: [{ model: Institute }] });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ success: false, error: { code: "INVALID_CREDENTIALS", message: "Email or password is incorrect" } });
    await user.update({ lastLoginAt: new Date() });
    const safeUser = user.toJSON();
    delete safeUser.passwordHash;
    return res.json({ success: true, data: { accessToken: issueToken(user), user: safeUser, permissions: effectivePermissions(user) } });
  } catch (error) { return next(error); }
};

const me = async (req, res) => res.json({ success: true, data: { user: req.user, permissions: effectivePermissions(req.user) } });

const verifyToken = async (req, res) => res.json({ success: true, data: { valid: true, claims: req.tokenClaims, user: req.user } });

const logout = async (req, res, next) => {
  try {
    await req.user.increment("tokenVersion");
    return res.json({ success: true, message: "Signed out successfully. The access token has been revoked." });
  } catch (error) { return next(error); }
};

const updateMe = async (req, res, next) => {
  try {
    const editableUser = await User.scope("withPassword").findOne({ where: { id: req.user.id, instituteId: req.user.instituteId, status: "ACTIVE" } });
    if (!editableUser) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Current user not found" } });
    const { firstName, lastName, email, currentPassword, newPassword } = req.body || {};
    const updates = {};
    if (firstName?.trim()) updates.firstName = firstName.trim();
    if (lastName?.trim()) updates.lastName = lastName.trim();
    if (email?.trim()) updates.email = email.toLowerCase().trim();
    if (req.file) updates.avatarUrl = `/uploads/users/${req.file.filename}`;
    if (newPassword) {
      if (!currentPassword || !(await bcrypt.compare(currentPassword, editableUser.passwordHash))) return res.status(400).json({ success: false, error: { code: "CURRENT_PASSWORD_INVALID", message: "Current password is required and must be correct" } });
      if (newPassword.length < 8) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "New password must contain at least 8 characters" } });
      updates.passwordHash = await bcrypt.hash(newPassword, 12);
    }
    await editableUser.update(updates);
    const safeUser = editableUser.toJSON();
    delete safeUser.passwordHash;
    return res.json({ success: true, data: { user: safeUser }, message: "Profile updated successfully" });
  } catch (error) { return next(error); }
};

module.exports = { login, me, verifyToken, updateMe, logout };
