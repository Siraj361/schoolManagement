require("dotenv").config();

const sequelize = require("../src/config/database");

const migrate = async () => {
  await sequelize.authenticate();
  await sequelize.query(`CREATE TABLE IF NOT EXISTS \`institute_expenses\` (
    \`id\` CHAR(36) NOT NULL,
    \`instituteId\` CHAR(36) NOT NULL,
    \`category\` VARCHAR(80) NOT NULL,
    \`description\` VARCHAR(255) NOT NULL,
    \`vendor\` VARCHAR(160) NULL,
    \`amountMinor\` INT NOT NULL,
    \`expenseDate\` DATE NOT NULL,
    \`paymentMethod\` ENUM('CASH', 'BANK_TRANSFER', 'CARD', 'ONLINE') NOT NULL DEFAULT 'CASH',
    \`notes\` VARCHAR(500) NULL,
    \`status\` ENUM('RECORDED', 'VOID') NOT NULL DEFAULT 'RECORDED',
    \`createdBy\` INT NOT NULL,
    \`created_at\` DATETIME NOT NULL,
    \`updated_at\` DATETIME NOT NULL,
    PRIMARY KEY (\`id\`),
    INDEX \`institute_expenses_institute_date\` (\`instituteId\`, \`expenseDate\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  console.log("Institute expenses migration complete.");
  await sequelize.close();
};

migrate().catch(async (error) => {
  console.error("Institute expenses migration failed:");
  console.error(error);
  await sequelize.close();
  process.exitCode = 1;
});