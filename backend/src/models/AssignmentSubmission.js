const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AssignmentSubmission = sequelize.define("AssignmentSubmission", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  instituteId: { type: DataTypes.UUID, allowNull: false },
  assignmentId: { type: DataTypes.UUID, allowNull: false },
  studentId: { type: DataTypes.UUID, allowNull: false },
  sourceType: { type: DataTypes.ENUM("GITHUB", "ZIP"), allowNull: false },
  repositoryUrl: DataTypes.STRING(500),
  fileName: DataTypes.STRING(255),
  fileUrl: DataTypes.STRING(500),
  submittedAt: { type: DataTypes.DATE, allowNull: false },
  score: DataTypes.INTEGER,
  reviewStatus: { type: DataTypes.ENUM("PENDING", "REVIEWED", "REVISION_REQUESTED"), allowNull: false, defaultValue: "PENDING" },
  feedback: DataTypes.TEXT,
  reviewedAt: DataTypes.DATE,
  reviewedBy: DataTypes.INTEGER,
}, { tableName: "assignment_submissions", indexes: [{ unique: true, fields: ["assignmentId", "studentId"] }] });

module.exports = AssignmentSubmission;