const router = require("express").Router();
const { createPublic, list, updateStatus, downloadCv } = require("../controllers/team-application.controller");
const { uploadCv } = require("../middleware/cvUpload");
const { requireAuth } = require("../middleware/auth");
const authorize = require("../middleware/authorize");

router.post("/public", uploadCv.single("cv"), createPublic);
router.get("/", requireAuth, authorize("team.applications.read"), list);
router.patch("/:applicationId", requireAuth, authorize("team.applications.update"), updateStatus);
router.get("/:applicationId/cv", requireAuth, authorize("team.applications.read"), downloadCv);

module.exports = router;
