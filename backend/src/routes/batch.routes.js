const router = require("express").Router();
const { list, create } = require("../controllers/batch.controller");
const { requireAuth } = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const schedule = require("../controllers/batch-schedule.controller");

router.use(requireAuth);
router.get("/schedule", authorize("module.read"), schedule.list);
router.post("/schedule", authorize("module.write"), schedule.create);
router.get("/", authorize("module.read"), list);
router.post("/", authorize("module.write"), create);

module.exports = router;
