const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Inquiry = sequelize.define("Inquiry", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  instituteId: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING(160), allowNull: false },
  courseId: { type: DataTypes.UUID, allowNull: false },
  phone: { type: DataTypes.STRING(40), allowNull: true },
  email: { type: DataTypes.STRING(254), allowNull: true },
  preferredTiming: { type: DataTypes.ENUM("MORNING", "AFTERNOON", "EVENING"), allowNull: true },
  message: { type: DataTypes.TEXT, allowNull: true },
  source: { type: DataTypes.STRING(80), allowNull: false, defaultValue: "Walk-in inquiry" },
  stage: { type: DataTypes.ENUM("NEW", "CONTACTED", "COUNSELLING", "REGISTERED", "OFFER_SENT"), allowNull: false, defaultValue: "NEW" },
  followUpAt: DataTypes.DATE,
}, { tableName: "inquiries" });

module.exports = Inquiry;
