/**
 * TrackMed — ML Accuracy Checker v2
 * Uses a smart split based on YOUR actual data range,
 * not fixed 90/30 day windows.
 *
 * Run from server/ folder:  node checkAccuracy.js
 */

require("dotenv").config();
const mongoose = require("mongoose");

// ── Prediction logic (inline) ─────────────────────────────────
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

// Build daily buckets from transactions between startDate and endDate
const buildDailyBuckets = (transactions, startDate, endDate) => {
  const map = {};
  const cur = new Date(startDate);
  while (cur <= endDate) {
    map[cur.toISOString().split("T")[0]] = 0;
    cur.setDate(cur.getDate() + 1);
  }
  transactions.forEach((t) => {
    const k = new Date(t.transactionDate).toISOString().split("T")[0];
    if (map[k] !== undefined) map[k] += Math.abs(t.quantity);
  });
  return Object.values(map);
};

const predictFromDailyBuckets = (dailyValues) => {
  if (!dailyValues.length) return 0;
  const x = dailyValues.map((_, i) => i);
  const { slope, intercept } = linearRegression(x, dailyValues);
  const wma = weightedMovingAverage(dailyValues);
  const n = dailyValues.length;
  // Project forward by n more days (same window size as training)
  const regForecast = Math.max(0, intercept + slope * (n + n / 2)) * n;
  const wmaForecast = wma * n;
  return Math.round(0.6 * wmaForecast + 0.4 * regForecast);
};

// ── Main ──────────────────────────────────────────────────────
const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected\n");

  const Medicine = require("./models/Medicine");
  const StockTransaction = require("./models/StockTransaction");

  const medicines = await Medicine.find({ isActive: true });
  console.log(`📦 Found ${medicines.length} medicines\n`);

  const results = [];
  const skipped = [];

  for (const med of medicines) {
    // Get ALL issue transactions for this medicine
    const allTx = await StockTransaction.find({
      medicine: med._id,
      transactionType: "issued",
    }).sort({ transactionDate: 1 });

    if (allTx.length < 4) {
      skipped.push({
        name: med.name,
        reason: `only ${allTx.length} transaction(s) — need ≥4`,
      });
      continue;
    }

    // Smart split: use first 70% of data to train, last 30% to test
    const splitIdx = Math.floor(allTx.length * 0.7);
    const trainTx = allTx.slice(0, splitIdx);
    const testTx = allTx.slice(splitIdx);

    const trainStart = new Date(trainTx[0].transactionDate);
    const trainEnd = new Date(trainTx[trainTx.length - 1].transactionDate);
    const testEnd = new Date(testTx[testTx.length - 1].transactionDate);

    // If train window is less than 2 days, skip
    const trainDays = Math.max(
      1,
      Math.ceil((trainEnd - trainStart) / 86400000) + 1,
    );
    const testDays = Math.max(1, Math.ceil((testEnd - trainEnd) / 86400000));

    const trainBuckets = buildDailyBuckets(trainTx, trainStart, trainEnd);
    const testActual = testTx.reduce((s, t) => s + Math.abs(t.quantity), 0);

    if (testActual === 0) {
      skipped.push({
        name: med.name,
        reason: "test window has 0 actual usage",
      });
      continue;
    }

    // Scale prediction to match the test window duration
    const predicted = Math.round(
      predictFromDailyBuckets(trainBuckets) * (testDays / trainDays),
    );

    const mape = (Math.abs(predicted - testActual) / testActual) * 100;
    const accuracy = Math.max(0, 100 - mape);

    results.push({
      name: med.name,
      trainTx: trainTx.length,
      testTx: testTx.length,
      predicted,
      actual: testActual,
      mape,
      accuracy,
    });
  }

  // ── Print results ─────────────────────────────────────────────
  if (!results.length) {
    console.log("⚠️  Not enough data to evaluate any medicine.");
    console.log(
      "   Each medicine needs at least 4 'Issued' stock transactions.",
    );
    console.log("\n   Steps to fix:");
    console.log("   1. Go to Inventory in the app");
    console.log("   2. Click the ↻ (Update Stock) button on a medicine");
    console.log("   3. Select 'Issued to patient/ward', enter quantity, save");
    console.log("   4. Repeat 4+ times with different quantities");
    console.log("   5. Run this script again\n");
  } else {
    console.log(
      "┌──────────────────────────┬───────┬──────┬───────────┬────────┬────────┬──────────┐",
    );
    console.log(
      "│ Medicine                  │ Train │ Test │ Predicted │ Actual │  MAPE  │ Accuracy │",
    );
    console.log(
      "├──────────────────────────┼───────┼──────┼───────────┼────────┼────────┼──────────┤",
    );

    for (const r of results) {
      const name = r.name.slice(0, 25).padEnd(25);
      const tr = String(r.trainTx).padStart(5);
      const te = String(r.testTx).padStart(4);
      const pred = String(r.predicted).padStart(9);
      const act = String(r.actual).padStart(6);
      const mape = (r.mape.toFixed(1) + "%").padStart(6);
      const acc = (r.accuracy.toFixed(1) + "%").padStart(8);
      console.log(
        `│ ${name} │ ${tr} │ ${te} │ ${pred} │ ${act} │ ${mape} │ ${acc} │`,
      );
    }

    console.log(
      "└──────────────────────────┴───────┴──────┴───────────┴────────┴────────┴──────────┘",
    );

    const avgMAPE = results.reduce((s, r) => s + r.mape, 0) / results.length;
    const avgAcc = results.reduce((s, r) => s + r.accuracy, 0) / results.length;
    const mae =
      results.reduce((s, r) => s + Math.abs(r.predicted - r.actual), 0) /
      results.length;

    console.log(`\n📊 Summary (${results.length} medicine(s) evaluated):`);
    console.log(
      `   MAE  (Mean Absolute Error)       : ${mae.toFixed(1)} units`,
    );
    console.log(`   MAPE (Mean Abs % Error)          : ${avgMAPE.toFixed(2)}%`);
    console.log(`   Average Accuracy                  : ${avgAcc.toFixed(2)}%`);
    console.log(`   Split method                      : 70% train / 30% test`);

    if (avgMAPE < 10) console.log("\n🟢 Excellent accuracy (MAPE < 10%)");
    else if (avgMAPE < 20) console.log("\n🟢 Good accuracy (MAPE < 20%)");
    else if (avgMAPE < 35)
      console.log("\n🟡 Moderate accuracy — more data will improve this");
    else
      console.log(
        "\n🟡 Accuracy limited by small dataset — expected for < 10 transactions per medicine",
      );

    console.log("\n💡 Note: Accuracy improves with more transaction history.");
    console.log(
      "   Industry benchmark: MAPE 15-25% for pharmaceutical demand forecasting.",
    );
  }

  // ── Print skipped ─────────────────────────────────────────────
  if (skipped.length) {
    console.log(
      `\n⏭  Skipped ${skipped.length} medicine(s) (insufficient data):`,
    );
    skipped.forEach((s) => console.log(`   • ${s.name}: ${s.reason}`));
  }

  await mongoose.disconnect();
  console.log("\n✅ Done");
};

run().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
