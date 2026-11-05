const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Certification = sequelize.define("Certification", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  instituteId: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING(180), allowNull: false },
  code: { type: DataTypes.STRING(40), allowNull: false },
  examDate: DataTypes.DATEONLY,
  candidateCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  issuedCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  status: { type: DataTypes.ENUM("SCHEDULED", "REGISTRATION_OPEN", "COMPLETED", "CANCELLED"), allowNull: false, defaultValue: "SCHEDULED" },
  qrVerification: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: "certifications", indexes: [{ unique: true, fields: ["instituteId", "code"] }] });

module.exports = Certification;
