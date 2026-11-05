const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Assignment = sequelize.define("Assignment", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  instituteId: { type: DataTypes.UUID, allowNull: false },
  batchId: { type: DataTypes.UUID, allowNull: false },
  courseSessionId: { type: DataTypes.UUID, allowNull: true },
  sessionOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  title: { type: DataTypes.STRING(180), allowNull: false },
  description: DataTypes.TEXT,
  dueDate: { type: DataTypes.DATEONLY, allowNull: false },
  maxScore: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 100 },
  status: { type: DataTypes.ENUM("ACTIVE", "CLOSED"), allowNull: false, defaultValue: "ACTIVE" },
  createdBy: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: "assignments" });

module.exports = Assignment;