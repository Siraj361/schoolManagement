const router = require("express").Router();
const { list, create, update, uploadImage } = require("../controllers/program.controller");
const { requireAuth } = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { uploadProgramImage } = require("../middleware/programUpload");

router.use(requireAuth);
router.get("/", authorize("academics.programs"), list);
router.post("/", authorize("academics.programs"), create);
router.post("/:programId/image", authorize("academics.programs"), uploadProgramImage.single("image"), uploadImage);
router.patch("/:programId", authorize("academics.programs"), update);

module.exports = router;
