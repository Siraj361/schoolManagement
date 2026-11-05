const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("User", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  instituteId: { type: DataTypes.UUID, allowNull: false },
  firstName: { type: DataTypes.STRING(80), allowNull: false },
  lastName: { type: DataTypes.STRING(80), allowNull: false },
 
  
  avatarUrl: DataTypes.STRING(500),
  email: { type: DataTypes.STRING(160), allowNull: false, unique: true, validate: { isEmail: true } },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM("SUPER_ADMIN", "ADMIN", "ACADEMIC_HEAD", "INSTRUCTOR", "STUDENT", "ACCOUNTS", "CASHIER", "HR", "LAB_ADMIN", "ADMISSION_OFFICER", "STAFF"), allowNull: false, defaultValue: "ADMIN" },
  permissions: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
  tokenVersion: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  status: { type: DataTypes.ENUM("ACTIVE", "INVITED", "SUSPENDED"), allowNull: false, defaultValue: "ACTIVE" },
  lastLoginAt: DataTypes.DATE,
}, { tableName: "users", defaultScope: { attributes: { exclude: ["passwordHash"] } }, scopes: { withPassword: { attributes: {} } } });

module.exports = User;
