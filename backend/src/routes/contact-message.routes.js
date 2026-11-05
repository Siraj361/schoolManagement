const router = require("express").Router();
const { createPublic, list, updateStatus } = require("../controllers/contact-message.controller");
const { requireAuth } = require("../middleware/auth");
const authorize = require("../middleware/authorize");

router.post("/public", createPublic);
router.get("/", requireAuth, authorize("contact.messages.read"), list);
router.patch("/:messageId", requireAuth, authorize("contact.messages.update"), updateStatus);

module.exports = router;
