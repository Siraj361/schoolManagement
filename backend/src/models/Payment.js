const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Payment = sequelize.define("Payment", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  instituteId: { type: DataTypes.UUID, allowNull: false },
  invoiceId: { type: DataTypes.UUID, allowNull: false },
  studentId: { type: DataTypes.UUID, allowNull: false },
  receiptNumber: { type: DataTypes.STRING(40), allowNull: false, unique: true },
  amountMinor: { type: DataTypes.INTEGER, allowNull: false },
  currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: "PKR" },
  method: { type: DataTypes.ENUM("CASH", "BANK_TRANSFER", "CARD", "ONLINE"), allowNull: false },
  paidAt: { type: DataTypes.DATE, allowNull: false },
  idempotencyKey: { type: DataTypes.STRING(160), allowNull: false, unique: true },
  receivedBy: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: "payments" });

module.exports = Payment;
