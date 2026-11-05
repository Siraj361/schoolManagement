require("dotenv").config();
const sequelize = require("../src/config/database");

const fields = {
  fatherName: "VARCHAR(160) NULL",
  caste: "VARCHAR(80) NULL",
  religion: "VARCHAR(80) NULL",
  cnic: "VARCHAR(25) NULL",
  address: "VARCHAR(500) NULL",
  qualifications: "VARCHAR(500) NULL",
  skills: "VARCHAR(500) NULL",
};

const run = async () => {
  try {
    const [rows] = await sequelize.query("SHOW COLUMNS FROM users");
    const existing = new Set(rows.map((row) => row.Field));
    for (const [name, definition] of Object.entries(fields)) {
      if (!existing.has(name)) await sequelize.query(`ALTER TABLE users ADD COLUMN ${name} ${definition}`);
    }
    console.log("Teacher profile fields are ready");
  } finally {
    await sequelize.close();
  }
};

run().catch((error) => { console.error(error); process.exitCode = 1; });