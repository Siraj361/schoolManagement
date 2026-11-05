const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RolePermission = sequelize.define("RolePermission", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  instituteId: { type: DataTypes.UUID, allowNull: false },
  role: { type: DataTypes.STRING(40), allowNull: false },
  permissions: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
}, { tableName: "role_permissions", indexes: [{ unique: true, fields: ["instituteId", "role"] }] });

module.exports = RolePermission;
