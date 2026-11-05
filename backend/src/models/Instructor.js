const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Instructor = sequelize.define("Instructor", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  instituteId: { type: DataTypes.UUID, allowNull: false },
  firstName: { type: DataTypes.STRING(80), allowNull: false },
  lastName: { type: DataTypes.STRING(80), allowNull: false },
  fatherName: DataTypes.STRING(160),
  caste: DataTypes.STRING(80),
  religion: DataTypes.STRING(80),
  cnic: DataTypes.STRING(25),
  address: DataTypes.STRING(500),
  qualifications: DataTypes.STRING(500),
  skills: DataTypes.STRING(500),
  avatarUrl: DataTypes.STRING(500),
  compensationType: { type: DataTypes.ENUM("FIXED", "PERCENTAGE"), allowNull: false, defaultValue: "FIXED" },
  fixedSalary: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  percentage: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
  status: { type: DataTypes.ENUM("ACTIVE", "INVITED", "SUSPENDED"), allowNull: false, defaultValue: "ACTIVE" },
}, { tableName: "instructors", timestamps: true });

module.exports = Instructor;
