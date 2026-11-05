require("dotenv").config();

const sequelize = require("../src/config/database");

const columns = [
  ["facebookUrl", "VARCHAR(500) NULL"],
  ["instagramUrl", "VARCHAR(500) NULL"],
  ["linkedinUrl", "VARCHAR(500) NULL"],
  ["yearsOfExcellence", "INT NOT NULL DEFAULT 5"],
];

const migrate = async () => {
  await sequelize.authenticate();
  const [existingColumns] = await sequelize.query("SHOW COLUMNS FROM `institutes`");
  const existingNames = new Set(existingColumns.map((column) => column.Field));
  let added = 0;

  for (const [name, definition] of columns) {
    if (!existingNames.has(name)) {
      await sequelize.query(`ALTER TABLE \`institutes\` ADD COLUMN \`${name}\` ${definition}`);
      added += 1;
    }
  }

  console.log(`Institute social links migration complete: ${added} column(s) added.`);
  await sequelize.close();
};

migrate().catch(async (error) => {
  console.error("Institute social links migration failed:");
  console.error(error);
  await sequelize.close();
  process.exitCode = 1;
});