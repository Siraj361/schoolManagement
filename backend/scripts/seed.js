require("dotenv").config();
const bcrypt = require("bcryptjs");
const sequelize = require("../src/config/database");
const { Institute, User } = require("../src/models");

const run = async () => {
  await sequelize.authenticate();
  await sequelize.sync();
  const [institute] = await Institute.findOrCreate({ where: { email: process.env.SEED_INSTITUTE_EMAIL || "info@theprime.edu.pk" }, defaults: { name: "The Prime Institute of Science & Technology", shortName: "The Prime", phone: "+92 300 1234567", academicYear: "2026-2027" } });
  const email = (process.env.SEED_ADMIN_EMAIL || "admin@theprime.edu.pk").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
  const passwordHash = await bcrypt.hash(password, 12);
  await User.findOrCreate({ where: { email }, defaults: { instituteId: institute.id, firstName: "Institute", lastName: "Administrator", passwordHash, role: process.env.SEED_ADMIN_ROLE || "SUPER_ADMIN" } });
  console.log(`Institute/admin bootstrap complete for ${institute.name}. Admin account: ${email}`);
  await sequelize.close();
};

run().catch(async (error) => { console.error(error); await sequelize.close(); process.exitCode = 1; });
