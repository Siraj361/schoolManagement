const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const studentsRoutes = require("./routes/students.routes");
const financeRoutes = require("./routes/finance.routes");
const moduleRoutes = require("./routes/module.routes");
const accessRoutes = require("./routes/access.routes");
const instituteRoutes = require("./routes/institute.routes");
const courseRoutes = require("./routes/course.routes");
const programRoutes = require("./routes/program.routes");
const batchRoutes = require("./routes/batch.routes");
const labRoutes = require("./routes/lab.routes");
const certificationRoutes = require("./routes/certification.routes");
const hrRoutes = require("./routes/hr.routes");
const inquiryRoutes = require("./routes/inquiry.routes");
const teamApplicationRoutes = require("./routes/team-application.routes");
const contactMessageRoutes = require("./routes/contact-message.routes");
const facultyRoutes = require("./routes/faculty.routes");
const portalRoutes = require("./routes/portal.routes");
const { verify } = require("./controllers/student.controller");
const errorHandler = require("./middleware/errorHandler");
const path = require("path");

const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads/team-applications", (_req, res) => res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "File not found" } }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/institutes", instituteRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/students", studentsRoutes);
app.use("/api/v1/academics/courses", courseRoutes);
app.use("/api/v1/academics/programs", programRoutes);
app.use("/api/v1/academics/batches", batchRoutes);
app.use("/api/v1/academics/labs", labRoutes);
app.use("/api/v1/academics/certifications", certificationRoutes);
app.use("/api/v1/hr", hrRoutes);
app.use("/api/v1/admissions/inquiries", inquiryRoutes);
app.use("/api/v1/admissions/opportunities", teamApplicationRoutes);
app.use("/api/v1/contact/messages", contactMessageRoutes);
app.use("/api/v1/team/applications", teamApplicationRoutes);
app.use("/api/v1/fees", financeRoutes);
app.use("/api/v1/faculty", facultyRoutes);
app.use("/api/v1/portal", portalRoutes);
app.use("/api/v1/modules/:module", moduleRoutes);
app.use("/api/v1/settings", accessRoutes);
[
  "/academics/courses", "/academics/batches/schedule", "/academics/labs", "/academics/certifications",
  "/students/admissions", "/students/attendance", "/students/submissions", "/students/grades",
  "/teachers", "/teachers/allocations", "/teachers/attendance", "/teachers/reviews",
  "/staff", "/staff/attendance", "/staff/leaves", "/staff/payroll",
  "/reports/academics", "/reports/financial", "/reports/retention",
  "/settings/profile", "/settings/roles", "/settings/integrations", "/settings/logs",
].forEach((path) => app.use(`/api/v1${path}`, moduleRoutes));
app.get("/api/v1/public/verify/student/:studentCode", verify);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Student Fee SaaS API is running",
  });
});

app.use(errorHandler);

module.exports = app;