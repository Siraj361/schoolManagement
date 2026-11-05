require("dotenv").config();
const sequelize = require("../src/config/database");

const run = async () => {
  await sequelize.authenticate();
  await sequelize.query("ALTER TABLE students ADD COLUMN userId INT NULL UNIQUE").catch((error) => { if (!/duplicate|exists/i.test(error.message)) throw error; });
  await sequelize.query("ALTER TABLE users MODIFY COLUMN role ENUM('SUPER_ADMIN','ADMIN','ACADEMIC_HEAD','INSTRUCTOR','STUDENT','ACCOUNTS','CASHIER','HR','LAB_ADMIN','ADMISSION_OFFICER','STAFF') NOT NULL DEFAULT 'ADMIN'");
  await sequelize.query("UPDATE users SET permissions = JSON_ARRAY() WHERE role IN ('STUDENT', 'INSTRUCTOR')");
  console.log("Student portal schema is ready");
  await sequelize.close();
};

run().catch((error) => { console.error(error); process.exitCode = 1; });