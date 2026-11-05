const router = require("express").Router();
const { list, create } = require("../controllers/lab-room.controller");
const { requireAuth } = require("../middleware/auth");
const authorize = require("../middleware/authorize");

router.use(requireAuth);
router.get("/", authorize("module.read"), list);
router.post("/", authorize("module.write"), create);

module.exports = router;