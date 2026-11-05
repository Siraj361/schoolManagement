const router = require("express").Router();
const { createInstitute, publicProfile, profile, updateProfile } = require("../controllers/institute.controller");
const { requireAuth } = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { uploadUserAvatar } = require("../middleware/userUpload");

router.post("/", createInstitute);
router.get("/public", publicProfile);
router.get("/profile", requireAuth, authorize("settings.profile"), profile);
router.patch("/profile", requireAuth, authorize("settings.profile"), uploadUserAvatar.single("logo"), updateProfile);

module.exports = router;
