require("dotenv").config();

const sequelize = require("../src/config/database");
const { User, Instructor } = require("../src/models");

const migrate = async () => {
  await sequelize.authenticate();
  await sequelize.sync();
  const users = await User.findAll({ where: { role: "INSTRUCTOR" }, attributes: ["id", "instituteId", "firstName", "lastName", "fatherName", "caste", "religion", "cnic", "address", "qualifications", "skills", "avatarUrl", "status"] });
  let migrated = 0;

  for (const user of users) {
    const [, created] = await Instructor.findOrCreate({
      where: { userId: user.id },
      defaults: {
        userId: user.id,
        instituteId: user.instituteId,
        firstName: user.firstName,
        lastName: user.lastName,
        fatherName: user.fatherName,
        caste: user.caste,
        religion: user.religion,
        cnic: user.cnic,
        address: user.address,
        qualifications: user.qualifications,
        skills: user.skills,
        avatarUrl: user.avatarUrl,
        status: user.status,
      },
    });
    if (created) migrated += 1;
  }

  console.log(`Instructor profile migration complete: ${migrated} profile(s) created from ${users.length} instructor user(s).`);
  await sequelize.close();
};

migrate().catch(async (error) => {
  console.error("Instructor profile migration failed:");
  console.error(error);
  await sequelize.close();
  process.exitCode = 1;
});
