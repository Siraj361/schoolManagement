const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Program = sequelize.define("Program", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  instituteId: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING(160), allowNull: false },
  slug: { type: DataTypes.STRING(180), allowNull: false },
  category: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  durationMonths: { type: DataTypes.INTEGER, allowNull: true },
  status: { type: DataTypes.ENUM("ACTIVE", "ARCHIVED"), allowNull: false, defaultValue: "ACTIVE" },
}, { tableName: "programs", indexes: [{ unique: true, fields: ["instituteId", "slug"] }] });

module.exports = Program;
