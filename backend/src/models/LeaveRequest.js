const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const LeaveRequest = sequelize.define("LeaveRequest", { id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true }, instituteId: { type: DataTypes.UUID, allowNull: false }, staffId: { type: DataTypes.UUID, allowNull: false }, startDate: { type: DataTypes.DATEONLY, allowNull: false }, endDate: { type: DataTypes.DATEONLY, allowNull: false }, reason: { type: DataTypes.STRING(500), allowNull: false }, status: { type: DataTypes.ENUM("PENDING", "APPROVED", "REJECTED"), allowNull: false, defaultValue: "PENDING" } }, { tableName: "leave_requests" });
module.exports = LeaveRequest;
