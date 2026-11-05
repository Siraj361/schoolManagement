const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ContactMessage = sequelize.define("ContactMessage", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  instituteId: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING(160), allowNull: false },
  email: { type: DataTypes.STRING(254), allowNull: false },
  subject: { type: DataTypes.STRING(160), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM("NEW", "READ", "REPLIED"), allowNull: false, defaultValue: "NEW" },
}, { tableName: "contact_messages", indexes: [{ fields: ["instituteId", "status"] }] });

module.exports = ContactMessage;
