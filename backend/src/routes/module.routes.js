const router = require("express").Router({ mergeParams: true });
const { list, create, update, uploadImage } = require("../controllers/module.controller");
const { requireAuth } = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { uploadUserAvatar } = require("../middleware/userUpload");

router.use(requireAuth);
router.get("/", authorize("module.read"), list);
router.post("/images", authorize("module.write"), uploadUserAvatar.single("image"), uploadImage);
router.post("/", authorize("module.write"), create);
router.patch("/:id", authorize("module.write"), update);

module.exports = router;
