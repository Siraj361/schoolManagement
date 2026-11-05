const router = require("express").Router();
const { overview } = require("../controllers/dashboard.controller");
const { requireAuth } = require("../middleware/auth");
const authorize = require("../middleware/authorize");

router.get("/overview", requireAuth, authorize("dashboard.read"), overview);

module.exports = router;
