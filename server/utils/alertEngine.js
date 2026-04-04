const Alert = require("../models/Alert");
const Medicine = require("../models/Medicine");

/**
 * Check a single medicine and create alerts if thresholds are breached
 */
const checkAndCreateAlerts = async (medicine) => {
  const alerts = [];
  const now = new Date();

  const daysToExpiry = medicine.daysToExpiry;
  const expiryAlertDays = parseInt(process.env.DEFAULT_EXPIRY_ALERT_DAYS) || 30;

  // ── Expiry alerts ──────────────────────────────────────────
  if (daysToExpiry !== null) {
    if (daysToExpiry < 0) {
      alerts.push({
        type: "expired",
        severity: "critical",
        message: `${medicine.name} (Batch: ${medicine.batchNumber}) has expired ${Math.abs(daysToExpiry)} day(s) ago.`,
        daysToExpiry,
      });
    } else if (daysToExpiry <= 7) {
      alerts.push({
        type: "expiry_critical",
        severity: "critical",
        message: `${medicine.name} (Batch: ${medicine.batchNumber}) expires in ${daysToExpiry} day(s). Immediate action required.`,
        daysToExpiry,
      });
    } else if (daysToExpiry <= expiryAlertDays) {
      alerts.push({
        type: "expiry_warning",
        severity: "warning",
        message: `${medicine.name} (Batch: ${medicine.batchNumber}) expires in ${daysToExpiry} day(s).`,
        daysToExpiry,
      });
    }
  }

  // ── Stock alerts ───────────────────────────────────────────
  if (medicine.quantity === 0) {
    alerts.push({
      type: "out_of_stock",
      severity: "critical",
      message: `${medicine.name} is out of stock. Reorder immediately.`,
      daysToExpiry,
    });
  } else if (medicine.quantity <= medicine.lowStockThreshold) {
    alerts.push({
      type: "low_stock",
      severity: "warning",
      message: `${medicine.name} stock is low: ${medicine.quantity} units remaining (threshold: ${medicine.lowStockThreshold}).`,
      daysToExpiry,
    });
  }

  // Save alerts — skip if same type + medicine already has unresolved alert
  for (const alertData of alerts) {
    const existing = await Alert.findOne({
      medicine: medicine._id,
      alertType: alertData.type,
      isResolved: false,
    });

    if (!existing) {
      await Alert.create({
        medicine: medicine._id,
        medicineName: medicine.name,
        alertType: alertData.type,
        severity: alertData.severity,
        message: alertData.message,
        currentQuantity: medicine.quantity,
        daysToExpiry: alertData.daysToExpiry,
      });
    }
  }

  return alerts.length;
};

/**
 * Scan ALL active medicines and create alerts as needed
 * Called by cron job daily
 */
const runAlertScan = async () => {
  const medicines = await Medicine.find({ isActive: true });
  let totalAlertsCreated = 0;

  for (const medicine of medicines) {
    const count = await checkAndCreateAlerts(medicine);
    totalAlertsCreated += count;
  }

  console.log(`🔔 Alert scan complete: ${totalAlertsCreated} new alerts created from ${medicines.length} medicines.`);

  return {
    medicinesScanned: medicines.length,
    alertsCreated: totalAlertsCreated,
    scannedAt: new Date(),
  };
};

module.exports = { checkAndCreateAlerts, runAlertScan };
