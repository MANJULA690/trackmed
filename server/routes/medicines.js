const express = require("express");
const router = express.Router();
const {
  getMedicines,
  getMedicine,
  addMedicine,
  updateMedicine,
  updateStock,
  deleteMedicine,
  getDashboardStats,
} = require("../controllers/medicineController");
const { protect, authorize } = require("../middleware/auth");

// All routes require authentication
router.use(protect);

router.get("/stats/summary", getDashboardStats);

router.route("/").get(getMedicines).post(addMedicine);

router
  .route("/:id")
  .get(getMedicine)
  .put(updateMedicine)
  .delete(deleteMedicine);

router.patch("/:id/stock", updateStock);

module.exports = router;
