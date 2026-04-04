const express = require("express");
const router = express.Router();
const {
  getAlerts,
  markAsRead,
  markAllRead,
  resolveAlert,
  triggerScan,
} = require("../controllers/alertController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

router.get("/", getAlerts);
router.patch("/mark-all-read", markAllRead);
router.post("/scan", authorize("admin", "pharmacist"), triggerScan);
router.patch("/:id/read", markAsRead);
router.patch("/:id/resolve", resolveAlert);

module.exports = router;
