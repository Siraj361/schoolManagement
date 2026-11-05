const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const inquiryFields = {
  phone: { type: DataTypes.STRING(40), allowNull: true },
  email: { type: DataTypes.STRING(254), allowNull: true },
  preferredTiming: { type: DataTypes.ENUM("MORNING", "AFTERNOON", "EVENING"), allowNull: true },
  message: { type: DataTypes.TEXT, allowNull: true },
};

const ensurePublicInquiryFields = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const columns = await queryInterface.describeTable("inquiries");

  for (const [field, definition] of Object.entries(inquiryFields)) {
    if (!columns[field]) await queryInterface.addColumn("inquiries", field, definition);
  }
};

module.exports = ensurePublicInquiryFields;
