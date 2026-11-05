const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ensureCourseCategory = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const columns = await queryInterface.describeTable("courses");
  if (!columns.category) {
    await queryInterface.addColumn("courses", "category", {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: "Short Courses",
    });
  }
};

module.exports = ensureCourseCategory;
