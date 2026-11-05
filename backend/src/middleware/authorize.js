const { RolePermission } = require("../models");
const { ROLE_PERMISSIONS } = require("../config/permissions");

const methodAction = (method) => method === "GET" ? "read" : method === "POST" ? "create" : method === "PATCH" || method === "PUT" ? "update" : method === "DELETE" ? "delete" : "read";
const expandRequirement = (required, method) => {
  if (required.endsWith(".read") || required.endsWith(".create") || required.endsWith(".update") || required.endsWith(".delete")) return required;
  if (required.endsWith(".write")) return `${required.slice(0, -6)}.${methodAction(method)}`;
  if (required.includes(".")) return `${required}.${methodAction(method)}`;
  return `${required}.${methodAction(method)}`;
};
const hasPermission = (permissions, required, method) => { const resolved = expandRequirement(required, method); return permissions.includes("*") || permissions.includes(resolved) || permissions.includes(required) || permissions.some((permission) => permission.endsWith(".*") && resolved.startsWith(permission.slice(0, -1))); };

const authorize = (...requirements) => async (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication is required" } });
  if (["STUDENT", "INSTRUCTOR"].includes(req.user.role) && !requirements.includes(req.user.role)) return res.status(403).json({ success: false, error: { code: "PORTAL_ONLY", message: "This account can only use its dedicated portal" } });
  const permissionRequirements = requirements.filter((requirement) => requirement.includes("."));
  const roleRequirements = requirements.filter((requirement) => !requirement.includes("."));
  if (roleRequirements.includes(req.user.role)) return next();
  if (req.user.role === "SUPER_ADMIN") return next();
  if (permissionRequirements.length) {
    const override = Array.isArray(req.user.permissions) ? req.user.permissions : [];
    const roleRecord = override.length ? null : await RolePermission.findOne({ where: { instituteId: req.user.instituteId, role: req.user.role } });
    const permissions = override.length ? override : roleRecord?.permissions || ROLE_PERMISSIONS[req.user.role] || [];
    if (permissionRequirements.some((permission) => hasPermission(permissions, permission, req.method))) return next();
  }
  return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "You do not have permission for this action" } });
};

module.exports = authorize;
