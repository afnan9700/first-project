const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");
const { deleteAllData, getStats } = require("../controllers/adminController");

const router = express.Router();

router.delete("/purge", requireAuth, requireAdmin, deleteAllData);
router.get("/stats", requireAuth, requireAdmin, getStats);

module.exports = router;