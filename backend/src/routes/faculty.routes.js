const router = require("express").Router();
const faculty = require("../controllers/faculty.controller");
const { requireAuth } = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { uploadUserAvatar } = require("../middleware/userUpload");

router.use(requireAuth, authorize("teachers.read"));
router.get("/", faculty.list);
router.post("/", authorize("teachers.write"), uploadUserAvatar.single("avatar"), faculty.create);
router.patch("/:facultyId", authorize("teachers.write"), uploadUserAvatar.single("avatar"), faculty.update);
router.post("/allocations", authorize("teachers.write"), faculty.createAllocation);
router.post("/attendance", authorize("teachers.write"), faculty.markAttendance);
router.post("/reviews", authorize("teachers.write"), faculty.createReview);

module.exports = router;
