const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Batch = sequelize.define("Batch", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  instituteId: { type: DataTypes.UUID, allowNull: false },
  courseId: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING(120), allowNull: false },
  shift: DataTypes.STRING(40),
  startDate: DataTypes.DATEONLY,
  endDate: DataTypes.DATEONLY,
  mentorId: DataTypes.INTEGER,
  capacity: DataTypes.INTEGER,
  status: { type: DataTypes.ENUM("ACTIVE", "COMPLETED", "ARCHIVED"), allowNull: false, defaultValue: "ACTIVE" },
}, { tableName: "batches" });

module.exports = Batch;
