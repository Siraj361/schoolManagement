const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const TeamApplication = sequelize.define("TeamApplication", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  instituteId: { type: DataTypes.UUID, allowNull: false },
  applicationType: { type: DataTypes.ENUM("FACULTY", "COMMUNITY", "INTERNSHIP"), allowNull: false },
  name: { type: DataTypes.STRING(160), allowNull: false },
  email: { type: DataTypes.STRING(254), allowNull: false },
  phone: { type: DataTypes.STRING(40), allowNull: false },
  details: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
  status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: "NEW" },
}, { tableName: "team_applications", indexes: [{ fields: ["instituteId", "applicationType", "status"] }] });

module.exports = TeamApplication;
