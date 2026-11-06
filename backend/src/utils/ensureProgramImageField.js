const sequelize = require("../config/database");

const ensureProgramImageField = async () => {
  const [columns] = await sequelize.query("SHOW COLUMNS FROM programs LIKE 'imageUrl'");
  if (!columns.length) {
    await sequelize.query("ALTER TABLE programs ADD COLUMN imageUrl VARCHAR(500) NULL");
  }
};

module.exports = ensureProgramImageField;
