const router = require("express").Router();
const { list, students, create, update } = require("../controllers/course.controller");
const sessions = require("../controllers/course-session.controller");
const { requireAuth } = require("../middleware/auth");
const authorize = require("../middleware/authorize");

router.use(requireAuth);
router.get("/", authorize("module.read"), list);
router.get("/:courseId/students", authorize("module.read"), students);
router.post("/", authorize("module.write"), create);
router.patch("/:courseId", authorize("module.write"), update);
router.get("/:courseId/sessions", authorize("INSTRUCTOR", "SUPER_ADMIN", "module.read"), sessions.list);
router.post("/:courseId/sessions", authorize("INSTRUCTOR", "SUPER_ADMIN", "module.write"), sessions.create);
router.patch("/:courseId/sessions/:sessionId", authorize("INSTRUCTOR", "SUPER_ADMIN", "module.write"), sessions.update);

module.exports = router;
