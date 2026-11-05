const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AuditLog = sequelize.define("AuditLog", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  instituteId: { type: DataTypes.UUID, allowNull: false },
  actorId: { type: DataTypes.INTEGER, allowNull: false },
  action: { type: DataTypes.STRING(80), allowNull: false },
  entityType: { type: DataTypes.STRING(80), allowNull: false },
  entityId: DataTypes.UUID,
  beforeJson: DataTypes.JSON,
  afterJson: DataTypes.JSON,
  ipAddress: DataTypes.STRING(64),
}, { tableName: "audit_logs" });

module.exports = AuditLog;
