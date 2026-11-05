const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const FacultyAllocation = sequelize.define("FacultyAllocation", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  instituteId: { type: DataTypes.UUID, allowNull: false },
  facultyId: { type: DataTypes.INTEGER, allowNull: false },
  courseId: { type: DataTypes.UUID },
  batchId: { type: DataTypes.UUID },
  title: { type: DataTypes.STRING(160), allowNull: false },
  hoursPerWeek: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
  schedule: DataTypes.STRING(120),
  status: { type: DataTypes.ENUM("ACTIVE", "CONFLICT", "COMPLETED"), allowNull: false, defaultValue: "ACTIVE" },
}, { tableName: "faculty_allocations" });

module.exports = FacultyAllocation;
