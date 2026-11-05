const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Institute = sequelize.define("Institute", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(160), allowNull: false },
  shortName: { type: DataTypes.STRING(80), allowNull: false },
  logoUrl: DataTypes.STRING(500),
  email: { type: DataTypes.STRING(160), allowNull: false, validate: { isEmail: true } },
  phone: DataTypes.STRING(40),
  secondaryPhone: DataTypes.STRING(40),
  address: DataTypes.STRING(255),
  facebookUrl: DataTypes.STRING(500),
  instagramUrl: DataTypes.STRING(500),
  youtubeUrl: DataTypes.STRING(500),
  linkedinUrl: DataTypes.STRING(500),
  yearsOfExcellence: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
  academicYear: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "2026-2027" },
  timezone: { type: DataTypes.STRING(80), allowNull: false, defaultValue: "Asia/Karachi" },
}, { tableName: "institutes" });

module.exports = Institute;
