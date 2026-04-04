const express = require("express");
const router = express.Router();
const {
  getMedicinePrediction,
  getAllPredictions,
  getTransactionHistory,
} = require("../controllers/predictionController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/", getAllPredictions);
router.get("/:medicineId", getMedicinePrediction);
router.get("/:medicineId/history", getTransactionHistory);

module.exports = router;
