const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CourseSession = sequelize.define("CourseSession", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  instituteId: { type: DataTypes.UUID, allowNull: false },
  courseId: { type: DataTypes.UUID, allowNull: false },
  sequenceNumber: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(180), allowNull: false },
  description: DataTypes.TEXT,
  status: { type: DataTypes.ENUM("LOCKED", "CURRENT", "COMPLETED"), allowNull: false, defaultValue: "LOCKED" },
  createdBy: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: "course_sessions", indexes: [{ unique: true, fields: ["courseId", "sequenceNumber"] }] });

module.exports = CourseSession;
