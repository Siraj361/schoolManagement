const sequelize = require("../config/database");

const ensureCourseImageField = async () => {
  const [columns] = await sequelize.query("SHOW COLUMNS FROM courses LIKE 'imageUrl'");
  if (!columns.length) {
    await sequelize.query("ALTER TABLE courses ADD COLUMN imageUrl VARCHAR(500) NULL");
  }
};

module.exports = ensureCourseImageField;
