const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Payroll = sequelize.define("Payroll", { id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true }, instituteId: { type: DataTypes.UUID, allowNull: false }, staffId: { type: DataTypes.UUID, allowNull: false }, month: { type: DataTypes.STRING(7), allowNull: false }, amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false }, status: { type: DataTypes.ENUM("PENDING", "PAID"), allowNull: false, defaultValue: "PENDING" }, paidAt: DataTypes.DATE }, { tableName: "payroll", indexes: [{ unique: true, fields: ["instituteId", "staffId", "month"] }] });
module.exports = Payroll;
