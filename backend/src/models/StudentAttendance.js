const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const StudentAttendance = sequelize.define("StudentAttendance", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  instituteId: { type: DataTypes.UUID, allowNull: false },
  studentId: { type: DataTypes.UUID, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  status: { type: DataTypes.ENUM("PRESENT", "LATE", "ABSENT", "EXCUSED"), allowNull: false, defaultValue: "PRESENT" },
  method: { type: DataTypes.ENUM("MANUAL", "BIOMETRIC"), allowNull: false, defaultValue: "MANUAL" },
  note: DataTypes.STRING(255),
}, { tableName: "student_attendance", indexes: [{ unique: true, fields: ["instituteId", "studentId", "date"] }] });

module.exports = StudentAttendance;
