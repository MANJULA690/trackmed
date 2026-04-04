const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
    },
    medicineName: {
      type: String, // denormalized
      trim: true,
    },
    alertType: {
      type: String,
      enum: ["low_stock", "expiry_warning", "expiry_critical", "expired", "out_of_stock"],
      required: true,
    },
    severity: {
      type: String,
      enum: ["info", "warning", "critical"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    // snapshot at time of alert
    currentQuantity: {
      type: Number,
    },
    daysToExpiry: {
      type: Number,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate unresolved alerts of same type for same medicine
alertSchema.index(
  { medicine: 1, alertType: 1, isResolved: 1 },
  { unique: false }
);

module.exports = mongoose.model("Alert", alertSchema);
