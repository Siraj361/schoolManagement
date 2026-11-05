const router = require("express").Router();
const { list, create, update } = require("../controllers/program.controller");
const { requireAuth } = require("../middleware/auth");
const authorize = require("../middleware/authorize");

router.use(requireAuth);
router.get("/", authorize("academics.programs"), list);
router.post("/", authorize("academics.programs"), create);
router.patch("/:programId", authorize("academics.programs"), update);

module.exports = router;
