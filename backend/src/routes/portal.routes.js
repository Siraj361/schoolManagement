const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const portal = require("../controllers/portal.controller");

router.use(requireAuth);
router.get("/student", authorize("STUDENT"), portal.studentDashboard);
router.patch("/student/profile", authorize("STUDENT"), portal.updateStudentProfile);
router.get("/student/id-card.pdf", authorize("STUDENT"), portal.studentIdCard);
router.get("/student/receipts/:paymentId.pdf", authorize("STUDENT"), portal.studentReceipt);
router.get("/teacher", authorize("INSTRUCTOR"), portal.teacherDashboard);
router.patch("/teacher/profile", authorize("INSTRUCTOR"), portal.updateTeacherProfile);

module.exports = router;