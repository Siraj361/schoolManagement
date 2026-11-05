const router = require("express").Router();
const { list, create, createPublic } = require("../controllers/inquiry.controller");
const { requireAuth } = require("../middleware/auth");
const authorize = require("../middleware/authorize");

router.post("/public", createPublic);
router.use(requireAuth);
router.get("/", authorize("module.read"), list);
router.post("/", authorize("module.write"), create);

module.exports = router;
