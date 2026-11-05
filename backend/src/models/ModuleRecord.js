const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ModuleRecord = sequelize.define("ModuleRecord", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  instituteId: { type: DataTypes.UUID, allowNull: false },
  module: { type: DataTypes.STRING(100), allowNull: false },
  name: { type: DataTypes.STRING(180), allowNull: false },
  details: DataTypes.JSON,
  status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: "ACTIVE" },
  owner: { type: DataTypes.STRING(120), allowNull: false, defaultValue: "Admin team" },
}, { tableName: "module_records", indexes: [{ fields: ["instituteId", "module"] }] });

module.exports = ModuleRecord;
