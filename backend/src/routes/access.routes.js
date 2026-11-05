const router = require("express").Router();
const access = require("../controllers/access.controller");
const { requireAuth } = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { uploadUserAvatar } = require("../middleware/userUpload");

router.use(requireAuth, authorize("SUPER_ADMIN"));
router.get("/roles", access.listRoles);
router.put("/roles/:roleId", access.updateRole);
router.get("/users", access.listUsers);
router.post("/users", uploadUserAvatar.single("avatar"), access.createUser);
router.get("/users/:userId/access", access.getUserAccess);
router.put("/users/:userId/access", access.updateUserAccess);
router.get("/logs", access.listAuditLogs);

module.exports = router;
