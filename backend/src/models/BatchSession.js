const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BatchSession = sequelize.define("BatchSession", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  instituteId: { type: DataTypes.UUID, allowNull: false },
  batchId: { type: DataTypes.UUID, allowNull: false },
  instructorId: { type: DataTypes.INTEGER, allowNull: true },
  title: { type: DataTypes.STRING(160), allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  startTime: { type: DataTypes.STRING(5), allowNull: false },
  endTime: { type: DataTypes.STRING(5), allowNull: false },
  room: { type: DataTypes.STRING(80), allowNull: true },
  status: { type: DataTypes.ENUM("SCHEDULED", "COMPLETED", "CANCELLED"), allowNull: false, defaultValue: "SCHEDULED" },
}, { tableName: "batch_sessions", indexes: [{ fields: ["instituteId", "date"] }] });

module.exports = BatchSession;
