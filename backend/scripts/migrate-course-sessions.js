require("dotenv").config();
const sequelize = require("../src/config/database");

const migrate = async () => {
  await sequelize.authenticate();
  await sequelize.query(`CREATE TABLE IF NOT EXISTS course_sessions (
    id CHAR(36) NOT NULL,
    instituteId CHAR(36) NOT NULL,
    courseId CHAR(36) NOT NULL,
    sequenceNumber INT NOT NULL,
    title VARCHAR(180) NOT NULL,
    description TEXT NULL,
    status ENUM('LOCKED','CURRENT','COMPLETED') NOT NULL DEFAULT 'LOCKED',
    createdBy INT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY course_session_order (courseId, sequenceNumber),
    KEY course_sessions_institute (instituteId),
    KEY course_sessions_course (courseId)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  const [columns] = await sequelize.query("SHOW COLUMNS FROM `assignments`");
  if (!columns.some((column) => column.Field === "courseSessionId")) await sequelize.query("ALTER TABLE `assignments` ADD COLUMN `courseSessionId` CHAR(36) NULL AFTER `batchId`");
  if (!columns.some((column) => column.Field === "sessionOrder")) await sequelize.query("ALTER TABLE `assignments` ADD COLUMN `sessionOrder` INT NOT NULL DEFAULT 1 AFTER `courseSessionId`");
  const [sessionColumns] = await sequelize.query("SHOW COLUMNS FROM `course_sessions`");
  if (sessionColumns.some((column) => column.Field === "createdAt") && !sessionColumns.some((column) => column.Field === "created_at")) await sequelize.query("ALTER TABLE `course_sessions` CHANGE COLUMN `createdAt` `created_at` DATETIME NOT NULL");
  if (sessionColumns.some((column) => column.Field === "updatedAt") && !sessionColumns.some((column) => column.Field === "updated_at")) await sequelize.query("ALTER TABLE `course_sessions` CHANGE COLUMN `updatedAt` `updated_at` DATETIME NOT NULL");
  console.log("Course sessions migration complete.");
  await sequelize.close();
};

migrate().catch(async (error) => {
  console.error("Course sessions migration failed:");
  console.error(error);
  await sequelize.close();
  process.exitCode = 1;
});
