require("dotenv").config();
const sequelize = require("../src/config/database");

const run = async () => {
  const transaction = await sequelize.transaction();
  try {
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0", { transaction });
    await sequelize.query("ALTER TABLE users ADD COLUMN numeric_user_id INT NULL", { transaction });
    await sequelize.query("SET @user_row = 0", { transaction });
    await sequelize.query("UPDATE users SET numeric_user_id = (@user_row := @user_row + 1) ORDER BY createdAt, id", { transaction });

    for (const [table, column] of [["batches", "mentorId"], ["payments", "receivedBy"], ["audit_logs", "actorId"]]) {
      const [columns] = await sequelize.query(`SHOW COLUMNS FROM ${table} LIKE '${column}'`, { transaction });
      if (!columns.length) continue;
      await sequelize.query(`ALTER TABLE ${table} ADD COLUMN numeric_${column} INT NULL`, { transaction });
      await sequelize.query(`UPDATE ${table} target JOIN users source ON target.${column} = source.id SET target.numeric_${column} = source.numeric_user_id`, { transaction });
      await sequelize.query(`ALTER TABLE ${table} DROP COLUMN ${column}`, { transaction });
      await sequelize.query(`ALTER TABLE ${table} CHANGE numeric_${column} ${column} INT NULL`, { transaction });
    }

    await sequelize.query("ALTER TABLE users DROP PRIMARY KEY", { transaction });
    await sequelize.query("ALTER TABLE users DROP COLUMN id", { transaction });
    await sequelize.query("ALTER TABLE users CHANGE numeric_user_id id INT NOT NULL AUTO_INCREMENT PRIMARY KEY", { transaction });
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1", { transaction });
    await transaction.commit();
    console.log("User IDs migrated to sequential integers.");
  } catch (error) {
    await transaction.rollback();
    try { await sequelize.query("SET FOREIGN_KEY_CHECKS = 1"); } catch {}
    if (error.original?.code === "ER_DUP_FIELDNAME") console.error("Migration already appears to be applied.");
    else console.error(error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();
