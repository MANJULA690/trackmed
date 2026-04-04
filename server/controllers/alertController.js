const Alert = require("../models/Alert");
const Medicine = require("../models/Medicine");
const { runAlertScan } = require("../utils/alertEngine");

// @desc    Get all alerts (with filters)
// @route   GET /api/alerts
// @access  Private
const getAlerts = async (req, res, next) => {
  try {
    const { type, severity, isRead, isResolved = "false", page = 1, limit = 30 } = req.query;

    const query = {};
    if (type) query.alertType = type;
    if (severity) query.severity = severity;
    if (isRead !== undefined) query.isRead = isRead === "true";
    if (isResolved !== undefined) query.isResolved = isResolved === "true";

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [alerts, total] = await Promise.all([
      Alert.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("medicine", "name batchNumber expiryDate quantity")
        .populate("resolvedBy", "name"),
      Alert.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: alerts.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      alerts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark alert as read
// @route   PATCH /api/alerts/:id/read
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ success: false, message: "Alert not found." });
    }

    res.status(200).json({ success: true, alert });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all alerts as read
// @route   PATCH /api/alerts/mark-all-read
// @access  Private
const markAllRead = async (req, res, next) => {
  try {
    await Alert.updateMany({ isRead: false }, { isRead: true });
    res.status(200).json({ success: true, message: "All alerts marked as read." });
  } catch (error) {
    next(error);
  }
};

// @desc    Resolve an alert
// @route   PATCH /api/alerts/:id/resolve
// @access  Private
const resolveAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { isResolved: true, resolvedBy: req.user.id, resolvedAt: new Date(), isRead: true },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ success: false, message: "Alert not found." });
    }

    res.status(200).json({ success: true, message: "Alert resolved.", alert });
  } catch (error) {
    next(error);
  }
};

// @desc    Manually trigger alert scan (admin/cron fallback)
// @route   POST /api/alerts/scan
// @access  Private/Admin
const triggerScan = async (req, res, next) => {
  try {
    const result = await runAlertScan();
    res.status(200).json({
      success: true,
      message: "Alert scan completed.",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAlerts, markAsRead, markAllRead, resolveAlert, triggerScan };
