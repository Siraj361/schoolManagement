require("dotenv").config();

const app = require("./src/app");
const sequelize = require("./src/config/database");
const ensurePublicInquiryFields = require("./src/utils/ensurePublicInquiryFields");
const ensureInstituteContactFields = require("./src/utils/ensureInstituteContactFields");
const ensureCourseCategory = require("./src/utils/ensureCourseCategory");
const ensureCourseImageField = require("./src/utils/ensureCourseImageField");
const ensureProgramImageField = require("./src/utils/ensureProgramImageField");
require("./src/models");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();

    console.log("MySQL connected successfully");

    await sequelize.sync();
    await ensurePublicInquiryFields();
    await ensureInstituteContactFields();
    await ensureCourseCategory();
    await ensureCourseImageField();
    await ensureProgramImageField();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:");
    console.error(error);
  }
};

startServer();