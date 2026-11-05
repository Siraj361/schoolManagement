const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const LabRoom = sequelize.define("LabRoom", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  instituteId: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING(120), allowNull: false },
  type: { type: DataTypes.STRING(160), allowNull: false },
  capacity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  usedCapacity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  networkStatus: { type: DataTypes.ENUM("ONLINE", "MAINTENANCE", "OFFLINE"), allowNull: false, defaultValue: "ONLINE" },
  status: { type: DataTypes.ENUM("AVAILABLE", "IN_USE", "MAINTENANCE"), allowNull: false, defaultValue: "AVAILABLE" },
}, { tableName: "lab_rooms", indexes: [{ unique: true, fields: ["instituteId", "name"] }] });

module.exports = LabRoom;
