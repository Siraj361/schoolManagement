require("dotenv").config();

const sequelize = require("../src/config/database");

const tables = [
  "audit_logs",
  "batches",
  "courses",
  "faculty_allocations",
  "faculty_attendance",
  "faculty_reviews",
  "inquiries",
  "institutes",
  "invoices",
  "instructors",
  "module_records",
  "payments",
  "role_permissions",
  "scholarships",
  "students",
  "users",
];

const migrate = async () => {
  await sequelize.authenticate();
  let renamed = 0;

  for (const table of tables) {
    try {
      const [columns] = await sequelize.query(`SHOW COLUMNS FROM \`${table}\``);
      const names = new Set(columns.map((column) => column.Field));
      const renames = [];
      if (names.has("createdAt") && !names.has("created_at")) renames.push(["createdAt", "created_at"]);
      if (names.has("updatedAt") && !names.has("updated_at")) renames.push(["updatedAt", "updated_at"]);
      for (const [from, to] of renames) {
        await sequelize.query(`ALTER TABLE \`${table}\` RENAME COLUMN \`${from}\` TO \`${to}\``);
        renamed += 1;
      }
    } catch (error) {
      if (error.original?.code === "ER_NO_SUCH_TABLE") continue;
      throw error;
    }
  }

  console.log(`Timestamp migration complete: ${renamed} column(s) renamed.`);
  await sequelize.close();
};

migrate().catch(async (error) => {
  console.error("Timestamp migration failed:");
  console.error(error);
  await sequelize.close();
  process.exitCode = 1;
});
