require("dotenv").config();
const sequelize = require("../src/config/database");

const fields = {
  compensationType: "ENUM('FIXED','PERCENTAGE') NOT NULL DEFAULT 'FIXED'",
  fixedSalary: "DECIMAL(12,2) NOT NULL DEFAULT 0",
  percentage: "DECIMAL(5,2) NOT NULL DEFAULT 0",
};

const run = async () => {
  try {
    const [rows] = await sequelize.query("SHOW COLUMNS FROM instructors");
    const existing = new Set(rows.map((row) => row.Field));
    for (const [name, definition] of Object.entries(fields)) {
      if (!existing.has(name)) await sequelize.query(`ALTER TABLE instructors ADD COLUMN ${name} ${definition}`);
    }
    console.log("Instructor compensation fields are ready");
  } finally {
    await sequelize.close();
  }
};

run().catch((error) => { console.error(error); process.exitCode = 1; });