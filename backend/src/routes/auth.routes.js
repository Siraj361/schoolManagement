const router = require("express").Router();
const { login, me, verifyToken, updateMe, logout } = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth");
const { uploadUserAvatar } = require("../middleware/userUpload");

router.post("/login", login);
router.get("/me", requireAuth, me);
router.get("/verify", requireAuth, verifyToken);
router.patch("/me", requireAuth, uploadUserAvatar.single("avatar"), updateMe);
router.post("/logout", requireAuth, logout);

module.exports = router;
