const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Scholarship = sequelize.define("Scholarship", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  instituteId: { type: DataTypes.UUID, allowNull: false },
  studentId: { type: DataTypes.UUID, allowNull: false },
  type: { type: DataTypes.ENUM("FIXED", "PERCENTAGE"), allowNull: false },
  amountMinor: DataTypes.INTEGER,
  percentage: DataTypes.DECIMAL(5, 2),
  approvedBy: DataTypes.UUID,
  validFrom: { type: DataTypes.DATEONLY, allowNull: false },
  validUntil: DataTypes.DATEONLY,
  status: { type: DataTypes.ENUM("PENDING", "APPROVED", "REJECTED", "EXPIRED"), allowNull: false, defaultValue: "PENDING" },
}, { tableName: "scholarships" });

module.exports = Scholarship;
