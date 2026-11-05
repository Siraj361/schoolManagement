const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const instituteFields = {
  secondaryPhone: { type: DataTypes.STRING(40), allowNull: true },
  youtubeUrl: { type: DataTypes.STRING(500), allowNull: true },
};

const ensureInstituteContactFields = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const columns = await queryInterface.describeTable("institutes");

  for (const [field, definition] of Object.entries(instituteFields)) {
    if (!columns[field]) await queryInterface.addColumn("institutes", field, definition);
  }
};

module.exports = ensureInstituteContactFields;
