const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Student = sequelize.define("Student", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: true, unique: true },
  instituteId: { type: DataTypes.UUID, allowNull: false },
  studentCode: { type: DataTypes.STRING(30), allowNull: false },
  name: { type: DataTypes.STRING(160), allowNull: false },
  fatherName: { type: DataTypes.STRING(160), allowNull: false },
  cnic: { type: DataTypes.STRING(20), allowNull: false },
  mobileNumber: { type: DataTypes.STRING(30), allowNull: false },
  email: { type: DataTypes.STRING(160), validate: { isEmail: true } },
  emergencyMobileNumber: { type: DataTypes.STRING(30), allowNull: false },
  residentialAddress: { type: DataTypes.STRING(500), allowNull: false },
  photoUrl: DataTypes.STRING(500),
  courseId: { type: DataTypes.UUID, allowNull: false },
  batchId: DataTypes.UUID,
  duration: { type: DataTypes.STRING(80), allowNull: false },
  shift: { type: DataTypes.STRING(40), allowNull: false },
  admissionFees: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  hasScholarship: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  scholarshipDetails: DataTypes.TEXT,
  registrationDate: { type: DataTypes.DATEONLY, allowNull: false },
  expiryDate: { type: DataTypes.DATEONLY, allowNull: false },
  status: { type: DataTypes.ENUM("ACTIVE", "EXPIRED", "SUSPENDED"), allowNull: false, defaultValue: "ACTIVE" },
  verificationToken: { type: DataTypes.STRING(128), allowNull: false, unique: true },
}, { tableName: "students", indexes: [{ unique: true, fields: ["instituteId", "studentCode"] }] });

module.exports = Student;
