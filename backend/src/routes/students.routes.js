const router = require("express").Router();
const { list, getOne, create, update, updatePhoto, verify } = require("../controllers/student.controller");
const { requireAuth } = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { uploadStudentPhoto } = require("../middleware/studentUpload");
const assignments = require("../controllers/assignment.controller");
const { uploadAssignmentFile } = require("../middleware/assignmentUpload");
const studentAttendance = require("../controllers/student-attendance.controller");

router.get("/", requireAuth, authorize("students.read"), list);
router.get("/attendance", requireAuth, authorize("students.attendance"), studentAttendance.list);
router.post("/attendance", requireAuth, authorize("students.attendance"), studentAttendance.mark);
router.get("/submissions", requireAuth, authorize("students.submissions"), assignments.list);
router.post("/submissions/assignments", requireAuth, authorize("INSTRUCTOR", "SUPER_ADMIN", "students.submissions"), assignments.createAssignment);
router.post("/submissions", requireAuth, authorize("STUDENT", "students.submissions"), uploadAssignmentFile.single("submissionFile"), assignments.createSubmission);
router.patch("/submissions/:submissionId/review", requireAuth, authorize("INSTRUCTOR", "SUPER_ADMIN"), assignments.review);
router.get("/:studentId", requireAuth, authorize("students.read"), getOne);
router.post("/", requireAuth, authorize("students.write"), uploadStudentPhoto.single("photo"), create);
router.patch("/:studentId", requireAuth, authorize("students.write"), update);
router.post("/:studentId/photo", requireAuth, authorize("students.write"), uploadStudentPhoto.single("photo"), updatePhoto);
router.get("/verify/:studentCode", verify);

module.exports = router;
