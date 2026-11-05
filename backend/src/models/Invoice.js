const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Invoice = sequelize.define("Invoice", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  instituteId: { type: DataTypes.UUID, allowNull: false },
  studentId: { type: DataTypes.UUID, allowNull: false },
  invoiceNumber: { type: DataTypes.STRING(40), allowNull: false, unique: true },
  amountMinor: { type: DataTypes.INTEGER, allowNull: false },
  dueDate: { type: DataTypes.DATEONLY, allowNull: false },
  status: { type: DataTypes.ENUM("PENDING", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"), allowNull: false, defaultValue: "PENDING" },
  description: DataTypes.STRING(255),
  sequenceNumber: { type: DataTypes.INTEGER, allowNull: true },
}, { tableName: "invoices" });

module.exports = Invoice;
