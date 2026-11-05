require("dotenv").config();

const sequelize = require("../src/config/database");
const { User } = require("../src/models");

const restore = async () => {
  await sequelize.authenticate();
  const [affected] = await User.update({ permissions: ["*"] }, { where: { role: "SUPER_ADMIN" } });
  console.log(`Super Admin access restored for ${affected} user(s): ["*"]`);
  await sequelize.close();
};

restore().catch(async (error) => {
  console.error("Super Admin access restore failed:");
  console.error(error);
  await sequelize.close();
  process.exitCode = 1;
});
