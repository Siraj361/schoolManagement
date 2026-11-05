const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const FacultyReview = sequelize.define("FacultyReview", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  instituteId: { type: DataTypes.UUID, allowNull: false },
  facultyId: { type: DataTypes.INTEGER, allowNull: false },
  studentId: { type: DataTypes.UUID },
  rating: { type: DataTypes.INTEGER, allowNull: false },
  comment: DataTypes.TEXT,
  status: { type: DataTypes.ENUM("PUBLISHED", "DRAFT", "HIDDEN"), allowNull: false, defaultValue: "PUBLISHED" },
}, { tableName: "faculty_reviews" });

module.exports = FacultyReview;
