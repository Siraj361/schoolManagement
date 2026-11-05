const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const InstituteExpense = sequelize.define("InstituteExpense", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  instituteId: { type: DataTypes.UUID, allowNull: false },
  category: { type: DataTypes.STRING(80), allowNull: false },
  description: { type: DataTypes.STRING(255), allowNull: false },
  vendor: DataTypes.STRING(160),
  amountMinor: { type: DataTypes.INTEGER, allowNull: false },
  expenseDate: { type: DataTypes.DATEONLY, allowNull: false },
  paymentMethod: { type: DataTypes.ENUM("CASH", "BANK_TRANSFER", "CARD", "ONLINE"), allowNull: false, defaultValue: "CASH" },
  notes: DataTypes.STRING(500),
  status: { type: DataTypes.ENUM("RECORDED", "VOID"), allowNull: false, defaultValue: "RECORDED" },
  createdBy: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: "institute_expenses" });

module.exports = InstituteExpense;