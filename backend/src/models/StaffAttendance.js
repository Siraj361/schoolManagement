const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const StaffAttendance = sequelize.define("StaffAttendance", { id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true }, instituteId: { type: DataTypes.UUID, allowNull: false }, staffId: { type: DataTypes.UUID, allowNull: false }, date: { type: DataTypes.DATEONLY, allowNull: false }, status: { type: DataTypes.ENUM("PRESENT", "LATE", "ABSENT", "ON_LEAVE"), allowNull: false, defaultValue: "PRESENT" }, checkIn: DataTypes.DATE, method: { type: DataTypes.ENUM("MANUAL", "BIOMETRIC"), allowNull: false, defaultValue: "MANUAL" } }, { tableName: "staff_attendance", indexes: [{ unique: true, fields: ["instituteId", "staffId", "date"] }] });
module.exports = StaffAttendance;
