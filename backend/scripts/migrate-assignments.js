require("dotenv").config();

const sequelize = require("../src/config/database");

const migrate = async () => {
  await sequelize.authenticate();
  await sequelize.query(`CREATE TABLE IF NOT EXISTS \`assignments\` (
    \`id\` CHAR(36) NOT NULL,
    \`instituteId\` CHAR(36) NOT NULL,
    \`batchId\` CHAR(36) NOT NULL,
    \`title\` VARCHAR(180) NOT NULL,
    \`description\` TEXT NULL,
    \`dueDate\` DATE NOT NULL,
    \`maxScore\` INT NOT NULL DEFAULT 100,
    \`status\` ENUM('ACTIVE', 'CLOSED') NOT NULL DEFAULT 'ACTIVE',
    \`createdBy\` INT NOT NULL,
    \`created_at\` DATETIME NOT NULL,
    \`updated_at\` DATETIME NOT NULL,
    PRIMARY KEY (\`id\`),
    INDEX \`assignments_institute_batch\` (\`instituteId\`, \`batchId\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  await sequelize.query(`CREATE TABLE IF NOT EXISTS \`assignment_submissions\` (
    \`id\` CHAR(36) NOT NULL,
    \`instituteId\` CHAR(36) NOT NULL,
    \`assignmentId\` CHAR(36) NOT NULL,
    \`studentId\` CHAR(36) NOT NULL,
    \`sourceType\` ENUM('GITHUB', 'ZIP') NOT NULL,
    \`repositoryUrl\` VARCHAR(500) NULL,
    \`fileName\` VARCHAR(255) NULL,
    \`fileUrl\` VARCHAR(500) NULL,
    \`submittedAt\` DATETIME NOT NULL,
    \`score\` INT NULL,
    \`reviewStatus\` ENUM('PENDING', 'REVIEWED', 'REVISION_REQUESTED') NOT NULL DEFAULT 'PENDING',
    \`feedback\` TEXT NULL,
    \`reviewedAt\` DATETIME NULL,
    \`reviewedBy\` INT NULL,
    \`created_at\` DATETIME NOT NULL,
    \`updated_at\` DATETIME NOT NULL,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`assignment_student_submission\` (\`assignmentId\`, \`studentId\`),
    INDEX \`assignment_submissions_institute\` (\`instituteId\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  const [columns] = await sequelize.query("SHOW COLUMNS FROM `assignment_submissions`");
  if (!columns.some((column) => column.Field === "fileUrl")) await sequelize.query("ALTER TABLE `assignment_submissions` ADD COLUMN `fileUrl` VARCHAR(500) NULL AFTER `fileName`");
  console.log("Assignments migration complete.");
  await sequelize.close();
};

migrate().catch(async (error) => {
  console.error("Assignments migration failed:");
  console.error(error);
  await sequelize.close();
  process.exitCode = 1;
});