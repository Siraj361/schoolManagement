const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const FacultyAttendance = sequelize.define("FacultyAttendance", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  instituteId: { type: DataTypes.UUID, allowNull: false },
  facultyId: { type: DataTypes.INTEGER, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  checkIn: DataTypes.DATE,
  checkOut: DataTypes.DATE,
  status: { type: DataTypes.ENUM("PRESENT", "LATE", "ABSENT", "ON_LEAVE"), allowNull: false, defaultValue: "PRESENT" },
  note: DataTypes.STRING(255),
}, { tableName: "faculty_attendance", indexes: [{ unique: true, fields: ["instituteId", "facultyId", "date"] }] });

module.exports = FacultyAttendance;
