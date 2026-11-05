const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Course = sequelize.define("Course", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  instituteId: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING(160), allowNull: false },
  slug: { type: DataTypes.STRING(180), allowNull: false },
  category: { type: DataTypes.STRING(100), allowNull: false, defaultValue: "Short Courses" },
  description: DataTypes.TEXT,
  durationMonths: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 12 },
  monthlyFeeMinor: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  totalFeeMinor: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  status: { type: DataTypes.ENUM("ACTIVE", "ARCHIVED"), allowNull: false, defaultValue: "ACTIVE" },
}, { tableName: "courses", indexes: [{ unique: true, fields: ["instituteId", "slug"] }] });

module.exports = Course;
