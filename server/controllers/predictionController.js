const StockTransaction = require("../models/StockTransaction");
const Medicine = require("../models/Medicine");
const { predictDemand, predictAllMedicines } = require("../ml/demandPredictor");

// @desc    Get demand prediction for a specific medicine
// @route   GET /api/predictions/:medicineId
// @access  Private
const getMedicinePrediction = async (req, res, next) => {
  try {
    const medicine = await Medicine.findById(req.params.medicineId);

    if (!medicine) {
      return res.status(404).json({ success: false, message: "Medicine not found." });
    }

    // Fetch last 90 days of issue transactions
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const transactions = await StockTransaction.find({
      medicine: req.params.medicineId,
      transactionType: "issued",
      transactionDate: { $gte: ninetyDaysAgo },
    }).sort({ transactionDate: 1 });

    const prediction = predictDemand(transactions, medicine.name);

    res.status(200).json({
      success: true,
      medicine: {
        id: medicine._id,
        name: medicine.name,
        currentStock: medicine.quantity,
        lowStockThreshold: medicine.lowStockThreshold,
      },
      prediction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get demand predictions for all medicines (top N)
// @route   GET /api/predictions
// @access  Private
const getAllPredictions = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const predictions = await predictAllMedicines(parseInt(limit));

    res.status(200).json({
      success: true,
      count: predictions.length,
      predictions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get transaction history for a medicine (for charts)
// @route   GET /api/predictions/:medicineId/history
// @access  Private
const getTransactionHistory = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const history = await StockTransaction.aggregate([
      {
        $match: {
          medicine: require("mongoose").Types.ObjectId.createFromHexString(req.params.medicineId),
          transactionDate: { $gte: since },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$transactionDate" } },
            type: "$transactionType",
          },
          total: { $sum: { $abs: "$quantity" } },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    res.status(200).json({
      success: true,
      history,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMedicinePrediction, getAllPredictions, getTransactionHistory };
