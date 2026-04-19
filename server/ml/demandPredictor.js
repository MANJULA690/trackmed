// const StockTransaction = require("../models/StockTransaction");
// const Medicine = require("../models/Medicine");

// /**
//  * Simple Linear Regression
//  * Given arrays of x (time index) and y (daily usage), returns slope and intercept
//  */
// const linearRegression = (x, y) => {
//   const n = x.length;
//   if (n === 0) return { slope: 0, intercept: 0 };

//   const sumX = x.reduce((a, b) => a + b, 0);
//   const sumY = y.reduce((a, b) => a + b, 0);
//   const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
//   const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);

//   const denominator = n * sumXX - sumX * sumX;
//   if (denominator === 0) return { slope: 0, intercept: sumY / n };

//   const slope = (n * sumXY - sumX * sumY) / denominator;
//   const intercept = (sumY - slope * sumX) / n;

//   return { slope, intercept };
// };

// /**
//  * Weighted Moving Average
//  * Recent days weighted more heavily
//  */
// const weightedMovingAverage = (values) => {
//   if (values.length === 0) return 0;
//   const n = values.length;
//   let weightedSum = 0;
//   let weightSum = 0;

//   values.forEach((val, i) => {
//     const weight = i + 1; // recent = higher weight
//     weightedSum += val * weight;
//     weightSum += weight;
//   });

//   return weightedSum / weightSum;
// };

// /**
//  * Group transactions by day and return daily usage array
//  */
// const getDailyUsage = (transactions, days = 30) => {
//   const dailyMap = {};
//   const now = new Date();

//   // Initialize all days with 0
//   for (let i = days - 1; i >= 0; i--) {
//     const d = new Date(now);
//     d.setDate(d.getDate() - i);
//     const key = d.toISOString().split("T")[0];
//     dailyMap[key] = 0;
//   }

//   // Sum quantities per day
//   transactions.forEach((t) => {
//     const key = new Date(t.transactionDate).toISOString().split("T")[0];
//     if (dailyMap[key] !== undefined) {
//       dailyMap[key] += Math.abs(t.quantity);
//     }
//   });

//   return Object.entries(dailyMap).map(([date, qty]) => ({ date, qty }));
// };

// /**
//  * Predict demand for a single medicine
//  * Returns predicted units needed for next 30 days
//  */
// const predictDemand = (transactions, medicineName = "") => {
//   if (!transactions || transactions.length === 0) {
//     return {
//       medicineName,
//       predictedNext30Days: 0,
//       averageDailyUsage: 0,
//       trend: "insufficient_data",
//       confidence: "low",
//       method: "none",
//       breakdown: [],
//     };
//   }

//   const dailyUsage = getDailyUsage(transactions, 90);
//   const quantities = dailyUsage.map((d) => d.qty);
//   const nonZeroDays = quantities.filter((q) => q > 0).length;

//   if (nonZeroDays < 3) {
//     const avg = quantities.reduce((a, b) => a + b, 0) / quantities.length;
//     return {
//       medicineName,
//       predictedNext30Days: Math.round(avg * 30),
//       averageDailyUsage: Math.round(avg * 10) / 10,
//       trend: "insufficient_data",
//       confidence: "low",
//       method: "simple_average",
//       breakdown: dailyUsage.slice(-30),
//     };
//   }

//   // Linear regression on last 30 days
//   const last30 = quantities.slice(-30);
//   const x = last30.map((_, i) => i);
//   const { slope, intercept } = linearRegression(x, last30);

//   // Weighted moving average for smoothing
//   const wma = weightedMovingAverage(last30);

//   // Blend: 60% WMA + 40% regression prediction at day 30+15 (midpoint of next month)
//   const regressionPrediction = Math.max(0, intercept + slope * 45);
//   const blendedDailyPrediction = 0.6 * wma + 0.4 * regressionPrediction;

//   const predictedNext30Days = Math.round(blendedDailyPrediction * 30);
//   const averageDailyUsage = Math.round(blendedDailyPrediction * 10) / 10;

//   // Determine trend
//   let trend = "stable";
//   if (slope > 0.5) trend = "increasing";
//   else if (slope < -0.5) trend = "decreasing";

//   // Confidence based on data consistency
//   const avg = last30.reduce((a, b) => a + b, 0) / last30.length;
//   const variance =
//     last30.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / last30.length;
//   const cv = avg > 0 ? Math.sqrt(variance) / avg : 1;

//   let confidence = "high";
//   if (cv > 0.8) confidence = "low";
//   else if (cv > 0.4) confidence = "medium";

//   // Next 7 days breakdown
//   const next7Days = [];
//   for (let i = 1; i <= 7; i++) {
//     const d = new Date();
//     d.setDate(d.getDate() + i);
//     next7Days.push({
//       date: d.toISOString().split("T")[0],
//       predicted: Math.round(Math.max(0, intercept + slope * (30 + i))),
//     });
//   }

//   return {
//     medicineName,
//     predictedNext30Days,
//     averageDailyUsage,
//     trend,
//     confidence,
//     method: "weighted_linear_regression",
//     slope: Math.round(slope * 100) / 100,
//     next7Days,
//     breakdown: dailyUsage.slice(-30),
//   };
// };

// /**
//  * Run predictions for all medicines and return top N by predicted demand
//  */
// const predictAllMedicines = async (limit = 10) => {
//   const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

//   const medicines = await Medicine.find({ isActive: true }).limit(100);

//   const predictions = await Promise.all(
//     medicines.map(async (med) => {
//       const transactions = await StockTransaction.find({
//         medicine: med._id,
//         transactionType: "issued",
//         transactionDate: { $gte: ninetyDaysAgo },
//       }).sort({ transactionDate: 1 });

//       const prediction = predictDemand(transactions, med.name);

//       return {
//         medicineId: med._id,
//         medicineName: med.name,
//         currentStock: med.quantity,
//         lowStockThreshold: med.lowStockThreshold,
//         // predictedNext30Days: prediction.predictedNext30Days,
//         averageDailyUsage: prediction.averageDailyUsage,
//         predicted: prediction.averageDailyUsage * 30,
//         trend: prediction.trend,
//         confidence: prediction.confidence,
//         // Will stock run out before next 30 days?
//         stockRunoutDays:
//           prediction.averageDailyUsage > 0
//             ? Math.round(med.quantity / prediction.averageDailyUsage)
//             : null,
//         needsRestock: med.quantity < prediction.predictedNext30Days,
//       };
//     }),
//   );

//   // Sort by predicted demand descending
//   return predictions
//     .sort((a, b) => b.predictedNext30Days - a.predictedNext30Days)
//     .slice(0, limit);
// };

// module.exports = { predictDemand, predictAllMedicines };

const StockTransaction = require("../models/StockTransaction");
const Medicine = require("../models/Medicine");

/* ── Math helpers ─────────────────────────────────────────── */
const linearRegression = (x, y) => {
  const n = x.length;
  if (n < 2) return { slope: 0, intercept: y[0] || 0 };
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((s, xi, i) => s + xi * y[i], 0);
  const sumXX = x.reduce((s, xi) => s + xi * xi, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };
  const slope = (n * sumXY - sumX * sumY) / denom;
  return { slope, intercept: (sumY - slope * sumX) / n };
};

const weightedMovingAverage = (values) => {
  if (!values.length) return 0;
  let wSum = 0,
    wTotal = 0;
  values.forEach((v, i) => {
    const w = i + 1;
    wSum += v * w;
    wTotal += w;
  });
  return wSum / wTotal;
};

/* ── Build daily buckets from transactions ────────────────── */
const getDailyBuckets = (transactions, windowDays) => {
  const map = {};
  const now = new Date();
  for (let i = windowDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    map[d.toISOString().split("T")[0]] = 0;
  }
  transactions.forEach((t) => {
    const k = new Date(t.transactionDate).toISOString().split("T")[0];
    if (map[k] !== undefined) map[k] += Math.abs(t.quantity);
  });
  return Object.entries(map).map(([date, qty]) => ({ date, qty }));
};

/* ── Core prediction function ─────────────────────────────── */
/**
 * FIX 3: Now works with any data window (days).
 * - Uses all available history (up to 90 days)
 * - Falls back gracefully to simple average when data is sparse
 * - Still predicts 30-day demand regardless of training window
 */
const predictDemand = (transactions, medicineName = "") => {
  if (!transactions || transactions.length === 0) {
    return {
      medicineName,
      predictedNext30Days: 0,
      averageDailyUsage: 0,
      trend: "insufficient_data",
      confidence: "low",
      method: "none",
      breakdown: [],
      next7Days: [],
    };
  }

  // Determine actual data window (use whatever is available, max 90 days)
  const dates = transactions.map((t) => new Date(t.transactionDate));
  const oldest = new Date(Math.min(...dates));
  const now = new Date();
  const availDays = Math.max(1, Math.ceil((now - oldest) / 86400000) + 1);
  const windowDays = Math.min(availDays, 90);

  const dailyData = getDailyBuckets(transactions, windowDays);
  const quantities = dailyData.map((d) => d.qty);
  const nonZeroDays = quantities.filter((q) => q > 0).length;

  // Simple average fallback for very sparse data (< 3 non-zero days)
  if (nonZeroDays < 3) {
    const totalUsed = quantities.reduce((a, b) => a + b, 0);
    const avgDaily = windowDays > 0 ? totalUsed / windowDays : 0;
    return {
      medicineName,
      predictedNext30Days: Math.round(avgDaily * 30),
      averageDailyUsage: Math.round(avgDaily * 10) / 10,
      trend: "insufficient_data",
      confidence: "low",
      method: "simple_average",
      windowDays,
      breakdown: dailyData,
      next7Days: Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i + 1);
        return {
          date: d.toISOString().split("T")[0],
          predicted: Math.round(avgDaily),
        };
      }),
    };
  }

  // WMA on all available daily data
  const wma = weightedMovingAverage(quantities);

  // Linear regression on all available data
  const x = quantities.map((_, i) => i);
  const { slope, intercept } = linearRegression(x, quantities);

  // Project to midpoint of next 30 days
  const n = quantities.length;
  const regForecast = Math.max(0, intercept + slope * (n + 15));

  // Blend: 60% WMA + 40% regression
  const blendedDaily = 0.6 * wma + 0.4 * regForecast;
  const predictedNext30Days = Math.round(blendedDaily * 30);
  const averageDailyUsage = Math.round(blendedDaily * 10) / 10;

  // Trend
  let trend = "stable";
  if (slope > 0.3) trend = "increasing";
  if (slope < -0.3) trend = "decreasing";

  // Confidence based on consistency (coefficient of variation)
  const avg = quantities.reduce((a, b) => a + b, 0) / quantities.length;
  const variance =
    quantities.reduce((s, v) => s + (v - avg) ** 2, 0) / quantities.length;
  const cv = avg > 0 ? Math.sqrt(variance) / avg : 1;
  const confidence = cv < 0.4 ? "high" : cv < 0.8 ? "medium" : "low";

  // Next 7 days breakdown
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return {
      date: d.toISOString().split("T")[0],
      predicted: Math.round(Math.max(0, intercept + slope * (n + i + 1))),
    };
  });

  return {
    medicineName,
    predictedNext30Days,
    averageDailyUsage,
    trend,
    confidence,
    method: "weighted_linear_regression",
    slope: Math.round(slope * 100) / 100,
    windowDays,
    next7Days,
    breakdown: dailyData,
  };
};

/* ── Predict all medicines ────────────────────────────────── */
/**
 * FIX 3: Look back only 7 days (not 90) so predictions work
 * immediately after adding transactions.
 * LOOK_BACK_DAYS is configurable via env var for production.
 */
const LOOK_BACK_DAYS = parseInt(process.env.PREDICTION_LOOKBACK_DAYS || "7");

const predictAllMedicines = async (limit = 10) => {
  const since = new Date(Date.now() - LOOK_BACK_DAYS * 24 * 60 * 60 * 1000);
  const medicines = await Medicine.find({ isActive: true }).limit(100);

  const predictions = await Promise.all(
    medicines.map(async (med) => {
      const transactions = await StockTransaction.find({
        medicine: med._id,
        transactionType: "issued",
        transactionDate: { $gte: since },
      }).sort({ transactionDate: 1 });

      const prediction = predictDemand(transactions, med.name);

      return {
        medicineId: med._id,
        medicineName: med.name,
        currentStock: med.quantity,
        lowStockThreshold: med.lowStockThreshold,
        predictedNext30Days: prediction.predictedNext30Days,
        averageDailyUsage: prediction.averageDailyUsage,
        trend: prediction.trend,
        confidence: prediction.confidence,
        windowDays: prediction.windowDays || LOOK_BACK_DAYS,
        stockRunoutDays:
          prediction.averageDailyUsage > 0
            ? Math.round(med.quantity / prediction.averageDailyUsage)
            : null,
        needsRestock: med.quantity < prediction.predictedNext30Days,
      };
    }),
  );

  return predictions
    .sort((a, b) => b.predictedNext30Days - a.predictedNext30Days)
    .slice(0, limit);
};

module.exports = { predictDemand, predictAllMedicines };
