const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const Medicine = require("../models/Medicine");
const StockTransaction = require("../models/StockTransaction");
const Alert = require("../models/Alert");

router.use(protect);

// @desc  Full expiry report
// @route GET /api/reports/expiry
router.get("/expiry", async (req, res, next) => {
  try {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const in90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const [expired, within30, within60, within90] = await Promise.all([
      Medicine.find({ isActive: true, expiryDate: { $lt: now } }).select("name batchNumber expiryDate quantity manufacturerName"),
      Medicine.find({ isActive: true, expiryDate: { $gte: now, $lt: in30 } }).select("name batchNumber expiryDate quantity manufacturerName"),
      Medicine.find({ isActive: true, expiryDate: { $gte: in30, $lt: in60 } }).select("name batchNumber expiryDate quantity manufacturerName"),
      Medicine.find({ isActive: true, expiryDate: { $gte: in60, $lt: in90 } }).select("name batchNumber expiryDate quantity manufacturerName"),
    ]);

    res.status(200).json({
      success: true,
      report: {
        generatedAt: new Date(),
        expired: { count: expired.length, medicines: expired },
        within30Days: { count: within30.length, medicines: within30 },
        within60Days: { count: within60.length, medicines: within60 },
        within90Days: { count: within90.length, medicines: within90 },
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc  Stock report — low stock and out of stock
// @route GET /api/reports/stock
router.get("/stock", async (req, res, next) => {
  try {
    const outOfStock = await Medicine.find({ isActive: true, quantity: 0 })
      .select("name batchNumber quantity lowStockThreshold manufacturerName category");

    const lowStock = await Medicine.aggregate([
      {
        $match: {
          isActive: true,
          quantity: { $gt: 0 },
          $expr: { $lte: ["$quantity", "$lowStockThreshold"] },
        },
      },
      {
        $project: {
          name: 1, batchNumber: 1, quantity: 1,
          lowStockThreshold: 1, manufacturerName: 1, category: 1,
          deficit: { $subtract: ["$lowStockThreshold", "$quantity"] },
        },
      },
      { $sort: { deficit: -1 } },
    ]);

    res.status(200).json({
      success: true,
      report: {
        generatedAt: new Date(),
        outOfStock: { count: outOfStock.length, medicines: outOfStock },
        lowStock: { count: lowStock.length, medicines: lowStock },
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc  Transaction report — stock movement over a date range
// @route GET /api/reports/transactions
router.get("/transactions", async (req, res, next) => {
  try {
    const { startDate, endDate, type } = req.query;

    const matchQuery = {};
    if (startDate || endDate) {
      matchQuery.transactionDate = {};
      if (startDate) matchQuery.transactionDate.$gte = new Date(startDate);
      if (endDate) matchQuery.transactionDate.$lte = new Date(endDate);
    }
    if (type) matchQuery.transactionType = type;

    const transactions = await StockTransaction.find(matchQuery)
      .sort({ transactionDate: -1 })
      .limit(200)
      .populate("medicine", "name category")
      .populate("performedBy", "name role");

    // Summary by type
    const summary = await StockTransaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$transactionType",
          totalQuantity: { $sum: { $abs: "$quantity" } },
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      report: {
        generatedAt: new Date(),
        summary,
        transactions,
        count: transactions.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc  Category-wise stock overview
// @route GET /api/reports/category-overview
router.get("/category-overview", async (req, res, next) => {
  try {
    const overview = await Medicine.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$category",
          totalMedicines: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          avgPrice: { $avg: "$price" },
          lowStockCount: {
            $sum: {
              $cond: [{ $lte: ["$quantity", "$lowStockThreshold"] }, 1, 0],
            },
          },
        },
      },
      { $sort: { totalMedicines: -1 } },
    ]);

    res.status(200).json({ success: true, overview });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
