require("dotenv").config();
const sequelize = require("../src/config/database");

const addColumnIfMissing = async (table, column, definition, transaction) => {
  const [columns] = await sequelize.query(`SHOW COLUMNS FROM ${table} LIKE '${column}'`, { transaction });
  if (!columns.length) await sequelize.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`, { transaction });
};

const run = async () => {
  const transaction = await sequelize.transaction();
  try {
    await addColumnIfMissing("courses", "monthlyFeeMinor", "INT NOT NULL DEFAULT 0", transaction);
    await addColumnIfMissing("courses", "totalFeeMinor", "INT NOT NULL DEFAULT 0", transaction);
    await addColumnIfMissing("invoices", "sequenceNumber", "INT NULL", transaction);
    await transaction.commit();
    console.log("Course fee columns migrated successfully.");
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();
